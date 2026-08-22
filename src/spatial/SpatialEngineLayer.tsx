import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, LineBasicMaterial, Matrix4, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';
import { SpatialEngine, type SpatialTemporalState } from './SpatialEngine';
import type { SpatialEntity } from './WorldModelSpatialBridge';

type SpatialEngineLayerProps = {
  entities: SpatialEntity[];
  temporalState?: SpatialTemporalState;
  temporalOffset?: number;
  onFocusChange?: (id: string | null) => void;
};

export function SpatialEngineLayer({ entities, temporalState = 'current', temporalOffset = 0, onFocusChange }: SpatialEngineLayerProps) {
  const engine = useMemo(() => new SpatialEngine(), []);
  const geometry = useMemo(() => new BufferGeometry(), []);
  const material = useMemo(() => new LineBasicMaterial({ color: '#9bdcff', transparent: true, opacity: 0.05, blending: AdditiveBlending }), []);
  const nodeGeometry = useMemo(() => new SphereGeometry(0.045, 8, 8), []);
  const nodeMaterial = useMemo(() => new MeshBasicMaterial({ color: '#dff7ff', transparent: true, opacity: 0.9, blending: AdditiveBlending }), []);
  const moduleMaterial = useMemo(() => new MeshBasicMaterial({ color: '#8fd8ff', transparent: true, opacity: 0.72, blending: AdditiveBlending }), []);
  const moduleRef = useRef<THREE.InstancedMesh>(null);
  const entityRef = useRef<THREE.InstancedMesh>(null);
  const scratch = useMemo(() => new Vector3(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  const moduleCount = 15;

  useEffect(() => {
    engine.setEntities(entities);
  }, [engine, entities]);

  useEffect(() => {
    engine.setTemporalState(temporalState, temporalOffset);
  }, [engine, temporalState, temporalOffset]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
    nodeGeometry.dispose();
    nodeMaterial.dispose();
    moduleMaterial.dispose();
  }, [geometry, material, nodeGeometry, nodeMaterial, moduleMaterial]);

  useFrame(({ clock, camera, size }, dt) => {
    engine.tick(clock.elapsedTime, dt, camera, size.height);
    const snapshot = engine.getSnapshot();
    const vertices: number[] = [];

    for (const edge of snapshot.edges) {
      const source = edge.source === 'core' ? scratch.set(0, 0, 0) : engine.getNode(edge.source)?.position;
      const target = engine.getNode(edge.target)?.position;
      if (!source || !target) continue;
      vertices.push(source.x, source.y, source.z, target.x, target.y, target.z);
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3).setUsage(DynamicDrawUsage));
    geometry.computeBoundingSphere();
    material.opacity = 0.02 + (Math.sin(clock.elapsedTime * 0.9) * 0.5 + 0.5) * 0.035;

    if (moduleRef.current) {
      const modules = snapshot.nodes.filter((node) => node.kind === 'module');
      modules.forEach((node, index) => {
        const pulse = 1 + node.propagatedActivity * 0.65 + Math.sin(clock.elapsedTime * (1.2 + node.activity) + index) * 0.08;
        matrix.makeScale(pulse, pulse, pulse).setPosition(node.position);
        moduleRef.current!.setMatrixAt(index, matrix);
      });
      moduleRef.current.instanceMatrix.needsUpdate = true;
    }

    if (entityRef.current) {
      const entitiesOnly = snapshot.nodes.filter((node) => node.kind === 'entity');
      entitiesOnly.forEach((node, index) => {
        const pulse = 0.45 + node.radius * 5 + node.propagatedActivity * 0.7 + Math.sin(clock.elapsedTime * 2.2 + index) * 0.04;
        matrix.makeScale(pulse, pulse, pulse).setPosition(node.position);
        entityRef.current!.setMatrixAt(index, matrix);
      });
      entityRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const entityColor = new Color('#f3fbff');
  const moduleColor = new Color('#a9e7ff');

  return (
    <group>
      <lineSegments geometry={geometry} material={material} />
      <instancedMesh ref={moduleRef} args={[nodeGeometry, moduleMaterial, moduleCount]} frustumCulled={false}>
        <primitive attach="instanceColor" object={moduleColor} />
      </instancedMesh>
      <instancedMesh ref={entityRef} args={[nodeGeometry, nodeMaterial, Math.max(entities.length, 1)]} frustumCulled={false} onClick={(event) => {
        event.stopPropagation();
        const hit = event.instanceId;
        if (hit == null) return;
        const entity = entities[hit];
        if (entity) {
          engine.setFocus(`entity:${entity.id}`);
          onFocusChange?.(entity.id);
        }
      }}>
        <primitive attach="instanceColor" object={entityColor} />
      </instancedMesh>
    </group>
  );
}
