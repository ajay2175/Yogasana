import * as Kalidokit from "kalidokit";
import { VRMHumanBoneName, type VRM } from "@pixiv/three-vrm";
import * as THREE from "three";
import type { PoseLandmarkFrame } from "./mediapipe-pose-engine";

type EulerLike = { x: number; y: number; z: number; rotationOrder?: string };
type SolvedPose = NonNullable<ReturnType<typeof Kalidokit.Pose.solve>>;

const ROTATION_BONES: { kalidokit: keyof SolvedPose; vrm: string; damp: number }[] = [
  { kalidokit: "Spine", vrm: VRMHumanBoneName.Spine, damp: 0.4 },
  { kalidokit: "LeftUpperArm", vrm: VRMHumanBoneName.LeftUpperArm, damp: 0.55 },
  { kalidokit: "LeftLowerArm", vrm: VRMHumanBoneName.LeftLowerArm, damp: 0.55 },
  { kalidokit: "RightUpperArm", vrm: VRMHumanBoneName.RightUpperArm, damp: 0.55 },
  { kalidokit: "RightLowerArm", vrm: VRMHumanBoneName.RightLowerArm, damp: 0.55 },
  { kalidokit: "LeftUpperLeg", vrm: VRMHumanBoneName.LeftUpperLeg, damp: 0.75 },
  { kalidokit: "LeftLowerLeg", vrm: VRMHumanBoneName.LeftLowerLeg, damp: 0.75 },
  { kalidokit: "RightUpperLeg", vrm: VRMHumanBoneName.RightUpperLeg, damp: 0.75 },
  { kalidokit: "RightLowerLeg", vrm: VRMHumanBoneName.RightLowerLeg, damp: 0.75 },
  { kalidokit: "LeftHand", vrm: VRMHumanBoneName.LeftHand, damp: 0.45 },
  { kalidokit: "RightHand", vrm: VRMHumanBoneName.RightHand, damp: 0.45 },
];

function asEuler(value: unknown): EulerLike | null {
  if (!value || typeof value !== "object") return null;
  const v = value as EulerLike;
  if (typeof v.x !== "number" || typeof v.y !== "number" || typeof v.z !== "number") return null;
  return v;
}

function applyRotation(
  vrm: VRM,
  boneName: string,
  rotation: EulerLike,
  damp: number,
  lerpAmount: number,
) {
  const bone = vrm.humanoid.getNormalizedBoneNode(boneName as (typeof VRMHumanBoneName)[keyof typeof VRMHumanBoneName]);
  if (!bone) return;

  const euler = new THREE.Euler(
    rotation.x * damp,
    rotation.y * damp,
    rotation.z * damp,
    (rotation.rotationOrder as THREE.EulerOrder) ?? "XYZ",
  );
  const q = new THREE.Quaternion().setFromEuler(euler);
  bone.quaternion.slerp(q, lerpAmount);
}

export function solvePoseFromVisionFrame(frame: PoseLandmarkFrame): SolvedPose | null {
  const solved = Kalidokit.Pose.solve(frame.world, frame.normalized, {
    runtime: "mediapipe",
    video: null,
    imageSize: { width: frame.imageWidth, height: frame.imageHeight },
    enableLegs: true,
  });
  return solved ?? null;
}

export function applyVisionPoseToVrm(vrm: VRM, solved: SolvedPose, lerpAmount = 0.65) {
  for (const entry of ROTATION_BONES) {
    const raw = solved[entry.kalidokit];
    const rotation = asEuler(raw);
    if (rotation) applyRotation(vrm, entry.vrm, rotation, entry.damp, lerpAmount);
  }

  const hips = solved.Hips;
  if (hips?.rotation) {
    const hipRot = asEuler(hips.rotation);
    if (hipRot) applyRotation(vrm, VRMHumanBoneName.Hips, hipRot, 0.35, lerpAmount);
  }
}
