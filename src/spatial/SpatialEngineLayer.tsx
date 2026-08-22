import React, { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, LineBasicMaterial, Vector3 } from 'three';
import { SpatialEngine } from './SpatialEngine';
import type { SpatialEntity } from './WorldModelSpatialBridge';

export function SpatialEngineLayer({ entities }: { entities: SpatialEntity[] }) {
  const engine = useMemo(() => new SpatialEngine(), []);
  const geometry = useMemo(() => new BufferGeometry(), []);
  const material = useMemo(() => new LineBasicMaterial({ color: '#9bdcff', transparent: true, opacity: 0.05, blending: AdditiveBlending }), []);
  const scratch = useMemo(() => new Vector3(), []);

  useEffect(() => {
    engine.setEntities(entities);
  }, [engine, entities]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(({ clock }, dt) => {
    engine.tick(clock.elapsedTime, dt);
    const vertices: number[] = [];
    const snapshot = engine.getSnapshot();

    for (const edge of snapshot.edges) {
      const source = edge.source === 'core' ? scratch.set(0, 0, 0) : engine.getNode(edge.source)?.position;
      const target = engine.getNode(edge.target)?.position;
      if (!source || !target) continue;
      vertices.push(source.x, source.y, source.z, target.x, target.y, target.z);
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.computeBoundingSphere();
    material.opacity = 0.025 + (Math.sin(clock.elapsedTime * 0.9) * 0.5 + 0.5) * 0.035;
  });

  return <lineSegments geometry={geometry} material={material} />;
}
