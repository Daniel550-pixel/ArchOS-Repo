import {
  MarketplaceProduct,
  AcademyModule,
  FinanceUnderwritingModel,
  RetrofitSimulationCase,
  ProcurementMaterialItem,
  SimulationPackageItem,
  MultiAgentNegotiation,
  BusinessModelSpec
} from '../types/archosExpansion';

// ============================================================================
// MODULE 3 · MARKETPLACE PRODUCTS (Intelligence, Templates, Agents, Data)
// ============================================================================

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'prod-intel-gulf-logistics',
    title: 'GCC Maritime & Port Congestion Predictive Engine',
    category: 'INTELLIGENCE_PRODUCTS',
    provider: {
      name: 'Dubai Future Labs',
      organization: 'Government of Dubai / DFL',
      verified: true,
      rating: 4.95,
      downloadsCount: 1420,
      badge: 'SOVEREIGN_VERIFIED'
    },
    priceAed: 18500,
    pricingModel: 'MONTHLY_SAAS',
    summary: 'Real-time AIS satellite vessel telemetry, container dwell-time forecast, and supply chain bottleneck predictor across Jebel Ali, Khalifa Port, and Fujairah.',
    description: 'High-frequency container flow simulation with 94.8% accuracy. Flags regional choke points up to 14 days in advance.',
    provenanceHash: '0x88f4e29bca1092837465ae098231cf83b7492019',
    capabilities: ['AIS Ship Tracking', 'Queue Simulation', 'Inter-Emirate Truck Dispatch Sync', 'Customs Clearance Anomaly Detection'],
    ratingScore: 4.95,
    reviewsCount: 48,
    tags: ['Maritime', 'Logistics', 'Jebel Ali', 'Khalifa Port']
  },
  {
    id: 'prod-tpl-super-tall-aerodynamics',
    title: 'Parametric Aerodynamic Core: 400m+ Vortex Suppression',
    category: 'DESIGN_TEMPLATES',
    provider: {
      name: 'Foster + Arup Middle East Consortium',
      organization: 'Arup UAE Architecture Studio',
      verified: true,
      rating: 4.9,
      downloadsCount: 860,
      badge: 'GOLD_PARTNER'
    },
    priceAed: 45000,
    pricingModel: 'ONE_TIME',
    summary: 'Validated parametric BIM & CFD template for extreme desert wind vortex shedding, reducing lateral steel requirements by 14.2%.',
    description: 'Tested across 1:200 boundary layer wind tunnel simulations at Dubai Silicon Oasis. Direct Revit, Rhino/Grasshopper, and ArchOS Digital Twin export.',
    provenanceHash: '0xa11c498327d6e501928475bc839201948572bcae',
    capabilities: ['Curved Corner Tapering', 'Aerodynamic Vent Openings', 'Automated Mass Damper Sizing', 'Embodied Steel Reduction'],
    ratingScore: 4.9,
    reviewsCount: 32,
    tags: ['BIM', 'Grasshopper', 'Super-Tall', 'Wind CFD']
  },
  {
    id: 'prod-agent-structural-sentinel',
    title: 'Aegis Structural Sentinel 3.0 (Domain AI Agent)',
    category: 'AGENT_MARKETPLACE',
    provider: {
      name: 'MIT / Khalifa University Cyber-Physical Lab',
      organization: 'Khalifa University AI & Robotics',
      verified: true,
      rating: 4.98,
      downloadsCount: 2150,
      badge: 'SOVEREIGN_VERIFIED'
    },
    priceAed: 12000,
    pricingModel: 'MONTHLY_SAAS',
    summary: 'Autonomous 24/7 structural health monitoring agent. Ingests strain, tilt, accelerometer, and thermal drift data to predict failure modes.',
    description: 'Deploys directly into J.A.R.V.I.S. multi-agent mesh. Participates in live Pareto trade-off negotiations against cost and carbon agents.',
    provenanceHash: '0x9938bca01928475620194857bca0194857219485',
    capabilities: ['Finite Element Anomaly Detection', 'Dynamic Modal Analysis', 'Pre-Stressed Tendon Health', 'J.A.R.V.I.S. Voice Alerts'],
    ratingScore: 4.98,
    reviewsCount: 76,
    tags: ['AI Agent', 'Structural Health', 'Multi-Agent', 'Safety']
  },
  {
    id: 'prod-sim-flash-flood-wadis',
    title: 'UAE Wadi & Urban Drainage Extreme Hydrology Simulator',
    category: 'SIMULATION_PACKAGES',
    provider: {
      name: 'National Center of Meteorology (NCM)',
      organization: 'UAE Federal NCM',
      verified: true,
      rating: 4.92,
      downloadsCount: 1680,
      badge: 'FEDERAL_SOVEREIGN'
    },
    priceAed: 24000,
    pricingModel: 'ONE_TIME',
    summary: 'Cloud-burst 200mm/24hr hydrological simulation package for road networks, underpasses, and basement waterproofing across all 7 Emirates.',
    description: 'Calibrated against historic April 2024 regional cloud seeding and torrential rainfall patterns. Simulates pump capacity and retention pond saturation.',
    provenanceHash: '0x2233445566778899aabbccddeeff001122334455',
    capabilities: ['2D Overland Flow', 'Culvert & Storm Drain Capacity', 'Infiltration Soil Mapping', 'Civil Defense Warning Triggers'],
    ratingScore: 4.92,
    reviewsCount: 54,
    tags: ['Hydrology', 'Flood Risk', 'NCM', 'Civil Defense']
  },
  {
    id: 'prod-data-energy-benchmarks',
    title: 'Anonymized UAE Commercial Asset Vitality & Carbon Benchmarks',
    category: 'DATA_PRODUCTS',
    provider: {
      name: 'ArchOS Data Consortium',
      organization: 'AIOS / UAE Real Estate Regulatory Authority (RERA)',
      verified: true,
      rating: 4.88,
      downloadsCount: 940,
      badge: 'OFFICIAL_INDEX'
    },
    priceAed: 8500,
    pricingModel: 'MONTHLY_SAAS',
    summary: 'Quarterly updated empirical dataset of 4,800+ UAE commercial buildings covering kWh/m², chiller ΔT degradation curves, and insurance loss ratios.',
    description: 'Privacy-preserving federated aggregation. Essential for developers, REIT fund managers, and insurance underwriters pricing risk.',
    provenanceHash: '0x77889900aabbccddeeff11223344556677889900',
    capabilities: ['Vitality Quintiles', 'Drift Probability Distributions', 'Opex Baseline Deciles', 'Carbon Credit Pricing History'],
    ratingScore: 4.88,
    reviewsCount: 29,
    tags: ['Data Feed', 'REIT', 'Underwriting', 'Benchmarks']
  }
];

