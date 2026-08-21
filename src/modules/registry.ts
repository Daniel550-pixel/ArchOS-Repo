import React from 'react';
import type { LifecycleStage } from '../../shared/contracts';
import { OrbCoreView } from '../components/views/OrbCoreView';
import { WorldModelView } from '../components/views/WorldModelView';
import { DesignStudioView } from '../components/views/DesignStudioView';
import { ProveSandboxView } from '../components/prove/ProveSandboxView';
import { ExperienceView } from '../components/views/ExperienceView';
import { RsiAgiMatrixView } from '../components/views/RsiAgiMatrixView';
import { IntelligenceEngineView } from '../components/views/IntelligenceEngineView';
import { PulseVitalityView } from '../components/views/PulseVitalityView';
import { SkywayDroneDispatchView } from '../components/views/SkywayDroneDispatchView';
import { AtmosphericWeatherRadarView } from '../components/views/AtmosphericWeatherRadarView';
import { RealEstateValuationView } from '../components/views/RealEstateValuationView';
import { EmiratesConnectivityMatrixView } from '../components/views/EmiratesConnectivityMatrixView';
import { MarketplaceHubView } from '../components/views/MarketplaceHubView';
import { FinOpsDashboardView } from '../components/views/FinOpsDashboardView';
import { Live } from '../panels';

export interface ModuleDefinition {
  stage: LifecycleStage;
  title: string;
  component: React.ComponentType<any>;
}

export const MODULES: Record<string, ModuleDefinition> = {
  orb: { stage: 'IMAGINE', title: 'Orb Sovereign Core', component: OrbCoreView },
  world: { stage: 'DISCOVER', title: 'World Model & Digital Twin', component: WorldModelView },
  design: { stage: 'DESIGN', title: 'LOD 350 Design Studio', component: DesignStudioView },
  prove: { stage: 'PROVE', title: 'Simulation Sandbox & Verification', component: ProveSandboxView },
  experience: { stage: 'BUILD', title: 'Operate & Experience BIM Explorer', component: ExperienceView },
  live: { stage: 'LIVE', title: 'Live Modbus Telemetry & MQTTS', component: Live },
  agi: { stage: 'OBSERVE', title: 'AGI MetaCognition & Reasoning', component: RsiAgiMatrixView },
  intelligence: { stage: 'OBSERVE', title: 'Epistemic Intelligence Engine', component: IntelligenceEngineView },
  pulse: { stage: 'LIVE', title: 'Pulse & Carbon Vitality', component: PulseVitalityView },
  skyway: { stage: 'LIVE', title: 'Autonomous Skyway Drone Corridors', component: SkywayDroneDispatchView },
  weather: { stage: 'OBSERVE', title: 'Atmospheric Weather Radar', component: AtmosphericWeatherRadarView },
  valuation: { stage: 'DISCOVER', title: 'Real Estate Valuation Matrix', component: RealEstateValuationView },
  connectivity: { stage: 'LIVE', title: 'Emirates Connectivity Fabric', component: EmiratesConnectivityMatrixView },
  marketplace: { stage: 'BUILD', title: 'Marketplace & Asset Procurement', component: MarketplaceHubView },
  finops: { stage: 'IMAGINE', title: 'FinOps Cost & Risk Router', component: FinOpsDashboardView },
};
