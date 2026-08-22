import { useSyncExternalStore } from 'react';
import { commandBus } from '../commandBus';
import { gestureEngine } from './GestureEngine';
import { gestureRecognizer } from './GestureRecognizer';
import type { UltronGestureEvent } from './types';

export interface GestureRuntimeSnapshot {
  enabled: boolean;
  lastEvent: UltronGestureEvent | null;
  eventCount: number;
  lastEventAt: number;
}

const initialSnapshot: GestureRuntimeSnapshot = {
  enabled: true,
  lastEvent: null,
  eventCount: 0,
  lastEventAt: 0
};

let snapshot = initialSnapshot;
const listeners = new Set<() => void>();
let unsubscribeRecognizer: (() => void) | null = null;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function ensureInitialized(): void {
  if (unsubscribeRecognizer) return;

  // Keep the global GestureEngine alive for the application lifetime. Its
  // constructor binds the recognizer to the spatial raycaster, haptics and bus.
  void gestureEngine;

  unsubscribeRecognizer = gestureRecognizer.onGestureDetected((event) => {
    snapshot = {
      ...snapshot,
      lastEvent: event,
      eventCount: snapshot.eventCount + 1,
      lastEventAt: event.timestamp
    };
    emit();
  });
}

export function initializeGestureRuntime(): () => void {
  ensureInitialized();
  return () => undefined;
}

export function setGestureRuntimeEnabled(enabled: boolean): void {
  ensureInitialized();
  snapshot = { ...snapshot, enabled };
  commandBus.dispatch(
    { type: enabled ? 'ENABLE_GESTURES' : 'DISABLE_GESTURES' },
    'system'
  );
  emit();
}

export function getGestureRuntimeSnapshot(): GestureRuntimeSnapshot {
  ensureInitialized();
  return snapshot;
}

export function subscribeGestureRuntime(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGestureRuntime(): GestureRuntimeSnapshot {
  return useSyncExternalStore(
    subscribeGestureRuntime,
    getGestureRuntimeSnapshot,
    getGestureRuntimeSnapshot
  );
}
