import { CityNode, SpatialAsset } from '../types';
import { EXPERIENCES } from '../data/experiences';

// Convert Motion/Form Experiences into Spatial Assets inside the UAE World Model
export const MOTION_FORM_ASSETS: SpatialAsset[] = EXPERIENCES.map((exp) => ({
  id: exp.id,
  name: exp.title,
  type: 'experience',
  cityId: 'dubai', // Default spatial anchor in Future Design Lab
  districtName: 'Future Tech & Innovation District',
  description: exp.description || exp.tagline,
  specs: exp.specs,
  layers: exp.layers,
  videoSrc: exp.videoSrc,
  isPreRendered: true,
  simulationScenarios: [
    {
      id: `${exp.id}-sim-1`,
      title: 'Structural Aerodynamic Stress & Optimization',
      description: 'Simulate mechanical load distribution and component fatigue under high-velocity orbital stresses.',
      baselineState: 'Standard composite structure at 100% nominal load.',
      projectedState: 'Next-gen carbon lattice reinforcement reduces mass by 28% while increasing torsional rigidity by 42%.',
      deltaMetrics: [
        { metric: 'Mass Efficiency', before: '1,450 kg', after: '1,044 kg', delta: '-28.0%' },
        { metric: 'Torsional Rigidity', before: '45,000 Nm/deg', after: '63,900 Nm/deg', delta: '+42.0%' },
        { metric: 'Thermal Dissipation', before: '650 W/m²K', after: '920 W/m²K', delta: '+41.5%' }
      ]
    }
  ],
  metadata: exp.metadata
}));

