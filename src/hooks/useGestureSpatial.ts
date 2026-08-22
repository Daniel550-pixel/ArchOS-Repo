import { useSyncExternalStore } from 'react';
import {
  gestureSpatialController,
  type GestureSpatialState
} from '../services/spatial/GestureSpatialController';

export function useGestureSpatial(): GestureSpatialState {
  return useSyncExternalStore(
    (listener) => gestureSpatialController.subscribe(() => listener()),
    () => gestureSpatialController.getState(),
    () => gestureSpatialController.getState()
  );
}
