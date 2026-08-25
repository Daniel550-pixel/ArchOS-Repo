export enum SystemStatus { IDLE="IDLE", ANALYZING="ANALYZING", EXECUTING="EXECUTING", RISK="RISK", LONG="LONG", SHORT="SHORT", PROFIT="PROFIT", LOSS="LOSS", HALT="HALT" }
export interface SystemState { status:SystemStatus; exposure:number; drawdown:number; pnl:number; totalCapital:number; availableCapital:number; totalAssets:number; netCashflow:number; liquidity:number; }
export interface MarketData { symbol:string; price:number; volatility:number; volume:number; trend:"UP"|"DOWN"|"SIDEWAYS"; }
export interface AgentScores { alpha:number; macro:number; risk:number; adversarial:number; }
export interface JarvisDecision { status:"EXECUTE"|"REJECT"|"HALT"; symbol:string; action:"LONG"|"SHORT"|"HOLD"; confidence:number; risk:number; reason:string; agent_scores:AgentScores; decision_score:number; capital_allocation:number; system_state:{exposure:number;drawdown:number;pnl:number}; }
