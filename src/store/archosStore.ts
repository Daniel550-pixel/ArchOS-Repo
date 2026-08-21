// src/store/archosStore.ts
// ArchOS Central Unified Store for Spatial Intelligence & RTX Path Tracing Governance

import { useState, useEffect } from 'react';
import { RTXSettings } from '../lib/renderer/types';
import { ExperienceCommand } from '../types';
import { SimulationScenario, SimulationResult } from '../types/simulation';
import { DesignParameters, BIMModel } from '../types/design';

export type VoiceStatus = 'IDLE' | 'SPEAKING' | 'SYNTHESIZING' | 'ERROR';

export interface SensorReading {
  id: string;
  label: string;
  value: number;
  unit: string;
  status: 'nominal' | 'warning' | 'critical';
  history: number[];
}

export interface VoiceProfileConfig {
  id: string;
  name: string;
  label: string;
  stability: number;
  similarity: number;
  style: number;
  description: string;
  useSpeakerBoost?: boolean;
}

export interface ArchOSState {
  viewMode: '2D_MAP' | '3D_ORB' | '8K_RTX' | 'EXPLODED_BIM' | 'GROUND_SCAN';
  selectedEntityId: string | null;
  selectedCityId: string;
  selectedDistrictId: string;
  activeDomainLayer: string;
  isDefcon1Active: boolean;
  isBiometricAuthenticated: boolean;
  rtxSettings: RTXSettings;
  // Voice Synthesis & Sovereign Audio State
  voiceStatus: VoiceStatus;
  lastSpokenText: string;
  activeVoiceProfileId: string;
  voiceVolume: number;
  isVoiceMuted: boolean;
  isListening: boolean;
  
  // Live Telemetry
  sensors: SensorReading[];
  isTelemetryPanelOpen: boolean;

  // Simulation Sandbox (PROVE Stage)
  activeScenario: SimulationScenario | null;
  simulationResult: SimulationResult | null;
  isSimulating: boolean;

  // Parametric Design & BIM (DESIGN Stage)
  designParameters: DesignParameters;
  bimModel: BIMModel | null;
  
  // Actions
  updateRTXSettings: (settings: Partial<RTXSettings>) => void;
  setViewMode: (mode: '2D_MAP' | '3D_ORB' | '8K_RTX' | 'EXPLODED_BIM' | 'GROUND_SCAN') => void;
  setSelectedEntity: (id: string | null) => void;
  setCityAndDistrict: (city: string, district: string) => void;
  setVoiceStatus: (status: VoiceStatus, text?: string) => void;
  setVoiceProfile: (profile: VoiceProfileConfig) => void;
  setVoiceVolume: (volume: number) => void;
  setVoiceMuted: (muted: boolean) => void;
  setListeningStatus: (on: boolean) => void;
  setSensors: (sensors: SensorReading[]) => void;
  setTelemetryPanelOpen: (open: boolean) => void;
  setActiveScenario: (s: SimulationScenario | null) => void;
  setSimulationResult: (r: SimulationResult | null) => void;
  setIsSimulating: (b: boolean) => void;
  updateDesignParameters: (params: Partial<DesignParameters>) => void;
  setBIMModel: (model: BIMModel | null) => void;
}

const DEFAULT_RTX_SETTINGS: RTXSettings = {
  maxSamples: 512,
  resolutionScale: 0.75,
  enableTemporal: true,
  adaptiveSampling: true,
  noiseThreshold: 0.02,
  maxBounces: 4,
  sunElevation: 28,
  sunAzimuth: 220
};

class StoreContainer {
  private state: ArchOSState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = {
      viewMode: '2D_MAP',
      selectedEntityId: 'uae.dubai.creek_tower',
      selectedCityId: 'dubai',
      selectedDistrictId: 'downtown',
      activeDomainLayer: 'infrastructure',
      isDefcon1Active: false,
      isBiometricAuthenticated: false,
      rtxSettings: DEFAULT_RTX_SETTINGS,
      // Voice defaults
      voiceStatus: 'IDLE',
      lastSpokenText: '',
      activeVoiceProfileId: 'ErXwobaYiN019PkySvjV', // Sovereign Marcus
      voiceVolume: 0.85,
      isVoiceMuted: false,
      isListening: false,
      
      // Telemetry
      sensors: [],
      isTelemetryPanelOpen: true,

      // Simulation Sandbox (PROVE Stage)
      activeScenario: null,
      simulationResult: null,
      isSimulating: false,

      // Parametric Design & BIM (DESIGN Stage)
      designParameters: {
        footprintWidth: 20,
        footprintDepth: 20,
        floorCount: 10,
        floorHeight: 3.5,
        orientation: 0,
        structuralSystem: 'concrete',
        facadeType: 'curtain_wall',
      },
      bimModel: null,

      updateRTXSettings: (newSettings) => {
        this.state.rtxSettings = { ...this.state.rtxSettings, ...newSettings };
        this.notify();
      },
      setViewMode: (mode) => {
        this.state.viewMode = mode;
        this.notify();
      },
      setSelectedEntity: (id) => {
        this.state.selectedEntityId = id;
        this.notify();
      },
      setCityAndDistrict: (city, district) => {
        this.state.selectedCityId = city;
        this.state.selectedDistrictId = district;
        this.notify();
      },
      setVoiceStatus: (status, text) => {
        this.state.voiceStatus = status;
        if (text) this.state.lastSpokenText = text;
        this.notify();
      },
      setVoiceProfile: (profile) => {
        this.state.activeVoiceProfileId = profile.id;
        this.notify();
      },
      setVoiceVolume: (volume) => {
        this.state.voiceVolume = volume;
        this.notify();
      },
      setVoiceMuted: (muted) => {
        this.state.isVoiceMuted = muted;
        this.notify();
      },
      setListeningStatus: (on) => {
        this.state.isListening = on;
        this.notify();
      },
      setSensors: (sensors) => {
        this.state.sensors = sensors;
        this.notify();
      },
      setTelemetryPanelOpen: (open) => {
        this.state.isTelemetryPanelOpen = open;
        this.notify();
      },
      setActiveScenario: (s) => {
        this.state.activeScenario = s;
        this.notify();
      },
      setSimulationResult: (r) => {
        this.state.simulationResult = r;
        this.notify();
      },
      setIsSimulating: (b) => {
        this.state.isSimulating = b;
        this.notify();
      },
      updateDesignParameters: (params) => {
        this.state.designParameters = { ...this.state.designParameters, ...params };
        this.notify();
      },
      setBIMModel: (model) => {
        this.state.bimModel = model;
        this.notify();
      }
    };
  }

  public getState(): ArchOSState {
    return this.state;
  }

  public setState(partial: Partial<ArchOSState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[ArchOSStore] listener error:', err);
      }
    });
  }
}

export const archOSStoreInstance = new StoreContainer();

export const useArchOSStore = (): ArchOSState => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = archOSStoreInstance.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  return archOSStoreInstance.getState();
};

// Direct Zustand-style static accessors
useArchOSStore.getState = () => archOSStoreInstance.getState();
useArchOSStore.setState = (partial: Partial<ArchOSState>) => archOSStoreInstance.setState(partial);
useArchOSStore.subscribe = (listener: () => void) => archOSStoreInstance.subscribe(listener);

