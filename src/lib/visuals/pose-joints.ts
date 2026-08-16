/** Joint angles (radians) for procedural 3D yoga avatar. Euler order: XYZ on each limb group. */
export type Vec3 = [number, number, number];

export interface JointPose {
  pelvisY: number;
  rootRotY: number;
  spineRotX: number;
  chestRotX: number;
  headRotX: number;
  leftUpperArm: Vec3;
  leftForearm: Vec3;
  rightUpperArm: Vec3;
  rightForearm: Vec3;
  leftThigh: Vec3;
  leftShin: Vec3;
  rightThigh: Vec3;
  rightShin: Vec3;
  /** Optional offset for asymmetrical poses */
  rootShiftX?: number;
  rootShiftZ?: number;
}

export function lerpPose(a: JointPose, b: JointPose, t: number): JointPose {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  const lerpV = (va: Vec3, vb: Vec3): Vec3 => [
    lerp(va[0], vb[0]),
    lerp(va[1], vb[1]),
    lerp(va[2], vb[2]),
  ];

  return {
    pelvisY: lerp(a.pelvisY, b.pelvisY),
    rootRotY: lerp(a.rootRotY, b.rootRotY),
    spineRotX: lerp(a.spineRotX, b.spineRotX),
    chestRotX: lerp(a.chestRotX, b.chestRotX),
    headRotX: lerp(a.headRotX, b.headRotX),
    leftUpperArm: lerpV(a.leftUpperArm, b.leftUpperArm),
    leftForearm: lerpV(a.leftForearm, b.leftForearm),
    rightUpperArm: lerpV(a.rightUpperArm, b.rightUpperArm),
    rightForearm: lerpV(a.rightForearm, b.rightForearm),
    leftThigh: lerpV(a.leftThigh, b.leftThigh),
    leftShin: lerpV(a.leftShin, b.leftShin),
    rightThigh: lerpV(a.rightThigh, b.rightThigh),
    rightShin: lerpV(a.rightShin, b.rightShin),
    rootShiftX: lerp(a.rootShiftX ?? 0, b.rootShiftX ?? 0),
    rootShiftZ: lerp(a.rootShiftZ ?? 0, b.rootShiftZ ?? 0),
  };
}

const stand: JointPose = {
  pelvisY: 1.0,
  rootRotY: 0,
  spineRotX: 0,
  chestRotX: 0,
  headRotX: 0,
  leftUpperArm: [0.15, 0, 0.1],
  leftForearm: [0.2, 0, 0],
  rightUpperArm: [-0.15, 0, -0.1],
  rightForearm: [0.2, 0, 0],
  leftThigh: [0.05, 0, 0],
  leftShin: [0.05, 0, 0],
  rightThigh: [-0.05, 0, 0],
  rightShin: [0.05, 0, 0],
};

