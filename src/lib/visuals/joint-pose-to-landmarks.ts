import type { Landmark } from "@mediapipe/tasks-vision";
import { getPoseKeyframes, type JointPose } from "./pose-joints";
import type { PoseLandmarkFrame } from "./mediapipe-pose-engine";

const IMG_W = 640;
const IMG_H = 480;

/** BlazePose landmark index shortcuts */
const LM = {
  nose: 0,
  lShoulder: 11,
  rShoulder: 12,
  lElbow: 13,
  rElbow: 14,
  lWrist: 15,
  rWrist: 16,
  lHip: 23,
  rHip: 24,
  lKnee: 25,
  rKnee: 26,
  lAnkle: 27,
  rAnkle: 28,
} as const;

type Vec3 = { x: number; y: number; z: number };

function rotateX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function rotateY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

function rotateZ(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
}

function applyEuler(v: Vec3, [rx, ry, rz]: [number, number, number]): Vec3 {
  return rotateZ(rotateY(rotateX(v, rx), ry), rz);
}

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function chain(base: Vec3, rot: [number, number, number], offset: Vec3): Vec3 {
  return add(base, applyEuler(offset, rot));
}

function limb(base: Vec3, upperRot: [number, number, number], lowerRot: [number, number, number], upperLen: number, lowerLen: number) {
  const joint = chain(base, upperRot, { x: 0, y: -upperLen, z: 0 });
  const end = chain(joint, lowerRot, { x: 0, y: -lowerLen, z: 0 });
  return { joint, end };
}

/** Forward kinematics: joint angles → approximate MediaPipe 33-point skeleton (world space). */
export function jointPoseToWorldLandmarks(pose: JointPose): Landmark[] {
  const root: Vec3 = {
    x: pose.rootShiftX ?? 0,
    y: pose.pelvisY,
    z: pose.rootShiftZ ?? 0,
  };

  const pelvis = root;
  const spine1 = chain(pelvis, [pose.spineRotX, 0, 0], { x: 0, y: 0.14, z: 0 });
  const chest = chain(spine1, [pose.chestRotX, 0, 0], { x: 0, y: 0.12, z: 0 });
  const neck = chain(chest, [0, 0, 0], { x: 0, y: 0.1, z: 0 });
  const head = chain(neck, [pose.headRotX, 0, 0], { x: 0, y: 0.12, z: 0 });

  const lShoulderBase = add(chest, { x: 0.16, y: 0.02, z: 0 });
  const rShoulderBase = add(chest, { x: -0.16, y: 0.02, z: 0 });
  const lArm = limb(lShoulderBase, pose.leftUpperArm, pose.leftForearm, 0.28, 0.26);
  const rArm = limb(rShoulderBase, pose.rightUpperArm, pose.rightForearm, 0.28, 0.26);

  const lHipBase = add(pelvis, { x: 0.1, y: -0.02, z: 0 });
  const rHipBase = add(pelvis, { x: -0.1, y: -0.02, z: 0 });
  const lLeg = limb(lHipBase, pose.leftThigh, pose.leftShin, 0.42, 0.42);
  const rLeg = limb(rHipBase, pose.rightThigh, pose.rightShin, 0.42, 0.42);

  const yaw = pose.rootRotY;
  const rotAll = (p: Vec3): Vec3 => rotateY(p, yaw);

  const points: Vec3[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));

  const set = (idx: number, p: Vec3) => {
    points[idx] = rotAll(p);
  };

  set(LM.nose, head);
  set(LM.lShoulder, lShoulderBase);
  set(LM.rShoulder, rShoulderBase);
  set(LM.lElbow, lArm.joint);
  set(LM.rElbow, rArm.joint);
  set(LM.lWrist, lArm.end);
  set(LM.rWrist, rArm.end);
  set(LM.lHip, lHipBase);
  set(LM.rHip, rHipBase);
  set(LM.lKnee, lLeg.joint);
  set(LM.rKnee, rLeg.joint);
  set(LM.lAnkle, lLeg.end);
  set(LM.rAnkle, rLeg.end);

  // Fill remaining landmarks by interpolation so Kalidokit receives 33 points.
  set(1, add(head, { x: 0, y: 0.03, z: 0 }));
  set(2, add(head, { x: -0.02, y: 0.02, z: 0 }));
  set(3, add(head, { x: 0.02, y: 0.02, z: 0 }));
  set(7, add(lArm.joint, { x: -0.04, y: 0.02, z: 0 }));
  set(8, add(rArm.joint, { x: 0.04, y: 0.02, z: 0 }));
  set(9, add(lArm.end, { x: -0.03, y: 0, z: 0 }));
  set(10, add(rArm.end, { x: 0.03, y: 0, z: 0 }));
  set(17, add(lArm.end, { x: -0.02, y: -0.04, z: 0 }));
  set(18, add(rArm.end, { x: 0.02, y: -0.04, z: 0 }));
  set(19, add(lArm.end, { x: -0.03, y: -0.05, z: 0 }));
  set(20, add(rArm.end, { x: 0.03, y: -0.05, z: 0 }));
  set(21, add(lArm.end, { x: -0.04, y: -0.05, z: 0 }));
  set(22, add(rArm.end, { x: 0.04, y: -0.05, z: 0 }));
  set(29, add(lLeg.end, { x: -0.04, y: -0.04, z: 0.02 }));
  set(30, add(rLeg.end, { x: 0.04, y: -0.04, z: 0.02 }));
  set(31, add(lLeg.end, { x: -0.05, y: -0.05, z: 0.03 }));
  set(32, add(rLeg.end, { x: 0.05, y: -0.05, z: 0.03 }));

  for (let i = 4; i <= 6; i++) set(i, add(neck, scale({ x: i === 4 ? -0.03 : i === 5 ? 0.03 : 0, y: 0.04, z: 0 }, 1)));
  set(23, lHipBase);
  set(24, rHipBase);

  return points.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z,
    visibility: 1,
  }));
}

function worldToNormalized(world: Landmark[]): Landmark[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of world) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const pad = 0.15;
  const spanX = Math.max(maxX - minX, 0.5);
  const spanY = Math.max(maxY - minY, 0.9);

  return world.map((p) => ({
    x: pad + ((p.x - minX) / spanX) * (1 - 2 * pad),
    y: pad + ((maxY - p.y) / spanY) * (1 - 2 * pad),
    z: p.z * 0.25,
    visibility: 1,
  }));
}

export function jointPoseToLandmarkFrame(pose: JointPose): PoseLandmarkFrame {
  const world = jointPoseToWorldLandmarks(pose);
  return {
    world,
    normalized: worldToNormalized(world),
    imageWidth: IMG_W,
    imageHeight: IMG_H,
  };
}

export function buildAnatomyGuidedStepFrames(poseKey: string): PoseLandmarkFrame[] {
  const keyframes = getPoseKeyframes(poseKey);
  return keyframes.map((pose) => jointPoseToLandmarkFrame(pose));
}
