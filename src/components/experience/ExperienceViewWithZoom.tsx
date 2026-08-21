import React, { useState } from 'react';
import { ExperienceZoomController } from './ExperienceZoomController';

interface ExperienceViewWithZoomProps {
  children?: React.ReactNode;
}

export const ExperienceViewWithZoom: React.FC<ExperienceViewWithZoomProps> = ({ children }) => {
  const [zoom, setZoom] = useState(1);

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  return (
    <div className="w-full h-full bg-[#0a0e1a]">
      <ExperienceZoomController
        onZoomChange={handleZoomChange}
        initialZoom={1}
        minZoom={0.3}
        maxZoom={5}
        zoomSensitivity={1.5}
        className="w-full h-full"
        showControls={true}
      >
        {children || (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-mono text-[#00e5ff] mb-4">Experience View</h2>
              <p className="text-sm font-mono text-[#545460]">
                Pinch to zoom in/out
              </p>
              <p className="text-xs font-mono text-[#545460] mt-2">
                Current zoom: {(zoom * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </ExperienceZoomController>
    </div>
  );
};
