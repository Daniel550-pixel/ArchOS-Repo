import { CanonicalWorldModelEntity, WorldModelGraphStats } from '../types/archosWorldModel';

export const INITIAL_WORLD_MODEL_ENTITIES: CanonicalWorldModelEntity[] = [
  {
    id: 'urn:archos:uae:dxb:downtown:bldg:b-4471',
    name: 'Tower B-4471 (Emaar Commercial Hub)',
    arabicName: 'برج بي-٤٤٧١ التجاري',
    entityClass: 'BUILDING',
    canonicalCode: 'DXB-DT-B4471',
    geometry: {
      type: 'BIM_IFC_LOD400',
      spatialReference: 'EPSG:3997',
      coordinates: [25.1972, 55.2744],
      elevationMslMeters: 4.8,
      heightMeters: 382.5,
      boundingRadiusMeters: 45.0,
      lodLevel: 4
    },
    location: {
      emirateId: 'dubai',
      emirateName: 'Dubai',
      municipalityZone: 'Sector 392 · Downtown Dubai',
      makaniNumber: '30032 95320',
      plotId: '392-4471',
      communityId: 'Downtown Master Community',
      latitude: 25.1972,
      longitude: 55.2744
    },
    attributes: {
      grossFloorAreaSqm: 148200,
      footprintAreaSqm: 4200,
      floorsAboveGround: 84,
      floorsBelowGround: 4,
      totalHeightMeters: 382.5,
      constructionYear: 2021,
      assetValueAed: 2450000000,
      occupancyCapacity: 6500,
      hvacCapacityTons: 4200,
      structuralCoreMaterial: 'Reinforced High-Strength Concrete (C80/95)',
      envelopeGlazingUValue: 1.18,
      pearlRatingEstidama: '4-Pearl Rated Equivalent',
      leedCertification: 'LEED Platinum Commercial v4.1',
      customSpecs: {
        'Elevator Groups': '14 Double-Deck High-Speed Banks',
        'District Cooling Provider': 'Empower Central Plant #3',
        'Grid Connection': 'DEWA 33kV Dual Redundant Substation'
      }
    },
    relationships: [
      {
        targetId: 'urn:archos:uae:dxb:district:downtown',
        targetClass: 'DISTRICT',
        targetName: 'Downtown Dubai District',
        relationType: 'CONTAINED_IN',
        weight: 1.0,
        isCriticalPath: true
      },
      {
        targetId: 'urn:archos:uae:dxb:utility:empower-cp3',
        targetClass: 'SYSTEM',
        targetName: 'Empower District Cooling Plant 3',
        relationType: 'COOLED_BY',
        weight: 0.95,
        isCriticalPath: true
      },
      {
        targetId: 'urn:archos:uae:dxb:utility:dewa-sub-dt7',
        targetClass: 'SYSTEM',
        targetName: 'DEWA 33kV Downtown Substation #7',
        relationType: 'POWERED_BY',
        weight: 0.98,
        isCriticalPath: true
      },
      {
        targetId: 'urn:archos:uae:dxb:gov:dubai-municipality',
        targetClass: 'FEDERATION',
        targetName: 'Dubai Municipality Planning Authority',
        relationType: 'REGULATED_BY',
        weight: 1.0,
        isCriticalPath: false
      }
    ],
    currentState: {
      vitalityScore: 92,
      operationalStatus: 'OPTIMAL',
      activeLoadKw: 3840,
      ambientTempCelsius: 38.4,
      coolingDemandTons: 2840,
      co2IntensityKgPerHour: 1420,
      activeOccupants: 4820,
      healthAnomalyCount: 0,
      lastTelemetrySync: '2026-08-17T07:48:12Z'
    },
    historicalState: {
      temporalLogRootMerkleHash: '0x8f2d93e4a1b0c8d7e6f5a4b3c2d1e0f98a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3',
      recordedIntervalsCount: 482000,
      historicalVitalityTrend: [
        { timestamp: '2026-03-01', score: 90 },
        { timestamp: '2026-04-01', score: 91 },
        { timestamp: '2026-05-01', score: 93 },
        { timestamp: '2026-06-01', score: 91 },
        { timestamp: '2026-07-01', score: 92 },
        { timestamp: '2026-08-01', score: 92 }
      ],
      historicalEnergyKwh: [
        { month: 'Mar', kwh: 1240000 },
        { month: 'Apr', kwh: 1420000 },
        { month: 'May', kwh: 1890000 },
        { month: 'Jun', kwh: 2310000 },
        { month: 'Jul', kwh: 2650000 },
        { month: 'Aug', kwh: 2580000 }
      ]
    },
    predictedState: {
      predictionHorizonDays: 90,
      projectedVitalityIn30Days: 91.8,
      projectedFailureRiskProbability: 0.018,
      predictedPeakPowerDemandKw: 4250,
      nextRecommendedMaintenanceDate: '2026-11-15',
      confidenceIntervalPercent: 96.4
    },
    observations: [
      {
        sensorId: 'SNSR-DXB-VIB-01',
        sensorType: 'VIBRATION',
        protocol: 'Modbus_TCP',
        samplingRateHz: 50,
        lastValue: 0.42,
        unit: 'mm/s RMS',
        lastTimestamp: '2026-08-17T07:48:12Z',
        status: 'ACTIVE'
      },
      {
        sensorId: 'SNSR-DXB-CHW-FLOW-03',
        sensorType: 'CHILLED_WATER_FLOW',
        protocol: 'BACnet/IP',
        samplingRateHz: 1,
        lastValue: 248.5,
        unit: 'L/s',
        lastTimestamp: '2026-08-17T07:48:12Z',
        status: 'ACTIVE'
      },
      {
        sensorId: 'SNSR-DXB-PWR-MAIN',
        sensorType: 'POWER_KW',
        protocol: 'DEWA_Smart_Grid',
        samplingRateHz: 0.2,
        lastValue: 3840.0,
        unit: 'kW',
        lastTimestamp: '2026-08-17T07:48:12Z',
        status: 'ACTIVE'
      }
    ],
    provenance: {
      originSource: 'Dubai Municipality BIM LOD-400 Registry & Emaar SCADA Bridge',
      organization: 'Emaar Properties & Dubai Municipality',
      method: 'DIRECT_IOT',
      ingestedAt: '2026-01-10T00:00:00Z',
      verifiedBy: 'Sovereign UAE Validator Authority Node #04',
      digitalSignatureSha256: '0xe7c4f83b1a29d84e56c701239847abcdef1234567890abcdef1234567890abcd'
    },
    confidence: {
      score: 0.985,
      epistemicUncertainty: 0.015,
      sensorNoiseIndex: 0.008,
      decayFactor: 0.999,
      lastCalibratedAt: '2026-08-16T22:00:00Z'
    },
    permissions: {
      classification: 'DEVELOPER_RESTRICTED',
      ownerTenantId: 'tenant-emaar-downtown',
      authorizedRoles: ['ROLE_SOVEREIGN_ADMIN', 'ROLE_ASSET_MANAGER', 'ROLE_BMS_ENGINEER'],
      isAirGappedSovereign: false
    },
    lifecycleState: 'LIVE',
    epistemologicalTag: 'OBSERVED',
    epistemologicalRationale: 'Live BACnet/IP and DEWA telemetry streams actively streaming with verified cryptographic signatures.'
  },
  {
    id: 'urn:archos:uae:dxb:downtown:bldg:burj-khalifa',
    name: 'Burj Khalifa Sovereign Landmark',
    arabicName: 'برج خليفة',
    entityClass: 'BUILDING',
    canonicalCode: 'DXB-DT-BK01',
    geometry: {
      type: 'BIM_IFC_LOD400',
      spatialReference: 'EPSG:3997',
      coordinates: [25.1972, 55.2744],
      elevationMslMeters: 5.0,
      heightMeters: 828.0,
      boundingRadiusMeters: 80.0,
      lodLevel: 4
    },
    location: {
      emirateId: 'dubai',
      emirateName: 'Dubai',
      municipalityZone: 'Sector 392 · Downtown Dubai',
      makaniNumber: '30000 95000',
      plotId: '392-0001',
      communityId: 'Downtown Master Community',
      latitude: 25.1972,
      longitude: 55.2744
    },
    attributes: {
      grossFloorAreaSqm: 309473,
      footprintAreaSqm: 8000,
      floorsAboveGround: 163,
      floorsBelowGround: 2,
      totalHeightMeters: 828.0,
      constructionYear: 2010,
      assetValueAed: 5800000000,
      occupancyCapacity: 12000,
      hvacCapacityTons: 10000,
      structuralCoreMaterial: 'High Performance Concrete Buttressed Core (C80)',
      envelopeGlazingUValue: 1.45,
      pearlRatingEstidama: 'Estidama Sovereign Landmark Rating',
      leedCertification: 'LEED Gold Existing Buildings v4',
      customSpecs: {
        'Tuned Mass / Vortex Damping': 'Aerodynamic Y-Shape Stepped Setbacks',
        'Condensate Recovery': '15 Million Gallons / Year Collected for Irrigation'
      }
    },
    relationships: [
      {
        targetId: 'urn:archos:uae:dxb:district:downtown',
        targetClass: 'DISTRICT',
        targetName: 'Downtown Dubai District',
        relationType: 'CONTAINED_IN',
        weight: 1.0,
        isCriticalPath: true
      },
      {
        targetId: 'urn:archos:uae:dxb:utility:empower-central-district',
        targetClass: 'SYSTEM',
        targetName: 'Empower Mega District Cooling',
        relationType: 'COOLED_BY',
        weight: 0.99,
        isCriticalPath: true
      }
    ],
    currentState: {
      vitalityScore: 94,
      operationalStatus: 'OPTIMAL',
      activeLoadKw: 9240,
      ambientTempCelsius: 38.6,
      coolingDemandTons: 7100,
      co2IntensityKgPerHour: 3410,
      activeOccupants: 8900,
      healthAnomalyCount: 0,
      lastTelemetrySync: '2026-08-17T07:48:15Z'
    },
    historicalState: {
      temporalLogRootMerkleHash: '0x3a9b1c7d2e8f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
      recordedIntervalsCount: 920000,
      historicalVitalityTrend: [
        { timestamp: '2026-03-01', score: 94 },
        { timestamp: '2026-04-01', score: 93 },
        { timestamp: '2026-05-01', score: 94 },
        { timestamp: '2026-06-01', score: 94 },
        { timestamp: '2026-07-01', score: 93 },
        { timestamp: '2026-08-01', score: 94 }
      ],
      historicalEnergyKwh: [
        { month: 'Mar', kwh: 3100000 },
        { month: 'Apr', kwh: 3800000 },
        { month: 'May', kwh: 4900000 },
        { month: 'Jun', kwh: 5800000 },
        { month: 'Jul', kwh: 6400000 },
        { month: 'Aug', kwh: 6250000 }
      ]
    },
    predictedState: {
      predictionHorizonDays: 180,
      projectedVitalityIn30Days: 93.9,
      projectedFailureRiskProbability: 0.009,
      predictedPeakPowerDemandKw: 10200,
      nextRecommendedMaintenanceDate: '2026-10-01',
      confidenceIntervalPercent: 98.1
    },
    observations: [
      {
        sensorId: 'SNSR-BK-STRAIN-FL140',
        sensorType: 'STRUCTURAL_STRAIN',
        protocol: 'OPC_UA',
        samplingRateHz: 100,
        lastValue: 12.4,
        unit: 'microstrain',
        lastTimestamp: '2026-08-17T07:48:15Z',
        status: 'ACTIVE'
      },
      {
        sensorId: 'SNSR-BK-ELEV-SPD-BANK1',
        sensorType: 'VIBRATION',
        protocol: 'Modbus_TCP',
        samplingRateHz: 20,
        lastValue: 0.18,
        unit: 'mm/s',
        lastTimestamp: '2026-08-17T07:48:15Z',
        status: 'ACTIVE'
      }
    ],
    provenance: {
      originSource: 'Dubai Crown Prince Office & Emaar Master Asset Monitoring Fabric',
      organization: 'Emaar Properties PJSC',
      method: 'DIRECT_IOT',
      ingestedAt: '2025-01-01T00:00:00Z',
      verifiedBy: 'Sovereign UAE Validator Authority Node #01',
      digitalSignatureSha256: '0x99aa88bb77cc66dd55ee44ff33aa22bb11cc00dd99ee88ff77aa66bb55cc44dd'
    },
    confidence: {
      score: 0.995,
      epistemicUncertainty: 0.005,
      sensorNoiseIndex: 0.003,
      decayFactor: 0.9995,
      lastCalibratedAt: '2026-08-17T00:00:00Z'
    },
    permissions: {
      classification: 'FEDERAL_SOVEREIGN',
      ownerTenantId: 'tenant-sovereign-dubai',
      authorizedRoles: ['ROLE_SOVEREIGN_ADMIN', 'ROLE_FEDERAL_MINISTRY'],
      isAirGappedSovereign: true
    },
    lifecycleState: 'LIVE',
    epistemologicalTag: 'OBSERVED',
    epistemologicalRationale: 'National sovereign asset with 100% direct SCADA & structural telemetry feeds.'
  },
  {
    id: 'urn:archos:uae:auh:masdar:district:eco-zone-4',
    name: 'Masdar Eco-District Sector 4 (Net-Zero Simulation)',
    arabicName: 'قطاع مدينة مصدر البيئي رقم ٤',
    entityClass: 'DISTRICT',
    canonicalCode: 'AUH-MASDAR-SEC4',
    geometry: {
      type: 'Polygon',
      spatialReference: 'EPSG:3997',
      coordinates: [24.4258, 54.6186],
      elevationMslMeters: 7.2,
      heightMeters: 35.0,
      boundingRadiusMeters: 350.0,
      lodLevel: 3
    },
    location: {
      emirateId: 'abu-dhabi',
      emirateName: 'Abu Dhabi',
      municipalityZone: 'Masdar Free Zone · Abu Dhabi DPM',
      onwaniAddress: 'Masdar Boulevard 14',
      plotId: 'MAS-SEC4-NZ',
      communityId: 'Masdar City Masterplan',
      latitude: 24.4258,
      longitude: 54.6186
    },
    attributes: {
      grossFloorAreaSqm: 240000,
      footprintAreaSqm: 65000,
      totalHeightMeters: 35.0,
      constructionYear: 2027,
      assetValueAed: 1850000000,
      occupancyCapacity: 8000,
      pearlRatingEstidama: '5-Pearl Estidama Net Zero Energy',
      customSpecs: {
        'PV Generation': '14.2 MWp Rooftop & Shading Canopy',
        'Passive Cooling': 'Wind Tower Microclimate Inducer (-6°C Ambient Delta)',
        'Thermal Mass': 'Low-Carbon Geopolymer Compressed Blocks'
      }
    },
    relationships: [
      {
        targetId: 'urn:archos:uae:auh:grid:al-dhafra-solar',
        targetClass: 'SYSTEM',
        targetName: 'Al Dhafra 2GW Solar Farm Grid Interconnect',
        relationType: 'POWERED_BY',
        weight: 1.0,
        isCriticalPath: true
      },
      {
        targetId: 'urn:archos:uae:auh:gov:dpm',
        targetClass: 'FEDERATION',
        targetName: 'Abu Dhabi Department of Municipalities and Transport',
        relationType: 'REGULATED_BY',
        weight: 1.0,
        isCriticalPath: false
      }
    ],
    currentState: {
      vitalityScore: 97,
      operationalStatus: 'OPTIMAL',
      activeLoadKw: 1200,
      ambientTempCelsius: 32.1,
      coolingDemandTons: 980,
      co2IntensityKgPerHour: -140, // Carbon negative net export
      activeOccupants: 3200,
      healthAnomalyCount: 0,
      lastTelemetrySync: '2026-08-17T07:47:00Z'
    },
    historicalState: {
      temporalLogRootMerkleHash: '0x4f5e6d7c8b9a0123456789abcdef0123456789abcdef0123456789abcdef0123',
      recordedIntervalsCount: 140000,
      historicalVitalityTrend: [
        { timestamp: '2026-03-01', score: 96 },
        { timestamp: '2026-04-01', score: 96 },
        { timestamp: '2026-05-01', score: 97 },
        { timestamp: '2026-06-01', score: 97 },
        { timestamp: '2026-07-01', score: 97 },
        { timestamp: '2026-08-01', score: 97 }
      ],
      historicalEnergyKwh: [
        { month: 'Mar', kwh: 420000 },
        { month: 'Apr', kwh: 510000 },
        { month: 'May', kwh: 680000 },
        { month: 'Jun', kwh: 820000 },
        { month: 'Jul', kwh: 910000 },
        { month: 'Aug', kwh: 890000 }
      ]
    },
    predictedState: {
      predictionHorizonDays: 365,
      projectedVitalityIn30Days: 97.2,
      projectedFailureRiskProbability: 0.005,
      predictedPeakPowerDemandKw: 1450,
      nextRecommendedMaintenanceDate: '2027-01-15',
      confidenceIntervalPercent: 94.2
    },
    observations: [
      {
        sensorId: 'SNSR-MASDAR-PV-01',
        sensorType: 'POWER_KW',
        protocol: 'MQTT_TLS',
        samplingRateHz: 1,
        lastValue: 8400.0,
        unit: 'kW Generation',
        lastTimestamp: '2026-08-17T07:47:00Z',
        status: 'ACTIVE'
      },
      {
        sensorId: 'SNSR-MASDAR-IAQ-04',
        sensorType: 'INDOOR_AIR_QUALITY',
        protocol: 'BACnet/IP',
        samplingRateHz: 0.1,
        lastValue: 412.0,
        unit: 'ppm CO2',
        lastTimestamp: '2026-08-17T07:47:00Z',
        status: 'ACTIVE'
      }
    ],
    provenance: {
      originSource: 'Masdar Future Energy Company & Abu Dhabi DPM Digital Twin Engine',
      organization: 'Masdar PJSC',
      method: 'DIRECT_IOT',
      ingestedAt: '2025-06-01T00:00:00Z',
      verifiedBy: 'Sovereign UAE Validator Authority Node #02',
      digitalSignatureSha256: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff'
    },
    confidence: {
      score: 0.978,
      epistemicUncertainty: 0.022,
      sensorNoiseIndex: 0.009,
      decayFactor: 0.998,
      lastCalibratedAt: '2026-08-16T18:00:00Z'
    },
    permissions: {
      classification: 'PUBLIC',
      ownerTenantId: 'tenant-masdar-city',
      authorizedRoles: ['ROLE_SOVEREIGN_ADMIN', 'ROLE_PUBLIC_VIEWER'],
      isAirGappedSovereign: false
    },
    lifecycleState: 'DESIGN',
    epistemologicalTag: 'SIMULATED',
    epistemologicalRationale: 'Computational fluid dynamic (CFD) microclimate and solar canopy simulation for Phase 4 Net Zero expansion.'
  },
  {
    id: 'urn:archos:uae:shj:srtip:bldg:ai-innovation-lab',
    name: 'Sharjah RTI Park — Sovereign AI Innovation Lab',
    arabicName: 'مختبر الابتكار للذكاء الاصطناعي بمجمع الشارقة للأبحاث',
    entityClass: 'BUILDING',
    canonicalCode: 'SHJ-SRTIP-AILAB',
    geometry: {
      type: 'Mesh3D',
      spatialReference: 'EPSG:3997',
      coordinates: [25.2934, 55.4789],
      elevationMslMeters: 14.5,
      heightMeters: 28.0,
      boundingRadiusMeters: 60.0,
      lodLevel: 3
    },
    location: {
      emirateId: 'sharjah',
      emirateName: 'Sharjah',
      municipalityZone: 'University City · SRTIP Sector 1',
      plotId: 'SRTIP-PL-09',
      communityId: 'Sharjah Research Technology & Innovation Park',
      latitude: 25.2934,
      longitude: 55.4789
    },
    attributes: {
      grossFloorAreaSqm: 38500,
      footprintAreaSqm: 8200,
      floorsAboveGround: 6,
      floorsBelowGround: 1,
      totalHeightMeters: 28.0,
      constructionYear: 2024,
      assetValueAed: 420000000,
      occupancyCapacity: 1400,
      hvacCapacityTons: 1100,
      structuralCoreMaterial: '3D Printed Geopolymer & Ultra-High Performance Concrete (UHPC)',
      envelopeGlazingUValue: 1.05,
      pearlRatingEstidama: '3-Pearl Equivalent',
      leedCertification: 'LEED Gold',
      customSpecs: {
        'High-Performance Compute': 'Liquid-Cooled Sovereign DGX H200 Clusters',
        'Waste Heat Recovery': '100% Compute Heat Transferred to Absorption Chillers'
      }
    },
    relationships: [
      {
        targetId: 'urn:archos:uae:shj:utility:sewa-grid',
        targetClass: 'SYSTEM',
        targetName: 'SEWA Smart Grid Intertie',
        relationType: 'POWERED_BY',
        weight: 0.96,
        isCriticalPath: true
      },
      {
        targetId: 'urn:archos:uae:shj:gov:town-planning',
        targetClass: 'FEDERATION',
        targetName: 'Sharjah Directorate of Town Planning and Survey',
        relationType: 'REGULATED_BY',
        weight: 1.0,
        isCriticalPath: false
      }
    ],
    currentState: {
      vitalityScore: 95,
      operationalStatus: 'OPTIMAL',
      activeLoadKw: 1820,
      ambientTempCelsius: 37.8,
      coolingDemandTons: 920,
      co2IntensityKgPerHour: 680,
      activeOccupants: 950,
      healthAnomalyCount: 0,
      lastTelemetrySync: '2026-08-17T07:48:00Z'
    },
    historicalState: {
      temporalLogRootMerkleHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8',
      recordedIntervalsCount: 290000,
      historicalVitalityTrend: [
        { timestamp: '2026-03-01', score: 95 },
        { timestamp: '2026-04-01', score: 94 },
        { timestamp: '2026-05-01', score: 95 },
        { timestamp: '2026-06-01', score: 95 },
        { timestamp: '2026-07-01', score: 95 },
        { timestamp: '2026-08-01', score: 95 }
      ],
      historicalEnergyKwh: [
        { month: 'Mar', kwh: 580000 },
        { month: 'Apr', kwh: 670000 },
        { month: 'May', kwh: 890000 },
        { month: 'Jun', kwh: 1050000 },
        { month: 'Jul', kwh: 1180000 },
        { month: 'Aug', kwh: 1150000 }
      ]
    },
    predictedState: {
      predictionHorizonDays: 90,
      projectedVitalityIn30Days: 94.9,
      projectedFailureRiskProbability: 0.012,
      predictedPeakPowerDemandKw: 2100,
      nextRecommendedMaintenanceDate: '2026-11-20',
      confidenceIntervalPercent: 97.0
    },
    observations: [
      {
        sensorId: 'SNSR-SRTIP-TEMP-COMPUTE',
        sensorType: 'TEMPERATURE',
        protocol: 'MQTT_TLS',
        samplingRateHz: 10,
        lastValue: 22.4,
        unit: '°C Ambient Rack',
        lastTimestamp: '2026-08-17T07:48:00Z',
        status: 'ACTIVE'
      }
    ],
    provenance: {
      originSource: 'Sharjah SRTIP Master Asset SCADA',
      organization: 'Sharjah Research Technology & Innovation Park Authority',
      method: 'DIRECT_IOT',
      ingestedAt: '2025-09-01T00:00:00Z',
      verifiedBy: 'Sovereign UAE Validator Authority Node #05',
      digitalSignatureSha256: '0xbbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa'
    },
    confidence: {
      score: 0.982,
      epistemicUncertainty: 0.018,
      sensorNoiseIndex: 0.007,
      decayFactor: 0.999,
      lastCalibratedAt: '2026-08-16T20:00:00Z'
    },
    permissions: {
      classification: 'MUNICIPAL_RESTRICTED',
      ownerTenantId: 'tenant-srtip-sharjah',
      authorizedRoles: ['ROLE_SOVEREIGN_ADMIN', 'ROLE_LAB_DIRECTOR'],
      isAirGappedSovereign: true
    },
    lifecycleState: 'LIVE',
    epistemologicalTag: 'INFERRED',
    epistemologicalRationale: 'Thermal energy balance and waste-heat recovery COP mathematically inferred from secondary hydronic loop sensors.'
  }
];

export const INITIAL_WORLD_MODEL_GRAPH_STATS: WorldModelGraphStats = {
  totalEntities: 4820,
  totalRelationships: 14890,
  observedEntitiesCount: 3410,
  inferredEntitiesCount: 840,
  predictedEntitiesCount: 390,
  simulatedEntitiesCount: 180,
  liveSensorsConnected: 18450,
  merkleTreeRootHash: '0x8f2d93e4a1b0c8d7e6f5a4b3c2d1e0f98a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3'
};
