import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExperienceCard, HandGestureState } from '../types';
import { ProceduralExplodedCanvas } from './ProceduralExplodedCanvas';
import { ChevronLeft, ChevronRight, Hand, ArrowRight, CornerDownLeft } from 'lucide-react';

interface GalleryProps {
  experiences: ExperienceCard[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenExperience: (experience: ExperienceCard) => void;
  gestureState: HandGestureState;
}

export const Gallery: React.FC<GalleryProps> = ({
  experiences,
  activeIndex,
  onSelectIndex,
  onOpenExperience,
  gestureState
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const activeExp = experiences[activeIndex];

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      onSelectIndex(activeIndex - 1);
    } else {
      onSelectIndex(experiences.length - 1);
    }
  }, [activeIndex, experiences.length, onSelectIndex]);

  const handleNext = useCallback(() => {
    if (activeIndex < experiences.length - 1) {
      onSelectIndex(activeIndex + 1);
    } else {
      onSelectIndex(0);
    }
  }, [activeIndex, experiences.length, onSelectIndex]);

  // Keyboard navigation Left / Right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenExperience(activeExp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onOpenExperience, activeExp]);

  // Mouse & Touch Swipe Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragDeltaX(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragDeltaX(e.clientX - dragStartX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragDeltaX < -60) {
      handleNext();
    } else if (dragDeltaX > 60) {
      handlePrev();
    }
    setDragDeltaX(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragDeltaX(e.touches[0].clientX - dragStartX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragDeltaX < -50) {
      handleNext();
    } else if (dragDeltaX > 50) {
      handlePrev();
    }
    setDragDeltaX(0);
  };

  // Wheel / Trackpad Horizontal Scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 40) {
      if (e.deltaX > 0) handleNext();
      else handlePrev();
    }
  };

  return (
    <main
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="relative w-full h-screen bg-[#08080a] text-[#f5f4f0] flex flex-col justify-between overflow-hidden select-none technical-grid"
    >
      {/* Top Editorial Header */}
      <header className="relative z-20 px-8 py-7 flex items-center justify-between border-b border-[#f5f4f0]/08">
        <div className="flex items-center gap-5">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl tracking-tighter text-[#f5f4f0]">
              MOTION
            </span>
            <span className="font-mono-tech text-xs text-[#d4ff00] font-bold">/</span>
            <span className="font-display font-light text-2xl tracking-tight text-[#8e8d88]">
              FORM
            </span>
          </div>
          <span className="hidden md:inline-block font-mono-tech text-[10px] text-[#545350] border-l border-[#f5f4f0]/10 pl-4 tracking-wider uppercase">
            3D Exploded View Kinetic Archive
          </span>
        </div>

        {/* Index Position & Gesture Hint */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono-tech text-xs">
            <span className="text-[#d4ff00] font-bold">{activeExp.index}</span>
            <span className="text-[#545350]">/</span>
            <span className="text-[#8e8d88]">05</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#111115] border border-[#f5f4f0]/10 rounded-xs font-mono-tech text-[11px] text-[#8e8d88]">
            <Hand className="w-3.5 h-3.5 text-[#d4ff00]" />
            <span>Open palm to enter · Swipe/Keys to navigate</span>
          </div>
        </div>
      </header>

      {/* Main Carousel Area */}
      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-12 md:px-20 overflow-hidden">
        {/* Horizontal Sliding Cards Stage */}
        <div className="relative w-full max-w-6xl h-[66vh] max-h-[640px] flex items-center justify-center">
          {experiences.map((exp, idx) => {
            const offset = idx - activeIndex;
            const isCenter = offset === 0;
            const isNear = Math.abs(offset) === 1;

            // Transform matrix math for editorial deck presentation
            let translateX = offset * 92;
            if (offset < 0) translateX = offset * 86;
            if (offset > 0) translateX = offset * 86;

            const scale = isCenter ? 1 : 0.84;
            const opacity = isCenter ? 1 : isNear ? 0.35 : 0;
            const zIndex = isCenter ? 30 : 20 - Math.abs(offset);

            if (Math.abs(offset) > 2) return null;

            return (
              <div
                key={exp.id}
                onClick={() => {
                  if (isCenter) {
                    onOpenExperience(exp);
                  } else {
                    onSelectIndex(idx);
                  }
                }}
                style={{
                  transform: `translateX(calc(${translateX}% + ${dragDeltaX * 0.4}px)) scale(${scale})`,
                  opacity,
                  zIndex,
                  transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease'
                }}
                className={`absolute w-[86vw] max-w-[820px] h-full bg-[#111115] border ${
                  isCenter ? 'border-[#f5f4f0]/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]' : 'border-[#f5f4f0]/08'
                } rounded-xs flex flex-col overflow-hidden cursor-pointer group`}
              >
                {/* Card Top Meta Bar */}
                <div className="px-6 py-4 border-b border-[#f5f4f0]/08 flex items-center justify-between bg-[#08080a]/60 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tech text-xs font-bold text-[#d4ff00]">
                      {exp.index}
                    </span>
                    <span className="font-mono-tech text-[11px] tracking-wider uppercase text-[#8e8d88]">
                      {exp.category}
                    </span>
                  </div>
                  <span className="font-mono-tech text-[10px] text-[#545350] tracking-widest uppercase">
                    {exp.classification}
                  </span>
                </div>

                {/* Card Visual Body: Poster / Interactive 3D Canvas Preview */}
                <div className="relative flex-1 bg-[#0c0c10] overflow-hidden">
                  <ProceduralExplodedCanvas
                    experience={exp}
                    progress={isCenter ? 0.15 + (gestureState.isCameraActive ? gestureState.smoothedProgress * 0.4 : 0) : 0.05}
                    showLabels={isCenter}
                    className="w-full h-full"
                  />

                  {/* Active Card Palm Trigger Overlay when Open Palm is held */}
                  {isCenter && gestureState.isOpenPalm && (
                    <div className="absolute inset-0 bg-[#08080a]/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 transition-opacity">
                      <div className="relative w-20 h-20">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-[#f5f4f0]/20"
                            strokeWidth="2.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#d4ff00] transition-all duration-75"
                            strokeDasharray={`${gestureState.palmHoldProgress * 100}, 100`}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Hand className="w-7 h-7 text-[#d4ff00] animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center font-mono-tech">
                        <div className="text-sm font-bold text-[#f5f4f0] uppercase tracking-wider">
                          ENTERING TRANSFORMATION FILM
                        </div>
                        <div className="text-[11px] text-[#8e8d88] mt-0.5">
                          Hold palm steady · {Math.round(gestureState.palmHoldProgress * 450)}ms / 450ms
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hover Prompt on Center Card */}
                  {isCenter && !gestureState.isOpenPalm && (
                    <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-[#f5f4f0] text-[#08080a] font-mono-tech text-[10px] font-bold uppercase px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                        <span>Open Film</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Content Strip */}
                <div className="px-6 py-5 bg-[#111115] border-t border-[#f5f4f0]/08 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10">
                  <div>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#f5f4f0]">
                      {exp.title}
                    </h2>
                    <p className="text-sm text-[#8e8d88] italic font-serif mt-0.5">
                      “{exp.tagline}”
                    </p>
                  </div>

                  {/* Specs Quick Pill */}
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-4 text-[11px] font-mono-tech text-[#8e8d88] border border-[#f5f4f0]/10 px-3 py-1.5 bg-[#08080a]/50">
                      <span>{exp.specs[0].label}: <strong className="text-[#f5f4f0]">{exp.specs[0].value}</strong></span>
                      <span className="text-[#545350]">|</span>
                      <span>{exp.specs[1].label}: <strong className="text-[#f5f4f0]">{exp.specs[1].value}</strong></span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExperience(exp);
                      }}
                      className="px-4 py-2 bg-[#f5f4f0] hover:bg-[#d4ff00] text-[#08080a] font-mono-tech text-[11px] font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Buttons */}
        <button
          onClick={handlePrev}
          aria-label="Previous Transformation Film"
          className="absolute left-6 md:left-12 z-40 p-3 bg-[#111115]/80 hover:bg-[#1a1a22] border border-[#f5f4f0]/10 text-[#f5f4f0] transition-colors rounded-xs cursor-pointer group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Transformation Film"
          className="absolute right-6 md:right-12 z-40 p-3 bg-[#111115]/80 hover:bg-[#1a1a22] border border-[#f5f4f0]/10 text-[#f5f4f0] transition-colors rounded-xs cursor-pointer group"
        >
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Bottom Editorial Footer & Dot Indicators */}
      <footer className="relative z-20 px-8 py-6 border-t border-[#f5f4f0]/08 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#08080a]">
        <div className="flex items-center gap-2">
          {experiences.map((exp, idx) => (
            <button
              key={exp.id}
              onClick={() => onSelectIndex(idx)}
              className={`h-1.5 transition-all duration-300 rounded-xs cursor-pointer ${
                idx === activeIndex
                  ? 'w-8 bg-[#d4ff00]'
                  : 'w-2 bg-[#f5f4f0]/20 hover:bg-[#f5f4f0]/40'
              }`}
              title={`${exp.index} — ${exp.title}`}
            />
          ))}
        </div>

        <div className="font-mono-tech text-[11px] text-[#545350] flex items-center gap-4">
          <span>KEYBOARD: [← / →] NAVIGATE</span>
          <span>[SPACE / ENTER] OPEN</span>
          <span>[ESC] CLOSE</span>
        </div>
      </footer>
    </main>
  );
};
