import { BuildingPulseRecord } from '../types/archosExpansion';

export const UAE_PULSE_BUILDINGS: BuildingPulseRecord[] = [
  {
    id: 'tower-b4471',
    name: 'Tower B-4471 Downtown Dubai',
    arabicName: 'برج ب-٤٤٧١ وسط مدينة دبي',
    assetId: 'tower-b4471',
    emirate: 'Dubai',
    district: 'Downtown Dubai',
    grossFloorAreaSqm: 184500,
    yearBuilt: 2022,
    overallPulseScore: 85,
    previousMonthScore: 88,
    trendDelta: -3,
    vitalityTier: 'GOLD',
    predictedRemainingLifeYears: 74,
    degradationRatePerYear: 0.38,
    tradeableAssetValueAed: 2450000000,
    dimensions: {
      structuralIntegrity: {
        score: 92,
        weight: 0.25,
        status: 'OPTIMAL',
        keyMetricLabel: 'Core Drift',
        keyMetricValue: '1.2 mm / 380m',
        delta30Days: 0,
        diagnostics: [
          'Outrigger truss strain gauges calibrated at 142 MPa (limit 380 MPa).',
          'Tuned mass damper frequency stabilized at 0.18 Hz under wind load.',
          'Zero foundation settlement detected across 42 friction piles.'
        ],
        sensorDriftAvg: 0.12,
        structuralDriftMm: 1.2,
        foundationStressMpa: 142,
        resonanceFrequencyHz: 0.18
      },
      systemHealth: {
        score: 76,
        weight: 0.25,
        status: 'DEGRADED',
        keyMetricLabel: 'HVAC Chiller Drift',
        keyMetricValue: '8.4% Efficiency Drop',
        delta30Days: -6,
        diagnostics: [
          'Chiller Unit #3 heat exchanger ΔT degraded from 6.2°C to 4.8°C.',
          'Variable air volume (VAV) dampers on Floors 44-58 exhibit 12% actuator lag.',
          'Elevator Bank C hoist rope harmonic vibration elevated by 4.2%.'
        ],
        hvacDriftPercent: 8.4,
        mepEfficiencyRating: 76,
        elevatorHoistWearPercent: 18.2,
        chilledWaterDeltaTC: 4.8
      },
      energyPerformance: {
        score: 84,
        weight: 0.2,
        status: 'NOMINAL',
        keyMetricLabel: 'Energy vs Baseline',
        keyMetricValue: '112 kWh/m²/yr',
        delta30Days: -2,
        diagnostics: [
          'Peak electrical load recorded at 8,420 kW during 14:00 GST solar peak.',
          'Rooftop photovoltaic array generated 420 MWh YTD (4.2% of total load).',
          'Power factor maintained at 0.98 inductive via active harmonic filters.'
        ],
        vsDesignBaselinePercent: -3.8,
        kwhPerSqmPerYear: 112,
        peakDemandKw: 8420,
        solarSelfConsumptionPercent: 98.2
      },
      carbonPerformance: {
        score: 89,
        weight: 0.15,
        status: 'OPTIMAL',
        keyMetricLabel: 'Operational Carbon',
        keyMetricValue: '4,120 tCO₂e / yr',
        delta30Days: +1,
        diagnostics: [
          'Carbon emissions tracking 11% below ASHRAE 90.1 UAE sovereign standard.',
          'Earned 1,420 verified tradeable carbon credits through chiller AI optimization.',
          'Greywater recycling system diverted 42,000 m³ from municipal desalination.'
        ],
        vsCarbonBudgetPercent: -11.2,
        operationalTco2ePerYear: 4120,
        embodiedCarbonSpentTonnes: 92400,
        creditsEarnedTonnes: 1420
      },
      financialHealth: {
        score: 86,
        weight: 0.15,
        status: 'NOMINAL',
        keyMetricLabel: 'Opex Yield',
        keyMetricValue: '7.8% Net Yield',
        delta30Days: -1,
        diagnostics: [
          'Monthly OPEX currently running at 1.42M AED (4.2% below pro-forma budget).',
          'Maintenance backlog quantified at 240k AED (strictly low-risk cosmetic).',
          'Pulse Score grants a 12.5% premium discount on sovereign property insurance.'
        ],
        opexMonthlyAed: 1420000,
        maintenanceBacklogAed: 240000,
        roiYieldPercent: 7.8,
        insurancePremiumScoreDiscountPercent: 12.5
      }
    },
    liveSensors: [
      {
        id: 'sens-hvac-ch3',
        sensorType: 'CHILLER_DELTA_T',
        location: 'Basement 3 - Plant Room B',
        reading: '4.8 °C ΔT',
        driftPercentage: 8.4,
        status: 'DRIFT_DETECTED',
        confidence: 0.96
      },
      {
        id: 'sens-strain-l62',
        sensorType: 'STRAIN_GAUGE',
        location: 'Level 62 - Core Outrigger West',
        reading: '142.4 MPa',
        driftPercentage: 0.14,
        status: 'CALIBRATED',
        confidence: 0.99
      },
      {
        id: 'sens-accel-spire',
        sensorType: 'ACCELEROMETER',
        location: 'Level 98 - Crown Spire',
        reading: '0.012 m/s² @ 0.18 Hz',
        driftPercentage: 0.08,
        status: 'CALIBRATED',
        confidence: 0.98
      },
      {
        id: 'sens-vav-f52',
        sensorType: 'AIRFLOW_CFM',
        location: 'Level 52 - Zone 4 AHU',
        reading: '2,840 CFM (-12% setpoint)',
        driftPercentage: 12.1,
        status: 'DRIFT_DETECTED',
        confidence: 0.92
      },
      {
        id: 'sens-lift-c4',
        sensorType: 'ELEVATOR_VIBRATION',
        location: 'Elevator Shaft C - Car #4',
        reading: '0.42 mm/s RMS',
        driftPercentage: 4.2,
        status: 'NOMINAL' as any,
        confidence: 0.95
      }
    ],
    jarvisVoiceNarrative:
      "Your building lost 3 vitality points this month, moving from 88 to 85. The primary cause is thermal drift in Chiller Unit #3 and VAV damper actuator lag on Floors 44 to 58. Recommended action: Auto-calibrate damper actuators and clean condenser coils to recover 2.4 vitality points and save 48,000 AED in monthly cooling.",
    insuranceImpact: {
      baselineMarketPremiumAed: 1850000,
      vitalityAdjustedPremiumAed: 1618750,
      annualSavingsAed: 231250,
      underwriterRating: 'AA+'
    }
  },
  {
    id: 'burj-khalifa-core',
    name: 'Burj Khalifa District Core',
    arabicName: 'برج خليفة - النواة المركزية',
    assetId: 'burj-khalifa',
    emirate: 'Dubai',
    district: 'Downtown Dubai',
    grossFloorAreaSqm: 334000,
    yearBuilt: 2010,
    overallPulseScore: 94,
    previousMonthScore: 93,
    trendDelta: +1,
    vitalityTier: 'PLATINUM',
    predictedRemainingLifeYears: 88,
    degradationRatePerYear: 0.18,
    tradeableAssetValueAed: 6800000000,
    dimensions: {
      structuralIntegrity: {
        score: 97,
        weight: 0.3,
        status: 'OPTIMAL',
        keyMetricLabel: 'Y-Shape Core Sway',
        keyMetricValue: '1.45m Max Swirl',
        delta30Days: 0,
        diagnostics: [
          'Buttressed core geometry demonstrates zero non-elastic deformation.',
          'High-precision GPS spire tracking verifies vortex shedding suppression.',
          'Cathodic corrosion protection system operating at 99.8% field integrity.'
        ],
        sensorDriftAvg: 0.04,
        structuralDriftMm: 0.8,
        foundationStressMpa: 210,
        resonanceFrequencyHz: 0.11
      },
      systemHealth: {
        score: 92,
        weight: 0.25,
        status: 'OPTIMAL',
        keyMetricLabel: 'Chilled Water Plant',
        keyMetricValue: '9.2 COP Peak',
        delta30Days: +1,
        diagnostics: [
          'District cooling sub-stations operating at optimal 10.4°C ΔT.',
          'Condensation collection harvesting 15M gallons of pure condensate per year.',
          'Double-decker high-speed elevator regenerative drives supplying 32% grid return.'
        ],
        hvacDriftPercent: 1.2,
        mepEfficiencyRating: 94,
        elevatorHoistWearPercent: 8.4,
        chilledWaterDeltaTC: 10.4
      },
      energyPerformance: {
        score: 91,
        weight: 0.2,
        status: 'OPTIMAL',
        keyMetricLabel: 'Energy Intensity',
        keyMetricValue: '168 kWh/m²/yr',
        delta30Days: +1,
        diagnostics: [
          'Silver-coated low-E double glazing reflecting 84% of external solar infrared.',
          'Night-time purge ventilation pre-cooling structural core during low tariff window.'
        ],
        vsDesignBaselinePercent: -14.8,
        kwhPerSqmPerYear: 168,
        peakDemandKw: 36000,
        solarSelfConsumptionPercent: 100
      },
      carbonPerformance: {
        score: 93,
        weight: 0.15,
        status: 'OPTIMAL',
        keyMetricLabel: 'Carbon Intensity',
        keyMetricValue: '58 kgCO₂e/m²/yr',
        delta30Days: +1,
        diagnostics: [
          '100% powered via DEWA Mohammed bin Rashid Al Maktoum Solar Park clean energy certs.',
          'Net carbon neutral status maintained for 4 consecutive quarters.'
        ],
        vsCarbonBudgetPercent: -22.4,
        operationalTco2ePerYear: 19372,
        embodiedCarbonSpentTonnes: 320000,
        creditsEarnedTonnes: 6200
      },
      financialHealth: {
        score: 96,
        weight: 0.1,
        status: 'OPTIMAL',
        keyMetricLabel: 'Asset Vitality Yield',
        keyMetricValue: '9.4% NOI Yield',
        delta30Days: 0,
        diagnostics: [
          'Sovereign AAA asset rating maintained across international underwriting syndicates.',
          'Pulse score enables minimum global tier reinsurance risk weighting.'
        ],
        opexMonthlyAed: 4800000,
        maintenanceBacklogAed: 120000,
        roiYieldPercent: 9.4,
        insurancePremiumScoreDiscountPercent: 22.0
      }
    },
    liveSensors: [
      {
        id: 'sens-bk-gps',
        sensorType: 'ACCELEROMETER',
        location: 'Level 163 - Spire Tip',
        reading: '0.008 m/s² @ 0.11 Hz',
        driftPercentage: 0.02,
        status: 'CALIBRATED',
        confidence: 0.99
      },
      {
        id: 'sens-bk-chiller',
        sensorType: 'CHILLER_DELTA_T',
        location: 'Substation 4 - District Cooling',
        reading: '10.4 °C ΔT',
        driftPercentage: 0.4,
        status: 'CALIBRATED',
        confidence: 0.99
      }
    ],
    jarvisVoiceNarrative:
      "Burj Khalifa maintains a Platinum Vitality score of 94, up 1 point this month. Solar procurement agreements and condensation recovery systems are operating at peak efficiency. Structural resonance remains locked at nominal 0.11 Hertz.",
    insuranceImpact: {
      baselineMarketPremiumAed: 8400000,
      vitalityAdjustedPremiumAed: 6552000,
      annualSavingsAed: 1848000,
      underwriterRating: 'AAA'
    }
  },
  {
    id: 'masdar-eco-hub',
    name: 'Masdar City Eco-Nexus',
    arabicName: 'مدينة مصدر - مجمع الاستدامة الذكي',
    assetId: 'masdar-nexus',
    emirate: 'Abu Dhabi',
    district: 'Masdar City',
    grossFloorAreaSqm: 72000,
    yearBuilt: 2024,
    overallPulseScore: 98,
    previousMonthScore: 97,
    trendDelta: +1,
    vitalityTier: 'PLATINUM',
    predictedRemainingLifeYears: 95,
    degradationRatePerYear: 0.08,
    tradeableAssetValueAed: 1180000000,
    dimensions: {
      structuralIntegrity: {
        score: 99,
        weight: 0.2,
        status: 'OPTIMAL',
        keyMetricLabel: 'Low-Carbon Geopolymer',
        keyMetricValue: '99.4% Stability',
        delta30Days: 0,
        diagnostics: [
          'Ultra-low carbon geopolymer concrete showing superior compressive strength gain.',
          'Timber-composite hybrid floor slabs monitoring zero creep deformation.'
        ],
        sensorDriftAvg: 0.02,
        structuralDriftMm: 0.2,
        foundationStressMpa: 48,
        resonanceFrequencyHz: 0.45
      },
      systemHealth: {
        score: 97,
        weight: 0.2,
        status: 'OPTIMAL',
        keyMetricLabel: 'Passive Wind Tower & MEP',
        keyMetricValue: '98% Passive Airflow',
        delta30Days: 0,
        diagnostics: [
          'Traditional Barjeel-inspired wind tower cooling ambient air by 5.5°C before HVAC intake.',
          'Chilled radiant ceiling panels operating with zero acoustic vibration.'
        ],
        hvacDriftPercent: 0.4,
        mepEfficiencyRating: 98,
        elevatorHoistWearPercent: 2.1,
        chilledWaterDeltaTC: 8.8
      },
      energyPerformance: {
        score: 99,
        weight: 0.25,
        status: 'OPTIMAL',
        keyMetricLabel: 'Net Positive Energy',
        keyMetricValue: '+14% Net Positive',
        delta30Days: +1,
        diagnostics: [
          'Building generates 114% of its annual energy requirement via BIPV facade and roof.',
          'Vanadium redox flow battery storage stores 4.2 MWh of excess daytime solar.'
        ],
        vsDesignBaselinePercent: -58.4,
        kwhPerSqmPerYear: 42,
        peakDemandKw: 820,
        solarSelfConsumptionPercent: 100
      },
      carbonPerformance: {
        score: 99,
        weight: 0.25,
        status: 'OPTIMAL',
        keyMetricLabel: 'Carbon Status',
        keyMetricValue: 'NET-NEGATIVE (-420 t/yr)',
        delta30Days: +1,
        diagnostics: [
          'Embodied carbon capped at 320 kgCO₂e/m² (65% below international baseline).',
          'Generated 3,840 verified UAE Blue Carbon credits eligible for Abu Dhabi Carbon Exchange.'
        ],
        vsCarbonBudgetPercent: -128.0,
        operationalTco2ePerYear: -420,
        embodiedCarbonSpentTonnes: 23040,
        creditsEarnedTonnes: 3840
      },
      financialHealth: {
        score: 96,
        weight: 0.1,
        status: 'OPTIMAL',
        keyMetricLabel: 'Net Carbon Yield',
        keyMetricValue: '11.2% IRR',
        delta30Days: 0,
        diagnostics: [
          'Carbon credit trading yields an additional 420,000 AED annually in pure ancillary revenue.',
          'Zero energy utility bills reduces tenant opex to lowest benchmark in the GCC.'
        ],
        opexMonthlyAed: 180000,
        maintenanceBacklogAed: 15000,
        roiYieldPercent: 11.2,
        insurancePremiumScoreDiscountPercent: 28.0
      }
    },
    liveSensors: [
      {
        id: 'sens-masdar-bipv',
        sensorType: 'POWER_FACTOR',
        location: 'Roof Photovoltaic Canopy',
        reading: '1.42 MW @ 1.00 PF',
        driftPercentage: 0.01,
        status: 'CALIBRATED',
        confidence: 0.99
      }
    ],
    jarvisVoiceNarrative:
      "Masdar City Eco-Nexus achieves a benchmark Vitality Index of 98 Platinum. The building is currently operating in net-negative carbon mode, exporting 420 kilowatt-hours of clean solar power back to the Abu Dhabi grid.",
    insuranceImpact: {
      baselineMarketPremiumAed: 920000,
      vitalityAdjustedPremiumAed: 662400,
      annualSavingsAed: 257600,
      underwriterRating: 'AAA'
    }
  },
  {
    id: 'etihad-rail-terminal',
    name: 'Etihad Rail Central Terminal',
    arabicName: 'محطة الاتحاد للقطارات المركزية',
    assetId: 'etihad-rail',
    emirate: 'Abu Dhabi',
    district: 'Al Faya Logistics Core',
    grossFloorAreaSqm: 142000,
    yearBuilt: 2023,
    overallPulseScore: 96,
    previousMonthScore: 96,
    trendDelta: 0,
    vitalityTier: 'PLATINUM',
    predictedRemainingLifeYears: 92,
    degradationRatePerYear: 0.12,
    tradeableAssetValueAed: 3200000000,
    dimensions: {
      structuralIntegrity: {
        score: 98,
        weight: 0.35,
        status: 'OPTIMAL',
        keyMetricLabel: 'Track Foundation Stress',
        keyMetricValue: '32.4 Tonne Axle Load',
        delta30Days: 0,
        diagnostics: [
          'Continuous fiber-optic distributed acoustic sensing (DAS) across 8 platforms.',
          'Heavy freight ballast settlement well within 0.2mm tolerance.'
        ],
        sensorDriftAvg: 0.05,
        structuralDriftMm: 0.3,
        foundationStressMpa: 165,
        resonanceFrequencyHz: 0.82
      },
      systemHealth: {
        score: 95,
        weight: 0.25,
        status: 'OPTIMAL',
        keyMetricLabel: 'Signal & Catenary Health',
        keyMetricValue: '99.98% Uptime',
        delta30Days: 0,
        diagnostics: [
          'ETCS Level 2 signalling systems operating with redundant optical rings.',
          'Pantograph wear sensors reporting nominal friction metrics.'
        ],
        hvacDriftPercent: 1.1,
        mepEfficiencyRating: 96,
        elevatorHoistWearPercent: 4.2,
        chilledWaterDeltaTC: 7.4
      },
      energyPerformance: {
        score: 94,
        weight: 0.15,
        status: 'OPTIMAL',
        keyMetricLabel: 'Traction Power Mix',
        keyMetricValue: '72% Clean Rail',
        delta30Days: +1,
        diagnostics: [
          'Regenerative braking energy recapture supplying station auxiliary power.'
        ],
        vsDesignBaselinePercent: -18.2,
        kwhPerSqmPerYear: 88,
        peakDemandKw: 14200,
        solarSelfConsumptionPercent: 88.0
      },
      carbonPerformance: {
        score: 97,
        weight: 0.15,
        status: 'OPTIMAL',
        keyMetricLabel: 'Road Freight Offset',
        keyMetricValue: '-2.4M tCO₂e / yr',
        delta30Days: +1,
        diagnostics: [
          'Replaced 320,000 truck trips along the Dubai-Abu Dhabi-Fujairah corridor YTD.'
        ],
        vsCarbonBudgetPercent: -44.0,
        operationalTco2ePerYear: 2840,
        embodiedCarbonSpentTonnes: 180000,
        creditsEarnedTonnes: 12400
      },
      financialHealth: {
        score: 96,
        weight: 0.1,
        status: 'OPTIMAL',
        keyMetricLabel: 'Logistics Throughput',
        keyMetricValue: '18.4M Tonnes Freight',
        delta30Days: 0,
        diagnostics: [
          'Freight concession fees tracking 16% ahead of sovereign infrastructure plan.'
        ],
        opexMonthlyAed: 2400000,
        maintenanceBacklogAed: 80000,
        roiYieldPercent: 8.6,
        insurancePremiumScoreDiscountPercent: 20.0
      }
    },
    liveSensors: [
      {
        id: 'sens-er-fiber',
        sensorType: 'STRAIN_GAUGE',
        location: 'Track 3 - Main Heavy Freight Siding',
        reading: '165 MPa dynamic',
        driftPercentage: 0.05,
        status: 'CALIBRATED',
        confidence: 0.99
      }
    ],
    jarvisVoiceNarrative:
      "Etihad Rail Central Terminal holds a Vitality Index of 96 Platinum. Fiber optic distributed acoustic sensing confirms track ballast and structural cantilevers are in pristine condition with 99.98% signalling uptime.",
    insuranceImpact: {
      baselineMarketPremiumAed: 3800000,
      vitalityAdjustedPremiumAed: 3040000,
      annualSavingsAed: 760000,
      underwriterRating: 'AAA'
    }
  },
  {
    id: 'sharjah-rtp-tower3',
    name: 'Sharjah R&D Innovation Tower 3',
    arabicName: 'مجمع الشارقة للبحوث والتكنولوجيا - البرج ٣',
    assetId: 'sharjah-tower3',
    emirate: 'Sharjah',
    district: 'University City Core',
    grossFloorAreaSqm: 54000,
    yearBuilt: 2016,
    overallPulseScore: 78,
    previousMonthScore: 81,
    trendDelta: -3,
    vitalityTier: 'SILVER',
    predictedRemainingLifeYears: 46,
    degradationRatePerYear: 0.72,
    tradeableAssetValueAed: 480000000,
    dimensions: {
      structuralIntegrity: {
        score: 86,
        weight: 0.25,
        status: 'NOMINAL',
        keyMetricLabel: 'Concrete Carbonation',
        keyMetricValue: '3.8 mm Depth',
        delta30Days: -1,
        diagnostics: [
          'Surface micro-cracking observed on western exposed facade due to thermal cycles.',
          'Reinforcement rebar cover remains within safe non-corrosive margins.'
        ],
        sensorDriftAvg: 0.28,
        structuralDriftMm: 2.8,
        foundationStressMpa: 98,
        resonanceFrequencyHz: 0.26
      },
      systemHealth: {
        score: 71,
        weight: 0.25,
        status: 'DEGRADED',
        keyMetricLabel: 'Legacy Chiller & Elevators',
        keyMetricValue: '28% Efficiency Deficit',
        delta30Days: -4,
        diagnostics: [
          'Chiller compressor #2 experiencing high vibration harmonics (4.8 mm/s).',
          'Elevator traction sheaves show 32% groove wear, scheduled for re-machining.',
          'Building Automation System running on legacy BACnet with 2.4s polling latency.'
        ],
        hvacDriftPercent: 14.8,
        mepEfficiencyRating: 71,
        elevatorHoistWearPercent: 32.4,
        chilledWaterDeltaTC: 3.9
      },
      energyPerformance: {
        score: 75,
        weight: 0.2,
        status: 'NOMINAL',
        keyMetricLabel: 'Energy Consumption',
        keyMetricValue: '194 kWh/m²/yr',
        delta30Days: -2,
        diagnostics: [
          'Single glazed atrium skylight creating significant solar cooling penalty in summer.',
          'Variable frequency drives (VFDs) on AHUs operating at fixed 80% throttle.'
        ],
        vsDesignBaselinePercent: +18.4,
        kwhPerSqmPerYear: 194,
        peakDemandKw: 3800,
        solarSelfConsumptionPercent: 12.0
      },
      carbonPerformance: {
        score: 77,
        weight: 0.15,
        status: 'NOMINAL',
        keyMetricLabel: 'Operational Carbon',
        keyMetricValue: '2,840 tCO₂e / yr',
        delta30Days: -1,
        diagnostics: [
          'Emissions 22% higher than comparable Grade-A green-certified UAE assets.',
          'Qualifies as a Prime Target for the ArchOS Legacy Retrofit Program.'
        ],
        vsCarbonBudgetPercent: +22.0,
        operationalTco2ePerYear: 2840,
        embodiedCarbonSpentTonnes: 38000,
        creditsEarnedTonnes: 0
      },
      financialHealth: {
        score: 82,
        weight: 0.15,
        status: 'NOMINAL',
        keyMetricLabel: 'Maintenance Backlog',
        keyMetricValue: '1.2M AED Backlog',
        delta30Days: -2,
        diagnostics: [
          'Rising energy costs reducing net rental yield from 8.2% to 6.9%.',
          'Retrofit investment of 4.2M AED projected to elevate Pulse score to 92 and boost NOI by 18%.'
        ],
        opexMonthlyAed: 540000,
        maintenanceBacklogAed: 1200000,
        roiYieldPercent: 6.9,
        insurancePremiumScoreDiscountPercent: 0.0
      }
    },
    liveSensors: [
      {
        id: 'sens-shj-chiller2',
        sensorType: 'CHILLER_DELTA_T',
        location: 'Rooftop Plant Room A',
        reading: '3.9 °C ΔT',
        driftPercentage: 14.8,
        status: 'DRIFT_DETECTED',
        confidence: 0.94
      },
      {
        id: 'sens-shj-lift',
        sensorType: 'ELEVATOR_VIBRATION',
        location: 'Shaft 2 - Motor Room',
        reading: '4.8 mm/s RMS (Warning)',
        driftPercentage: 22.4,
        status: 'ANOMALOUS',
        confidence: 0.96
      }
    ],
    jarvisVoiceNarrative:
      "Sharjah R&D Tower 3 currently rates at a Silver Vitality score of 78. Heavy chiller drift and elevator motor vibration are eroding asset performance. ArchOS Legacy Retrofit simulation suggests a chiller plant and smart envelope upgrade would deliver a 28-month payback and restore vitality to 92.",
    insuranceImpact: {
      baselineMarketPremiumAed: 650000,
      vitalityAdjustedPremiumAed: 650000,
      annualSavingsAed: 0,
      underwriterRating: 'BBB'
    }
  }
];
