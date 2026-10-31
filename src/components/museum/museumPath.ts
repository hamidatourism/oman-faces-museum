import * as THREE from 'three';
import {
  ENTRANCE_STOP,
  EYE_HEIGHT,
  WALK_SPEED_METERS_PER_SECOND,
  paintingPlacement,
  paintingStop,
} from './museumLayout';

export type Place = number | null;

export interface WalkRoute {
  from: Place;
  to: Place;
}

interface OrientationKey {
  at: number;
  rotation: THREE.Quaternion;
}

export interface WalkSegment {
  curve: THREE.CatmullRomCurve3;
  length: number;
  duration: number;
  orientation: OrientationKey[];
}

const ENTRANCE_INDEX = -1;
const INNER_ENTRANCE_Z = 2.5;
const RETREAT_SIDE_OFFSET = 0.25;
const RETREAT_BACK_DISTANCE = 1;
const MIN_DURATION_SECONDS = 1.5;
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Quaternion();
const TURN_AROUND = new THREE.Quaternion().setFromAxisAngle(UP, Math.PI);

function facing(eye: THREE.Vector3, target: THREE.Vector3) {
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye, target, UP));
}

function placePosition(place: Place) {
  const stop = place === null ? ENTRANCE_STOP : paintingStop(place);
  return new THREE.Vector3(...stop.position);
}

function placeView(place: Place) {
  const stop = place === null ? ENTRANCE_STOP : paintingStop(place);
  return facing(new THREE.Vector3(...stop.position), new THREE.Vector3(...stop.look));
}

function centerPoint(index: number) {
  return new THREE.Vector3(0, EYE_HEIGHT, paintingPlacement(index).z);
}

function innerEntrancePoint() {
  return new THREE.Vector3(0, EYE_HEIGHT, INNER_ENTRANCE_Z);
}

function retreatPoint(index: number) {
  const { side, z } = paintingPlacement(index);
  return new THREE.Vector3(side * RETREAT_SIDE_OFFSET, EYE_HEIGHT, z + RETREAT_BACK_DISTANCE);
}

export function buildWalkSegment(route: WalkRoute, instant: boolean): WalkSegment {
  const fromIndex = route.from ?? ENTRANCE_INDEX;
  const toIndex = route.to ?? ENTRANCE_INDEX;
  const step = toIndex > fromIndex ? 1 : -1;

  const points = [placePosition(route.from)];
  points.push(route.from === null ? innerEntrancePoint() : retreatPoint(route.from));

  const passed: number[] = [];
  for (let j = fromIndex + step; step > 0 ? j < toIndex : j > toIndex; j += step) {
    if (j >= 0) passed.push(j);
  }
  passed.forEach((j) => points.push(centerPoint(j)));

  if (route.from !== null && route.to !== null && passed.length === 0) {
    const middleZ = (paintingPlacement(route.from).z + paintingPlacement(route.to).z) / 2;
    points.push(new THREE.Vector3(0, EYE_HEIGHT, middleZ));
  }

  if (route.to === null) {
    points.push(innerEntrancePoint(), placePosition(null));
  } else {
    points.push(placePosition(route.to));
  }

  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const length = curve.getLength();
  const travelRotation = step > 0 ? FORWARD : TURN_AROUND;

  return {
    curve,
    length,
    duration: instant ? 0 : Math.max(MIN_DURATION_SECONDS, length / WALK_SPEED_METERS_PER_SECOND),
    orientation: [
      { at: 0, rotation: placeView(route.from) },
      { at: 0.25, rotation: travelRotation },
      { at: 0.75, rotation: travelRotation },
      { at: 1, rotation: placeView(route.to) },
    ],
  };
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

export function sampleOrientation(keys: OrientationKey[], progress: number, target: THREE.Quaternion) {
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (progress <= b.at) {
      const span = b.at - a.at;
      const blend = span > 0 ? smoothstep((progress - a.at) / span) : 1;
      return target.copy(a.rotation).slerp(b.rotation, blend);
    }
  }
  return target.copy(keys[keys.length - 1].rotation);
}