// ============================================================================
// MODULE 4 · ACADEMY & CERTIFICATION PROGRAM
// ============================================================================

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: 'acad-01-foundations',
    title: 'ArchOS Core: UAE World Model & Digital Twin Orchestration',
    level: 'FOUNDATION',
    description: 'Master the fundamentals of the unified UAE Digital Twin, spatial BIM layers, and real-time sensory ingest pipelines.',
    durationHours: 16,
    curriculum: [
      'Digital Twin Architecture: From Geography to Plot Resolution',
      'The Observation → World Model → J.A.R.V.I.S. Loop',
      'Spatial Coordinate Transforms & BIM Decomposition',
      'Zero-Trust RBAC & Sovereign Telemetry Enclaves'
    ],
    enrolledPractitioners: 3420,
    examPassingScore: 85,
    certificationCredential: 'ArchOS Certified Associate (ACA)',
    institutionalMemoryCapture: 'Standardized operational procedures for multi-emirate spatial query routing and coordinate alignment.'
  },
  {
    id: 'acad-02-vitality-carbon',
    title: 'Vitality Engineering: Pulse Scores & Carbon Ledger Economics',
    level: 'PRACTITIONER',
    description: 'Learn to design, deploy, and audit the Building Vitality Index (0-100) and tokenize operational carbon savings into tradeable credits.',
    durationHours: 24,
    curriculum: [
      'Vitality Dimension Math: Structural, MEP, Energy, Carbon & Financial Health',
      'Sensor Drift Analytics: Accelerometers, Chiller ΔT, and VAV Dampers',
      'Lifecycle Carbon Accounting: Embodied vs Operational Budgets',
      'Connecting Pulse Scores to Risk-Based Insurance Premiums'
    ],
    enrolledPractitioners: 1890,
    examPassingScore: 90,
    certificationCredential: 'ArchOS Vitality & Carbon Practitioner (AVCP)',
    institutionalMemoryCapture: 'Continuous logging of MEP calibration best practices and chiller thermal drift correction protocols.'
  },
  {
    id: 'acad-03-sovereign-architect',
    title: 'Sovereign AI Systems Architect & Multi-Agent Orchestration',
    level: 'SOVEREIGN_ARCHITECT',
    description: 'The highest tier certification. Design sovereign enclaves, multi-agent Pareto negotiations, and automated DEFCON defense parameters.',
    durationHours: 40,
    curriculum: [
      'Multi-Agent Consensus: Structural vs Cost vs Carbon Optimization',
      'Sokovia Protocol & Cryptographic Hardware Security Modules (HSM)',
      'Federated Learning across UAE Institutional Clusters',
      'Licensing & White-Label Architecture for Foreign Sovereign Deployments'
    ],
    enrolledPractitioners: 420,
    examPassingScore: 95,
    certificationCredential: 'ArchOS Certified Sovereign Architect (ACSA)',
    institutionalMemoryCapture: 'Deep repository of sovereign enclave deployment templates and government inter-agency data sharing agreements.'
  }
];

