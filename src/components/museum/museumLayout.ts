export interface CameraStop {
  position: [number, number, number];
  look: [number, number, number];
}

export const EYE_HEIGHT = 1.65;
export const WALK_SPEED_METERS_PER_SECOND = 1.3;
export const HALL_HALF_WIDTH = 5;
export const WALL_INNER_X = 4.92;
export const PAINTING_WIDTH = 2.6;
export const PAINTING_HEIGHT = 3.4;
export const PAINTING_CENTER_Y = 2.3;
export const VIEW_DISTANCE = 4;
export const FIRST_PAINTING_Z = -7;
export const PAINTING_SPACING = 5;
export const ENTRANCE_STOP: CameraStop = {
  position: [0, EYE_HEIGHT, 9],
  look: [0, EYE_HEIGHT, 0],
};

export interface PaintingPlacement {
  side: -1 | 1;
  x: number;
  z: number;
  rotationY: number;
}

export function paintingPlacement(index: number): PaintingPlacement {
  const side = index % 2 === 0 ? -1 : 1;
  return {
    side,
    x: side * WALL_INNER_X,
    z: FIRST_PAINTING_Z - index * PAINTING_SPACING,
    rotationY: -side * (Math.PI / 2),
  };
}

export function paintingStop(index: number): CameraStop {
  const { side, z } = paintingPlacement(index);
  return {
    position: [side * (WALL_INNER_X - VIEW_DISTANCE), EYE_HEIGHT, z],
    look: [side * WALL_INNER_X, PAINTING_CENTER_Y, z],
  };
}

export const HALL_END_Z = -42;
export const HALL_START_Z = 4;
export const CEILING_HEIGHT = 6;
