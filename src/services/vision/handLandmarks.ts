import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { LandmarkPoint } from '../../types';

export interface VisionConfig {
  sensitivity: number; // 0.2 to 2.5 (1.0 = 100% nominal)
  minPinchThreshold: number; // baseline raw normalized pinch distance representing 0.0 (assembled)
  maxPinchThreshold: number; // baseline raw normalized pinch distance representing 1.0 (exploded)
  smoothingAlpha: number; // exponential moving average factor (0.0 to 1.0)
  palmHoldDurationMs: number; // duration (ms) open palm must be held to trigger selection
  triggerCooldownMs: number; // cooldown (ms) after trigger to avoid double activations
}

export const BASELINE_VISION_CONFIG: VisionConfig = {
  sensitivity: 1.0,
  minPinchThreshold: 0.20,
  maxPinchThreshold: 0.82,
  smoothingAlpha: 0.28,
  palmHoldDurationMs: 450,
  triggerCooldownMs: 1400
};

export const DEFAULT_VISION_CONFIG: VisionConfig = { ...BASELINE_VISION_CONFIG };

type VisionConfigListener = (config: VisionConfig, effectiveConfig: VisionConfig) => void;

export class HandVisionService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;
  private smoothedProgress: number = 0;
  private currentConfig: VisionConfig = { ...BASELINE_VISION_CONFIG };
  private listeners: Set<VisionConfigListener> = new Set();

  constructor() {
    // Load persisted sensitivity if available
    try {
      const saved = localStorage.getItem('jarvis_gesture_sensitivity');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.2 && val <= 2.5) {
          this.currentConfig.sensitivity = val;
        }
      }
    } catch {
      // Ignore storage errors in sandboxed contexts
    }
  }

  /**
   * Retrieves active base configuration
   */
  public getConfig(): VisionConfig {
    return { ...this.currentConfig };
  }

  /**
   * Retrieves calculated effective thresholds modulated by current sensitivity
   */
  public getEffectiveConfig(): VisionConfig {
    const s = Math.max(0.2, Math.min(2.5, this.currentConfig.sensitivity));
    
    // Higher sensitivity narrows required pinch span and sharpens response
    const baselineSpan = BASELINE_VISION_CONFIG.maxPinchThreshold - BASELINE_VISION_CONFIG.minPinchThreshold;
    const effectiveSpan = baselineSpan / (0.55 + 0.45 * s);
    const effectiveMin = Math.max(0.08, BASELINE_VISION_CONFIG.minPinchThreshold + (1 - s) * 0.04);
    const effectiveMax = effectiveMin + effectiveSpan;

    // Smoothing alpha scales with sensitivity (higher sensitivity = snappier, lower latency)
    const effectiveAlpha = Math.min(0.75, Math.max(0.12, BASELINE_VISION_CONFIG.smoothingAlpha * (0.5 + 0.5 * s)));

    // Palm hold duration is faster on higher sensitivity
    const effectiveHoldDuration = Math.round(BASELINE_VISION_CONFIG.palmHoldDurationMs / Math.sqrt(s));

    return {
      sensitivity: s,
      minPinchThreshold: effectiveMin,
      maxPinchThreshold: effectiveMax,
      smoothingAlpha: effectiveAlpha,
      palmHoldDurationMs: effectiveHoldDuration,
      triggerCooldownMs: BASELINE_VISION_CONFIG.triggerCooldownMs
    };
  }

  /**
   * Updates sensitivity dynamically (e.g. from UI slider)
   */
  public setSensitivity(sensitivity: number): void {
    const clamped = Math.max(0.2, Math.min(2.5, sensitivity));
    this.currentConfig.sensitivity = clamped;
    
    try {
      localStorage.setItem('jarvis_gesture_sensitivity', clamped.toString());
    } catch {
      // Ignore storage error
    }

    const effective = this.getEffectiveConfig();
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.currentConfig }, effective);
      } catch (err) {
        console.warn('Vision config listener error:', err);
      }
    });
  }

  /**
   * Subscribes to live config/sensitivity changes
   */
  public subscribeConfig(listener: VisionConfigListener): () => void {
    this.listeners.add(listener);
    // Trigger initial state
    listener({ ...this.currentConfig }, this.getEffectiveConfig());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Resets sensitivity back to 1.0x nominal
   */
  public resetSensitivity(): void {
    this.setSensitivity(1.0);
  }

  /**
   * Initializes MediaPipe HandLandmarker with WASM files
   */
  public async initialize(): Promise<HandLandmarker> {
    if (this.handLandmarker) {
      return this.handLandmarker;
    }

    if (this.isInitializing) {
      // Wait until previous init completes
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (this.handLandmarker) return this.handLandmarker;
    }

    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      return this.handLandmarker;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Detects landmarks in a video frame
   */
  public detectForVideo(video: HTMLVideoElement, timestampMs: number) {
    if (!this.handLandmarker) return null;
    return this.handLandmarker.detectForVideo(video, timestampMs);
  }

  /**
   * Calculates normalized pinch distance (Thumb Tip 4 to Index Tip 8 / Hand Scale Wrist 0 to MCP 9)
   */
  public calculateNormalizedPinch(landmarks: LandmarkPoint[]): {
    rawDistance: number;
    normalizedDistance: number;
    progress: number;
    isPinching: boolean;
  } {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleMcp = landmarks[9];

    if (!wrist || !thumbTip || !indexTip || !middleMcp) {
      return { rawDistance: 0, normalizedDistance: 0, progress: 0, isPinching: false };
    }

    // Euclidean distance between Thumb Tip and Index Tip
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dz = thumbTip.z - indexTip.z;
    const rawDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Hand Scale reference distance (Wrist to Middle MCP)
    const hx = wrist.x - middleMcp.x;
    const hy = wrist.y - middleMcp.y;
    const hz = wrist.z - middleMcp.z;
    const handScale = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;

    // Relative distance independent of camera distance
    const normalizedDistance = rawDistance / handScale;

    const config = this.getEffectiveConfig();

    // Linear mapping from [minPinchThreshold, maxPinchThreshold] -> [0.0, 1.0]
    const clampedProgress = Math.max(
      0,
      Math.min(
        1,
        (normalizedDistance - config.minPinchThreshold) /
          (config.maxPinchThreshold - config.minPinchThreshold)
      )
    );

    // Exponential Moving Average (EMA) Smoothing
    this.smoothedProgress =
      this.smoothedProgress * (1 - config.smoothingAlpha) +
      clampedProgress * config.smoothingAlpha;

    return {
      rawDistance,
      normalizedDistance,
      progress: this.smoothedProgress,
      isPinching: normalizedDistance < config.minPinchThreshold + 0.15 * config.sensitivity
    };
  }

  /**
   * Evaluates if all 5 fingers are fully extended (Open Palm)
   */
  public isOpenPalm(landmarks: LandmarkPoint[]): boolean {
    const wrist = landmarks[0];
    if (!wrist) return false;

    // Tips: 4 (thumb), 8 (index), 12 (middle), 16 (ring), 20 (pinky)
    // MCPs/PIPs: 2, 6, 10, 14, 18
    const fingerPairs = [
      { tip: 8, pip: 6, mcp: 5 },
      { tip: 12, pip: 10, mcp: 9 },
      { tip: 16, pip: 14, mcp: 13 },
      { tip: 20, pip: 18, mcp: 17 }
    ];

    // Check four fingers: Tip distance to wrist must be substantially greater than PIP distance to wrist
    for (const pair of fingerPairs) {
      const tip = landmarks[pair.tip];
      const pip = landmarks[pair.pip];
      if (!tip || !pip) return false;

      const dTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const dPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);

      if (dTip <= dPip * 1.1) {
        return false;
      }
    }

    // Thumb check (landmark 4 relative to 2 and wrist)
    const thumbTip = landmarks[4];
    const thumbPip = landmarks[2];
    if (thumbTip && thumbPip) {
      const dThumbTip = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);
      const dThumbPip = Math.hypot(thumbPip.x - wrist.x, thumbPip.y - wrist.y);
      if (dThumbTip <= dThumbPip * 1.05) {
        return false;
      }
    }

    return true;
  }

  public setSmoothedProgress(value: number) {
    this.smoothedProgress = Math.max(0, Math.min(1, value));
  }

  public cleanup() {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }
}

export const visionService = new HandVisionService();
