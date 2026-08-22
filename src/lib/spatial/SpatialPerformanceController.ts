// ArchOS spatial performance controller.
// Frame-time driven quality adaptation with no render-loop allocations.
export type SpatialQualityTier = 'ultra' | 'high' | 'balanced' | 'performance';

export interface SpatialPerformanceState {
  tier: SpatialQualityTier;
  targetFrameMs: number;
  frameMs: number;
  fps: number;
  resolutionScale: number;
  lodScale: number;
  effectsScale: number;
  stableFrames: number;
  degradedFrames: number;
}

const TIER_CONFIG: Record<SpatialQualityTier, readonly [number, number, number]> = {
  ultra: [1, 1, 1], high: [0.9, 0.85, 0.9], balanced: [0.78, 0.68, 0.75], performance: [0.62, 0.5, 0.55],
};

export class SpatialPerformanceController {
  private readonly state: SpatialPerformanceState = {
    tier: 'ultra', targetFrameMs: 1000 / 60, frameMs: 1000 / 60, fps: 60,
    resolutionScale: 1, lodScale: 1, effectsScale: 1, stableFrames: 0, degradedFrames: 0,
  };
  private accumulatorMs = 0;
  private sampleCount = 0;

  public update(frameMs: number): SpatialPerformanceState {
    this.accumulatorMs += Math.min(100, Math.max(1, frameMs));
    this.sampleCount++;
    if (this.sampleCount < 12) return this.state;

    const average = this.accumulatorMs / this.sampleCount;
    this.accumulatorMs = 0;
    this.sampleCount = 0;
    this.state.frameMs = this.state.frameMs * 0.8 + average * 0.2;
    this.state.fps = 1000 / this.state.frameMs;

    if (this.state.frameMs > this.state.targetFrameMs * 1.18) {
      this.state.degradedFrames++;
      this.state.stableFrames = 0;
      if (this.state.degradedFrames >= 3) { this.stepDown(); this.state.degradedFrames = 0; }
    } else if (this.state.frameMs < this.state.targetFrameMs * 0.88) {
      this.state.stableFrames++;
      this.state.degradedFrames = 0;
      if (this.state.stableFrames >= 8) { this.stepUp(); this.state.stableFrames = 0; }
    } else {
      this.state.stableFrames = 0;
      this.state.degradedFrames = 0;
    }
    return this.state;
  }

  public getState(): SpatialPerformanceState { return this.state; }

  public setTier(tier: SpatialQualityTier): void {
    this.state.tier = tier;
    this.applyTier();
    this.state.stableFrames = 0;
    this.state.degradedFrames = 0;
  }

  private stepDown(): void {
    if (this.state.tier === 'ultra') this.state.tier = 'high';
    else if (this.state.tier === 'high') this.state.tier = 'balanced';
    else if (this.state.tier === 'balanced') this.state.tier = 'performance';
    this.applyTier();
  }

  private stepUp(): void {
    if (this.state.tier === 'performance') this.state.tier = 'balanced';
    else if (this.state.tier === 'balanced') this.state.tier = 'high';
    else if (this.state.tier === 'high') this.state.tier = 'ultra';
    this.applyTier();
  }

  private applyTier(): void {
    const [resolutionScale, lodScale, effectsScale] = TIER_CONFIG[this.state.tier];
    this.state.resolutionScale = resolutionScale;
    this.state.lodScale = lodScale;
    this.state.effectsScale = effectsScale;
  }
}
