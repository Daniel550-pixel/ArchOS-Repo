import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaPipeHandSource, type MediaPipeHandSourceOptions } from './MediaPipeHandSource';
import { SpatialInteractionRuntime, type SpatialInteractionRuntimeOptions } from './SpatialInteractionRuntime';
import type { SpatialCommand } from './SpatialCommandBus';

export interface UseSpatialHandControlOptions extends SpatialInteractionRuntimeOptions {
  mediaPipe?: MediaPipeHandSourceOptions;
  enabled?: boolean;
}

/** React bridge for the native hand runtime. Keep rendering logic downstream of the command bus. */
export function useSpatialHandControl(options: UseSpatialHandControlOptions = {}) {
  const runtimeRef = useRef<SpatialInteractionRuntime | null>(null);
  const sourceRef = useRef<MediaPipeHandSource | null>(null);
  const [enabled, setEnabledState] = useState(options.enabled ?? false);
  const [lastCommand, setLastCommand] = useState<SpatialCommand | null>(null);

  if (!runtimeRef.current) {
    runtimeRef.current = new SpatialInteractionRuntime(options, undefined);
  }

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    runtimeRef.current?.setEnabled(value);
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current!;
    runtime.setEnabled(enabled);
    return runtime.subscribeAll(setLastCommand);
  }, [enabled]);

  const start = useCallback(async (video: HTMLVideoElement) => {
    const runtime = runtimeRef.current!;
    const source = new MediaPipeHandSource(options.mediaPipe);
    sourceRef.current = source;
    setEnabled(true);
    await source.start(video, (landmarks, confidence, timestamp) => {
      runtime.updateLandmarks(landmarks, confidence, timestamp);
    });
  }, [options.mediaPipe, setEnabled]);

  const stop = useCallback(() => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    runtimeRef.current?.reset();
  }, []);

  useEffect(() => () => {
    sourceRef.current?.close();
    runtimeRef.current?.bus.clear();
  }, []);

  return { runtime: runtimeRef.current, enabled, setEnabled, start, stop, lastCommand };
}
