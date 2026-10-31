import { useMemo } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';
import {
  CEILING_HEIGHT,
  HALL_END_Z,
  HALL_HALF_WIDTH,
  HALL_START_Z,
} from './museumLayout';
import {
  createFloorTileTexture,
  createFriezeTexture,
  createPlateTexture,
  createWallStoneTexture,
} from './textures';

const HALL_LENGTH = HALL_START_Z - HALL_END_Z;
const HALL_CENTER_Z = (HALL_START_Z + HALL_END_Z) / 2;
const WALL_THICKNESS = 0.3;
const WALL_OUTER_X = HALL_HALF_WIDTH + WALL_THICKNESS / 2;
const ENTRANCE_HALF_WIDTH = 1.8;
const ENTRANCE_SPRING_Y = 3.2;
const ENTRANCE_FRAME_DEPTH = 0.22;
const FRIEZE_Y = 5.25;
const POINT_LIGHT_Z = [-10, -24, -38];

function buildArch(path: THREE.Path, halfWidth: number, springY: number) {
  path.moveTo(-halfWidth, 0);
  path.lineTo(-halfWidth, springY);
  path.absarc(0, springY, halfWidth, Math.PI, 0, true);
  path.lineTo(halfWidth, 0);
}

export default function MuseumHall() {
  const wallTexture = useMemo(() => createWallStoneTexture(HALL_LENGTH / 1.4, CEILING_HEIGHT / 1.4), []);
  const endWallTexture = useMemo(() => createWallStoneTexture(8, CEILING_HEIGHT / 1.4), []);
  const entranceTexture = useMemo(() => createWallStoneTexture(0.7, 0.7), []);
  const floorTexture = useMemo(() => createFloorTileTexture(4, HALL_LENGTH / 2.5), []);
  const friezeTexture = useMemo(() => createFriezeTexture(), []);
  const signTexture = useMemo(() => createPlateTexture('وجوه من عُمان', 64), []);

  const entranceShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-HALL_HALF_WIDTH, 0);
    shape.lineTo(HALL_HALF_WIDTH, 0);
    shape.lineTo(HALL_HALF_WIDTH, CEILING_HEIGHT);
    shape.lineTo(-HALL_HALF_WIDTH, CEILING_HEIGHT);
    shape.closePath();
    const opening = new THREE.Path();
    buildArch(opening, ENTRANCE_HALF_WIDTH, ENTRANCE_SPRING_Y);
    shape.holes.push(opening);
    return shape;
  }, []);

  const entranceFrameGeometry = useMemo(() => {
    const outer = new THREE.Shape();
    buildArch(outer, ENTRANCE_HALF_WIDTH + ENTRANCE_FRAME_DEPTH * 2, ENTRANCE_SPRING_Y);
    const inner = new THREE.Path();
    buildArch(inner, ENTRANCE_HALF_WIDTH, ENTRANCE_SPRING_Y);
    outer.holes.push(inner);
    return new THREE.ExtrudeGeometry(outer, { depth: ENTRANCE_FRAME_DEPTH, bevelEnabled: false, curveSegments: 32 });
  }, []);

  return (
    <group>
      <ambientLight intensity={0.35} color="#ffe9c9" />
      <hemisphereLight args={['#fff1d6', '#3a2a18', 0.4]} />
      {POINT_LIGHT_Z.map((z) => (
        <pointLight key={z} position={[0, CEILING_HEIGHT - 0.6, z]} intensity={18} distance={16} decay={2} color="#ffd9a0" />
      ))}

      <mesh position={[0, 0, HALL_START_Z]}>
        <shapeGeometry args={[entranceShape]} />
        <meshStandardMaterial map={entranceTexture} roughness={0.92} />
      </mesh>
      <mesh geometry={entranceFrameGeometry} position={[0, 0, HALL_START_Z - 0.1]}>
        <meshStandardMaterial color="#c9a24d" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0, CEILING_HEIGHT - 0.3, HALL_START_Z + 0.02]}>
        <planeGeometry args={[2, 0.625]} />
        <meshStandardMaterial map={signTexture} metalness={0.5} roughness={0.45} />
      </mesh>

      <mesh position={[-WALL_OUTER_X, CEILING_HEIGHT / 2, HALL_CENTER_Z]}>
        <boxGeometry args={[WALL_THICKNESS, CEILING_HEIGHT, HALL_LENGTH]} />
        <meshStandardMaterial map={wallTexture} roughness={0.92} />
      </mesh>
      <mesh position={[WALL_OUTER_X, CEILING_HEIGHT / 2, HALL_CENTER_Z]}>
        <boxGeometry args={[WALL_THICKNESS, CEILING_HEIGHT, HALL_LENGTH]} />
        <meshStandardMaterial map={wallTexture} roughness={0.92} />
      </mesh>
      <mesh position={[0, CEILING_HEIGHT / 2, HALL_END_Z - WALL_THICKNESS / 2]}>
        <boxGeometry args={[HALL_HALF_WIDTH * 2 + WALL_THICKNESS * 2, CEILING_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial map={endWallTexture} roughness={0.92} />
      </mesh>

      <mesh position={[0, 0, HALL_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALL_HALF_WIDTH * 2, HALL_LENGTH]} />
        <MeshReflectorMaterial
          map={floorTexture}
          color="#d8c7a8"
          blur={[400, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={25}
          mixContrast={1}
          roughness={0.85}
          metalness={0.2}
          depthScale={0.8}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.2}
          mirror={0.35}
        />
      </mesh>

      <mesh position={[0, CEILING_HEIGHT, HALL_CENTER_Z]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALL_HALF_WIDTH * 2, HALL_LENGTH]} />
        <meshStandardMaterial color="#3b2e20" roughness={1} />
      </mesh>
      {[-4.55, 4.55].map((x) => (
        <mesh key={x} position={[x, CEILING_HEIGHT - 0.08, HALL_CENTER_Z]}>
          <boxGeometry args={[0.22, 0.1, HALL_LENGTH]} />
          <meshStandardMaterial color="#f5d38f" emissive="#f5d38f" emissiveIntensity={1.6} />
        </mesh>
      ))}

      <mesh position={[-(HALL_HALF_WIDTH - 0.06), FRIEZE_Y, HALL_CENTER_Z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[HALL_LENGTH, 0.5]} />
        <meshStandardMaterial map={friezeTexture} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[HALL_HALF_WIDTH - 0.06, FRIEZE_Y, HALL_CENTER_Z]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[HALL_LENGTH, 0.5]} />
        <meshStandardMaterial map={friezeTexture} roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}
