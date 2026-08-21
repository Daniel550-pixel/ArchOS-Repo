/**
 * ArchOS City Sonification Engine
 * Translates live building & urban telemetry into an ambient, organic sonic instrument.
 * - Strain (MPa) -> Low bass resonant drone (Sine)
 * - Power (MW)   -> Mid harmonic carrier tone (Triangle)
 * - Accel (m/s²) -> High shimmer harmonic modulation
 */

let ctx: AudioContext | null = null;
let iv: NodeJS.Timeout | number | null = null;
let active = false;

export interface SonifyTelemetrySample {
  strain_mpa?: number;
  power_mw?: number;
  accel_ms2?: number;
  temperature?: number;
  vibration?: number;
}

export function isSonifying(): boolean {
  return active && ctx !== null && ctx.state !== 'closed';
}

export function startSonify(get: () => SonifyTelemetrySample | null | undefined): void {
  if (active) {
    stopSonify();
  }

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      console.warn('[Sonify] AudioContext not supported in this environment');
      return;
    }

    ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const master = ctx.createGain();
    master.gain.value = 0.04;
    master.connect(ctx.destination);

    const o1 = ctx.createOscillator();
    o1.type = 'sine';

    const o2 = ctx.createOscillator();
    o2.type = 'triangle';

    const g1 = ctx.createGain();
    g1.gain.value = 0.8;

    const g2 = ctx.createGain();
    g2.gain.value = 0.4;

    o1.connect(g1).connect(master);
    o2.connect(g2).connect(master);

    o1.start();
    o2.start();
    active = true;

    iv = setInterval(() => {
      const s = get();
      if (!s || !ctx || ctx.state === 'closed') return;

      const now = ctx.currentTime;
      // Strain -> bass drone (70Hz - 220Hz)
      const strain = s.strain_mpa ?? 140;
      o1.frequency.setTargetAtTime(70 + strain * 0.9, now, 0.3);

      // Power -> mid tone (200Hz - 600Hz)
      const power = s.power_mw ?? 8.2;
      o2.frequency.setTargetAtTime(200 + power * 22, now, 0.3);

      // Accel -> harmonic shimmer gain
      const accel = s.accel_ms2 ?? 0.012;
      g2.gain.setTargetAtTime(0.2 + accel * 12, now, 0.3);
    }, 400);
  } catch (e) {
    console.warn('[Sonify] Failed to start city sonification:', e);
    active = false;
  }
}

export function stopSonify(): void {
  if (iv) {
    clearInterval(iv as any);
    iv = null;
  }
  if (ctx && ctx.state !== 'closed') {
    try {
      ctx.close().catch(() => {});
    } catch {}
    ctx = null;
  }
  active = false;
}
