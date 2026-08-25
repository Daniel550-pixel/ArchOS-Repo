# ArchOS Mission Control

Mission Control is the provider-agnostic orchestration foundation for ArchOS.

## Runtime boundaries

- **MissionEngine** owns mission lifecycle and task assignment.
- **AgentRegistry** owns agent identity, capability and permission metadata.
- **PolicyEngine** enforces risk and approval gates before consequential execution.
- **EventEngine** records immutable-in-process lifecycle events and provides deterministic mission replay.
- **AIProvider** abstracts Claude/other model runtimes.
- **KnowledgeProvider** abstracts Obsidian/claude-obsidian and future knowledge systems.
- **GitProvider** abstracts GitHub as the implementation source of truth.
- **TerminalProvider** abstracts execution environments without granting a default execution implementation.

## Mission lifecycle

`QUEUED -> PLANNING -> RUNNING -> VERIFYING -> COMPLETED`

Exceptional states are `BLOCKED`, `FAILED`, `CANCELLED`, and `ROLLED_BACK`.

## Agent contract

Agents are registered with a stable ID, model, role, capabilities, permissions and knowledge scope. The registry intentionally does not bind ArchOS to a specific vendor runtime.

## Knowledge projection

Agents receive scoped knowledge through `KnowledgeProvider.search(query, scope)`. ArchOS should project only the relevant Obsidian context into a mission instead of synchronizing an entire vault into every agent context.

## Development provenance

A mission can associate agent work with Git branches, commits and pull requests through `GitProvider`. Git remains the canonical implementation ledger; events remain the operational replay ledger.

## Replay

`EventEngine.replay(missionId)` returns mission events in timestamp order. ULTRON can use this stream to render execution timelines without storing full model transcripts by default.

## Security invariant

No provider is automatically configured with credentials or unrestricted execution. Consequential and high-impact actions require an explicit policy decision and, by default, operator approval.
