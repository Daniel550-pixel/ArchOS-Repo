export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
}

export interface SpatialEntity {
  id: string;
  position?: Partial<SpatialPosition>;
  radius?: number;
  [key: string]: unknown;
}

export function toSpatialPosition(entity: SpatialEntity): SpatialPosition {
  return {
    x: Number(entity.position?.x ?? 0),
    y: Number(entity.position?.y ?? 0),
    z: Number(entity.position?.z ?? 0),
  };
}
