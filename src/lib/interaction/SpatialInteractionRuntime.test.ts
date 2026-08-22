import { SpatialInteractionRuntime } from './SpatialInteractionRuntime';
import type { HandLandmark } from './HandControl';

const landmarks = (indexX: number, indexY: number, thumbX: number, thumbY: number): HandLandmark[] => {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
  points[8] = { x: indexX, y: indexY };
  points[4] = { x: thumbX, y: thumbY };
  return points;
};

const runtime = new SpatialInteractionRuntime();
runtime.setEnabled(true);

const first = runtime.updateLandmarks(landmarks(0.4, 0.5, 0.7, 0.7), 0.95, 1000);
if (!first.some((command) => command.type === 'SPATIAL_POINT')) {
  throw new Error('Expected SPATIAL_POINT from a confident hand update');
}

const pinch = runtime.updateLandmarks(landmarks(0.4, 0.5, 0.405, 0.505), 0.95, 1100);
if (!pinch.some((command) => command.type === 'SPATIAL_SELECT')) {
  throw new Error('Expected SPATIAL_SELECT when pinch begins');
}

runtime.setEnabled(false);
const disabled = runtime.updateLandmarks(landmarks(0.5, 0.5, 0.505, 0.505), 0.95, 1200);
if (disabled.some((command) => command.type === 'SPATIAL_POINT' || command.type === 'SPATIAL_SELECT')) {
  throw new Error('Disabled runtime must not emit active spatial commands');
}

console.log('SpatialInteractionRuntime smoke test passed');