// ============================================================================
// MODULE 5 · FINANCE & UNDERWRITING MODELS
// ============================================================================

export const FINANCE_UNDERWRITING_DATA: FinanceUnderwritingModel = {
  assetId: 'tower-b4471',
  assetName: 'Tower B-4471 Downtown Dubai',
  grossDevelopmentValueAed: 2450000000,
  totalConstructionCostAed: 1380000000,
  projectedIrrPercent: 18.4,
  equityMultiple: 2.34,
  loanToCostPercent: 60.0,
  paybackPeriodYears: 6.8,
  sensitivityMatrix: [
    { occupancyRate: 95, rentalYieldPercent: 8.8, resultingIrrPercent: 21.2, vitalityAdjustedValuationAed: 2620000000 },
    { occupancyRate: 90, rentalYieldPercent: 8.0, resultingIrrPercent: 18.4, vitalityAdjustedValuationAed: 2450000000 },
    { occupancyRate: 85, rentalYieldPercent: 7.2, resultingIrrPercent: 15.6, vitalityAdjustedValuationAed: 2280000000 },
    { occupancyRate: 75, rentalYieldPercent: 6.0, resultingIrrPercent: 11.8, vitalityAdjustedValuationAed: 1980000000 }
  ],
  insuranceUnderwriting: {
    standardMarketPremiumAed: 1850000,
    vitalityScoreDiscountAed: 231250,
    netAnnualPremiumAed: 1618750,
    vitalityDiscountPercent: 12.5,
    underwriterPool: ['Abu Dhabi National Insurance (ADNIC)', 'Oman Insurance / Sukoon', 'Dubai Islamic Insurance', 'Munich Re Syndicate'],
    riskRating: 'AA+',
    claimsLikelihoodReductionPercent: 34.0
  }
};

// ============================================================================
// MODULE 6 · LEGACY RETROFIT INTELLIGENCE
// ============================================================================

