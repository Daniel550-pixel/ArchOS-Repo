# ULTRON Experience Layer

ULTRON is the ArchOS presentation/experience layer. It consumes read-only system state and renders intelligence state, world state and governance state.

## Boundary

ULTRON may visualize and dispatch user intent through the existing ArchOS command bus, but it must not own orchestration, policy, credentials, external side effects, or execution authority.

## Promoted source

The neural field is an ArchOS-native promotion of FGSE's `NeuralVisualizer`. The visual model preserves its particle, depth, connection and status-reactive behavior while removing the FGSE trading-domain dependency. The original source remains preserved under `integrations/source-repositories/FGSE/` for provenance.

## Components

- `UltronNeuralField.tsx` — animated neural/particle field.
- `UltronExperience.tsx` — minimal experience shell around the field.

## Integration contract

```text
ArchOS runtime state
        ↓
ULTRON presentation state
        ↓
visualization / user intent
        ↓
existing ArchOS command bus
        ↓
J.A.R.V.I.S. / governance / ActionGate
```
