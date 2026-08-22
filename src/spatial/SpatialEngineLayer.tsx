import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, InstancedMesh, LineBasicMaterial, Matrix4, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';
import { SPATIAL_MODULES } from './SpatialRuntime';
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
  const material = useMemo(() => new LineBasicMaterial({ color: '#9bdcff', transparent: true, opacity: 0.04, blending: AdditiveBlending }), []);
  const focusGeometry = useMemo(() => new SphereGeometry(0.14, 16, 16), []);
  const focusMaterial = useMemo(() => new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, blending: AdditiveBlending }), []);
  const nodeGeometry = useMemo(() => new SphereGeometry(0.045, 8, 8), []);
  const nodeMaterial = useMemo(() => new MeshBasicMaterial({ color: '#dff7ff', transparent: true, opacity: 0.9, blending: AdditiveBlending }), []);
  const moduleMaterial = useMemo(() => new MeshBasicMaterial({ color: '#8fd8ff', transparent: true, opacity: 0.72, blending: AdditiveBlending }), []);
  const moduleRef = useRef<InstancedMesh>(null);
  const entityRef = useRef<InstancedMesh>(null);
  const focusRef = useRef<InstancedMesh>(null);
  const scratch = useMemo(() => new Vector3(), []);
  const matrix = useMemo(() => new Matrix4(), []);

  useEffect(() => {
    engine.setEntities(entities);
  }, [engine, entities]);

  useEffect(() => {
    engine.setTemporalState(temporalState, temporalOffset);
  }, [engine, temporalState, temporalOffset]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
    focusGeometry.dispose();
    focusMaterial.dispose();
    nodeGeometry.dispose();
    nodeMaterial.dispose();
    moduleMaterial.dispose();
  }, [geometry, material, focusGeometry, focusMaterial, nodeGeometry, nodeMaterial, moduleMaterial]);

  useFrame(({ clock, camera, size }, dt) => {
    engine.tick(clock.elapsedTime, dt, camera, size.height);
    const snapshot = engine.getSnapshot();
    const vertices: number[] = [];
    let weightedEdgeActivity = 0;

    for (const edge of snapshot.edges) {
      const source = edge.source === 'core' ? scratch.set(0, 0, 0) : engine.getNode(edge.source)?.position;
      const target = engine.getNode(edge.target)?.position;
      if (!source || !target) continue;
      vertices.push(source.x, source.y, source.z, target.x, target.y, target.z);
      weightedEdgeActivity += edge.strength;
    }

    const position = geometry.getAttribute('position');
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3).setUsage(DynamicDrawUsage));
    if (position) position.needsUpdate = true;
    geometry.computeBoundingSphere();
    const activityPulse = Math.sin(clock.elapsedTime * 1.4) * 0.5 + 0.5;
    material.opacity = Math.min(0.16, 0.018 + Math.min(0.12, weightedEdgeActivity / Math.max(1, snapshot.edges.length) * 0.12) + activityPulse * 0.012);

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
        const lodScale = node.lod === 'full' ? 1 : node.lod === 'reduced' ? 0.72 : 0.42;
        const pulse = (0.45 + node.radius * 5 + node.propagatedActivity * 0.7) * lodScale + Math.sin(clock.elapsedTime * 2.2 + index) * 0.04;
        matrix.makeScale(pulse, pulse, pulse).setPosition(node.position);
        entityRef.current!.setMatrixAt(index, matrix);
      });
      entityRef.current.instanceMatrix.needsUpdate = true;
    }

    if (focusRef.current) {
      const focusIndex = snapshot.nodes.findIndex((node) => node.id === snapshot.metrics.focusedNode);
      if (focusIndex >= 0) {
        const focused = snapshot.nodes[focusIndex];
        const pulse = 1.5 + Math.sin(clock.elapsedTime * 3) * 0.25;
        matrix.makeScale(pulse, pulse, pulse).setPosition(focused.position);
        focusRef.current.setMatrixAt(0, matrix);
        focusRef.current.instanceMatrix.needsUpdate = true;
      } else {
        matrix.makeScale(0.0001, 0.0001, 0.0001).setPosition(0, 0, 0);
        focusRef.current.setMatrixAt(0, matrix);
        focusRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <lineSegments geometry={geometry} material={material} frustumCulled={false} />
      <instancedMesh ref={focusRef} args={[focusGeometry, focusMaterial, 1]} frustumCulled={false} />
      <instancedMesh ref={moduleRef} args={[nodeGeometry, moduleMaterial, SPATIAL_MODULES.length]} frustumCulled={false} />
      <instancedMesh
        ref={entityRef}
        args={[nodeGeometry, nodeMaterial, Math.max(entities.length, 1)]}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          const hit = event.instanceId;
          if (hit == null) return;
          const entity = entities[hit];
          if (entity) {
            const id = `entity:${entity.id}`;
            engine.setFocus(id);
            onFocusChange?.(entity.id);
          }
        }}
      />
    </group>
  );
}
