import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = path.join(root, "server.ts");
const storePath = path.join(root, "server", "governance", "actionGateStore.ts");
const jwtPath = path.join(root, "server", "security", "jwt.ts");

const server = fs.readFileSync(serverPath, "utf8");
const failures = [];

if (!fs.existsSync(storePath)) failures.push("Missing ActionGateStore module");
if (!fs.existsSync(jwtPath)) failures.push("Missing centralized JWT module");

if (/history:\s*\[\]\s*as\s+NodeActionRequest\[\]/.test(server)) {
  failures.push("server.ts still declares an unbounded Action Gate history array");
}

if (/audit:\s*\[\]\s*as\s+any\[\]/.test(server)) {
  failures.push("server.ts still declares an unbounded Action Gate audit array");
}

if (/nodeActionGate\.audit\.push\(/.test(server)) {
  failures.push("server.ts still writes directly to the Action Gate audit array");
}

if (/nodeActionGate\.history\.push\(/.test(server)) {
  failures.push("server.ts still writes directly to the Action Gate history array");
}

if (/archos_sovereign_jwt_secret_key_2026_qkd/.test(server)) {
  failures.push("server.ts still contains the deprecated hard-coded JWT fallback secret");
}

if (failures.length) {
  console.error("Governance integration guard FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Governance integration guard PASSED");
console.log("- bounded Action Gate storage is enforced");
console.log("- centralized JWT security module is present");
console.log("- deprecated direct governance mutations are absent");
console.log("- deprecated hard-coded JWT fallback is absent");
