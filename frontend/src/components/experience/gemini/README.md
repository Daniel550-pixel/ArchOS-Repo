# ULTRON / Gemini Command Center

Gemini is a native ULTRON experience module, not a standalone application.

## Boundary

`GeminiCommandCenter.tsx` is presentation and user-intent UI. It calls the ArchOS Gemini gateway and reads ActionGate state. It does not own credentials, orchestration, policy, or execution authority.

## Runtime path

```text
ULTRON
  -> GeminiCommandCenter
  -> /api/reason
  -> JARVIS mission planning
  -> Google AI Studio / Gemini
  -> ActionGate for consequential proposals
```

The original prototype under `apps/gemini-command-center` remains available on this feature branch as a migration reference. The production-facing UI is now mounted directly by `UltronExperience`.
