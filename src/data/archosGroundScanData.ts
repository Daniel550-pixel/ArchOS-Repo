import { GroundScanSession } from '../types/archosGroundScan';

export const PRESET_GROUND_SCAN_SESSIONS: GroundScanSession[] = [
  {
    scanId: 'GSCAN-DXB-392-4471',
    targetPlotId: '392-4471',
    targetName: 'Downtown Dubai Commercial Superplot B-4471',
    emirate: 'Dubai',
    coordinates: [25.1972, 55.2744],
    elevationMsl: 4.8,
    pointCloudSampleCount: 14200000,
    worldModelInjectionStatus: 'INJECTED',
    activeLayers: [
      {
        layerId: 'LYR-CADASTRAL-01',
        name: 'Dubai Municipality Cadastral Boundary & Makani',
        authority: 'DUBAI_MUNICIPALITY',
        layerType: 'CADASTRAL_PARCEL_BOUNDARY',
        resolutionMeters: 0.05,
        dataPointsCount: 4800,
        ingestionStatus: 'SYNCHRONIZED',
        provenanceAttestation: 'Makani 30032 95320 · Plot Deed verified by Dubai Land Department (DLD)',
        lastUpdated: '2026-08-16T12:00:00Z',
        featuresSummary: 'Plot Area: 12,400 m² · Commercial / Mixed-Use High Rise Zoning G+84'
      },
      {
        layerId: 'LYR-LIDAR-02',
        name: 'Autonomous Drone LiDAR Point Cloud (500 pts/m²)',
        authority: 'DUBAI_MUNICIPALITY',
        layerType: 'LIDAR_POINT_CLOUD',
        resolutionMeters: 0.02,
        dataPointsCount: 14200000,
        ingestionStatus: 'SYNCHRONIZED',
        provenanceAttestation: 'DJI Matrice 350 RTK LiDAR payload flight survey · Ref: DCAA-SV-8841',
        lastUpdated: '2026-08-15T06:30:00Z',
        featuresSummary: 'Sub-centimeter terrain surface elevation, adjacent tower envelope clearances mapped'
      },
      {
        layerId: 'LYR-SUBSURFACE-03',
        name: 'GPR Ground Penetrating Radar Subsurface Utility Corridor',
        authority: 'DUBAI_MUNICIPALITY',
        layerType: 'SUBSURFACE_UTILITY_CORRIDOR',
        resolutionMeters: 0.1,
        dataPointsCount: 82000,
        ingestionStatus: 'CONFLICT_DETECTED',
        provenanceAttestation: 'DEWA & Empower joint utility clearance GIS registry v2026.4',
        lastUpdated: '2026-08-14T18:00:00Z',
        featuresSummary: 'DEWA 132kV transmission cable at -4.2m MSL · 900mm District Cooling Main at -2.8m MSL'
      },
      {
        layerId: 'LYR-MICROCLIMATE-04',
        name: 'Computational Wind & Solar Irradiance Microclimate Vector',
        authority: 'FEDERAL_MOCAT',
        layerType: 'MICROCLIMATE_WIND_SOLAR',
        resolutionMeters: 1.0,
        dataPointsCount: 250000,
        ingestionStatus: 'STREAMING',
        provenanceAttestation: 'National Center of Meteorology (NCM) Real-time Doppler & Solar Mesonet',
        lastUpdated: '2026-08-17T07:45:00Z',
        featuresSummary: 'Summer Peak Irradiance: 1,020 W/m² · NW Shamal Wind Speed: 14.2 knots'
      }
    ],
    scorecard: {
      plotId: '392-4471',
      makaniNumber: '30032 95320',
      maxAllowableHeightMeters: 400.0,
      floorAreaRatioFAR: 14.5,
      plotCoverageMaxPercent: 65,
      setbacks: { frontM: 6.0, rearM: 4.5, sidesM: 4.5 },
      utilityCapacityStatus: {
        powerAvailableMva: 18.5,
        chilledWaterAvailableTons: 5000,
        waterFlowLps: 45.0
      },
      microclimateFactors: {
        solarIrradianceKwhPerSqm: 2240,
        prevailingWindDirection: 'North-West (315°)',
        ambientSummerMaxTempC: 44.5,
        heatIslandIntensityScore: 68
      },
      subsurfaceConflicts: [
        {
          conflictId: 'CONF-DXB-01',
          utilityType: 'CHILLED_WATER_MAIN',
          depthMslMeters: -2.8,
          clearanceRequiredMeters: 3.0,
          detectedClearanceMeters: 1.8,
          severity: 'WARNING_PROXIMITY',
          mitigationRecommendation: 'Re-align secondary piling cluster P-14 to maintain 3.0m offset from Empower 900mm pipeline.'
        }
      ],
      overallFeasibilityScore: 94
    }
  },
  {
    scanId: 'GSCAN-AUH-YAS-SEC4',
    targetPlotId: 'YAS-SEC4-PL12',
    targetName: 'Yas Island Waterfront Hospitality Superplot',
    emirate: 'Abu Dhabi',
    coordinates: [24.4988, 54.6062],
    elevationMsl: 2.1,
    pointCloudSampleCount: 9800000,
    worldModelInjectionStatus: 'READY_TO_INJECT',
    activeLayers: [
      {
        layerId: 'LYR-AUH-DPM-01',
        name: 'Abu Dhabi DPM Onwani GIS & Coastal Zoning',
        authority: 'ABU_DHABI_DPM',
        layerType: 'CADASTRAL_PARCEL_BOUNDARY',
        resolutionMeters: 0.05,
        dataPointsCount: 3200,
        ingestionStatus: 'SYNCHRONIZED',
        provenanceAttestation: 'Abu Dhabi DMT Onwani Cadastral Register',
        lastUpdated: '2026-08-16T14:00:00Z',
        featuresSummary: 'Plot Area: 28,500 m² · Estidama 3-Pearl Mandatory Coastal Setback: 35m'
      },
      {
        layerId: 'LYR-AUH-RADAR-02',
        name: 'SAR Satellite Sea Level & Groundwater Elevation Map',
        authority: 'ABU_DHABI_DPM',
        layerType: 'SAR_SATELLITE_ELEVATION',
        resolutionMeters: 0.5,
        dataPointsCount: 840000,
        ingestionStatus: 'STREAMING',
        provenanceAttestation: 'UAE Space Agency Rashid Coastal Satellite SAR Radar',
        lastUpdated: '2026-08-17T06:00:00Z',
        featuresSummary: 'High Tide Storm Surge Level: +1.65m MSL · Coastal De-watering requirement verified'
      }
    ],
    scorecard: {
      plotId: 'YAS-SEC4-PL12',
      makaniNumber: 'N/A (Abu Dhabi Onwani: YAS-HW-04)',
      maxAllowableHeightMeters: 95.0,
      floorAreaRatioFAR: 4.8,
      plotCoverageMaxPercent: 45,
      setbacks: { frontM: 10.0, rearM: 35.0, sidesM: 8.0 },
      utilityCapacityStatus: {
        powerAvailableMva: 12.0,
        chilledWaterAvailableTons: 3200,
        waterFlowLps: 30.0
      },
      microclimateFactors: {
        solarIrradianceKwhPerSqm: 2310,
        prevailingWindDirection: 'North (350° Marine Breeze)',
        ambientSummerMaxTempC: 43.0,
        heatIslandIntensityScore: 42
      },
      subsurfaceConflicts: [],
      overallFeasibilityScore: 97
    }
  }
];
