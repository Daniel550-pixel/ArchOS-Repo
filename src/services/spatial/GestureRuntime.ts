import { useSyncExternalStore } from 'react';
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

  // Importing the engine instantiates its command-bus integration. The explicit
  // reference above prevents tree-shaking from removing that runtime boundary.
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
  return () => {
    // The global recognizer/engine intentionally remain alive for the application
    // lifetime. This function only guarantees initialization for consumers.
  };
}

export function setGestureRuntimeEnabled(enabled: boolean): void {
  snapshot = { ...snapshot, enabled };
  if (!enabled) {
    gestureEngine.processGesture({
      type: 'IDLE',
      timestamp: performance.now(),
      confidence: 1,
      source: 'gesture'
    });
  }
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
