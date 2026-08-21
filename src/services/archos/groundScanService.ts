import { GroundScanSession, GroundScanLayerStream, SubsurfaceUtilityConflict } from '../../types/archosGroundScan';
import { PRESET_GROUND_SCAN_SESSIONS } from '../../data/archosGroundScanData';
import { worldModelGraphService } from './worldModelGraphService';
import { CanonicalWorldModelEntity } from '../../types/archosWorldModel';

type GroundScanListener = (sessions: GroundScanSession[], activeSession: GroundScanSession) => void;

class GroundScanService {
  private sessions: GroundScanSession[] = [...PRESET_GROUND_SCAN_SESSIONS];
  private activeSessionId: string = PRESET_GROUND_SCAN_SESSIONS[0].scanId;
  private listeners: Set<GroundScanListener> = new Set();
  private isScanning: boolean = false;

  public getSessions(): GroundScanSession[] {
    return [...this.sessions];
  }

  public getActiveSession(): GroundScanSession {
    return this.sessions.find((s) => s.scanId === this.activeSessionId) || this.sessions[0];
  }

  public selectSession(scanId: string): void {
    this.activeSessionId = scanId;
    this.notify();
  }

  public triggerDroneLidarScan(): void {
    if (this.isScanning) return;
    this.isScanning = true;

    const current = this.getActiveSession();
    const updatedLayers = current.activeLayers.map((l) => {
      if (l.layerType === 'LIDAR_POINT_CLOUD') {
        return {
          ...l,
          dataPointsCount: l.dataPointsCount + 2500000,
          ingestionStatus: 'STREAMING' as const,
          lastUpdated: new Date().toISOString()
        };
      }
      return l;
    });

    this.sessions = this.sessions.map((s) => {
      if (s.scanId === current.scanId) {
        return {
          ...s,
          activeLayers: updatedLayers,
          pointCloudSampleCount: s.pointCloudSampleCount + 2500000
        };
      }
      return s;
    });

    this.notify();

    setTimeout(() => {
      this.isScanning = false;
      this.sessions = this.sessions.map((s) => {
        if (s.scanId === current.scanId) {
          const synchedLayers = s.activeLayers.map((l) => ({
            ...l,
            ingestionStatus: 'SYNCHRONIZED' as const
          }));
          return {
            ...s,
            activeLayers: synchedLayers,
            worldModelInjectionStatus: 'INJECTED' as const
          };
        }
        return s;
      });
      this.notify();
    }, 2000);
  }

  public resolveSubsurfaceConflict(conflictId: string): void {
    const current = this.getActiveSession();
    const updatedConflicts = current.scorecard.subsurfaceConflicts.map((c) => {
      if (c.conflictId === conflictId) {
        return {
          ...c,
          severity: 'CLEARED' as const,
          detectedClearanceMeters: 3.2,
          mitigationRecommendation: 'Piling offset realigned. 3.2m safety clearance from 900mm District Cooling main achieved.'
        };
      }
      return c;
    });

    this.sessions = this.sessions.map((s) => {
      if (s.scanId === current.scanId) {
        return {
          ...s,
          scorecard: {
            ...s.scorecard,
            subsurfaceConflicts: updatedConflicts,
            overallFeasibilityScore: Math.min(100, s.scorecard.overallFeasibilityScore + 4)
          }
        };
      }
      return s;
    });

    this.notify();
  }

