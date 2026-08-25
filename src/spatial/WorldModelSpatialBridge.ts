export interface SpatialEntity {
  id: string;
  name: string;
  type?: string;
  category?: string;
  domain?: string;
  position?: [number, number, number] | { x: number; y: number; z: number };
  coordinates?: [number, number];
  properties?: Record<string, unknown>;
  confidence?: number;
  reality?: string;
}

export interface SpatialObservationBridge {
  entityId: string;
  source: string;
  observedAt: number;
  realityLevel: string;
}
