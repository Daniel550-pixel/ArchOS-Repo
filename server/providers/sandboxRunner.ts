import { spawn } from "node:child_process";
import path from "node:path";
import { assertPermission, assertWorkspacePath, ExecutorPolicy } from "./claudeExecutor";

export interface SandboxCommand {
  command: "git" | "ls" | "cat" | "pytest" | "node" | "npm";
  args: string[];
  cwd: string;
}

export interface SandboxResult {
  code: number;
  stdout: string;
  stderr: string;
}

const ALLOWED_COMMANDS = new Set<SandboxCommand["command"]>(["git", "ls", "cat", "pytest", "node", "npm"]);
const DENIED_ARG_PATTERNS = [
  /(^|\s)--?(?:exec|eval|command)(?:=|\s)/i,
  /(^|\s)(?:rm|del|rmdir|format|shutdown|reboot)(?:\s|$)/i,
  /(^|\s)(?:sudo|su)(?:\s|$)/i
];

export function validateSandboxCommand(policy: ExecutorPolicy, command: SandboxCommand) {
  assertPermission(policy, "shell:approved");
  if (!ALLOWED_COMMANDS.has(command.command)) throw new Error(`Sandbox denied command: ${command.command}`);
  assertWorkspacePath(policy, path.resolve(command.cwd));
  const joined = command.args.join(" ");
  if (DENIED_ARG_PATTERNS.some((pattern) => pattern.test(joined))) {
    throw new Error("Sandbox denied potentially destructive or arbitrary-execution arguments.");
  }
  if (policy.allowProduction) throw new Error("Production execution is not permitted by the development sandbox.");
}

export function runSandboxCommand(policy: ExecutorPolicy, command: SandboxCommand): Promise<SandboxResult> {
  validateSandboxCommand(policy, command);
  return new Promise((resolve, reject) => {
    const child = spawn(command.command, command.args, {
      cwd: path.resolve(command.cwd),
      shell: false,
      env: {
        PATH: process.env.PATH ?? "",
        NODE_ENV: "test"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}
