export type HandGesture =
  | 'none'
  | 'point'
  | 'pinch'
  | 'open'
  | 'fist'
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down';

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface HandControlState {
  enabled: boolean;
  confidence: number;
  gesture: HandGesture;
  cursorX: number;
  cursorY: number;
  pinch: number;
  timestamp: number;
}

export interface HandControlOptions {
  confidenceThreshold?: number;
  smoothing?: number;
  pinchThreshold?: number;
}

const DEFAULTS: Required<HandControlOptions> = {
  confidenceThreshold: 0.65,
  smoothing: 0.18,
  pinchThreshold: 0.055,
};

/**
 * Pure hand-interaction layer. Vision inference stays outside this module so
 * MediaPipe/WebGPU workers can feed landmarks without coupling the UI to a
 * specific inference implementation.
 */
export class HandControlController {
  private readonly options: Required<HandControlOptions>;
  private state: HandControlState = {
    enabled: false,
    confidence: 0,
    gesture: 'none',
    cursorX: 0.5,
    cursorY: 0.5,
    pinch: 0,
    timestamp: 0,
  };

  constructor(options: HandControlOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
    if (!enabled) this.state.gesture = 'none';
  }

  update(landmarks: HandLandmark[], confidence: number, timestamp = performance.now()): HandControlState {
    if (!this.state.enabled || confidence < this.options.confidenceThreshold || landmarks.length < 21) {
      this.state.confidence = confidence;
      this.state.gesture = 'none';
      this.state.timestamp = timestamp;
      return { ...this.state };
    }

    const index = landmarks[8];
    const thumb = landmarks[4];
    const pinchDistance = Math.hypot(index.x - thumb.x, index.y - thumb.y);
    const alpha = this.options.smoothing;

    this.state.cursorX += (index.x - this.state.cursorX) * alpha;
    this.state.cursorY += (index.y - this.state.cursorY) * alpha;
    this.state.pinch += ((pinchDistance < this.options.pinchThreshold ? 1 : 0) - this.state.pinch) * alpha;
    this.state.confidence = confidence;
    this.state.gesture = pinchDistance < this.options.pinchThreshold ? 'pinch' : 'point';
    this.state.timestamp = timestamp;

    return { ...this.state };
  }

  getState(): HandControlState {
    return { ...this.state };
  }
}