export const RETROFIT_SIMULATION_CASES: RetrofitSimulationCase[] = [
  {
    assetId: 'sharjah-tower3',
    assetName: 'Sharjah R&D Innovation Tower 3',
    scanResolutionMm: 2.0,
    pointCloudCountMillions: 142.5,
    originalYearBuilt: 2016,
    beforeRetrofit: {
      pulseScore: 78,
      annualEnergyMwh: 10476,
      annualCarbonTonnes: 2840,
      annualOpexAed: 6480000,
      assetValuationAed: 480000000
    },
    afterRetrofit: {
      pulseScore: 92,
      annualEnergyMwh: 6810,
      annualCarbonTonnes: 1420,
      annualOpexAed: 4210000,
      assetValuationAed: 545000000
    },
    netAssetAppreciationAed: 65000000,
    totalRetrofitCapexAed: 8400000,
    retrofitOpportunities: [
      {
        id: 'opp-chiller-mag',
        title: 'Magnetic Levitation Oil-Free Chiller Plant Upgrade',
        category: 'CHILLER_PLANT_MODERNIZATION',
        capexAed: 3200000,
        annualOpexSavedAed: 1120000,
        co2ReductionTonnesPerYear: 680,
        vitalityPointsGain: +6.4,
        paybackPeriodMonths: 34,
        tenancyDisruptionLevel: 'MINIMAL_NIGHT_WORK'
      },
      {
        id: 'opp-glazing-films',
        title: 'Nanoceramic Solar Heat Rejection Window Film on Facade',
        category: 'ENVELOPE_SMART_GLAZING',
        capexAed: 1800000,
        annualOpexSavedAed: 580000,
        co2ReductionTonnesPerYear: 390,
        vitalityPointsGain: +4.2,
        paybackPeriodMonths: 37,
        tenancyDisruptionLevel: 'ZERO_DISRUPTION'
      },
      {
        id: 'opp-ai-vav',
        title: 'AI Smart Actuators & Dynamic Occupancy VAV Retrofit',
        category: 'AI_DYNAMIC_AIRFLOW',
        capexAed: 1400000,
        annualOpexSavedAed: 420000,
        co2ReductionTonnesPerYear: 240,
        vitalityPointsGain: +3.0,
        paybackPeriodMonths: 40,
        tenancyDisruptionLevel: 'ZERO_DISRUPTION'
      },
      {
        id: 'opp-lift-regen',
        title: 'Elevator Regenerative Braking Grid Feedback Kits',
        category: 'REGENERATIVE_LIFT_DRIVES',
        capexAed: 2000000,
        annualOpexSavedAed: 150000,
        co2ReductionTonnesPerYear: 110,
        vitalityPointsGain: +1.8,
        paybackPeriodMonths: 160,
        tenancyDisruptionLevel: 'MINIMAL_NIGHT_WORK'
      }
    ]
  }
];

// ============================================================================
// MODULE 7 · PROCUREMENT NETWORK (Materials & EPDs)
// ============================================================================

export const PROCUREMENT_MATERIALS: ProcurementMaterialItem[] = [
  {
    id: 'mat-geopolymer-c60',
    name: 'Desert Creep C60 Ultra-Low Carbon Geopolymer Concrete',
    supplier: 'Emirates Cement & Low-Carbon Concrete Co.',
    location: 'Ras Al Khaimah Industrial Zone',
    embodiedCarbonKgPerUnit: 140, // vs 380 standard
    unit: 'm³',
    unitPriceAed: 380,
    leadTimeDays: 3,
    inventoryStatus: 'IN_STOCK_LOCAL',
    environmentalProductDeclarationUrl: 'https://epd.archos.ae/c60-geopolymer-2026.pdf',
    circularRecycledContentPercent: 65.0
  },
  {
    id: 'mat-recycled-steel-rebar',
    name: 'EMSTEEL EPD-Verified 100% Recycled Electric Arc Furnace Rebar',
    supplier: 'EMSTEEL / Emirates Steel Arkan',
    location: 'Industrial City of Abu Dhabi (ICAD)',
    embodiedCarbonKgPerUnit: 420, // vs 1800 blast furnace
    unit: 'Tonne',
    unitPriceAed: 2650,
    leadTimeDays: 5,
    inventoryStatus: 'IN_STOCK_LOCAL',
    environmentalProductDeclarationUrl: 'https://epd.archos.ae/emsteel-eaf-2026.pdf',
    circularRecycledContentPercent: 100.0
  },
  {
    id: 'mat-bipv-solar-glazing',
    name: 'Desert-Grade Triple Silver BIPV Photovoltaic Glazing Panels',
    supplier: 'Masdar Clean Technologies & Emirates Glass',
    location: 'Al Quoz Industrial Area, Dubai',
    embodiedCarbonKgPerUnit: 18,
    unit: 'm²',
    unitPriceAed: 520,
    leadTimeDays: 14,
    inventoryStatus: 'TRANSIT_JEBEL_ALI',
    environmentalProductDeclarationUrl: 'https://epd.archos.ae/bipv-emiratesglass-2026.pdf',
    circularRecycledContentPercent: 40.0
  }
];

// ============================================================================
// MODULE 8 · SIMULATION MARKETPLACE PACKAGES
// ============================================================================

