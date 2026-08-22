import { GestureRecognizer, type GestureRecognizerOptions } from './GestureRecognizer';
import { HandControlController, type HandControlOptions, type HandLandmark } from './HandControl';
import { SpatialCommandBus, type SpatialCommand, type SpatialCommandHandler } from './SpatialCommandBus';

export interface SpatialInteractionRuntimeOptions {
  hand?: HandControlOptions;
  gestures?: GestureRecognizerOptions;
}

/**
 * Native spatial interaction runtime. MediaPipe (or another vision provider)
 * only supplies landmarks; this class owns the deterministic path from
 * landmarks -> gesture semantics -> application command bus.
 */
export class SpatialInteractionRuntime {
  readonly hand: HandControlController;
  readonly gestures: GestureRecognizer;
  readonly bus: SpatialCommandBus;

  constructor(options: SpatialInteractionRuntimeOptions = {}, bus = new SpatialCommandBus()) {
    this.hand = new HandControlController(options.hand);
    this.gestures = new GestureRecognizer(options.gestures);
    this.bus = bus;
  }

  setEnabled(enabled: boolean): void {
    this.hand.setEnabled(enabled);
    if (!enabled) this.gestures.reset();
  }

  updateLandmarks(landmarks: HandLandmark[], confidence: number, timestamp?: number): SpatialCommand[] {
    const state = this.hand.update(landmarks, confidence, timestamp);
    const commands = this.gestures.update(state);
    for (const command of commands) this.bus.publish(command);
    return commands;
  }

  subscribe(type: Parameters<SpatialCommandHandler>[0]['type'], handler: SpatialCommandHandler): () => void {
    return this.bus.subscribe(type, handler);
  }

  subscribeAll(handler: SpatialCommandHandler): () => void {
    return this.bus.subscribeAll(handler);
  }

  reset(): void {
    this.gestures.reset();
  }
}
