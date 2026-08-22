import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  LineBasicMaterial,
  Matrix4,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { SPATIAL_MODULES } from './SpatialRuntime';
import { SpatialEngine, type SpatialTemporalState } from './SpatialEngine';
import type { SpatialEntity } from './WorldModelSpatialBridge';

type SpatialEngineLayerProps = {
  entities: SpatialEntity[];
  temporalState?: SpatialTemporalState;
  temporalOffset?: number;
  onFocusChange?: (id: string | null) => void;
};

export function SpatialEngineLayer({
  entities,
  temporalState = 'current',
  temporalOffset = 0,
  onFocusChange,
}: SpatialEngineLayerProps) {
  const engine = useMemo(() => new SpatialEngine(), []);
  const geometry = useMemo(() => new BufferGeometry(), []);
  const material = useMemo(
    () =>
      new LineBasicMaterial({
        color: '#9bdcff',
        transparent: true,
        opacity: 0.04,
        blending: AdditiveBlending,
      }),
    [],
  );
  const focusGeometry = useMemo(() => new SphereGeometry(0.14, 16, 16), []);
  const focusMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.22,
        blending: AdditiveBlending,
      }),
    [],
  );
  const nodeGeometry = useMemo(() => new SphereGeometry(0.045, 8, 8), []);
  const nodeMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#dff7ff',
        transparent: true,
        opacity: 0.9,
        blending: AdditiveBlending,
      }),
    [],
  );
  const moduleMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#8fd8ff',
        transparent: true,
        opacity: 0.72,
        blending: AdditiveBlending,
      }),
    [],
  );

  const moduleRef = useRef<InstancedMesh>(null);
  const entityRef = useRef<InstancedMesh>(null);
  const focusRef = useRef<InstancedMesh>(null);
  const scratchSource = useMemo(() => new Vector3(), []);
  const scratchTarget = useMemo(() => new Vector3(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  const maxEdgesRef = useRef(0);

  const entityCapacity = Math.max(entities.length, 1);

  useEffect(() => {
    engine.setEntities(entities);
  }, [engine, entities]);

  useEffect(() => {
    engine.setTemporalState(temporalState, temporalOffset);
  }, [engine, temporalState, temporalOffset]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      focusGeometry.dispose();
      focusMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      moduleMaterial.dispose();
    },
    [geometry, material, focusGeometry, focusMaterial, nodeGeometry, nodeMaterial, moduleMaterial],
  );

  useFrame(({ clock, camera, size }, dt) => {
    engine.tick(clock.elapsedTime, dt, camera, size.height);
    const snapshot = engine.getSnapshot();
    const edges = snapshot.edges;

    // Allocate edge storage only when the graph grows. Reuse the same GPU buffer
    // for normal frames to avoid per-frame garbage collection and frame drops.
    if (edges.length > maxEdgesRef.current) {
      maxEdgesRef.current = Math.max(edges.length, Math.ceil(edges.length * 1.25));
      const attribute = new BufferAttribute(new Float32Array(maxEdgesRef.current * 6), 3);
      attribute.setUsage(DynamicDrawUsage);
      geometry.setAttribute('position', attribute);
    }

    const position = geometry.getAttribute('position') as BufferAttribute | undefined;
    if (position) {
      let cursor = 0;
      let weightedEdgeActivity = 0;

      for (const edge of edges) {
        const sourceNode = edge.source === 'core' ? null : engine.getNode(edge.source);
        const targetNode = engine.getNode(edge.target);
        if (!targetNode) continue;

        if (sourceNode) scratchSource.copy(sourceNode.position);
        else scratchSource.set(0, 0, 0);
        scratchTarget.copy(targetNode.position);

        position.setXYZ(cursor++, scratchSource.x, scratchSource.y, scratchSource.z);
        position.setXYZ(cursor++, scratchTarget.x, scratchTarget.y, scratchTarget.z);
        weightedEdgeActivity += edge.strength;
      }

      position.needsUpdate = true;
      geometry.setDrawRange(0, cursor);
      geometry.computeBoundingSphere();

      const activityAverage = weightedEdgeActivity / Math.max(1, edges.length);
      const activityPulse = Math.sin(clock.elapsedTime * 1.4) * 0.5 + 0.5;
      material.opacity = Math.min(
        0.16,
        0.018 + Math.min(0.12, activityAverage * 0.12) + activityPulse * 0.012,
      );
    }

    if (moduleRef.current) {
      const modules = snapshot.nodes.filter((node) => node.kind === 'module');
      modules.forEach((node, index) => {
        const pulse =
          1 +
          node.propagatedActivity * 0.65 +
          Math.sin(clock.elapsedTime * (1.2 + node.activity) + index) * 0.08;
        matrix.makeScale(pulse, pulse, pulse).setPosition(node.position);
        moduleRef.current!.setMatrixAt(index, matrix);
      });
      moduleRef.current.instanceMatrix.needsUpdate = true;
    }

    if (entityRef.current) {
      const entitiesOnly = snapshot.nodes.filter((node) => node.kind === 'entity');
      const visibleCount = Math.min(entitiesOnly.length, entityCapacity);

      for (let index = 0; index < visibleCount; index += 1) {
        const node = entitiesOnly[index];
        const lodScale = node.lod === 'full' ? 1 : node.lod === 'reduced' ? 0.72 : 0.42;
        const pulse =
          (0.45 + node.radius * 5 + node.propagatedActivity * 0.7) * lodScale +
          Math.sin(clock.elapsedTime * 2.2 + index) * 0.04;
        matrix.makeScale(pulse, pulse, pulse).setPosition(node.position);
        entityRef.current.setMatrixAt(index, matrix);
      }

      // Hide stale instances when the entity set shrinks.
      for (let index = visibleCount; index < entityCapacity; index += 1) {
        matrix.makeScale(0.0001, 0.0001, 0.0001).setPosition(0, 0, 0);
        entityRef.current.setMatrixAt(index, matrix);
      }
      entityRef.current.instanceMatrix.needsUpdate = true;
    }

    if (focusRef.current) {
      const focusId = engine.getFocusId();
      const focused = focusId ? engine.getNode(focusId) : undefined;

      if (focused) {
        const pulse = 1.5 + Math.sin(clock.elapsedTime * 3) * 0.25;
        matrix.makeScale(pulse, pulse, pulse).setPosition(focused.position);
        focusRef.current.setMatrixAt(0, matrix);
      } else {
        matrix.makeScale(0.0001, 0.0001, 0.0001).setPosition(0, 0, 0);
        focusRef.current.setMatrixAt(0, matrix);
      }
      focusRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <lineSegments geometry={geometry} material={material} frustumCulled={false} />
      <instancedMesh ref={focusRef} args={[focusGeometry, focusMaterial, 1]} frustumCulled={false} />
      <instancedMesh
        ref={moduleRef}
        args={[nodeGeometry, moduleMaterial, SPATIAL_MODULES.length]}
        frustumCulled={false}
      />
      <instancedMesh
        key={`entity-capacity-${entityCapacity}`}
        ref={entityRef}
        args={[nodeGeometry, nodeMaterial, entityCapacity]}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          const hit = event.instanceId;
          if (hit == null) return;
          const entity = entities[hit];
          if (!entity) return;

          const id = `entity:${entity.id}`;
          engine.setFocus(id);
          onFocusChange?.(entity.id);
        }}
      />
    </group>
  );
}
