export type SpatialCommandType =
  | 'SPATIAL_POINT'
  | 'SPATIAL_SELECT'
  | 'SPATIAL_GRAB'
  | 'SPATIAL_RELEASE'
  | 'CAMERA_ORBIT'
  | 'CAMERA_ZOOM'
  | 'SPATIAL_SWIPE'
  | 'SPATIAL_CANCEL';

export interface SpatialCommand {
  type: SpatialCommandType;
  source: 'hand' | 'voice' | 'pointer' | 'system';
  confidence: number;
  timestamp: number;
  targetId?: string;
  position?: { x: number; y: number; z?: number };
  delta?: { x: number; y: number; z?: number };
  metadata?: Record<string, unknown>;
}

export type SpatialCommandHandler = (command: SpatialCommand) => void;

/**
 * Small synchronous command bus shared by hand, voice, pointer and autonomous
 * input sources. Input modalities publish semantic commands; spatial systems
 * decide how those commands affect the world.
 */
export class SpatialCommandBus {
  private readonly handlers = new Map<SpatialCommandType, Set<SpatialCommandHandler>>();
  private readonly anyHandlers = new Set<SpatialCommandHandler>();

  subscribe(type: SpatialCommandType, handler: SpatialCommandHandler): () => void {
    const handlers = this.handlers.get(type) ?? new Set<SpatialCommandHandler>();
    handlers.add(handler);
    this.handlers.set(type, handlers);
    return () => handlers.delete(handler);
  }

  subscribeAll(handler: SpatialCommandHandler): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  publish(command: SpatialCommand): void {
    for (const handler of this.handlers.get(command.type) ?? []) handler(command);
    for (const handler of this.anyHandlers) handler(command);
  }

  clear(): void {
    this.handlers.clear();
    this.anyHandlers.clear();
  }
}

export const createHandCommand = (
  type: SpatialCommandType,
  confidence: number,
  payload: Omit<SpatialCommand, 'type' | 'source' | 'confidence' | 'timestamp'> = {},
): SpatialCommand => ({
  type,
  source: 'hand',
  confidence,
  timestamp: performance.now(),
  ...payload,
});
