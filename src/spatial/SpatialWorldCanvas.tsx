import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SpatialWorldScene } from './SpatialWorldScene';
import './spatial-world.css';

export function SpatialWorldCanvas({onModuleSelect}:{onModuleSelect?:(id:string)=>void}){
  return <div className="spatial-world-canvas" aria-label="ArchOS 3D spatial world model">
    <Canvas
      dpr={[1,2]}
      camera={{position:[0,4.8,8.8],fov:42,near:.1,far:80}}
      gl={{antialias:false,powerPreference:'high-performance',alpha:false,stencil:false,depth:true}}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <SpatialWorldScene onModuleSelect={onModuleSelect}/>
        <OrbitControls enablePan={false} enableZoom={true} minDistance={6.2} maxDistance={13} rotateSpeed={.22} zoomSpeed={.55} target={[0,0,0]}/>
      </Suspense>
    </Canvas>
  </div>;
}
