# OmniRoute integration — ArchOS / JARVIS

## Status and scope

This change adds OmniRoute as an optional central inference gateway for the
existing Claude Agent Fabric reasoning lane. ArchOS JARVIS already dispatches
its canonical reasoning specialist through `ClaudeAgentFabric`; therefore
JARVIS requests that reach that specialist use the same gateway without
changing the orchestrator, agent contracts, world model, event fabric, or
governance pipeline.

This is an additive integration. OmniRoute is disabled by default. With
`OMNIROUTE_ENABLED=false`, the current direct Anthropic path remains active.
No provider credentials are copied into source code or the frontend.

## Local installation (Windows)

Install OmniRoute using the official npm package:

```powershell
npm install -g omniroute
omniroute
```

The dashboard listens on `http://127.0.0.1:20128`; the OpenAI-compatible
inference API is `http://127.0.0.1:20128/v1`. Complete the OmniRoute setup
and connect at least one provider in its dashboard. Create/copy an API key
from Dashboard → Endpoints.

## ArchOS configuration

Add these values to the local, untracked `.env` file (never to Git):

```dotenv
OMNIROUTE_ENABLED=true
OMNIROUTE_BASE_URL=http://127.0.0.1:20128/v1
OMNIROUTE_API_KEY=replace-with-the-local-omniroute-key
OMNIROUTE_MODEL=auto
OMNIROUTE_TIMEOUT_SECONDS=60
OMNIROUTE_FALLBACK_TO_ANTHROPIC=true
```

Keep `ANTHROPIC_API_KEY` configured if direct Anthropic fallback is desired.
The gateway uses the OpenAI-compatible chat-completions API. `auto` delegates
model selection to OmniRoute; an explicit model can be supplied per request.

## Shared JARVIS / ArchOS path

`backend/jarvis/runtime.py` dispatches the reasoning stage through the
canonical swarm. The canonical reasoning specialist
(`backend/agents/claude_reasoning_agent.py`) calls
`ClaudeAgentFabric`. This is the integration point shared by ArchOS and its
JARVIS runtime. The JARVIS orchestrator and action gate remain unchanged.

## Runtime status and verification

- `GET /api/claude/status` reports selected provider, configuration state,
  gateway URL/model, and fallback availability. It does not expose secrets.
- `POST /api/claude/run` runs a governed model-analysis request.
- The existing `execution_authority=false` invariant is preserved.
- If OmniRoute fails and fallback is enabled with an Anthropic key, the request
  uses the existing direct Anthropic adapter. Otherwise the model lane reports
  failure/unconfigured; it does not silently invent a result.

## Security and operational boundaries

- Bind OmniRoute to loopback for local development; do not expose port 20128
  publicly without an authenticated, reviewed deployment design.
- Store OmniRoute and upstream provider keys only in local environment files
  or an approved secret manager.
- OmniRoute routing does not grant model outputs permission to execute tools.
  JARVIS governance, identity, risk, approval, and audit remain authoritative.
- Provider quotas, pricing, availability, and terms remain controlled by each
  upstream provider.
