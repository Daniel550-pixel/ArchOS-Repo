import type { SpatialQualityTier } from './SpatialRuntime';

export interface FrameQualityState {
  tier: SpatialQualityTier;
  renderScale: number;
  lodBias: number;
  effectsScale: number;
  frameMs: number;
}

const ORDER: SpatialQualityTier[] = ['performance', 'balanced', 'high', 'ultra'];
const PRESETS: Record<SpatialQualityTier, Omit<FrameQualityState, 'frameMs'>> = {
  ultra: { tier: 'ultra', renderScale: 1, lodBias: 0, effectsScale: 1 },
  high: { tier: 'high', renderScale: 0.9, lodBias: 0.15, effectsScale: 0.85 },
  balanced: { tier: 'balanced', renderScale: 0.78, lodBias: 0.35, effectsScale: 0.65 },
  performance: { tier: 'performance', renderScale: 0.65, lodBias: 0.6, effectsScale: 0.45 },
};

/** Frame-time governor with hysteresis. It changes quality slowly to avoid oscillation. */
export class FrameQualityController {
  private tier: SpatialQualityTier;
  private overBudget = 0;
  private underBudget = 0;
  private lastFrameMs = 1000 / 60;

  constructor(initialTier: SpatialQualityTier = 'high') {
    this.tier = initialTier;
  }

  sample(frameMs: number): FrameQualityState {
    this.lastFrameMs = Math.max(0.1, frameMs);
    const target = 1000 / 60;

    if (frameMs > target * 1.12) {
      this.overBudget++;
      this.underBudget = 0;
    } else if (frameMs < target * 0.82) {
      this.underBudget++;
      this.overBudget = 0;
    } else {
      this.overBudget = Math.max(0, this.overBudget - 1);
      this.underBudget = Math.max(0, this.underBudget - 1);
    }

    if (this.overBudget >= 12) {
      this.setTierByStep(-1);
      this.overBudget = 0;
    } else if (this.underBudget >= 90) {
      this.setTierByStep(1);
      this.underBudget = 0;
    }

    return { ...PRESETS[this.tier], frameMs: this.lastFrameMs };
  }

  getState(): FrameQualityState {
    return { ...PRESETS[this.tier], frameMs: this.lastFrameMs };
  }

  private setTierByStep(step: number): void {
    const index = ORDER.indexOf(this.tier);
    const next = Math.max(0, Math.min(ORDER.length - 1, index + step));
    this.tier = ORDER[next];
  }
}
