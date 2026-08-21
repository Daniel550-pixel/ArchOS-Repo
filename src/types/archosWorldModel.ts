// ArchOS World Model & Knowledge Graph Types
// Implements the canonical 14-attribute entity schema and epistemological boundary

export type EpistemologicalTag = 'OBSERVED' | 'INFERRED' | 'PREDICTED' | 'SIMULATED';

export type LifecycleStage =
  | 'IMAGINE'
  | 'DISCOVER'
  | 'DESIGN'
  | 'PROVE'
  | 'BUILD'
  | 'LIVE'
  | 'RETROFIT';

export type EntityClass =
  | 'FEDERATION'
  | 'EMIRATE'
  | 'CITY'
  | 'DISTRICT'
  | 'DEVELOPMENT'
  | 'PARCEL'
  | 'BUILDING'
  | 'FLOOR'
  | 'SPACE'
  | 'SYSTEM'
  | 'COMPONENT';

export type RelationshipType =
  | 'CONTAINS'
  | 'CONTAINED_IN'
  | 'CONNECTED_TO'
  | 'POWERED_BY'
  | 'COOLED_BY'
  | 'REGULATED_BY'
  | 'DEPENDS_ON'
  | 'COOLS'
  | 'POWERS'
  | 'MONITORED_BY'
  | 'ADJACENT_TO';

export type SecurityClassification =
  | 'PUBLIC'
  | 'TENANT_CONFIDENTIAL'
  | 'DEVELOPER_RESTRICTED'
  | 'MUNICIPAL_RESTRICTED'
  | 'FEDERAL_SOVEREIGN'
  | 'DEFCON_AIR_GAPPED';

export interface SpatialGeometry {
  type: 'Point' | 'Polygon' | 'MultiPolygon' | 'Mesh3D' | 'BIM_IFC_LOD400';
  spatialReference: 'EPSG:3997' | 'EPSG:4326' | 'WGS84'; // EPSG:3997 is UAE National Grid
  coordinates: number[] | number[][] | number[][][];
  elevationMslMeters: number;
  heightMeters: number;
  boundingRadiusMeters: number;
  lodLevel: 1 | 2 | 3 | 4;
}

export interface SpatialLocation {
  emirateId: 'dubai' | 'abu-dhabi' | 'sharjah' | 'ajman' | 'rak' | 'fujairah' | 'uaq';
  emirateName: string;
  municipalityZone: string;
  makaniNumber?: string; // Dubai Makani 10-digit spatial geo-tag
  onwaniAddress?: string; // Abu Dhabi Onwani addressing code
  plotId: string;
  communityId: string;
  latitude: number;
  longitude: number;
}

export interface EntityRelationship {
  targetId: string;
  targetClass: EntityClass;
  targetName: string;
  relationType: RelationshipType;
  weight: number; // 0.0 to 1.0 (coupling strength)
  isCriticalPath: boolean;
  metadata?: Record<string, any>;
}

export interface EntityObservationBinding {
  sensorId: string;
  sensorType: 'TEMPERATURE' | 'VIBRATION' | 'POWER_KW' | 'CHILLED_WATER_FLOW' | 'INDOOR_AIR_QUALITY' | 'STRUCTURAL_STRAIN' | 'CAMERA_OCCUPANCY';
  protocol: 'BACnet/IP' | 'Modbus_TCP' | 'MQTT_TLS' | 'OPC_UA' | 'DEWA_Smart_Grid';
  samplingRateHz: number;
  lastValue: number;
  unit: string;
  lastTimestamp: string;
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE' | 'CALIBRATING';
}

export interface EntityProvenance {
  originSource: string;
  organization: string;
  method: 'DIRECT_IOT' | 'MUNICIPAL_GIS' | 'BIM_IMPORT' | 'DRONE_LIDAR' | 'SATELLITE_RADAR' | 'SURVEYOR_ATTESTATION';
  ingestedAt: string;
  verifiedBy: string;
  digitalSignatureSha256: string;
}

export interface CanonicalWorldModelEntity {
  // 1. Identity
  id: string; // Canonical URN (e.g. urn:archos:uae:dxb:downtown:bldg:b-4471)
  name: string;
  arabicName: string;
  entityClass: EntityClass;
  canonicalCode: string;

  // 2. Geometry
  geometry: SpatialGeometry;

  // 3. Location
  location: SpatialLocation;

  // 4. Attributes (Domain-specific parameters)
  attributes: {
    grossFloorAreaSqm?: number;
    footprintAreaSqm?: number;
    floorsAboveGround?: number;
    floorsBelowGround?: number;
    totalHeightMeters?: number;
    constructionYear?: number;
    assetValueAed?: number;
    occupancyCapacity?: number;
    hvacCapacityTons?: number;
    structuralCoreMaterial?: string;
    envelopeGlazingUValue?: number;
    pearlRatingEstidama?: string;
    leedCertification?: string;
    customSpecs?: Record<string, string | number>;
  };

  // 5. Relationships
  relationships: EntityRelationship[];

  // 6. Current State
  currentState: {
    vitalityScore: number; // 0 - 100
    operationalStatus: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL' | 'MAINTENANCE' | 'OFFLINE';
    activeLoadKw: number;
    ambientTempCelsius: number;
    coolingDemandTons: number;
    co2IntensityKgPerHour: number;
    activeOccupants: number;
    healthAnomalyCount: number;
    lastTelemetrySync: string;
  };

  // 7. Historical State
  historicalState: {
    temporalLogRootMerkleHash: string;
    recordedIntervalsCount: number;
    historicalVitalityTrend: { timestamp: string; score: number }[];
    historicalEnergyKwh: { month: string; kwh: number }[];
  };

  // 8. Predicted State
  predictedState: {
    predictionHorizonDays: number;
    projectedVitalityIn30Days: number;
    projectedFailureRiskProbability: number;
    predictedPeakPowerDemandKw: number;
    nextRecommendedMaintenanceDate: string;
    confidenceIntervalPercent: number;
  };

  // 9. Observations
  observations: EntityObservationBinding[];

  // 10. Provenance
  provenance: EntityProvenance;

  // 11. Confidence
  confidence: {
    score: number; // 0.0 - 1.0
    epistemicUncertainty: number;
    sensorNoiseIndex: number;
    decayFactor: number;
    lastCalibratedAt: string;
  };

  // 12. Permissions
  permissions: {
    classification: SecurityClassification;
    ownerTenantId: string;
    authorizedRoles: string[];
    isAirGappedSovereign: boolean;
  };

  // 13. Lifecycle State
  lifecycleState: LifecycleStage;

  // 14. Epistemological Tag
  epistemologicalTag: EpistemologicalTag;
  epistemologicalRationale: string;
}

export interface WorldModelGraphStats {
  totalEntities: number;
  totalRelationships: number;
  observedEntitiesCount: number;
  inferredEntitiesCount: number;
  predictedEntitiesCount: number;
  simulatedEntitiesCount: number;
  liveSensorsConnected: number;
  merkleTreeRootHash: string;
}