/** Four keyframes per pose: prepare → enter → hold → refine */
export const POSE_3D_KEYFRAMES: Record<string, JointPose[]> = {
  siddhasana: [
    { ...stand, pelvisY: 0.35, leftThigh: [1.2, 0.3, 0.5], rightThigh: [1.0, -0.2, -0.4], leftShin: [0.3, 0.5, 0.8], rightShin: [0.2, -0.3, -0.6], leftUpperArm: [0.3, 0.2, 0.4], rightUpperArm: [-0.3, -0.2, -0.4], leftForearm: [0.4, 0, 0], rightForearm: [0.4, 0, 0] },
    { ...stand, pelvisY: 0.32, leftThigh: [1.35, 0.35, 0.55], rightThigh: [1.15, -0.25, -0.45], leftShin: [0.35, 0.55, 0.85], rightShin: [0.25, -0.35, -0.65], spineRotX: 0.05, leftUpperArm: [0.35, 0.15, 0.35], rightUpperArm: [-0.35, -0.15, -0.35] },
    { ...stand, pelvisY: 0.3, leftThigh: [1.4, 0.4, 0.6], rightThigh: [1.2, -0.3, -0.5], leftShin: [0.4, 0.6, 0.9], rightShin: [0.3, -0.4, -0.7], spineRotX: 0.08, headRotX: -0.05, leftUpperArm: [0.4, 0.1, 0.3], rightUpperArm: [-0.4, -0.1, -0.3], leftForearm: [0.5, 0, 0], rightForearm: [0.5, 0, 0] },
    { ...stand, pelvisY: 0.28, leftThigh: [1.45, 0.42, 0.62], rightThigh: [1.22, -0.32, -0.52], leftShin: [0.42, 0.62, 0.92], rightShin: [0.32, -0.42, -0.72], spineRotX: 0.1, headRotX: -0.08, leftUpperArm: [0.42, 0.08, 0.28], rightUpperArm: [-0.42, -0.08, -0.28] },
  ],
  vajrasana: [
    { ...stand, pelvisY: 0.55, leftThigh: [-1.45, 0.1, 0], rightThigh: [-1.45, -0.1, 0], leftShin: [1.35, 0.1, 0], rightShin: [1.35, -0.1, 0] },
    { ...stand, pelvisY: 0.48, leftThigh: [-1.55, 0.08, 0], rightThigh: [-1.55, -0.08, 0], leftShin: [1.45, 0.08, 0], rightShin: [1.45, -0.08, 0], spineRotX: 0.05 },
    { ...stand, pelvisY: 0.42, leftThigh: [-1.6, 0.05, 0], rightThigh: [-1.6, -0.05, 0], leftShin: [1.5, 0.05, 0], rightShin: [1.5, -0.05, 0], spineRotX: 0.08, leftUpperArm: [0.2, 0, 0.3], rightUpperArm: [-0.2, 0, -0.3] },
    { ...stand, pelvisY: 0.4, leftThigh: [-1.62, 0.03, 0], rightThigh: [-1.62, -0.03, 0], leftShin: [1.52, 0.03, 0], rightShin: [1.52, -0.03, 0], spineRotX: 0.1, headRotX: -0.04 },
  ],
  matsyendrasana: [
    { ...stand, pelvisY: 0.32, leftThigh: [1.1, 0, 0.3], rightThigh: [0.2, 0, -0.8], leftShin: [0.2, 0, 0.5], rightShin: [1.2, 0, 0], rootRotY: 0.3 },
    { ...stand, pelvisY: 0.3, leftThigh: [1.2, 0, 0.35], rightThigh: [0.15, 0, -0.85], leftShin: [0.25, 0, 0.55], rightShin: [1.25, 0, 0], spineRotX: 0.1, chestRotX: 0.35, rootRotY: 0.5, leftUpperArm: [0.5, 0, 0.8], rightUpperArm: [-0.3, 0.2, -0.6] },
    { ...stand, pelvisY: 0.28, leftThigh: [1.25, 0, 0.4], rightThigh: [0.1, 0, -0.9], leftShin: [0.3, 0, 0.6], rightShin: [1.3, 0, 0], spineRotX: 0.12, chestRotX: 0.55, rootRotY: 0.65, leftUpperArm: [0.6, 0, 1.0], rightUpperArm: [-0.4, 0.3, -0.8], headRotX: 0.15 },
    { ...stand, pelvisY: 0.27, leftThigh: [1.28, 0, 0.42], rightThigh: [0.08, 0, -0.92], leftShin: [0.32, 0, 0.62], rightShin: [1.32, 0, 0], spineRotX: 0.14, chestRotX: 0.65, rootRotY: 0.72, leftUpperArm: [0.65, 0, 1.05], rightUpperArm: [-0.45, 0.35, -0.85], headRotX: 0.2 },
  ],
  paschimottanasana: [
    { ...stand, pelvisY: 0.22, leftThigh: [0.1, 0, 0], rightThigh: [-0.1, 0, 0], leftShin: [0.05, 0, 0], rightShin: [0.05, 0, 0], leftUpperArm: [0.2, 0, 0.2], rightUpperArm: [-0.2, 0, -0.2] },
    { ...stand, pelvisY: 0.2, leftThigh: [0.15, 0, 0], rightThigh: [-0.15, 0, 0], spineRotX: 0.35, leftUpperArm: [0.8, 0, 0.3], rightUpperArm: [-0.8, 0, -0.3] },
    { ...stand, pelvisY: 0.18, leftThigh: [0.18, 0, 0], rightThigh: [-0.18, 0, 0], spineRotX: 0.75, chestRotX: 0.2, headRotX: 0.25, leftUpperArm: [1.2, 0, 0.4], rightUpperArm: [-1.2, 0, -0.4], leftForearm: [0.3, 0, 0], rightForearm: [0.3, 0, 0] },
    { ...stand, pelvisY: 0.17, leftThigh: [0.2, 0, 0], rightThigh: [-0.2, 0, 0], spineRotX: 0.95, chestRotX: 0.25, headRotX: 0.35, leftUpperArm: [1.35, 0, 0.45], rightUpperArm: [-1.35, 0, -0.45] },
  ],
  utkatasana: [
    { ...stand },
    { ...stand, pelvisY: 0.75, leftThigh: [0.85, 0.1, 0], rightThigh: [-0.85, -0.1, 0], leftShin: [0.95, 0, 0], rightShin: [0.95, 0, 0], leftUpperArm: [0.1, 0, 1.4], rightUpperArm: [-0.1, 0, -1.4] },
    { ...stand, pelvisY: 0.62, leftThigh: [1.05, 0.12, 0], rightThigh: [-1.05, -0.12, 0], leftShin: [1.15, 0, 0], rightShin: [1.15, 0, 0], leftUpperArm: [0.15, 0, 1.55], rightUpperArm: [-0.15, 0, -1.55], spineRotX: 0.12 },
    { ...stand, pelvisY: 0.58, leftThigh: [1.1, 0.14, 0], rightThigh: [-1.1, -0.14, 0], leftShin: [1.2, 0, 0], rightShin: [1.2, 0, 0], leftUpperArm: [0.18, 0, 1.6], rightUpperArm: [-0.18, 0, -1.6], spineRotX: 0.15, chestRotX: 0.05 },
  ],
  vrikshasana: [
    { ...stand },
    { ...stand, rootRotY: 0.15, rightThigh: [0.15, 0, -0.9], rightShin: [0.2, 0, 0.6], leftUpperArm: [0.1, 0, 0.35], rightUpperArm: [-0.1, 0, -0.35] },
    { ...stand, rootRotY: 0.2, rightThigh: [0.2, 0, -1.15], rightShin: [0.25, 0, 0.75], leftUpperArm: [0.15, 0, 0.5], rightUpperArm: [-0.15, 0, -0.5], leftForearm: [0.3, 0, 0], rightForearm: [0.3, 0, 0] },
    { ...stand, rootRotY: 0.22, rightThigh: [0.22, 0, -1.25], rightShin: [0.28, 0, 0.82], leftUpperArm: [0.2, 0, 0.55], rightUpperArm: [-0.2, 0, -0.55], leftForearm: [0.35, 0, 0], rightForearm: [0.35, 0, 0] },
  ],
  trikonasana: [
    { ...stand, rootRotY: 0.4, rootShiftX: -0.3, leftThigh: [0.05, 0, 0.15], rightThigh: [-0.05, 0, -0.15] },
    { ...stand, pelvisY: 0.92, rootRotY: 0.55, rootShiftX: -0.45, spineRotX: 0.15, chestRotX: 0.25, leftThigh: [0.08, 0, 0.12], rightThigh: [-0.08, 0, -0.12], leftUpperArm: [0.4, 0, 0.9], rightUpperArm: [-0.2, 0, -1.3] },
    { ...stand, pelvisY: 0.88, rootRotY: 0.62, rootShiftX: -0.55, spineRotX: 0.22, chestRotX: 0.45, leftThigh: [0.1, 0, 0.1], rightThigh: [-0.1, 0, -0.1], leftUpperArm: [0.55, 0, 1.05], rightUpperArm: [-0.25, 0, -1.45], headRotX: 0.1 },
    { ...stand, pelvisY: 0.86, rootRotY: 0.65, rootShiftX: -0.58, spineRotX: 0.25, chestRotX: 0.52, leftThigh: [0.1, 0, 0.08], rightThigh: [-0.1, 0, -0.08], leftUpperArm: [0.6, 0, 1.1], rightUpperArm: [-0.28, 0, -1.5], headRotX: 0.12 },
  ],
  "adho-mukha-svanasana": [
    { ...stand, pelvisY: 0.5, leftThigh: [0.8, 0, 0], rightThigh: [-0.8, 0, 0], leftShin: [0.9, 0, 0], rightShin: [0.9, 0, 0], leftUpperArm: [0.5, 0, 0.3], rightUpperArm: [-0.5, 0, -0.3] },
    { ...stand, pelvisY: 0.95, rootRotY: 0, spineRotX: -0.55, chestRotX: -0.25, leftThigh: [0.65, 0, 0], rightThigh: [-0.65, 0, 0], leftShin: [0.35, 0, 0], rightShin: [0.35, 0, 0], leftUpperArm: [0.75, 0, 0.5], rightUpperArm: [-0.75, 0, -0.5] },
    { ...stand, pelvisY: 1.15, spineRotX: -0.75, chestRotX: -0.35, headRotX: -0.2, leftThigh: [0.55, 0, 0], rightThigh: [-0.55, 0, 0], leftShin: [0.25, 0, 0], rightShin: [0.25, 0, 0], leftUpperArm: [0.85, 0, 0.55], rightUpperArm: [-0.85, 0, -0.55], leftForearm: [0.15, 0, 0], rightForearm: [0.15, 0, 0] },
    { ...stand, pelvisY: 1.2, spineRotX: -0.82, chestRotX: -0.4, headRotX: -0.28, leftThigh: [0.52, 0, 0], rightThigh: [-0.52, 0, 0], leftShin: [0.2, 0, 0], rightShin: [0.2, 0, 0], leftUpperArm: [0.88, 0, 0.58], rightUpperArm: [-0.88, 0, -0.58] },
  ],
  shavasana: [
    { ...stand, pelvisY: 0.08, rootRotY: 1.57, spineRotX: -1.57, chestRotX: 0, headRotX: 0.1, leftThigh: [0.08, 0, 0.05], rightThigh: [-0.08, 0, -0.05], leftShin: [0.05, 0, 0], rightShin: [0.05, 0, 0], leftUpperArm: [0.15, 0, 0.6], rightUpperArm: [-0.15, 0, -0.6], leftForearm: [0.1, 0, 0], rightForearm: [0.1, 0, 0] },
    { ...stand, pelvisY: 0.07, rootRotY: 1.57, spineRotX: -1.57, leftThigh: [0.06, 0, 0.04], rightThigh: [-0.06, 0, -0.04], leftUpperArm: [0.12, 0, 0.55], rightUpperArm: [-0.12, 0, -0.55] },
    { ...stand, pelvisY: 0.065, rootRotY: 1.57, spineRotX: -1.57, leftThigh: [0.05, 0, 0.03], rightThigh: [-0.05, 0, -0.03], leftUpperArm: [0.1, 0, 0.5], rightUpperArm: [-0.1, 0, -0.5] },
    { ...stand, pelvisY: 0.06, rootRotY: 1.57, spineRotX: -1.57, leftThigh: [0.04, 0, 0.02], rightThigh: [-0.04, 0, -0.02], leftUpperArm: [0.08, 0, 0.48], rightUpperArm: [-0.08, 0, -0.48] },
  ],
  sirsasana: [
    { ...stand, pelvisY: 0.5, leftUpperArm: [0.9, 0, 0.4], rightUpperArm: [-0.9, 0, -0.4], leftForearm: [0.4, 0, 0], rightForearm: [0.4, 0, 0], leftThigh: [0.3, 0, 0], rightThigh: [-0.3, 0, 0] },
    { ...stand, pelvisY: 0.75, spineRotX: -0.4, headRotX: -0.5, leftUpperArm: [1.0, 0, 0.45], rightUpperArm: [-1.0, 0, -0.45], leftForearm: [0.5, 0, 0], rightForearm: [0.5, 0, 0], leftThigh: [0.15, 0, 0], rightThigh: [-0.15, 0, 0] },
    { ...stand, pelvisY: 1.35, spineRotX: -1.05, chestRotX: -0.15, headRotX: -0.85, leftUpperArm: [1.05, 0, 0.48], rightUpperArm: [-1.05, 0, -0.48], leftThigh: [0.08, 0, 0], rightThigh: [-0.08, 0, 0], leftShin: [0.05, 0, 0], rightShin: [0.05, 0, 0] },
    { ...stand, pelvisY: 1.45, spineRotX: -1.15, chestRotX: -0.18, headRotX: -0.92, leftUpperArm: [1.08, 0, 0.5], rightUpperArm: [-1.08, 0, -0.5], leftThigh: [0.05, 0, 0], rightThigh: [-0.05, 0, 0], leftShin: [0.03, 0, 0], rightShin: [0.03, 0, 0] },
  ],
};

export function getPoseKeyframes(poseKey: string): JointPose[] {
  return POSE_3D_KEYFRAMES[poseKey] ?? POSE_3D_KEYFRAMES.siddhasana;
}

export function getPoseAtProgress(poseKey: string, stepIndex: number, stepT: number): JointPose {
  const frames = getPoseKeyframes(poseKey);
  const a = frames[Math.min(stepIndex, frames.length - 1)];
  const b = frames[Math.min(stepIndex + 1, frames.length - 1)];
  return stepIndex >= frames.length - 1 ? a : lerpPose(a, b, stepT);
}
