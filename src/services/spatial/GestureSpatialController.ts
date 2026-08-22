import { spatialRaycaster } from './SpatialRaycaster';
import type { Vector3D, UltronGestureEvent } from './types';

export interface GestureSpatialState {
  hoveredEntityId: string | null;
  heldEntityId: string | null;
  pointer: { x: number; y: number };
  worldPoint: Vector3D | null;
  cameraOrbit: { yaw: number; pitch: number };
  cameraZoom: number;
  active: boolean;
}

const initialState: GestureSpatialState = {
  hoveredEntityId: null,
  heldEntityId: null,
  pointer: { x: 0.5, y: 0.5 },
  worldPoint: null,
  cameraOrbit: { yaw: 0, pitch: 0 },
  cameraZoom: 1,
  active: false
};

let state = initialState;
const listeners = new Set<(state: GestureSpatialState) => void>();

function publish(): void {
  listeners.forEach((listener) => listener(state));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class GestureSpatialController {
  public subscribe(listener: (state: GestureSpatialState) => void): () => void {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  }

  public getState(): GestureSpatialState {
    return state;
  }

  public process(event: UltronGestureEvent): void {
    if (event.position) {
      const x = clamp(event.position.x, 0, 1);
      const y = clamp(event.position.y, 0, 1);
      const ray = spatialRaycaster.screenToWorldRay(x, y);
      const hit = spatialRaycaster.castRay(ray);

      state = {
        ...state,
        pointer: { x, y },
        worldPoint: hit?.point ?? null,
        hoveredEntityId: hit?.entityId ?? state.hoveredEntityId
      };
    }

    switch (event.type) {
      case 'PINCH':
        state = {
          ...state,
          active: true,
          heldEntityId: state.hoveredEntityId
        };
        break;

      case 'FIST_CLOSE':
        state = {
          ...state,
          active: true,
          heldEntityId: state.hoveredEntityId
        };
        break;

      case 'FIST_OPEN':
        state = { ...state, active: false, heldEntityId: null };
        break;

      case 'PAN': {
        const dx = event.delta?.x ?? 0;
        const dy = event.delta?.y ?? 0;
        state = {
          ...state,
          active: true,
          cameraOrbit: {
            yaw: state.cameraOrbit.yaw + dx * 2.4,
            pitch: clamp(state.cameraOrbit.pitch + dy * 1.8, -1.25, 1.25)
          }
        };
        break;
      }

      case 'SCROLL': {
        const delta = event.delta?.y ?? 0;
        state = {
          ...state,
          cameraZoom: clamp(state.cameraZoom + delta * 0.8, 0.35, 3.5)
        };
        break;
      }

      case 'FLICK':
        state = { ...state, active: false, heldEntityId: null };
        break;

      case 'HOVER':
      case 'IDLE':
        break;
    }

    publish();
  }

  public reset(): void {
    state = initialState;
    publish();
  }
}

export const gestureSpatialController = new GestureSpatialController();
