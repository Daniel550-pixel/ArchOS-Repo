import React, { useState, useEffect, useCallback } from 'react';
import { EXPERIENCES } from '../data/experiences';
import { ExperienceCard, ExperienceCommand, CommandLogEntry, CommandSource } from '../types';
import { useHandGestures } from '../hooks/useHandGestures';
import { commandBus } from '../services/commandBus';
import { Gallery } from './Gallery';
import { Experience } from './Experience';
import { GestureController } from './GestureController';
import { GrainOverlay } from './GrainOverlay';
import { UnifiedCommandPalette } from './UnifiedCommandPalette';
import { Terminal } from 'lucide-react';

export interface MotionFormExperienceModuleProps {
  initialExperienceId?: string;
  onExperienceChange?: (id: string | null) => void;
  onProgressChange?: (progress: number) => void;
  className?: string;
  showCommandBusTrigger?: boolean;
}

export const MotionFormExperienceModule: React.FC<MotionFormExperienceModuleProps> = ({
  initialExperienceId,
  onExperienceChange,
  onProgressChange,
  className = '',
  showCommandBusTrigger = true
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (initialExperienceId) {
      const foundIdx = EXPERIENCES.findIndex(e => e.id === initialExperienceId);
      if (foundIdx !== -1) return foundIdx;
    }
    return 0;
  });

  const [activeExperience, setActiveExperience] = useState<ExperienceCard | null>(() => {
    if (initialExperienceId) {
      return EXPERIENCES.find(e => e.id === initialExperienceId) || null;
    }
    return null;
  });

  const [commandLogs, setCommandLogs] = useState<CommandLogEntry[]>(() => commandBus.getHistory());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Stable Open Palm Trigger Callback (450ms hold)
  const handlePalmOpenTrigger = useCallback(() => {
    if (!activeExperience) {
      const selected = EXPERIENCES[activeIndex];
      if (selected) {
        commandBus.dispatch({ type: 'OPEN_EXPERIENCE', payload: { id: selected.id } }, 'gesture', 'Open Palm Hold (450ms)');
      }
    }
  }, [activeExperience, activeIndex]);

  // Hand Gestures Vision Engine
  const {
    state: gestureState,
    videoElementRef,
    startCamera,
    stopCamera,
    toggleDebugSkeleton,
    setManualProgress
  } = useHandGestures(handlePalmOpenTrigger);

  // Subscribe to the Unified Command Bus
  useEffect(() => {
    const unsubscribe = commandBus.subscribe((command: ExperienceCommand, source: CommandSource, rawText?: string) => {
      setCommandLogs(commandBus.getHistory());

      switch (command.type) {
        case 'OPEN_EXPERIENCE': {
          let targetExp = EXPERIENCES[activeIndex];
          if (command.payload?.id) {
            const found = EXPERIENCES.find(e => e.id === command.payload.id);
            if (found) targetExp = found;
          }
          if (targetExp) {
            setActiveExperience(targetExp);
            onExperienceChange?.(targetExp.id);
          }
          break;
        }

        case 'CLOSE_EXPERIENCE': {
          setActiveExperience(null);
          onExperienceChange?.(null);
          break;
        }

        case 'SELECT_EXPERIENCE': {
          const idx = EXPERIENCES.findIndex(e => e.id === command.payload.id);
          if (idx !== -1) {
            setActiveIndex(idx);
            if (activeExperience) {
              setActiveExperience(EXPERIENCES[idx]);
              onExperienceChange?.(EXPERIENCES[idx].id);
            }
          }
          break;
        }

        case 'NEXT_EXPERIENCE': {
          setActiveIndex(prev => (prev < EXPERIENCES.length - 1 ? prev + 1 : 0));
          break;
        }

        case 'PREV_EXPERIENCE': {
          setActiveIndex(prev => (prev > 0 ? prev - 1 : EXPERIENCES.length - 1));
          break;
        }

        case 'SET_PROGRESS': {
          setManualProgress(command.payload.value);
          onProgressChange?.(command.payload.value);
          break;
        }

        case 'RESET_EXPERIENCE': {
          setManualProgress(0);
          onProgressChange?.(0);
          break;
        }

        case 'ENABLE_GESTURES': {
          startCamera();
          break;
        }

        case 'DISABLE_GESTURES': {
          stopCamera();
          break;
        }

        case 'TOGGLE_DEBUG_SKELETON': {
          toggleDebugSkeleton();
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeIndex, activeExperience, onExperienceChange, onProgressChange, setManualProgress, startCamera, stopCamera, toggleDebugSkeleton]);

  // Sync gesture progress up to parent if callback is provided
  useEffect(() => {
    onProgressChange?.(gestureState.smoothedProgress);
  }, [gestureState.smoothedProgress, onProgressChange]);

  const handleOpenExperience = (exp: ExperienceCard) => {
    commandBus.dispatch({ type: 'OPEN_EXPERIENCE', payload: { id: exp.id } }, 'mouse');
  };

  const handleCloseExperience = () => {
    commandBus.dispatch({ type: 'CLOSE_EXPERIENCE' }, 'mouse');
  };

  const handleSelectIndex = (idx: number) => {
    setActiveIndex(idx);
    const exp = EXPERIENCES[idx];
    if (exp) {
      commandBus.dispatch({ type: 'SELECT_EXPERIENCE', payload: { id: exp.id } }, 'mouse');
    }
  };

  return (
    <div className={`relative w-full h-full bg-[#08080a] text-[#f5f4f0] overflow-hidden ${className}`}>
      {/* Subtle Film Grain Texture */}
      <GrainOverlay />

      {/* Main Experience View: Gallery Deck or Immersive Transformation Player */}
      {!activeExperience ? (
        <Gallery
          experiences={EXPERIENCES}
          activeIndex={activeIndex}
          onSelectIndex={handleSelectIndex}
          onOpenExperience={handleOpenExperience}
          gestureState={gestureState}
        />
      ) : (
        <Experience
          experience={activeExperience}
          gestureState={gestureState}
          onClose={handleCloseExperience}
          onManualProgressChange={setManualProgress}
        />
      )}

      {/* Optical Gesture Controller Monitor */}
      <GestureController
        gestureState={gestureState}
        videoElementRef={videoElementRef}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onToggleDebugSkeleton={toggleDebugSkeleton}
        isExperienceOpen={Boolean(activeExperience)}
      />

      {/* Unified Command Bus Trigger & Modal */}
      {showCommandBusTrigger && (
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          aria-label="Open Unified Command Bus"
          className="fixed bottom-6 left-6 z-40 bg-[#111115]/90 hover:bg-[#1a1a24] border border-[#f5f4f0]/10 text-[#8e8d88] hover:text-[#d4ff00] px-3 py-2 rounded-xs font-mono-tech text-[11px] flex items-center gap-2 backdrop-blur-md transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-[#d4ff00]" />
          <span>COMMAND BUS [{commandLogs.length}]</span>
        </button>
      )}

      <UnifiedCommandPalette
        commandLogs={commandLogs}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