export const SIMULATION_PACKAGES: SimulationPackageItem[] = [
  {
    id: 'sim-extreme-heat-52c',
    name: '52°C Extreme Desert Heatwave Chiller Failure Cascade Simulation',
    type: 'EXTREME_CLIMATE_HEATWAVE',
    resolution: 'PHYSICS_FEM_CFD',
    computeTimeSec: 8.4,
    priceAed: 14500,
    accuracyConfidence: 0.96,
    description: 'Calculates thermal inertia of concrete core, room-by-room temperature rise curve over 48 hours without grid power, and critical server room thresholds.'
  },
  {
    id: 'sim-uam-sky-vertiport',
    name: 'Dubai Urban Air Mobility (UAM) Vertiport Wind Shear & Rotor Inflow',
    type: 'URBAN_AIR_MOBILITY_CORRIDOR',
    resolution: 'PHYSICS_FEM_CFD',
    computeTimeSec: 12.2,
    priceAed: 32000,
    accuracyConfidence: 0.94,
    description: 'Simulates Joby / Archer eVTOL approach corridors between Burj Khalifa, Palm Jumeirah, and Dubai International Airport under cross-wind thermals.'
  }
];

// ============================================================================
// Multi-Agent Trade-off Negotiation Instance
// ============================================================================

export const ACTIVE_MULTI_AGENT_NEGOTIATION: MultiAgentNegotiation = {
  id: 'neg-tower-b4471-facade',
  title: 'Tower B-4471 West Facade Glazing & Structural Shading Optimization',
  targetAsset: 'Tower B-4471 Downtown Dubai',
  agents: {
    structural: {
      name: 'Structural Sentinel Agent',
      role: 'STRUCTURAL_RESILIENCE',
      priority: 'Max wind resistance (380 km/h gusts) & minimum facade deadload weight on outrigger cantilevers.',
      idealProposal: 'Heavy anodized titanium vertical louvers with rigid structural anchors (+18M AED capex, +420 Tonnes weight).',
      weight: 0.35
    },
    cost: {
      name: 'FinSight Cost Agent',
      role: 'FINANCIAL_OPTIMIZATION',
      priority: 'Lowest initial CAPEX and fastest payback under 36 months to preserve project IRR > 18%.',
      idealProposal: 'Standard double-pane low-E glass with zero exterior louvers (-14M AED capex, but +22% HVAC cooling penalty).',
      weight: 0.35
    },
    carbon: {
      name: 'Green Carbon Auditor Agent',
      role: 'CARBON_NET_ZERO',
      priority: 'Maximum solar heat gain coefficient (SHGC < 0.18) and minimum lifetime operational tCO₂e.',
      idealProposal: 'Dynamic BIPV electrochromic glass with recycled timber solar fins (-1,800 tCO₂e/yr, +24M AED capex).',
      weight: 0.30
    }
  },
  negotiatedConsensus: {
    compromiseSolution:
      'Pareto-Optimal Compromise: Ultra-lightweight perforated recycled aluminum aerofoil louvers + Triple-Silver Spectrally Selective Coating. Delivers 98% of target solar rejection while reducing structural deadload by 68% and capping capex delta at +4.8M AED.',
    structuralSafetyFactor: 2.15,
    capexDeltaAed: 4800000,
    carbonReductionTonnes: 1240,
    paretoOptimalityScore: 0.94,
    status: 'CONSENSUS_REACHED'
  }
};

// ============================================================================
// 6 BUSINESS MODELS MATRIX SPECIFICATION
// ============================================================================