export const UAE_CITIES: CityNode[] = [
  {
    id: 'dubai',
    name: 'Dubai',
    arabicName: 'دبي',
    tagline: 'Global Hub for Future Innovation, Logistics & Advanced Infrastructure',
    description: 'Dynamic metropolis leading global smart governance, autonomous transport corridors, blockchain commerce, and aerospace design.',
    coordinates: [25.2048, 55.2708],
    branchAngle: 0,
    colorHex: '#00e5ff',
    metrics: {
      population: '3.65M',
      gdpContribution: 'AED 430B+',
      infrastructureScore: '98.4 / 100',
      cleanEnergyShare: '24.5%'
    },
    domains: [
      {
        id: 'infrastructure',
        name: 'Infrastructure & Real Estate',
        iconName: 'Building2',
        summary: 'World-class hyperstructures, autonomous vertical transit, and intelligent microclimate urban fabric.',
        kpis: [
          { label: 'Hyperstructure Readiness', value: '99.1%', trend: '+1.4%' },
          { label: 'Smart Grid Efficiency', value: '96.8%', trend: '+3.2%' },
          { label: 'BIM Level 3 Adoption', value: '94.0%', trend: '+5.0%' }
        ],
        activeProjectsCount: 142,
        readinessScore: 97,
        assets: [
          {
            id: 'burj-future-tower',
            name: 'Burj Future Hyperstructure',
            arabicName: 'برج المستقبل الفائق',
            type: 'building',
            cityId: 'dubai',
            districtName: 'Downtown Dubai',
            description: 'Next-generation 1,150-meter mixed-use vertical city featuring aerodynamic vortex dampers, integrated solar photovoltaic skin, and magnetic elevator shafts.',
            specs: [
              { label: 'Total Height', value: '1,150 m' },
              { label: 'Floors', value: '240 Levels' },
              { label: 'Energy Self-Sufficiency', value: '88% Clean Solar / Wind' },
              { label: 'Structural Steel / Alloy', value: 'Super-grade Titanium Composite' }
            ],
            layers: [
              { id: 'bft-facade', index: '01', name: 'Photovoltaic Smart Facade', description: 'Dual-glazed kinetic thermal responsive skin with embedded microscopic solar cells.', material: 'Electrochromic Smart Glass & BIPV', relativeDepth: 0.15, offsetAxis: 'x', colorHex: '#00e5ff' },
              { id: 'bft-structure', index: '02', name: 'Exoskeleton Lattice & Outriggers', description: 'Aerodynamic diagrid exoskeleton distributing lateral wind shear and seismic forces.', material: 'Titanium-Reinforced Carbon Fiber', relativeDepth: 0.35, offsetAxis: 'y', colorHex: '#d4ff00' },
              { id: 'bft-mep', index: '03', name: 'MEP & Vertical Smart HVAC Core', description: 'Closed-loop vacuum thermal exchange shafts and localized water reclamation networks.', material: 'High-density insulated copper & PEX', relativeDepth: 0.55, offsetAxis: 'x', colorHex: '#f59e0b' },
              { id: 'bft-elevator', index: '04', name: 'Magnetic Levitated Transit Pods', description: 'Ropeless multidirectional elevator transit network operating at up to 25 m/s.', material: 'Superconducting Maglev Guideway', relativeDepth: 0.75, offsetAxis: 'z', colorHex: '#8b5cf6' },
              { id: 'bft-foundation', index: '05', name: 'Subterranean Friction Pile Foundation', description: 'Deep bedrock anchors extending 90 meters beneath sea level with seismic dampening.', material: 'Self-healing ultra-high performance concrete', relativeDepth: 0.95, offsetAxis: 'y', colorHex: '#64748b' }
            ],
            simulationScenarios: [
              {
                id: 'bft-thermal-sim',
                title: 'High-Temperature Climate Load Simulation',
                description: 'Model building thermal envelope performance under extreme 52°C ambient desert temperature with 100% solar irradiation.',
                baselineState: 'Standard HVAC cooling cycle consuming 14.2 MW during peak afternoon hours.',
                projectedState: 'Kinetic nano-louvers activate automatically; solar absorption decreases by 38%, lowering HVAC demand to 8.8 MW.',
                deltaMetrics: [
                  { metric: 'Peak Power Demand', before: '14.2 MW', after: '8.8 MW', delta: '-38.0%' },
                  { metric: 'Internal Ambient Temp', before: '23.5°C', after: '22.0°C', delta: '-1.5°C' },
                  { metric: 'Water Vapor Recycled', before: '18,000 L/day', after: '34,500 L/day', delta: '+91.6%' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'logistics',
        name: 'Logistics & Global Ports',
        iconName: 'Ship',
        summary: 'World-leading deepwater maritime automated terminals, customs clearance robotics, and multimodal rail connectivity.',
        kpis: [
          { label: 'TEU Annual Capacity', value: '22.4M TEU', trend: '+6.8%' },
          { label: 'Turnaround Time', value: '8.2 hrs / vessel', trend: '-14.0%' },
          { label: 'Automated AGV Uptime', value: '99.94%', trend: '+0.2%' }
        ],
        activeProjectsCount: 88,
        readinessScore: 99,
        assets: [
          {
            id: 'jebel-ali-mega-port',
            name: 'Jebel Ali Autonomous Port Terminal 5',
            arabicName: 'ميناء جبل علي - المحطة الذكية 5',
            type: 'port',
            cityId: 'dubai',
            districtName: 'Jebel Ali Freezone',
            description: 'Fully autonomous deepwater container terminal with artificial intelligence berth planning and automated straddle carriers.',
            specs: [
              { label: 'Berth Depth', value: '-18.5 m Low Tide' },
              { label: 'Quay Length', value: '3,200 m' },
              { label: 'Automation Level', value: '100% Electrified AGV & Remote STS Cranes' },
              { label: 'Handling Speed', value: '44 moves / gross crane hour' }
            ],
            layers: [
              { id: 'jap-cranes', index: '01', name: 'High-Speed Automated Quay Cranes (STS)', description: 'Electric tandem-lift 40-container gantry cranes with remote visual telemetry.', material: 'Marine-grade structural steel & fiber-optic bus', relativeDepth: 0.2, offsetAxis: 'y', colorHex: '#00e5ff' },
              { id: 'jap-agv', index: '02', name: 'Autonomous Guided Vehicles (AGV Grid)', description: '5G ultra-low latency robotic transport fleet with high-cycle lithium titanate batteries.', material: 'Autonomous telemetry chassis & LiDAR array', relativeDepth: 0.4, offsetAxis: 'x', colorHex: '#d4ff00' },
              { id: 'jap-yard', index: '03', name: 'High-Density Automated Stacking Yard', description: 'Automated stacking cranes (ASC) organizing 120,000 slots based on predictive vessel arrival.', material: 'Reinforced concrete apron & anti-corrosive rails', relativeDepth: 0.65, offsetAxis: 'z', colorHex: '#f59e0b' },
              { id: 'jap-rail', index: '04', name: 'Multimodal Freight Rail Transfer Link', description: 'Direct intermodal interface with Etihad Rail network providing inland GCC freight transit.', material: 'Heavy haul railway ballast & overhead power', relativeDepth: 0.9, offsetAxis: 'y', colorHex: '#8b5cf6' }
            ],
            simulationScenarios: [
              {
                id: 'jap-surge-sim',
                title: 'Global Trade Redirection Stress Test',
                description: 'Simulate +35% sudden container diversion resulting from geopolitical strait rerouting.',
                baselineState: 'Normal throughput at 42,000 TEU/day with 12-hour customs turnaround.',
                projectedState: 'AI Dynamic Berth Allocation kicks in, scaling automated AGVs to 100% capacity; yard throughput surges to 58,000 TEU/day with zero berthing backlog.',
                deltaMetrics: [
                  { metric: 'Daily TEU Processed', before: '42,000', after: '58,200', delta: '+38.5%' },
                  { metric: 'Average Dwell Time', before: '2.4 days', after: '1.9 days', delta: '-20.8%' },
                  { metric: 'Berth Queue Time', before: '4.2 hrs', after: '0.8 hrs', delta: '-80.9%' }
                ]
              }
            ]
          }
        ]
      }
    ],
    assets: []
  },
  {
    id: 'abu-dhabi',
    name: 'Abu Dhabi',
    arabicName: 'أبوظبي',
    tagline: 'Capital of Strategic Governance, Clean Nuclear Energy & Sovereign Technology',
    description: 'Federal capital pioneering large-scale zero-carbon energy grids, sovereign AI clusters, aerospace defense, and advanced maritime ecosystems.',
    coordinates: [24.4539, 54.3773],
    branchAngle: (Math.PI * 2) / 7,
    colorHex: '#d4ff00',
    metrics: {
      population: '3.80M',
      gdpContribution: 'AED 1.14T',
      infrastructureScore: '99.0 / 100',
      cleanEnergyShare: '42.0%'
    },
    domains: [
      {
        id: 'energy',
        name: 'Clean Energy & Power Grid',
        iconName: 'Zap',
        summary: 'Nuclear baseload, mega solar arrays, green hydrogen electrolysis, and sovereign carbon capture.',
        kpis: [
          { label: 'Nuclear Baseload', value: '5,600 MW (Barakah)', trend: '100% Operational' },
          { label: 'Solar Output', value: '3,200 MW (Al Dhafra)', trend: '+12.4%' },
          { label: 'CO2 Offset / Year', value: '22.4M Tons', trend: '+18.0%' }
        ],
        activeProjectsCount: 94,
        readinessScore: 99,
        assets: [
          {
            id: 'barakah-energy-plant',
            name: 'Barakah Advanced Clean Power Grid',
            arabicName: 'محطة براكة للطاقة النووية السلمية',
            type: 'energy',
            cityId: 'abu-dhabi',
            districtName: 'Al Dhafrah Region',
            description: '4 APR-1400 nuclear reactors providing 25% of the entire UAE electricity demand with zero carbon emissions.',
            specs: [
              { label: 'Total Output', value: '5,600 MW' },
              { label: 'Reactor Type', value: 'Generation III+ APR-1400' },
              { label: 'Design Lifespan', value: '60+ Years' },
              { label: 'Grid Synchronicity', value: '99.999%' }
            ],
            layers: [
              { id: 'bep-containment', index: '01', name: 'Prestressed Reinforced Containment Building', description: '1.2m thick post-tensioned concrete dome with steel liner resisting catastrophic impacts.', material: 'Post-tensioned high-strength concrete', relativeDepth: 0.2, offsetAxis: 'y', colorHex: '#00e5ff' },
              { id: 'bep-reactor', index: '02', name: 'APR-1400 Reactor Pressure Vessel & Core', description: 'Heavy alloy steel reactor core utilizing low-enriched uranium oxide fuel assemblies.', material: 'Forged nickel-chromium-molybdenum alloy', relativeDepth: 0.45, offsetAxis: 'z', colorHex: '#d4ff00' },
              { id: 'bep-turbines', index: '03', name: 'High-Pressure Steam Turbines & Generators', description: 'Advanced dual-casing steam turbine generating 1,400 MWe per unit.', material: 'Chromium-molybdenum turbine rotor blades', relativeDepth: 0.7, offsetAxis: 'x', colorHex: '#f59e0b' },
              { id: 'bep-cooling', index: '04', name: 'Seawater Cooling & Reverse Osmosis Intake', description: 'Subsurface marine intake tunnels with ecological fish-protection screening.', material: 'Anti-biofouling titanium alloy piping', relativeDepth: 0.92, offsetAxis: 'y', colorHex: '#8b5cf6' }
            ],
            simulationScenarios: [
              {
                id: 'bep-grid-surge',
                title: 'High-Demand Green Hydrogen Electrolyzer Load Coupling',
                description: 'Simulate direct 1.2 GW baseload power diversion to produce 250,000 tons/year of liquid green hydrogen for export.',
                baselineState: '100% grid export supplying national residential and industrial base.',
                projectedState: 'Off-peak surplus dynamically directed to adjacent Al Dhafra hydrogen liquefaction facility with 92% round-trip conversion efficiency.',
                deltaMetrics: [
                  { metric: 'Green H2 Production', before: '0 tons', after: '250,000 tons/yr', delta: '+100%' },
                  { metric: 'Grid Peak Stability', before: '99.98%', after: '99.999%', delta: '+0.019%' },
                  { metric: 'Export Energy Value', before: '$1.2B', after: '$2.85B', delta: '+137.5%' }
                ]
              }
            ]
          }
        ]
      }
    ],
    assets: []
  },
  {
    id: 'sharjah',
    name: 'Sharjah',
    arabicName: 'الشارقة',
    tagline: 'Cultural Capital, Advanced Education, Heritage & Circular Economy',
    description: 'Center of university innovation clusters, sustainable zero-waste landfill diversion, and publishing economy.',
    coordinates: [25.3463, 55.4209],
    branchAngle: (Math.PI * 2 * 2) / 7,
    colorHex: '#3b82f6',
    metrics: {
      population: '1.85M',
      gdpContribution: 'AED 140B',
      infrastructureScore: '94.2 / 100',
      cleanEnergyShare: '31.0%'
    },
    domains: [
      {
        id: 'environment',
        name: 'Circular Economy & Zero Waste',
        iconName: 'Leaf',
        summary: 'Pioneering 100% landfill diversion, waste-to-energy conversion, and university R&D parks.',
        kpis: [
          { label: 'Landfill Diversion', value: '91.4%', trend: '+4.1%' },
          { label: 'Waste-to-Energy Output', value: '30 MW', trend: 'Optimal' },
          { label: 'R&D Patents', value: '412 / yr', trend: '+18.5%' }
        ],
        activeProjectsCount: 52,
        readinessScore: 95,
        assets: []
      }
    ],
    assets: []
  },
  {
    id: 'ajman',
    name: 'Ajman',
    arabicName: 'عجمان',
    tagline: 'Coastal Manufacturing, Maritime Engineering & Sustainable Tourism',
    description: 'Rapidly modernizing maritime drydocks, boutique coastal developments, and light industrial clusters.',
    coordinates: [25.4052, 55.5136],
    branchAngle: (Math.PI * 2 * 3) / 7,
    colorHex: '#ec4899',
    metrics: {
      population: '540K',
      gdpContribution: 'AED 36B',
      infrastructureScore: '91.8 / 100',
      cleanEnergyShare: '18.0%'
    },
    domains: [
      {
        id: 'manufacturing',
        name: 'Maritime & Advanced Fabrication',
        iconName: 'Anchor',
        summary: 'Specialized ship repair, superyacht refit, and precision metal fabrication.',
        kpis: [
          { label: 'Drydock Utilization', value: '94.6%', trend: '+2.8%' },
          { label: 'Export Manufacturing', value: 'AED 12.4B', trend: '+6.2%' }
        ],
        activeProjectsCount: 34,
        readinessScore: 92,
        assets: []
      }
    ],
    assets: []
  },
  {
    id: 'umm-al-quwain',
    name: 'Umm Al Quwain',
    arabicName: 'أم القيوين',
    tagline: 'Blue Economy, Mangrove Biospheres & Desalination Infrastructure',
    description: 'Preserving vital marine coastal ecosystems while driving world-class reverse osmosis water security.',
    coordinates: [25.5647, 55.5552],
    branchAngle: (Math.PI * 2 * 4) / 7,
    colorHex: '#10b981',
    metrics: {
      population: '110K',
      gdpContribution: 'AED 14B',
      infrastructureScore: '89.5 / 100',
      cleanEnergyShare: '22.0%'
    },
    domains: [
      {
        id: 'water-security',
        name: 'Desalination & Blue Biospheres',
        iconName: 'Droplets',
        summary: '150 MIGD ultra-efficient sea water reverse osmosis supplying national potable reserves.',
        kpis: [
          { label: 'RO Capacity', value: '150 MIGD', trend: '100% Online' },
          { label: 'Mangrove Carbon Stock', value: '2.4M Tons', trend: '+8.0%' }
        ],
        activeProjectsCount: 21,
        readinessScore: 93,
        assets: []
      }
    ],
    assets: []
  },
  {
    id: 'ras-al-khaimah',
    name: 'Ras Al Khaimah',
    arabicName: 'رأس الخيمة',
    tagline: 'Advanced Ceramics, Mineral Logistics, Heavy Industry & Mountain Tourism',
    description: 'Global supplier of high-grade ceramics, limestone quarrying, deepwater bulk shipping, and luxury alpine hospitality.',
    coordinates: [25.6741, 55.9804],
    branchAngle: (Math.PI * 2 * 5) / 7,
    colorHex: '#f59e0b',
    metrics: {
      population: '420K',
      gdpContribution: 'AED 48B',
      infrastructureScore: '93.5 / 100',
      cleanEnergyShare: '26.0%'
    },
    domains: [
      {
        id: 'industry',
        name: 'Advanced Materials & Mineral Logistics',
        iconName: 'Mountain',
        summary: 'World-scale bulk port facilities at Saqr Port and carbon-neutral green cement manufacturing.',
        kpis: [
          { label: 'Bulk Port Throughput', value: '75M Tons / yr', trend: '+5.4%' },
          { label: 'Ceramic Export Share', value: '#1 in MENA', trend: 'Stable' }
        ],
        activeProjectsCount: 46,
        readinessScore: 94,
        assets: []
      }
    ],
    assets: []
  },
  {
    id: 'fujairah',
    name: 'Fujairah',
    arabicName: 'الفجيرة',
    tagline: 'Strategic Indian Ocean Energy Gateway & Global Bunkering Hub',
    description: 'Bypassing the Strait of Hormuz with deepwater oil pipelines, massive offshore bunkering, and naval security hubs.',
    coordinates: [25.1288, 56.3265],
    branchAngle: (Math.PI * 2 * 6) / 7,
    colorHex: '#8b5cf6',
    metrics: {
      population: '310K',
      gdpContribution: 'AED 32B',
      infrastructureScore: '95.1 / 100',
      cleanEnergyShare: '20.0%'
    },
    domains: [
      {
        id: 'energy-gateway',
        name: 'Strategic Energy Gateway & Bunkering',
        iconName: 'Fuel',
        summary: 'World second-largest bunkering port with direct Indian Ocean access for UAE crude exports.',
        kpis: [
          { label: 'Bunkering Volume', value: '8.4M m³', trend: '+3.9%' },
          { label: 'Strategic Storage Capacity', value: '11.2M m³', trend: '+7.1%' }
        ],
        activeProjectsCount: 38,
        readinessScore: 98,
        assets: []
      }
    ],
    assets: []
  }
];

// Combine all domain assets
UAE_CITIES[0].assets = [
  ...UAE_CITIES[0].domains.flatMap(d => d.assets),
  ...MOTION_FORM_ASSETS
];
UAE_CITIES[1].assets = UAE_CITIES[1].domains.flatMap(d => d.assets);
