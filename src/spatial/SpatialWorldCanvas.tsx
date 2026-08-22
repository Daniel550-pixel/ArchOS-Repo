import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import { SpatialWorldScene } from './SpatialWorldScene';
import './spatial-world.css';

function EngineTelemetry({ onFps }: { onFps: (fps: number) => void }) {
  const { gl } = useThree();
  const frames = useRef(0);
  const last = useRef(performance.now());
  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    gl.setAnimationLoop(null);
    return () => gl.setAnimationLoop(null);
  }, [gl]);
  useEffect(() => {
    let raf = 0;
    const sample = (now: number) => {
      frames.current += 1;
      if (now - last.current >= 1000) {
        onFps(Math.round(frames.current * 1000 / (now - last.current)));
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(sample);
    };
    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, [onFps]);
  return null;
}

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 4.8, 8.8);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

export function SpatialWorldCanvas({ onModuleSelect }: { onModuleSelect?: (id: string) => void }) {
  const [fps, setFps] = useState(60);
  const [quality, setQuality] = useState<'high' | 'balanced'>('high');
  const handleFps = useCallback((value: number) => {
    setFps(value);
    if (value < 45) setQuality('balanced');
    else if (value > 57) setQuality('high');
  }, []);
  const dpr: [number, number] = quality === 'high' ? [1, 2] : [1, 1.35];

  return <div className="spatial-world-canvas" aria-label="ArchOS 3D spatial world model">
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 4.8, 8.8], fov: 42, near: .1, far: 100 }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false, depth: true, logarithmicDepthBuffer: false }}
      frameloop="always"
      performance={{ min: .55, max: 1, debounce: 180 }}
      flat
      onCreated={({ gl }) => {
        gl.outputColorSpace = 'srgb';
        gl.toneMappingExposure = 1.08;
      }}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <EngineTelemetry onFps={handleFps} />
        <SpatialWorldScene onModuleSelect={onModuleSelect} />
        <OrbitControls enablePan={false} enableZoom minDistance={5.5} maxDistance={14} rotateSpeed={.24} zoomSpeed={.58} dampingFactor={.055} enableDamping target={[0, 0, 0]} />
        <Preload all />
      </Suspense>
    </Canvas>
    <div className="spatial-engine-hud" aria-hidden="true">
      <span>GPU SPATIAL ENGINE</span><i/>
      <strong>{fps} FPS</strong><i/>
      <span>{quality.toUpperCase()}</span>
    </div>
  </div>;
}