  public injectSiteIntoWorldModel(): void {
    const current = this.getActiveSession();
    const newWorldModelEntity: CanonicalWorldModelEntity = {
      id: `urn:archos:uae:gscan:${current.targetPlotId.toLowerCase()}`,
      name: `${current.targetName} (GroundScan Validated)`,
      arabicName: 'موقع مسح أرضي معتمد',
      entityClass: 'PARCEL',
      canonicalCode: `GSCAN-${current.targetPlotId}`,
      geometry: {
        type: 'Point',
        spatialReference: 'EPSG:3997',
        coordinates: current.coordinates,
        elevationMslMeters: current.elevationMsl,
        heightMeters: current.scorecard.maxAllowableHeightMeters,
        boundingRadiusMeters: 75.0,
        lodLevel: 3
      },
      location: {
        emirateId: current.emirate.toLowerCase() as any,
        emirateName: current.emirate,
        municipalityZone: `Cadastral Plot ${current.targetPlotId}`,
        makaniNumber: current.scorecard.makaniNumber,
        plotId: current.targetPlotId,
        communityId: `${current.emirate} Master Plan`,
        latitude: current.coordinates[0],
        longitude: current.coordinates[1]
      },
      attributes: {
        grossFloorAreaSqm: current.scorecard.floorAreaRatioFAR * 10000,
        footprintAreaSqm: (current.scorecard.plotCoverageMaxPercent / 100) * 10000,
        totalHeightMeters: current.scorecard.maxAllowableHeightMeters,
        customSpecs: {
          'Zoning FAR': current.scorecard.floorAreaRatioFAR,
          'Available Power MVA': current.scorecard.utilityCapacityStatus.powerAvailableMva,
          'Available Chilled Water Tons': current.scorecard.utilityCapacityStatus.chilledWaterAvailableTons
        }
      },
      relationships: [],
      currentState: {
        vitalityScore: current.scorecard.overallFeasibilityScore,
        operationalStatus: 'OPTIMAL',
        activeLoadKw: 0,
        ambientTempCelsius: current.scorecard.microclimateFactors.ambientSummerMaxTempC,
        coolingDemandTons: 0,
        co2IntensityKgPerHour: 0,
        activeOccupants: 0,
        healthAnomalyCount: 0,
        lastTelemetrySync: new Date().toISOString()
      },
      historicalState: {
        temporalLogRootMerkleHash: '0x1234567890abcdef1234567890abcdef',
        recordedIntervalsCount: 1,
        historicalVitalityTrend: [{ timestamp: '2026-08-17', score: current.scorecard.overallFeasibilityScore }],
        historicalEnergyKwh: []
      },
      predictedState: {
        predictionHorizonDays: 365,
        projectedVitalityIn30Days: current.scorecard.overallFeasibilityScore,
        projectedFailureRiskProbability: 0.01,
        predictedPeakPowerDemandKw: 2500,
        nextRecommendedMaintenanceDate: '2027-01-01',
        confidenceIntervalPercent: 98.0
      },
      observations: [],
      provenance: {
        originSource: 'ArchOS Multi-Scale GroundScan & Municipal Cadastre Pipeline',
        organization: `${current.emirate} Municipality & GroundScan GIS`,
        method: 'DRONE_LIDAR',
        ingestedAt: new Date().toISOString(),
        verifiedBy: 'Sovereign UAE Validator Authority',
        digitalSignatureSha256: `0x${Math.random().toString(16).substring(2, 14)}`
      },
      confidence: {
        score: 0.99,
        epistemicUncertainty: 0.01,
        sensorNoiseIndex: 0.005,
        decayFactor: 0.999,
        lastCalibratedAt: new Date().toISOString()
      },
      permissions: {
        classification: 'DEVELOPER_RESTRICTED',
        ownerTenantId: 'tenant-groundscan-active',
        authorizedRoles: ['ROLE_SOVEREIGN_ADMIN', 'ROLE_PLANNER'],
        isAirGappedSovereign: false
      },
      lifecycleState: 'DISCOVER',
      epistemologicalTag: 'OBSERVED',
      epistemologicalRationale: 'Empirical Drone LiDAR point cloud and municipal cadastral deeds verified.'
    };

    worldModelGraphService.injectGroundScanEntity(newWorldModelEntity);

    this.sessions = this.sessions.map((s) => {
      if (s.scanId === current.scanId) {
        return {
          ...s,
          worldModelInjectionStatus: 'INJECTED' as const
        };
      }
      return s;
    });

    this.notify();
  }

  public subscribe(listener: GroundScanListener): () => void {
    this.listeners.add(listener);
    listener(this.getSessions(), this.getActiveSession());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const s = this.getSessions();
    const a = this.getActiveSession();
    this.listeners.forEach((l) => l(s, a));
  }
}

export const groundScanService = new GroundScanService();
