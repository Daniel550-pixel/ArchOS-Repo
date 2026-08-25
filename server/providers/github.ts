import { createHash } from "node:crypto";

export interface GitHubProviderConfig {
  owner: string;
  repo: string;
  token?: string;
  apiBaseUrl?: string;
  defaultBaseBranch?: string;
}

export interface GitHubBranch {
  name: string;
  sha: string;
}

export interface GitHubPullRequest {
  number: number;
  url: string;
  head: string;
  base: string;
}

export interface GitHubProvider {
  inspect(path?: string, ref?: string): Promise<unknown>;
  createBranch(name: string, from: string): Promise<GitHubBranch>;
  openPullRequest(input: { title: string; body?: string; head: string; base?: string }): Promise<GitHubPullRequest>;
}

const SAFE_BRANCH = /^[A-Za-z0-9._/-]+$/;

export function createGitHubProvider(config: GitHubProviderConfig): GitHubProvider {
  const api = (config.apiBaseUrl ?? "https://api.github.com").replace(/\/$/, "");
  const base = config.defaultBaseBranch ?? "main";

  function requireToken() {
    if (!config.token) throw new Error("GitHub provider is not configured: GITHUB_TOKEN is required for write operations.");
    return config.token;
  }

  function validateBranch(name: string) {
    if (!SAFE_BRANCH.test(name) || name.includes("..") || name.startsWith("/") || name.endsWith("/")) {
      throw new Error("Invalid GitHub branch name.");
    }
  }

  async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/vnd.github+json");
    headers.set("X-GitHub-Api-Version", "2022-11-28");
    headers.set("User-Agent", "ArchOS");
    if (authenticated) headers.set("Authorization", `Bearer ${requireToken()}`);
    const response = await fetch(`${api}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
    return (await response.json()) as T;
  }

  return {
    async inspect(path = "", ref = base) {
      const encoded = path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
      return request(`/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encoded}${encoded ? "" : "/"}?ref=${encodeURIComponent(ref)}`);
    },

    async createBranch(name, from) {
      validateBranch(name);
      const source = await request<{ object: { sha: string } }>(`/repos/${config.owner}/${config.repo}/git/ref/heads/${encodeURIComponent(from)}`);
      const created = await request<{ ref: string; object: { sha: string } }>(`/repos/${config.owner}/${config.repo}/git/refs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: `refs/heads/${name}`, sha: source.object.sha })
      }, true);
      return { name, sha: created.object.sha };
    },

    async openPullRequest(input) {
      validateBranch(input.head);
      const result = await request<{ number: number; html_url: string; head: { ref: string }; base: { ref: string } }>(`/repos/${config.owner}/${config.repo}/pulls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.title, body: input.body ?? "Created by ArchOS agent orchestration.", head: input.head, base: input.base ?? base })
      }, true);
      return { number: result.number, url: result.html_url, head: result.head.ref, base: result.base.ref };
    }
  };
}

export function missionBranchName(missionId: string, agentId: string): string {
  const digest = createHash("sha256").update(`${missionId}:${agentId}`).digest("hex").slice(0, 12);
  return `archos/agent/${agentId}/${digest}`;
}
