export type ExecutorPermission =
  | "repo:read"
  | "repo:write"
  | "git:branch"
  | "git:commit"
  | "git:pull-request"
  | "test:run"
  | "build:run"
  | "shell:approved";

export interface ExecutorPolicy {
  permissions: ReadonlySet<ExecutorPermission>;
  workspaceRoot: string;
  allowNetwork: boolean;
  allowProduction: boolean;
  requireApprovalFor: ReadonlySet<string>;
}

export interface ClaudeExecutionRequest {
  missionId: string;
  agentId: string;
  prompt: string;
  branch: string;
  policy: ExecutorPolicy;
}

export interface ClaudeExecutionEvent {
  type: "started" | "stdout" | "stderr" | "file_changed" | "test_result" | "committed" | "pull_request" | "completed" | "failed";
  timestamp: string;
  data: Record<string, unknown>;
}

export interface ClaudeExecutionResult {
  status: "COMPLETED" | "FAILED" | "BLOCKED";
  branch: string;
  commitSha?: string;
  pullRequestUrl?: string;
  events: ClaudeExecutionEvent[];
  reason?: string;
}

/**
 * Provider-neutral boundary for Claude Code / future coding agents.
 * The implementation is intentionally absent until a real executor is configured.
 * This prevents ArchOS from pretending that an unavailable model or shell is active.
 */
export interface ClaudeCodeExecutor {
  execute(request: ClaudeExecutionRequest, onEvent?: (event: ClaudeExecutionEvent) => void): Promise<ClaudeExecutionResult>;
}

export function createUnconfiguredClaudeExecutor(): ClaudeCodeExecutor {
  return {
    async execute(request, onEvent) {
      const event: ClaudeExecutionEvent = {
        type: "failed",
        timestamp: new Date().toISOString(),
        data: { missionId: request.missionId, agentId: request.agentId, reason: "CLAUDE_EXECUTOR_UNCONFIGURED" }
      };
      onEvent?.(event);
      return {
        status: "BLOCKED",
        branch: request.branch,
        events: [event],
        reason: "Claude Code executor is not configured."
      };
    }
  };
}

export function assertPermission(policy: ExecutorPolicy, permission: ExecutorPermission) {
  if (!policy.permissions.has(permission)) {
    throw new Error(`Executor policy denied permission: ${permission}`);
  }
}

export function assertWorkspacePath(policy: ExecutorPolicy, candidate: string) {
  const root = policy.workspaceRoot.replace(/[\\/]+$/, "");
  const normalized = candidate.replace(/\\/g, "/");
  const prefix = `${root.replace(/\\/g, "/")}/`;
  if (normalized !== root.replace(/\\/g, "/") && !normalized.startsWith(prefix)) {
    throw new Error("Executor policy denied filesystem path outside the mission workspace.");
  }
}
