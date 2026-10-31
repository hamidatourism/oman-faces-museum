import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { OmaniFigure } from '@/data/omaniFigures';
import {
  PAINTING_CENTER_Y,
  PAINTING_HEIGHT,
  PAINTING_WIDTH,
  paintingPlacement,
} from './museumLayout';
import { createPaintingTexture, createPlateTexture, toArabicDigits } from './textures';

const FRAME_PADDING = 0.22;
const FRAME_DEPTH = 0.1;
const CANVAS_OFFSET_Z = 0.06;
const PLATE_WIDTH = 1.1;
const PLATE_HEIGHT = 0.34;
const HOVER_SCALE = 1.03;

interface PaintingProps {
  figure: OmaniFigure;
  index: number;
  interactive: boolean;
  onSelect: () => void;
}

export default function Painting({ figure, index, interactive, onSelect }: PaintingProps) {
  const { side, x, z, rotationY } = paintingPlacement(index);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const paintingTexture = useMemo(() => createPaintingTexture(figure.name), [figure.name]);
  const plateTexture = useMemo(() => createPlateTexture(`اللوحة ${toArabicDigits(index + 1)}`), [index]);
  const spotTarget = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    return () => {
      paintingTexture.dispose();
      plateTexture.dispose();
    };
  }, [paintingTexture, plateTexture]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const targetScale = interactive && hovered ? HOVER_SCALE : 1;
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, targetScale, 8, delta));
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = '';
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    onSelect();
  };

  return (
    <>
      <group
        ref={groupRef}
        position={[x, PAINTING_CENTER_Y, z]}
        rotation={[0, rotationY, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <mesh>
          <boxGeometry args={[PAINTING_WIDTH + FRAME_PADDING, PAINTING_HEIGHT + FRAME_PADDING, FRAME_DEPTH]} />
          <meshStandardMaterial color="#c9a24d" metalness={1} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, CANVAS_OFFSET_Z]}>
          <planeGeometry args={[PAINTING_WIDTH, PAINTING_HEIGHT]} />
          <meshStandardMaterial map={paintingTexture} roughness={0.85} />
        </mesh>
        <mesh position={[0, -PAINTING_HEIGHT / 2 - 0.2 - PLATE_HEIGHT / 2, CANVAS_OFFSET_Z]}>
          <planeGeometry args={[PLATE_WIDTH, PLATE_HEIGHT]} />
          <meshStandardMaterial map={plateTexture} metalness={0.6} roughness={0.4} />
        </mesh>
        <primitive object={spotTarget} />
      </group>
      <spotLight
        position={[side * 3.1, 5.5, z + 1.2]}
        target={spotTarget}
        angle={0.42}
        penumbra={0.9}
        intensity={60}
        decay={2}
        color="#ffe2b0"
      />
    </>
  );
}
