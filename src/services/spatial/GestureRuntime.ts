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

  // GestureEngine binds the recognizer to spatial raycasting, haptics and the
  // unified command bus. Keep that singleton alive for the application lifetime.
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
