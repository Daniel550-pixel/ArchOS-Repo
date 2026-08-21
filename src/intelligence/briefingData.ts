export interface IntelligenceFeedItem {
  id: string;
  tag: 'FACT' | 'ANALYSIS' | 'FORECAST' | 'SIMULATION' | 'ASSUMPTION';
  title: string;
  source: string;
  confidence: number;
  relevance: number;
  timestamp: string;
  timeStr: string;
  entity: string;
  entityId: string;
  affectedPath: string; // e.g. "Dubai > Infrastructure > Transportation"
  impactMetrics: string;
  provenance: {
    source: string;
    rawData: string;
    verification: string;
    entity: string;
  };
  whyThisMatters: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  likelihood: number;
  impactScore: number;
  overallRisk: number;
  correlations: { name: string; trend: 'up' | 'down' | 'neutral' }[];
  cityId: string;
  domainId: string;
}

export const INTELLIGENCE_FEED: IntelligenceFeedItem[] = [
  {
    id: 'metro-blue-line-q4',
    tag: 'FACT',
    title: 'Dubai Metro Blue Line Completion — Q4 2026',
    source: 'RTA Official',
    confidence: 0.97,
    relevance: 0.94,
    timestamp: '15 AUG 2026',
    timeStr: '07:42 GST',
    entity: 'Dubai Metro',
    entityId: 'DM-001',
    affectedPath: 'Dubai > Infrastructure > Transportation',
    impactMetrics: '24 new stations, 14.5km track, serves 320K daily riders',
    provenance: {
      source: 'RTA Official',
      rawData: 'Transit Update v3.2',
      verification: 'RTA Verified 15 AUG 2026',
      entity: 'Dubai Metro ID: DM-001'
    },
    whyThisMatters:
      'The Blue Line expands high-capacity rail access across key urban corridors, improving mobility, reducing highway congestion, and unlocking prime real estate and economic activity along new transit catchments including Dubai Creek Harbour and Academic City.',
    riskLevel: 'MEDIUM',
    likelihood: 55,
    impactScore: 60,
    overallRisk: 57,
    correlations: [
      { name: 'Economy', trend: 'up' },
      { name: 'Real Estate', trend: 'up' },
      { name: 'Infrastructure', trend: 'up' },
      { name: 'Transport', trend: 'up' }
    ],
    cityId: 'dubai',
    domainId: 'infrastructure'
  },
  {
    id: 'uae-trade-h1-2026',
    tag: 'ANALYSIS',
    title: 'UAE non-oil trade hits AED 1.2T in H1 2026',
    source: 'MoE + Customs',
    confidence: 0.91,
    relevance: 0.90,
    timestamp: '15 AUG 2026',
    timeStr: '07:38 GST',
    entity: 'Ministry of Economy',
    entityId: 'MOE-772',
    affectedPath: 'UAE > Federal > Economy & Foreign Trade',
    impactMetrics: '+14.4% YoY expansion in re-exports and high-tech manufacturing',
    provenance: {
      source: 'Federal Customs Authority',
      rawData: 'H1 Comprehensive Trade Ledger',
      verification: 'MoE Macro Bureau 15 AUG 2026',
      entity: 'National Trade Registry'
    },
    whyThisMatters:
      'Robust global CEPA partnerships with India, Turkey, Indonesia, and South Korea have supercharged non-oil industrial exports and strengthened sovereign logistics corridors through Jebel Ali and Khalifa Port.',
    riskLevel: 'LOW',
    likelihood: 25,
    impactScore: 85,
    overallRisk: 30,
    correlations: [
      { name: 'Global Ports', trend: 'up' },
      { name: 'Manufacturing', trend: 'up' },
      { name: 'Financial Liquidity', trend: 'up' }
    ],
    cityId: 'dubai',
    domainId: 'economy'
  },
  {
    id: 'ad-real-estate-q2',
    tag: 'ANALYSIS',
    title: 'Abu Dhabi real estate transactions up 12% YoY in Q2',
    source: 'DLD + Bayut',
    confidence: 0.91,
    relevance: 0.88,
    timestamp: '15 AUG 2026',
    timeStr: '07:35 GST',
    entity: 'Abu Dhabi DMT',
    entityId: 'AD-DMT-09',
    affectedPath: 'Abu Dhabi > Real Estate > Saadiyat & Yas',
    impactMetrics: 'AED 28.4B in residential & commercial acquisitions',
    provenance: {
      source: 'Department of Municipalities and Transport',
      rawData: 'Dari Real Estate Digital Index',
      verification: 'Audited DMT Quarterly Release',
      entity: 'Abu Dhabi Land Title Authority'
    },
    whyThisMatters:
      'High-net-worth international capital inflows into Saadiyat Cultural District and Al Maryah Financial Island continue to outpace regional indices, driven by Golden Visa reforms and prime luxury inventory.',
    riskLevel: 'LOW',
    likelihood: 30,
    impactScore: 70,
    overallRisk: 35,
    correlations: [
      { name: 'Sovereign Wealth', trend: 'up' },
      { name: 'Construction Pipeline', trend: 'up' },
      { name: 'Mortgage Growth', trend: 'up' }
    ],
    cityId: 'abu-dhabi',
    domainId: 'real-estate'
  },
  {
    id: 'fujairah-port-double-2028',
    tag: 'FORECAST',
    title: 'Fujairah port capacity to double by 2028',
    source: 'AD Ports + internal model',
    confidence: 0.73,
    relevance: 0.85,
    timestamp: '15 AUG 2026',
    timeStr: '07:32 GST',
    entity: 'Fujairah Port Authority',
    entityId: 'FPA-004',
    affectedPath: 'Fujairah > Energy Gateway > Deepwater Bunkering',
    impactMetrics: '+12.5M m³ added strategic liquid storage and LNG bunkering',
    provenance: {
      source: 'AD Ports Maritime Advisory',
      rawData: 'Indian Ocean Freight Model v4',
      verification: 'Internal Predictive Simulation',
      entity: 'Port of Fujairah Infrastructure'
    },
    whyThisMatters:
      'Bypassing the Strait of Hormuz for crude oil and clean ammonia exports establishes Fujairah as the premier energy security terminal for Indo-Pacific trade lanes.',
    riskLevel: 'MEDIUM',
    likelihood: 62,
    impactScore: 78,
    overallRisk: 52,
    correlations: [
      { name: 'Crude Transit', trend: 'up' },
      { name: 'Etihad Rail Freight', trend: 'up' },
      { name: 'Marine Bunkering', trend: 'up' }
    ],
    cityId: 'fujairah',
    domainId: 'energy-gateway'
  },
  {
    id: 'sharjah-industrial-growth',
    tag: 'FORECAST',
    title: 'Sharjah industrial zone demand expected to grow 8% by 2027',
    source: 'SCAD',
    confidence: 0.79,
    relevance: 0.79,
    timestamp: '15 AUG 2026',
    timeStr: '07:30 GST',
    entity: 'Sharjah SEDD',
    entityId: 'SHJ-SEDD-12',
    affectedPath: 'Sharjah > Economy > Industrial Clusters',
    impactMetrics: '480+ new advanced manufacturing & green tech licenses issued',
    provenance: {
      source: 'Sharjah Census & Statistics Department',
      rawData: 'Industrial Output Survey 2026',
      verification: 'SEDD Economic Observatory',
      entity: 'Sharjah Chamber of Commerce'
    },
    whyThisMatters:
      'Logistics integration with Sharjah International Airport free zone and sustainable zero-waste circular manufacturing hubs are attracting high-value regional supply chains.',
    riskLevel: 'LOW',
    likelihood: 40,
    impactScore: 65,
    overallRisk: 38,
    correlations: [
      { name: 'Light Industry', trend: 'up' },
      { name: 'Export Logistics', trend: 'up' }
    ],
    cityId: 'sharjah',
    domainId: 'environment'
  },
  {
    id: 'blue-line-business-bay-sim',
    tag: 'SIMULATION',
    title: 'Impact of Blue Line on Business Bay property values',
    source: 'JARVIS model',
    confidence: 0.68,
    relevance: 0.78,
    timestamp: '15 AUG 2026',
    timeStr: '07:28 GST',
    entity: 'JARVIS Neural Predictor',
    entityId: 'JARVIS-SIM-04',
    affectedPath: 'Dubai > Real Estate > Business Bay',
    impactMetrics: 'Projected +14.2% capital appreciation within 800m station catchment',
    provenance: {
      source: 'JARVIS World Model Simulation',
      rawData: 'Synthesized DLD Historic Corridor Model',
      verification: 'Confidence Envelope: 68%',
      entity: 'Urban Transit Valuation Algorithm'
    },
    whyThisMatters:
      'Reduced transit commute times to DXB Airport and Dubai International Financial Centre trigger rent rate adjustments and premium tenant lease conversions in prime Grade-A commercial towers.',
    riskLevel: 'MEDIUM',
    likelihood: 68,
    impactScore: 55,
    overallRisk: 48,
    correlations: [
      { name: 'Commercial Yields', trend: 'up' },
      { name: 'Pedestrian Density', trend: 'up' }
    ],
    cityId: 'dubai',
    domainId: 'real-estate'
  },
  {
    id: 'ad-population-2030-assumption',
    tag: 'ASSUMPTION',
    title: 'Abu Dhabi population to reach 4M by 2030',
    source: 'SCAD projection',
    confidence: 0.61,
    relevance: 0.72,
    timestamp: '15 AUG 2026',
    timeStr: '07:24 GST',
    entity: 'Statistics Centre Abu Dhabi',
    entityId: 'SCAD-DEMO-01',
    affectedPath: 'Abu Dhabi > Demographics > Strategic Planning',
    impactMetrics: '+200K net migration driven by advanced tech & sovereign finance sectors',
    provenance: {
      source: 'SCAD Demographic Long-Range Model',
      rawData: 'Civil Registry Annual Growth Trajectory',
      verification: 'Scenario-Weighted Projection',
      entity: 'Abu Dhabi Executive Council'
    },
    whyThisMatters:
      'Accelerating population growth mandates immediate utility grid scaling, desalination capacity additions, and autonomous transit master planning across Al Reem and Yas Island.',
    riskLevel: 'LOW',
    likelihood: 61,
    impactScore: 68,
    overallRisk: 42,
    correlations: [
      { name: 'Housing Demand', trend: 'up' },
      { name: 'Water Consumption', trend: 'up' },
      { name: 'Healthcare Capacity', trend: 'up' }
    ],
    cityId: 'abu-dhabi',
    domainId: 'energy'
  }
];
