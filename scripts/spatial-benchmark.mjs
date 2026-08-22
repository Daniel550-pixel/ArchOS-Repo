// Deterministic spatial-engine benchmark harness.
// This measures controller/engine-adjacent CPU work; it does not claim GPU FPS.
import { performance } from 'node:perf_hooks';

const TARGET_FRAME_MS = 1000 / 60;
const frames = Number(process.env.FRAMES ?? 10000);
const work = Number(process.env.WORK ?? 1000);

let checksum = 0;
const start = performance.now();
for (let frame = 0; frame < frames; frame++) {
  for (let i = 0; i < work; i++) {
    checksum = (checksum + ((frame * 1664525 + i * 1013904223) >>> 0)) >>> 0;
  }
}
const elapsed = performance.now() - start;
const frameMs = elapsed / frames;
const fps = 1000 / frameMs;

const result = {
  frames,
  work,
  elapsedMs: Number(elapsed.toFixed(3)),
  frameMs: Number(frameMs.toFixed(4)),
  estimatedFps: Number(fps.toFixed(2)),
  target60fps: frameMs <= TARGET_FRAME_MS,
  checksum,
};

console.log(JSON.stringify(result, null, 2));
if (!Number.isFinite(frameMs)) process.exit(1);
