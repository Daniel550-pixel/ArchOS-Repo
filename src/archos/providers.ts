export interface KnowledgeDocument { id: string; title: string; path: string; content: string; tags: string[]; updatedAt?: string; }

export interface KnowledgeProvider {
  search(query: string, scope?: string[]): Promise<KnowledgeDocument[]>;
  read(id: string): Promise<KnowledgeDocument | null>;
  write(document: KnowledgeDocument): Promise<void>;
  link(sourceId: string, targetId: string): Promise<void>;
}

export interface GitProvider {
  repository: string;
  read(path: string, ref?: string): Promise<string>;
  createBranch(name: string, baseRef: string): Promise<void>;
  createCommit(message: string, changes: Array<{ path: string; content: string }>): Promise<string>;
  createPullRequest(input: { title: string; body: string; head: string; base: string }): Promise<string>;
}

export interface AIProvider {
  id: string;
  model: string;
  run(input: { system?: string; prompt: string; context?: Record<string, unknown> }): Promise<{ text: string; model: string; usage?: Record<string, number> }>;
}

export interface TerminalProvider {
  id: string;
  execute(command: string, cwd?: string, timeoutMs?: number): Promise<{ exitCode: number; stdout: string; stderr: string }>;
}

export class MemoryKnowledgeProvider implements KnowledgeProvider {
  private readonly documents = new Map<string, KnowledgeDocument>();
  private readonly links = new Map<string, Set<string>>();
  async search(query: string, scope: string[] = []): Promise<KnowledgeDocument[]> {
    const needle = query.toLowerCase();
    return [...this.documents.values()].filter((doc) =>
      (!scope.length || scope.some((prefix) => doc.path.startsWith(prefix))) &&
      `${doc.title} ${doc.path} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase().includes(needle)
    );
  }
  async read(id: string): Promise<KnowledgeDocument | null> { return this.documents.get(id) ?? null; }
  async write(document: KnowledgeDocument): Promise<void> { this.documents.set(document.id, document); }
  async link(sourceId: string, targetId: string): Promise<void> {
    const set = this.links.get(sourceId) ?? new Set<string>();
    set.add(targetId); this.links.set(sourceId, set);
  }
}

export class UnconfiguredAIProvider implements AIProvider {
  id = "unconfigured";
  constructor(public model = "unconfigured") {}
  async run(): Promise<{ text: string; model: string }> {
    throw new Error("AI provider is not configured. Configure a provider adapter before execution.");
  }
}