export const ARCHOS_BUSINESS_MODELS: BusinessModelSpec[] = [
  {
    id: 'IAAS',
    title: 'Intelligence-as-a-Service (IaaS)',
    tagline: 'Predictable recurring subscription per building, per square meter, or per sovereign portfolio.',
    pricingMechanic: 'Tiered monthly/annual SaaS based on Gross Floor Area (GFA) and sensory telemetry density.',
    projectedAnnualRevenueAed: '180,000,000 AED',
    keyMetrics: [
      { label: 'Avg ARR / Building', value: '240,000 AED' },
      { label: 'Gross Margin', value: '88.4%' },
      { label: 'Net Retention', value: '138%' }
    ],
    description: 'The foundation of the platform. Real estate developers, master asset owners (Emaar, Aldar, Nakheel), and government ministries subscribe for continuous Digital Twin sync, sensor drift monitoring, and daily J.A.R.V.I.S. operational briefings.',
    strategicAdvantage: 'High switching costs once all BMS sensors, structural health gauges, and BIM layers are linked into the unified World Model.',
    tierStructure: [
      { tierName: 'Single Building Prime', targetSegment: 'Single Commercial / Residential Tower (< 80k m²)', rate: '18,000 AED / month', sla: '99.9% Uptime, Daily Pulse Index' },
      { tierName: 'Master District Nexus', targetSegment: 'Multi-tower master development (Up to 500k m²)', rate: '75,000 AED / month', sla: 'Sub-second telemetry, Automated multi-agent dispatch' },
      { tierName: 'Sovereign Portfolio Enclave', targetSegment: 'Emirate-wide sovereign asset holdings & ministries', rate: '280,000 AED / month', sla: 'Air-gapped on-premise enclaves, Sokovia DEFCON integration' }
    ]
  },
  {
    id: 'OUTCOME_BASED',
    title: 'Outcome-Based Pricing',
    tagline: 'Zero financial risk for asset owners: Pay strictly for proven, audited energy and carbon savings.',
    pricingMechanic: '20% to 35% revenue share on verified monthly OPEX utility reduction and avoided equipment failure costs.',
    projectedAnnualRevenueAed: '240,000,000 AED',
    keyMetrics: [
      { label: 'Pay per kWh Saved', value: '0.12 AED' },
      { label: 'Pay per Failure Prevented', value: '45,000 AED' },
      { label: 'Pay per tCO₂e Cut', value: '65 AED' }
    ],
    description: 'The most compelling commercial model. Rather than paying for software licenses upfront, asset owners pay a percentage of their actual utility bill reductions verified through the DEWA / ADDC billing API integrations.',
    strategicAdvantage: 'Aligns incentives perfectly. Sales cycles drop from 9 months to 3 weeks because customers only pay from realized utility savings.',
    tierStructure: [
      { tierName: 'Shared Energy Alpha', targetSegment: 'High energy consumption hotels, data centers, and malls', rate: '30% of verified monthly energy savings', sla: 'Guaranteed minimum 12% OPEX cut' },
      { tierName: 'Critical Failure Shield', targetSegment: 'Hospitals, airports, and transport nodes', rate: '25% share of avoided downtime risk', sla: 'Zero unplanned chiller/substation outages' }
    ]
  },
  {
    id: 'MARKETPLACE_REV',
    title: 'Intelligence Marketplace Revenue',
    tagline: 'The App Store for the Built World: Monetizing simulation packages, validated design templates, and 3rd-party agents.',
    pricingMechanic: '15% to 25% platform take-rate on all marketplace transactions, data feeds, and third-party agent subscriptions.',
    projectedAnnualRevenueAed: '95,000,000 AED',
    keyMetrics: [
      { label: 'Platform Take Rate', value: '20.0%' },
      { label: 'Active Developers & Labs', value: '148 Firms' },
      { label: 'Monthly GMV', value: '38.5M AED' }
    ],
    description: 'Global engineering firms (Arup, WSP, Foster), universities, and independent AI labs publish validated design templates, CFD simulation packages, and autonomous domain agents into the ArchOS ecosystem.',
    strategicAdvantage: 'Creates a massive network effect. Competitors cannot easily replicate an ecosystem with hundreds of pre-validated regional engineering packages.',
    tierStructure: [
      { tierName: 'Template & Script Sales', targetSegment: 'Parametric BIM algorithms & CFD scripts', rate: '20% take rate on one-time purchase', sla: 'Cryptographic provenance verification' },
      { tierName: 'Third-Party Agent Hosting', targetSegment: 'Specialized domain AI agents (e.g. Geotechnical, Acoustics)', rate: '15% rev share on monthly SaaS', sla: 'Zero-trust sandbox execution' }
    ]
  },
  {
    id: 'INSURANCE_PARTNERSHIPS',
    title: 'Risk-Based Insurance & Underwriting Partnerships',
    tagline: 'Transforming property insurance: Actuarial premiums dynamically indexed to the live Pulse Vitality Score.',
    pricingMechanic: '1.5% to 3.0% platform fee on all insurance policies written through the ArchOS underwriting consortium.',
    projectedAnnualRevenueAed: '140,000,000 AED',
    keyMetrics: [
      { label: 'Insured Asset Base', value: '42B AED' },
      { label: 'Loss Ratio Reduction', value: '-34%' },
      { label: 'Partner Underwriters', value: '6 Major Syndicates' }
    ],
    description: 'Insurers provide substantial premium discounts (up to 28%) to buildings maintaining Platinum Pulse Scores (90+), because real-time sensor monitoring virtually eliminates catastrophic water leaks, electrical fires, and elevator hoist failures.',
    strategicAdvantage: 'Asset owners mandate ArchOS purely to unlock millions of dirhams in annual insurance premium savings.',
    tierStructure: [
      { tierName: 'Vitality-Linked Policy', targetSegment: 'Commercial Grade-A Towers & Logistics Hubs', rate: '2.5% of gross written premium', sla: 'Real-time telemetry loss-prevention alerts' },
      { tierName: 'Parametric Weather Shield', targetSegment: 'Flash flood and desert storm damage indemnity', rate: '1.8% of policy volume', sla: 'Instant automated claims settlement via NCM sensor feed' }
    ]
  },
  {
    id: 'SOVEREIGN_LICENSING',
    title: 'Sovereign Government Licensing & Export',
    tagline: 'Exporting the UAE Reference Implementation to GCC & international sovereign authorities.',
    pricingMechanic: 'Multi-million dollar sovereign master license + annual sovereign infrastructure maintenance.',
    projectedAnnualRevenueAed: '320,000,000 AED',
    keyMetrics: [
      { label: 'Master License Fee', value: '50M - 120M AED' },
      { label: 'Annual Support & Upgrades', value: '18%' },
      { label: 'Sovereign Enclaves', value: '100% Air-Gapped' }
    ],
    description: 'The UAE AIOS / ArchOS deployment serves as the gold-standard reference implementation. Foreign municipal governments (e.g., Riyadh, Singapore, Doha) license the platform for national digital twin and infrastructure governance.',
    strategicAdvantage: 'High diplomatic and institutional prestige. Establishes the UAE as the global exporter of AI operating systems for the built world.',
    tierStructure: [
      { tierName: 'Municipal Twin License', targetSegment: 'Capital cities and metropolitan regions', rate: '65,000,000 AED upfront + 12M AED / yr', sla: 'Dedicated sovereign engineering battalion' },
      { tierName: 'National Sovereign OS', targetSegment: 'Country-wide multi-ministry deployment', rate: '140,000,000 AED upfront + 25M AED / yr', sla: 'Complete source escrow & national cryptographic key ownership' }
    ]
  },
  {
    id: 'CERTIFICATION_REVENUE',
    title: 'ArchOS Academy & Certification Ecosystem',
    tagline: 'Training the next generation of sovereign digital-twin architects and certified practitioners.',
    pricingMechanic: 'Tuition fees per practitioner certification, firm enterprise accreditation, and institutional knowledge capture fees.',
    projectedAnnualRevenueAed: '45,000,000 AED',
    keyMetrics: [
      { label: 'Certified Practitioners', value: '5,730+' },
      { label: 'Accredited Engineering Firms', value: '280+' },
      { label: 'Avg Exam Fee', value: '4,500 AED' }
    ],
    description: 'Government engineering departments, design consultancies, and contractors require staff to hold ACA, AVCP, or ACSA credentials to submit digital twins into national regulatory review portals.',
    strategicAdvantage: 'Creates an army of trained practitioners who mandate ArchOS on every new project they design or build.',
    tierStructure: [
      { tierName: 'Practitioner Certification Exam', targetSegment: 'Individual architects, MEP engineers, and BIM managers', rate: '4,500 AED per candidate', sla: 'Digital verifiable blockchain credential badge' },
      { tierName: 'Firm Enterprise Accreditation', targetSegment: 'Top 100 GCC architecture & MEP consultancies', rate: '85,000 AED annual firm license', sla: 'Unlimited internal practitioner training seats' }
    ]
  }
];
