// ArchOS UAE Intelligence & GroundScan Multi-Scale Ingestion Types
// Implements the GroundScan pipeline: Location -> Spatial Context -> GroundScan -> Site Intelligence -> World Model

export type MunicipalityAuthority =
  | 'DUBAI_MUNICIPALITY'
  | 'ABU_DHABI_DPM'
  | 'SHARJAH_URBAN_PLANNING'
  | 'AJMAN_MUNICIPALITY'
  | 'RAK_MUNICIPALITY'
  | 'FUJAIRAH_MUNICIPALITY'
  | 'FEDERAL_MOCAT';

export type IngestionLayerType =
  | 'CADASTRAL_PARCEL_BOUNDARY'
  | 'MUNICIPAL_ZONING_RESTRICTIONS'
  | 'LIDAR_POINT_CLOUD'
  | 'SAR_SATELLITE_ELEVATION'
  | 'SUBSURFACE_UTILITY_CORRIDOR'
  | 'DEWA_GRID_INTERCONNECT'
  | 'DISTRICT_COOLING_TRUNK'
  | 'MICROCLIMATE_WIND_SOLAR'
  | 'TRAFFIC_MOBILITY_FLOW';

export interface GroundScanLayerStream {
  layerId: string;
  name: string;
  authority: MunicipalityAuthority;
  layerType: IngestionLayerType;
  resolutionMeters: number;
  dataPointsCount: number;
  ingestionStatus: 'STREAMING' | 'SYNCHRONIZED' | 'CACHED' | 'CONFLICT_DETECTED';
  provenanceAttestation: string;
  lastUpdated: string;
  featuresSummary: string;
}

export interface SubsurfaceUtilityConflict {
  conflictId: string;
  utilityType: 'HIGH_VOLTAGE_POWER' | 'CHILLED_WATER_MAIN' | 'GAS_FEEDER' | 'TELECOM_DUCT' | 'STORMWATER_CULVERT';
  depthMslMeters: number;
  clearanceRequiredMeters: number;
  detectedClearanceMeters: number;
  severity: 'CRITICAL_ENCROACHMENT' | 'WARNING_PROXIMITY' | 'CLEARED';
  mitigationRecommendation: string;
}

export interface SiteConstraintScorecard {
  plotId: string;
  makaniNumber?: string;
  maxAllowableHeightMeters: number;
  floorAreaRatioFAR: number;
  plotCoverageMaxPercent: number;
  setbacks: { frontM: number; rearM: number; sidesM: number };
  utilityCapacityStatus: {
    powerAvailableMva: number;
    chilledWaterAvailableTons: number;
    waterFlowLps: number;
  };
  microclimateFactors: {
    solarIrradianceKwhPerSqm: number;
    prevailingWindDirection: string;
    ambientSummerMaxTempC: number;
    heatIslandIntensityScore: number; // 0 - 100
  };
  subsurfaceConflicts: SubsurfaceUtilityConflict[];
  overallFeasibilityScore: number; // 0 - 100
}

export interface GroundScanSession {
  scanId: string;
  targetPlotId: string;
  targetName: string;
  emirate: string;
  coordinates: [number, number]; // [lat, lng]
  elevationMsl: number;
  activeLayers: GroundScanLayerStream[];
  scorecard: SiteConstraintScorecard;
  pointCloudSampleCount: number;
  worldModelInjectionStatus: 'READY_TO_INJECT' | 'INJECTED' | 'VALIDATING';
}
