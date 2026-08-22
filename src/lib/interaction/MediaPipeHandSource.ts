import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import type { HandLandmark } from './HandControl';

export interface MediaPipeHandSourceOptions {
  wasmRoot?: string;
  modelAssetPath?: string;
  minHandDetectionConfidence?: number;
  minHandPresenceConfidence?: number;
  minTrackingConfidence?: number;
}

export type HandFrameCallback = (landmarks: HandLandmark[], confidence: number, timestamp: number) => void;

const DEFAULTS: Required<MediaPipeHandSourceOptions> = {
  wasmRoot: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm',
  modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  minHandDetectionConfidence: 0.65,
  minHandPresenceConfidence: 0.65,
  minTrackingConfidence: 0.65,
};

/** Browser-only MediaPipe adapter. It emits normalized landmarks and never owns UI state. */
export class MediaPipeHandSource {
  private readonly options: Required<MediaPipeHandSourceOptions>;
  private landmarker: HandLandmarker | null = null;
  private running = false;
  private animationFrame = 0;
  private video: HTMLVideoElement | null = null;

  constructor(options: MediaPipeHandSourceOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  async initialize(): Promise<void> {
    if (this.landmarker) return;
    const vision = await FilesetResolver.forVisionTasks(this.options.wasmRoot);
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: this.options.modelAssetPath },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: this.options.minHandDetectionConfidence,
      minHandPresenceConfidence: this.options.minHandPresenceConfidence,
      minTrackingConfidence: this.options.minTrackingConfidence,
    });
  }

  async start(video: HTMLVideoElement, onFrame: HandFrameCallback): Promise<void> {
    await this.initialize();
    if (!this.landmarker) throw new Error('HandLandmarker initialization failed');
    this.stop();
    this.video = video;
    this.running = true;

    const loop = () => {
      if (!this.running || !this.video || !this.landmarker) return;
      const now = performance.now();
      if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const result: HandLandmarkerResult = this.landmarker.detectForVideo(this.video, now);
        const landmarks = (result.landmarks?.[0] ?? []).map((point) => ({
          x: point.x,
          y: point.y,
          z: point.z,
        }));
        const confidence = result.handedness?.[0]?.[0]?.score ?? 0;
        onFrame(landmarks, confidence, now);
      }
      this.animationFrame = requestAnimationFrame(loop);
    };

    this.animationFrame = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this.video = null;
  }

  close(): void {
    this.stop();
    this.landmarker?.close();
    this.landmarker = null;
  }
}
