// src/services/spatial/GestureRecognizer.ts
// ULTRON Gesture Recognizer: Classifies raw landmark telemetry into the canonical Gesture Dictionary

import { UltronGestureEvent, UltronGestureType, Vector3D } from './types';
import { LandmarkPoint } from '../../types';

type GestureCallback = (event: UltronGestureEvent) => void;

function dist3D(p1: { x: number; y: number; z?: number }, p2: { x: number; y: number; z?: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class GestureRecognizer {
  private listeners: Set<GestureCallback> = new Set();
  
  // Temporal tracking state
  private lastGesture: UltronGestureType = 'IDLE';
  private lastPinchReleaseTime: number = 0;
  private lastPinchStartTime: number = 0;
  private pinchCountInWindow: number = 0;
  private palmOpenStartTime: number | null = null;
  private lastWristPos: Vector3D | null = null;
  private lastTimestamp: number = 0;
  private isFistClosed: boolean = false;

  public onGestureDetected(callback: GestureCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Process a single video frame / landmark snapshot
   */
  public processLandmarks(landmarks: LandmarkPoint[] | null, handedness: 'left' | 'right' | 'unknown' = 'right'): void {
    const now = performance.now();

    if (!landmarks || landmarks.length < 21) {
      if (this.lastGesture !== 'IDLE') {
        this.emitGesture({
          type: 'IDLE',
          timestamp: now,
          confidence: 1.0,
          source: 'gesture'
        });
      }
      this.lastGesture = 'IDLE';
      this.palmOpenStartTime = null;
      this.lastWristPos = null;
      return;
    }

    // Key Landmark indices:
    // 0: Wrist, 4: Thumb Tip, 3: Thumb IP, 2: Thumb MCP
    // 8: Index Tip, 6: Index PIP, 5: Index MCP
    // 12: Middle Tip, 10: Middle PIP, 9: Middle MCP
    // 16: Ring Tip, 14: Ring PIP, 13: Ring MCP
    // 20: Pinky Tip, 18: Pinky PIP, 17: Pinky MCP
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const indexMcp = landmarks[5];
    const middleTip = landmarks[12];
    const middlePip = landmarks[10];
    const middleMcp = landmarks[9];
    const ringTip = landmarks[16];
    const ringPip = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyPip = landmarks[18];

    // Reference hand scale: Wrist(0) to Middle MCP(9)
    const handScale = Math.max(0.08, dist3D(wrist, middleMcp));

    // Calculate normalized finger extensions
    const isThumbExtended = dist3D(thumbTip, wrist) > dist3D(thumbIp, wrist) * 1.1;
    const isIndexExtended = dist3D(indexTip, wrist) > dist3D(indexPip, wrist) * 1.15;
    const isMiddleExtended = dist3D(middleTip, wrist) > dist3D(middlePip, wrist) * 1.15;
    const isRingExtended = dist3D(ringTip, wrist) > dist3D(ringPip, wrist) * 1.15;
    const isPinkyExtended = dist3D(pinkyTip, wrist) > dist3D(pinkyPip, wrist) * 1.15;

    // Pinch distance
    const rawPinchDist = dist3D(thumbTip, indexTip);
    const normalizedPinch = rawPinchDist / handScale;
    const isPinching = normalizedPinch < 0.22;

    // Fist detection (all 4 main fingers curled tight to palm)
    const isCurledIndex = dist3D(indexTip, indexMcp) < handScale * 0.55;
    const isCurledMiddle = dist3D(middleTip, middleMcp) < handScale * 0.55;
    const isCurledRing = dist3D(ringTip, landmarks[13]) < handScale * 0.55;
    const isCurledPinky = dist3D(pinkyTip, landmarks[17]) < handScale * 0.55;
    const isFist = isCurledIndex && isCurledMiddle && isCurledRing && isCurledPinky;

    // Velocity & Delta calculation
    let deltaX = 0;
    let deltaY = 0;
    let velocity = 0;

    if (this.lastWristPos && this.lastTimestamp > 0) {
      const dt = Math.max(1, now - this.lastTimestamp);
      deltaX = (wrist.x - this.lastWristPos.x);
      deltaY = (wrist.y - this.lastWristPos.y);
      velocity = (Math.sqrt(deltaX * deltaX + deltaY * deltaY) / dt) * 1000;
    }

    this.lastWristPos = { x: wrist.x, y: wrist.y, z: wrist.z || 0 };
    this.lastTimestamp = now;

    // Pointing / Hover mode: Index finger extended while middle, ring, pinky are curled
    const isPointing = isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && !isPinching;

    // Open Palm: All 5 fingers extended
    const isOpenPalm = isThumbExtended && isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended;

    // --- State Machine Classification ---

    // 1. Double Pinch & Primary Pinch Detection
    if (isPinching) {
      if (this.lastGesture !== 'PINCH' && this.lastGesture !== 'DOUBLE_PINCH') {
        this.lastPinchStartTime = now;
        if (now - this.lastPinchReleaseTime < 380) {
          // Double pinch detected!
          this.pinchCountInWindow = 2;
          this.emitGesture({
            type: 'DOUBLE_PINCH',
            timestamp: now,
            position: { x: indexTip.x, y: indexTip.y, z: indexTip.z || 0 },
            confidence: 0.95,
            source: 'gesture'
          });
          this.lastGesture = 'DOUBLE_PINCH';
          return;
        } else {
          this.pinchCountInWindow = 1;
          this.emitGesture({
            type: 'PINCH',
            timestamp: now,
            position: { x: indexTip.x, y: indexTip.y, z: indexTip.z || 0 },
            confidence: 0.95,
            source: 'gesture'
          });
          this.lastGesture = 'PINCH';
          return;
        }
      }
    } else {
      if (this.lastGesture === 'PINCH' || this.lastGesture === 'DOUBLE_PINCH') {
        this.lastPinchReleaseTime = now;
      }
    }

    // 2. Fist Grab & Release
    if (isFist) {
      if (!this.isFistClosed) {
        this.isFistClosed = true;
        this.emitGesture({
          type: 'FIST_CLOSE',
          timestamp: now,
          position: { x: wrist.x, y: wrist.y, z: wrist.z || 0 },
          confidence: 0.9,
          source: 'gesture'
        });
        this.lastGesture = 'FIST_CLOSE';
        return;
      }
    } else {
      if (this.isFistClosed) {
        this.isFistClosed = false;
        this.emitGesture({
          type: 'FIST_OPEN',
          timestamp: now,
          position: { x: wrist.x, y: wrist.y, z: wrist.z || 0 },
          confidence: 0.9,
          source: 'gesture'
        });
        this.lastGesture = 'FIST_OPEN';
        return;
      }
    }

    // 3. Flick / Dismiss (High velocity snap away)
    if (velocity > 1.8 && (Math.abs(deltaX) > 0.05 || deltaY < -0.05)) {
      this.emitGesture({
        type: 'FLICK',
        timestamp: now,
        delta: { x: deltaX, y: deltaY },
        confidence: 0.88,
        source: 'gesture'
      });
      this.lastGesture = 'FLICK';
      return;
    }

    // 4. Open Palm Hold (Summon Menu / Reset)
    if (isOpenPalm && velocity < 0.25) {
      if (this.palmOpenStartTime === null) {
        this.palmOpenStartTime = now;
      }
      const holdDuration = now - this.palmOpenStartTime;

      if (holdDuration >= 500 && this.lastGesture !== 'OPEN_PALM_HOLD') {
        this.emitGesture({
          type: 'OPEN_PALM_HOLD',
          timestamp: now,
          position: { x: wrist.x, y: wrist.y, z: wrist.z || 0 },
          confidence: 0.98,
          source: 'gesture'
        });
        this.lastGesture = 'OPEN_PALM_HOLD';
        return;
      }
    } else {
      this.palmOpenStartTime = null;
    }

    // 5. Pan & Scroll Navigation (Open Palm moving)
    if (isOpenPalm && velocity >= 0.25) {
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
        this.emitGesture({
          type: 'SCROLL',
          timestamp: now,
          delta: { x: 0, y: deltaY },
          confidence: 0.85,
          source: 'gesture'
        });
        this.lastGesture = 'SCROLL';
        return;
      } else {
        this.emitGesture({
          type: 'PAN',
          timestamp: now,
          delta: { x: deltaX, y: deltaY },
          confidence: 0.85,
          source: 'gesture'
        });
        this.lastGesture = 'PAN';
        return;
      }
    }

    // 6. Point / Hover
    if (isPointing) {
      this.emitGesture({
        type: 'HOVER',
        timestamp: now,
        position: { x: indexTip.x, y: indexTip.y, z: indexTip.z || 0 },
        direction: {
          x: indexTip.x - indexPip.x,
          y: indexTip.y - indexPip.y,
          z: (indexTip.z || 0) - (indexPip.z || 0)
        },
        confidence: 0.9,
        source: 'gesture'
      });
      this.lastGesture = 'HOVER';
      return;
    }

    // Fallback: Idle / Hand Tracking
    this.emitGesture({
      type: 'IDLE',
      timestamp: now,
      position: { x: indexTip.x, y: indexTip.y, z: indexTip.z || 0 },
      confidence: 0.8,
      source: 'gesture'
    });
    this.lastGesture = 'IDLE';
  }

  private emitGesture(event: UltronGestureEvent): void {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('[GestureRecognizer] Listener error:', err);
      }
    });
  }
}

export const gestureRecognizer = new GestureRecognizer();
