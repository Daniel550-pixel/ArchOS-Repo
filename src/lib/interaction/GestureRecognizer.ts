import type { HandControlState, HandGesture } from './HandControl';
import { createHandCommand, type SpatialCommand } from './SpatialCommandBus';

export interface GestureRecognizerOptions {
  actionConfidence?: number;
  pinchThreshold?: number;
  swipeDistance?: number;
  swipeCooldownMs?: number;
}

const DEFAULTS: Required<GestureRecognizerOptions> = {
  actionConfidence: 0.85,
  pinchThreshold: 0.7,
  swipeDistance: 0.08,
  swipeCooldownMs: 250,
};

/**
 * Converts the normalized HandControl state into stable semantic commands.
 * It deliberately knows nothing about React, Three.js or the camera device.
 */
export class GestureRecognizer {
  private readonly options: Required<GestureRecognizerOptions>;
  private previous: HandControlState | null = null;
  private lastSwipeAt = 0;
  private wasPinching = false;

  constructor(options: GestureRecognizerOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  update(state: HandControlState): SpatialCommand[] {
    const commands: SpatialCommand[] = [];
    const previous = this.previous;
    this.previous = state;

    if (!state.enabled || state.confidence < this.options.actionConfidence || state.gesture === 'none') {
      if (this.wasPinching) {
        this.wasPinching = false;
        commands.push(createHandCommand('SPATIAL_RELEASE', state.confidence));
      }
      return commands;
    }

    commands.push(
      createHandCommand('SPATIAL_POINT', state.confidence, {
        position: { x: state.cursorX, y: state.cursorY },
      }),
    );

    const pinching = state.pinch >= this.options.pinchThreshold || state.gesture === 'pinch';
    if (pinching && !this.wasPinching) {
      this.wasPinching = true;
      commands.push(
        createHandCommand('SPATIAL_SELECT', state.confidence, {
          position: { x: state.cursorX, y: state.cursorY },
        }),
      );
    } else if (!pinching && this.wasPinching) {
      this.wasPinching = false;
      commands.push(createHandCommand('SPATIAL_RELEASE', state.confidence));
    }

    if (previous && state.timestamp - this.lastSwipeAt >= this.options.swipeCooldownMs) {
      const dx = state.cursorX - previous.cursorX;
      const dy = state.cursorY - previous.cursorY;
      const distance = Math.hypot(dx, dy);

      if (distance >= this.options.swipeDistance) {
        const gesture: HandGesture = Math.abs(dx) >= Math.abs(dy)
          ? (dx > 0 ? 'swipe-right' : 'swipe-left')
          : (dy > 0 ? 'swipe-down' : 'swipe-up');

        commands.push(
          createHandCommand('SPATIAL_SWIPE', state.confidence, {
            delta: { x: dx, y: dy },
            metadata: { gesture },
          }),
        );
        this.lastSwipeAt = state.timestamp;
      }
    }

    return commands;
  }

  reset(): void {
    this.previous = null;
    this.lastSwipeAt = 0;
    this.wasPinching = false;
  }
}
