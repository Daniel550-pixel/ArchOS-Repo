# IRIS + AIOS Secure Architecture

IRIS means International Reality Integrity Platform. It is the trust and integrity plane of ArchOS. AIOS Secure is the defensive infrastructure layer that protects identities, secrets, agent actions, service communication, and runtime boundaries.

## System model

```text
                         ARCHOS
                            |
              +-------------+-------------+
              |                           |
          ULTRON                         JARVIS
      human experience              cognitive control
              |                           |
              +-------------+-------------+
                            |
                  INTELLIGENCE FABRIC
                            |
          +----------------+----------------+
          |                                 |
      WORLD MODEL                    CLAUDE AGENT FABRIC
          |                                 |
          +----------------+----------------+
                           |
                    CAUSAL / SIMULATION
                           |
             +-------------+-------------+
             |                           |
           IRIS                     AIOS SECURE
       trust state                 security plane
             |                           |
             +-------------+-------------+
                           |
                  GOVERNED ACTIONS
```

## IRIS domains

IRIS normalizes integrity observations from hardware, operating system, identity, network, data, reality/provenance, and AI-security domains. Each observation carries a score, confidence, timestamp, provenance, and optional metadata.

The first implementation is deliberately deterministic. A model may later correlate signals, but it must not become the authoritative calculator of the base integrity score.

## AIOS Secure modules

- SecureAuth: identity, authentication, authorization, and adaptive trust.
- SecureVault: secret and key lifecycle boundaries.
- AgentShield: agent permissions, tool policy, isolation, and execution boundaries.
- SecureMesh: authenticated service-to-service communication.
- ThreatBrain: detection, correlation, and response recommendations.

## Multi-model control flow

JARVIS routes objectives to role-specific agents: architect, researcher, analyst, specialist, critic, simulator, and synthesizer. The system records provenance and verification state. Consequential execution remains behind explicit policy and action gates.

## UI contract

ULTRON remains the primary human experience. God's Eye View is the spatial surface. The Intelligence Graph is the explanatory/observability surface. IRIS and AIOS Secure provide trust/security state that can be overlaid without turning the primary interface into a conventional dashboard.

## Design constraints

1. Observations are not automatically facts.
2. Inference is not presented as observation.
3. Prediction and simulation are explicitly labeled.
4. Security telemetry must not silently become an execution command.
5. High-impact actions require policy authorization and, where configured, human approval.
6. Provider-specific model logic stays behind adapters.
7. Secrets never belong in source control.
