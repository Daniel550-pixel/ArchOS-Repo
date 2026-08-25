# ArchOS Repository Fusion Matrix

Status: active integration baseline
Last audited: 2026-08-25

ArchOS remains the system-of-systems host. External repositories are treated as capability sources, not as codebases to merge wholesale.

## Audited repositories

| Repository | Observed capability | ArchOS integration target | Priority | Integration mode |
|---|---|---|---|---|
| `Daniel550-pixel/FinSight-Global-AI-2` | Financial/AI modules, FX, ESG, geo-risk, liquidity, regime detection, valuation, simulation artifacts and FastAPI entry point | Financial Intelligence domain, risk/forecasting specialist agents, evidence-producing analytics | High | Extract/normalize behind service contracts |
| `Daniel550-pixel/FinSight_Global_AI_Dashboard` | Streamlit dashboard plus alerts, auth, backtesting, broker API, deep-RL, Monte Carlo, hedging, sentiment and SaaS projections | Experience-module reference and financial analytics capabilities | Medium | Selective extraction; do not inherit dashboard coupling |
| `Daniel550-pixel/AIOS-Core-Architect.` | Minimal Gradio AIOS module simulation with configurable modules and live logs | Historical AIOS module model / lifecycle concepts | Medium | Reimplement concepts inside ArchOS runtime |
| `Daniel550-pixel/AI-mainframe` | Repository currently contains only a README pointer; no implementation to integrate | None yet | Low | Re-audit when implementation exists |
| `Daniel550-pixel/FGSE` | React/Vite experience, JARVIS service, market data service, neural visualizer, strategy/trader/db server modules | JARVIS contract ideas, market-data adapter, neural visualization concepts, trading-domain specialists | High | Extract contracts and UI concepts; route actions through ArchOS governance |

## Integration rules

1. ArchOS owns orchestration, governance, identity, evidence, world-model state, simulation and infrastructure boundaries.
2. No external repository may bypass `ActionGate` / governance for consequential actions.
3. External model outputs are observations or proposals until verified and authorized by ArchOS.
4. Financial trading capabilities remain paper/simulation oriented until an explicit governed execution path exists.
5. UI code is adapted into ArchOS experience modules rather than duplicated as separate applications.
6. Secrets, `.env` files, credentials and local-machine artifacts are never imported into ArchOS.
7. External repository dependencies are introduced only when they provide material capability and can satisfy ArchOS security and lifecycle requirements.

## Initial fusion domains

### Financial Intelligence Engine

Source capabilities: FinSight-Global-AI-2 and FinSight_Global_AI_Dashboard.

Planned contract:

- market observations
- financial signals
- sentiment observations
- valuation/risk scores
- scenario/backtest results
- FX observations
- ESG observations
- confidence/provenance metadata

### JARVIS Intelligence Adapter

Source capability: FGSE `jarvisService.ts`.

ArchOS already contains a JARVIS orchestrator. The FGSE implementation is therefore treated as a source of contract and prompt/decision-schema ideas, not as a second orchestration runtime.

### Experience / Neural Visualization

Source capability: FGSE `NeuralVisualizer.tsx` and its React/Vite experience layer.

Target: reusable ArchOS experience component under the existing Experience Engine, with command and state data supplied by ArchOS rather than local trading state.

### AIOS module lifecycle

Source capability: AIOS-Core-Architect.

Target: map module activation, state, logs and lifecycle concepts onto ArchOS runtime registry, event fabric and observability instead of running a separate Gradio process.

## Current conclusion

The repositories are complementary. The highest-value fusion is not a monolithic merge. It is a capability extraction strategy in which ArchOS becomes the authoritative runtime and the other repositories become bounded domain/experience sources.
