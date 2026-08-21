import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandGestureState, LandmarkPoint } from '../types';
import { visionService, VisionConfig } from '../services/vision/handLandmarks';
import { gestureRecognizer } from '../services/spatial/GestureRecognizer';

function euclideanDistance(
  p1: { x: number; y: number; z?: number },
  p2: { x: number; y: number; z?: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function useHandGestures(
  onPalmOpenTrigger?: () => void
) {
  const [state, setState] = useState<HandGestureState>({
    isCameraActive: false,
    handDetected: false,
    isOpenPalm: false,
    palmHoldProgress: 0,
    isPinching: false,
    rawPinchDistance: 0,
    normalizedDistance: 0,
    smoothedProgress: 0, // 0 = Assembled, 1 = Exploded
    landmarks: null,
    handedness: 'unknown',
    currentGesture: 'IDLE',
    fps: 0,
    error: null,
    debugSkeleton: false
  });

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Dynamic vision configuration ref
  const configRef = useRef<VisionConfig>(visionService.getEffectiveConfig());

  // Gesture state tracking refs for high-frequency render loop
  const smoothedProgressRef = useRef<number>(0);
  const palmHoldStartTimeRef = useRef<number | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());
  const isEnabledRef = useRef<boolean>(false);

  // Subscribe to live vision config & sensitivity updates
  useEffect(() => {
    const unsub = visionService.subscribeConfig((_raw, effective) => {
      configRef.current = effective;
    });
    return () => unsub();
  }, []);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isMounted = true;

    async function initModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        if (!isMounted) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55
        });

        if (!isMounted) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
      } catch (err) {
        console.warn('GPU HandLandmarker initialization failed, trying CPU fallback:', err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
          );
          if (!isMounted) return;

          const landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          if (!isMounted) {
            landmarker.close();
            return;
          }

          landmarkerRef.current = landmarker;
        } catch (fallbackErr) {
          console.error('HandLandmarker initialization failed entirely:', fallbackErr);
          if (isMounted) {
            setState(prev => ({
              ...prev,
              error: 'Gesture model could not be initialized. Fallback controls active.'
            }));
          }
        }
      }
    }

    initModel();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Frame Processing Loop
  const processFrame = useCallback(() => {
    if (!isEnabledRef.current || !videoElementRef.current || !landmarkerRef.current) {
      return;
    }

    const video = videoElementRef.current;
    if (video.readyState < 2) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    frameCountRef.current++;
    if (now - lastFpsUpdateRef.current >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
      setState(prev => ({ ...prev, fps: currentFps }));
    }

    try {
      const results = landmarkerRef.current.detectForVideo(video, now);

      if (results && results.landmarks && results.landmarks.length > 0) {
        const rawLandmarks = results.landmarks[0];
        const handednessStr = results.handednesses?.[0]?.[0]?.categoryName || 'Right';
        const handedness = handednessStr.toLowerCase() === 'left' ? 'left' : 'right';

        // Landmark indices:
        // 0: Wrist
        // 4: Thumb Tip, 3: Thumb IP, 2: Thumb MCP
        // 8: Index Tip, 6: Index PIP, 5: Index MCP
        // 12: Middle Tip, 10: Middle PIP, 9: Middle MCP
        // 16: Ring Tip, 14: Ring PIP, 13: Ring MCP
        // 20: Pinky Tip, 18: Pinky PIP, 17: Pinky MCP
        const wrist = rawLandmarks[0];
        const thumbTip = rawLandmarks[4];
        const thumbIp = rawLandmarks[3];
        const indexTip = rawLandmarks[8];
        const indexPip = rawLandmarks[6];
        const middleTip = rawLandmarks[12];
        const middlePip = rawLandmarks[10];
        const middleMcp = rawLandmarks[9];
        const ringTip = rawLandmarks[16];
        const ringPip = rawLandmarks[14];
        const pinkyTip = rawLandmarks[20];
        const pinkyPip = rawLandmarks[18];

        // 1. Hand scale reference: Wrist(0) to Middle MCP(9)
        const handScale = Math.max(0.08, euclideanDistance(wrist, middleMcp));

        // 2. Pinch Calculation (Thumb Tip to Index Tip)
        const rawPinch = euclideanDistance(thumbTip, indexTip);
        const normalizedPinch = rawPinch / handScale;

        // Map normalized pinch distance to 0..1 progress (0 = Assembled, 1 = Exploded)
        const { minPinchThreshold, maxPinchThreshold, smoothingAlpha, palmHoldDurationMs, triggerCooldownMs, sensitivity } = configRef.current;
        const clampedProgress = Math.max(
          0,
          Math.min(1, (normalizedPinch - minPinchThreshold) / (maxPinchThreshold - minPinchThreshold))
        );

        // Exponential Moving Average (EMA)
        const prevProgress = smoothedProgressRef.current;
        const smoothedProgress = prevProgress * (1 - smoothingAlpha) + clampedProgress * smoothingAlpha;
        smoothedProgressRef.current = smoothedProgress;

        // 3. Open Palm Detection (5 extended fingers)
        const isThumbExtended = euclideanDistance(thumbTip, wrist) > euclideanDistance(thumbIp, wrist) * 1.05;
        const isIndexExtended = euclideanDistance(indexTip, wrist) > euclideanDistance(indexPip, wrist) * 1.15;
        const isMiddleExtended = euclideanDistance(middleTip, wrist) > euclideanDistance(middlePip, wrist) * 1.15;
        const isRingExtended = euclideanDistance(ringTip, wrist) > euclideanDistance(ringPip, wrist) * 1.15;
        const isPinkyExtended = euclideanDistance(pinkyTip, wrist) > euclideanDistance(pinkyPip, wrist) * 1.15;
        const areFingersSpread = normalizedPinch > 0.42;

        const isOpenPalm =
          isThumbExtended &&
          isIndexExtended &&
          isMiddleExtended &&
          isRingExtended &&
          isPinkyExtended &&
          areFingersSpread;

        // 4. Stable Palm Hold Timer
        let palmHoldProgress = 0;

        if (isOpenPalm) {
          if (palmHoldStartTimeRef.current === null) {
            palmHoldStartTimeRef.current = now;
          }
          const elapsed = now - palmHoldStartTimeRef.current;
          palmHoldProgress = Math.min(1, elapsed / palmHoldDurationMs);

          if (
            palmHoldProgress >= 1 &&
            now - lastTriggerTimeRef.current > triggerCooldownMs
          ) {
            lastTriggerTimeRef.current = now;
            palmHoldStartTimeRef.current = null;
            if (onPalmOpenTrigger) {
              onPalmOpenTrigger();
            }
          }
        } else {
          palmHoldStartTimeRef.current = null;
          palmHoldProgress = 0;
        }

        const isPinching = normalizedPinch < minPinchThreshold + 0.15 * sensitivity;
        const currentGesture = isOpenPalm ? 'OPEN_PALM' : isPinching ? 'PINCH' : 'IDLE';

        // Feed directly into the ULTRON Gesture Dictionary recognizer & spatial pipeline
        gestureRecognizer.processLandmarks(rawLandmarks as LandmarkPoint[], handedness);

        setState(prev => ({
          ...prev,
          handDetected: true,
          handedness,
          isOpenPalm,
          palmHoldProgress,
          isPinching,
          rawPinchDistance: rawPinch,
          normalizedDistance: normalizedPinch,
          smoothedProgress,
          currentGesture,
          landmarks: rawLandmarks as LandmarkPoint[],
          error: null
        }));
      } else {
        palmHoldStartTimeRef.current = null;
        gestureRecognizer.processLandmarks(null);
        setState(prev => ({
          ...prev,
          handDetected: false,
          isOpenPalm: false,
          palmHoldProgress: 0,
          isPinching: false,
          landmarks: null
        }));
      }
    } catch (err) {
      console.warn('Frame detection error:', err);
    }

    if (isEnabledRef.current) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    }
  }, [onPalmOpenTrigger]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        await videoElementRef.current.play();
      }

      isEnabledRef.current = true;
      setState(prev => ({
        ...prev,
        isCameraActive: true,
        error: null
      }));

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setState(prev => ({
        ...prev,
        isCameraActive: false,
        error: 'Camera access denied or unavailable. Fallback scrubber & keyboard controls active.'
      }));
    }
  }, [processFrame]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    isEnabledRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setState(prev => ({
      ...prev,
      isCameraActive: false,
      handDetected: false,
      isOpenPalm: false,
      palmHoldProgress: 0,
      landmarks: null
    }));
  }, []);

  // Toggle debug skeleton
  const toggleDebugSkeleton = useCallback(() => {
    setState(prev => ({ ...prev, debugSkeleton: !prev.debugSkeleton }));
  }, []);

  // Manual Progress Setter for Fallback Controls (Scrubber, Mouse Wheel, Keyboard, Commands)
  const setManualProgress = useCallback((progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    smoothedProgressRef.current = clamped;
    setState(prev => ({
      ...prev,
      smoothedProgress: clamped
    }));
  }, []);

  // Sensitivity Controls
  const setSensitivity = useCallback((sensitivity: number) => {
    visionService.setSensitivity(sensitivity);
  }, []);

  const resetSensitivity = useCallback(() => {
    visionService.resetSensitivity();
  }, []);

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    state,
    videoElementRef,
    startCamera,
    stopCamera,
    toggleDebugSkeleton,
    setManualProgress,
    sensitivity: configRef.current.sensitivity,
    setSensitivity,
    resetSensitivity
  };
}
