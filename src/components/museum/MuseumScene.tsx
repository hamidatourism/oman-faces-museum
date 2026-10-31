import { Canvas } from '@react-three/fiber';
import { OMANI_FIGURES } from '@/data/omaniFigures';
import CameraRig from './CameraRig';
import MuseumHall from './MuseumHall';
import Painting from './Painting';
import { ENTRANCE_STOP } from './museumLayout';
import type { WalkSegment } from './museumPath';

const BACKGROUND_COLOR = '#120d08';

function isWebGLAvailable() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

interface MuseumSceneProps {
  segment: WalkSegment | null;
  interactiveIndex: number | null;
  onArrive: () => void;
  onSelectPainting: (index: number) => void;
}

export default function MuseumScene({
  segment,
  interactiveIndex,
  onArrive,
  onSelectPainting,
}: MuseumSceneProps) {
  if (!isWebGLAvailable()) {
    throw new Error('WebGL is not available in this browser');
  }

  return (
    <div className="fixed inset-0">
      <Canvas
        camera={{ position: ENTRANCE_STOP.position, fov: 55, near: 0.1, far: 120 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={[BACKGROUND_COLOR]} />
        <fog attach="fog" args={[BACKGROUND_COLOR, 14, 46]} />
        <MuseumHall />
        {OMANI_FIGURES.map((figure, index) => (
          <Painting
            key={figure.id}
            figure={figure}
            index={index}
            interactive={interactiveIndex === index}
            onSelect={() => onSelectPainting(index)}
          />
        ))}
        <CameraRig segment={segment} onArrive={onArrive} />
      </Canvas>
    </div>
  );
}
