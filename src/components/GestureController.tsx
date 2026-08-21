import React from 'react';
import { HandGestureState } from '../types';
import { CameraPreview } from './CameraPreview';

interface GestureControllerProps {
  gestureState: HandGestureState;
  videoElementRef: React.RefObject<HTMLVideoElement | null>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleDebugSkeleton?: () => void;
  isExperienceOpen: boolean;
  className?: string;
}

export const GestureController: React.FC<GestureControllerProps> = ({
  gestureState,
  videoElementRef,
  onStartCamera,
  onStopCamera,
  onToggleDebugSkeleton = () => {},
  isExperienceOpen,
  className = ''
}) => {
  return (
    <aside
      aria-label="Gesture Control Monitor"
      className={`fixed bottom-6 right-6 z-40 flex flex-col items-end transition-all ${className}`}
    >
      <CameraPreview
        gestureState={gestureState}
        videoElementRef={videoElementRef}
        onStartCamera={onStartCamera}
        onStopCamera={onStopCamera}
        onToggleDebugSkeleton={onToggleDebugSkeleton}
        isExperienceOpen={isExperienceOpen}
      />
    </aside>
  );
};
