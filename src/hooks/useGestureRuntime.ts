import { useSyncExternalStore } from 'react';
import {
  getGestureRuntimeSnapshot,
  subscribeGestureRuntime
} from '../services/spatial/GestureRuntime';

export function useGestureRuntime() {
  return useSyncExternalStore(
    subscribeGestureRuntime,
    getGestureRuntimeSnapshot,
    getGestureRuntimeSnapshot
  );
}
