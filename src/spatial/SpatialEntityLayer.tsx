import React, { useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import { AdditiveBlending, Color, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import type { SpatialEntity } from './WorldModelSpatialBridge';

function EntityNode({ entity, onSelect }: { entity: SpatialEntity; onSelect?: (entity: SpatialEntity) => void }) {
  const group = useRef<Group>(null!);
  const color = useMemo(() => {
    const palette: Record<SpatialEntity['kind'], string> = {
      city: '#ffcf83', facility: '#74d9ff', route: '#83aaff', event: '#ff91c8', agent: '#9dffcf', metric: '#d2a8ff', unknown: '#b8c4d5',
    };
    return new Color(palette[entity.kind]);
  }, [entity.kind]);
  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.2 + entity.id.length) * .08 * entity.activity;
    group.current.scale.setScalar(pulse);
  });
  return <group ref={group} position={entity.position}>
    <mesh onClick={(e) => { e.stopPropagation(); onSelect?.(entity); }}>
      <sphereGeometry args={[.045 + entity.activity * .035, 12, 12]}/>
      <meshBasicMaterial color={color} transparent opacity={.95} blending={AdditiveBlending}/>
    </mesh>
    <mesh scale={2.8 + entity.activity * 2}>
      <sphereGeometry args={[.06, 8, 8]}/>
      <meshBasicMaterial color={color} transparent opacity={.025} blending={AdditiveBlending}/>
    </mesh>
    <Text position={[0, .13, 0]} fontSize={.065} color="#c9d4e1" anchorX="center" anchorY="bottom" outlineWidth={.004} outlineColor="#000000">{entity.label}</Text>
  </group>;
}

export function SpatialEntityLayer({ entities, onSelect }: { entities: SpatialEntity[]; onSelect?: (entity: SpatialEntity) => void }) {
  return <group>{entities.map((entity) => <EntityNode key={entity.id} entity={entity} onSelect={onSelect}/>)}</group>;
}
