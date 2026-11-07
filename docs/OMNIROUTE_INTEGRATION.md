# OmniRoute integration — ArchOS / JARVIS

## Status and scope

This change adds OmniRoute as an optional central inference gateway for the
existing Claude Agent Fabric reasoning lane. ArchOS JARVIS dispatches its
canonical reasoning specialist through `ClaudeAgentFabric`; therefore JARVIS
requests that reach that specialist use the same gateway without changing the
orchestrator, agent contracts, world model, event fabric, or governance
pipeline.

This is an additive integration. OmniRoute is disabled by default. With
`OMNIROUTE_ENABLED=false`, the current direct Anthropic path remains active.
No provider credentials are copied into source code or the frontend.

## Upstream compatibility

The Windows installer targets the official OmniRoute npm package
`omniroute@3.8.54`. Its documented Node.js engine range is
`>=22.22.2 <23 || >=24.0.0 <27`; Node.js 24.x is supported.

The OpenAI-compatible API root is `http://127.0.0.1:20128/v1`.
The OpenAI SDK must receive this root URL (not the full chat-completions
endpoint); chat requests are sent to `/chat/completions`.

## Local installation (Windows)

From the ArchOS repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Install-Start-OmniRoute.ps1
```

The installer checks the Node.js engine range, installs the official npm
package if it is not already on PATH, and waits for the local service on
`127.0.0.1:20128`. With npm 11 or later, it uses the lifecycle-script
allowlist documented by OmniRoute 3.8.54:

```powershell
npm install -g --allow-scripts=omniroute,keytar,onnxruntime-node,@parcel/watcher,@swc/core,protobufjs,esbuild omniroute@3.8.54
```

The upstream dependency allowlist can change between releases. If npm reports
a different required package list, use the exact names in that npm warning;
do not disable lifecycle-script protections globally.

Dashboard: `http://127.0.0.1:20128`
API: `http://127.0.0.1:20128/v1`

In the dashboard, connect at least one eligible provider using its supported
account/API-key flow. Then create or copy an API key from **Dashboard →
Endpoints**. The `auto` model route requires at least one eligible connected
provider/model; a fresh installation without a provider connection cannot
complete an inference request.

## Verify OmniRoute before connecting ArchOS

Use the API key from Dashboard → Endpoints:

```powershell
$headers = @{ Authorization = "Bearer YOUR_OMNIROUTE_KEY" }
Invoke-RestMethod -Uri "http://127.0.0.1:20128/v1/models" -Headers $headers
```

The response should list the models available through the connected
providers. Do not paste API keys into source files, terminal transcripts, or
commits.

## ArchOS configuration

Run the secure local configuration helper from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Configure-OmniRoute.ps1
```

It verifies that `.env` is Git-ignored, accepts the key as hidden input, and
writes the local settings without printing the secret. The resulting local
configuration is equivalent to:

```dotenv
OMNIROUTE_ENABLED=true
OMNIROUTE_BASE_URL=http://127.0.0.1:20128/v1
OMNIROUTE_API_KEY=replace-with-the-local-omniroute-key
OMNIROUTE_MODEL=auto
OMNIROUTE_TIMEOUT_SECONDS=60
OMNIROUTE_FALLBACK_TO_ANTHROPIC=true
```

Keep `ANTHROPIC_API_KEY` configured if direct Anthropic fallback is desired.
The gateway uses the OpenAI-compatible chat-completions API. An explicit
OmniRoute model ID can be supplied instead of `auto` when required.

## Shared JARVIS / ArchOS path

`backend/jarvis/runtime.py` dispatches the reasoning stage through the
canonical swarm. The canonical reasoning specialist
(`backend/agents/claude_reasoning_agent.py`) calls `ClaudeAgentFabric`.
This is the integration point shared by ArchOS and its JARVIS runtime. The
JARVIS orchestrator and action gate remain unchanged.

## Runtime status and verification

- `GET /api/claude/status` reports selected provider, configuration state,
  gateway URL/model, and fallback availability. It does not expose secrets.
- `POST /api/claude/run` runs a governed model-analysis request.
- The existing `execution_authority=false` invariant is preserved.
- If OmniRoute fails and fallback is enabled with an Anthropic key, the
  request uses the existing direct Anthropic adapter. Otherwise the model
  lane reports failure/unconfigured; it does not silently invent a result.

## Security and operational boundaries

- Bind OmniRoute to loopback for local development; do not expose port 20128
  publicly without an authenticated, reviewed deployment design.
- Store OmniRoute and upstream provider keys only in local environment files
  or an approved secret manager.
- OmniRoute routing does not grant model outputs permission to execute tools.
  JARVIS governance, identity, risk, approval, and audit remain authoritative.
- Provider quotas, pricing, availability, and terms remain controlled by each
  upstream provider.
