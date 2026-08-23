# ArchOS Agent Runtime Adapter Contract

ArchOS separates **agent identity/capability registration** from **executable runtime binding**.

An external agent must not receive arbitrary code execution inside the ArchOS process. A production adapter is expected to place the implementation behind an isolated boundary (for example a container, sandbox, or separately authenticated service).

## Contract

An adapter implements:

- `health()` — runtime health and protocol metadata.
- `execute(task)` — executes a validated `AgentTask` inside the adapter boundary and returns an `AgentResult`.
- `shutdown()` — releases runtime resources.

The descriptor identifies the runtime protocol and advertised capabilities.

## Security boundary

Registration does **not** grant execution authority. The Agent Fabric validates the registered capability/permission contract, while the runtime adapter owns the execution boundary. Consequential actions must continue through ArchOS governance and verification.

`InProcessRuntimeAdapter` exists only for development and contract testing. It is **not** a production sandbox.

## Intended production flow

```text
external agent
     |
     v
authenticated adapter
     |
     v
Agent Fabric
     |
     +--> capability / permission validation
     |
     v
AgentTask
     |
     v
isolated runtime
     |
     v
AgentResult
     |
     +--> verification
     +--> Event Fabric
     +--> governed execution when applicable
```

This keeps the public integration contract stable while allowing the isolation technology to evolve independently.
