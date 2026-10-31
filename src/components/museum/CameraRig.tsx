import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EYE_HEIGHT } from './museumLayout';
import { sampleOrientation, type WalkSegment } from './museumPath';

const STRIDE_LENGTH = 1.8;
const BOB_AMPLITUDE = 0.02;

interface CameraRigProps {
  segment: WalkSegment | null;
  onArrive: () => void;
}

interface Motion {
  segment: WalkSegment | null;
  startTime: number | null;
  arrived: boolean;
}

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export default function CameraRig({ segment, onArrive }: CameraRigProps) {
  const { camera } = useThree();
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;
  const motion = useRef<Motion>({ segment: null, startTime: null, arrived: true });

  useEffect(() => {
    motion.current = { segment, startTime: null, arrived: segment === null };
  }, [segment]);

  useFrame((state) => {
    const current = motion.current;
    const active = current.segment;
    if (!active || current.arrived) return;

    if (current.startTime === null) current.startTime = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - current.startTime;
    const t = active.duration > 0 ? Math.min(elapsed / active.duration, 1) : 1;
    const progress = easeInOutSine(t);

    active.curve.getPointAt(progress, camera.position);
    const bob = Math.sin((progress * active.length * 2 * Math.PI) / STRIDE_LENGTH) * BOB_AMPLITUDE;
    camera.position.y = EYE_HEIGHT + bob * Math.sin(progress * Math.PI);
    sampleOrientation(active.orientation, progress, camera.quaternion);

    if (t >= 1) {
      current.arrived = true;
      onArriveRef.current();
    }
  });

  return null;
}
