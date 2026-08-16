"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import type { PoseLandmarkFrame } from "@/lib/visuals/mediapipe-pose-engine";
import { applyVisionPoseToVrm, solvePoseFromVisionFrame } from "@/lib/visuals/apply-kalidokit-vrm";

const VRM_URL = "/models/yoga-instructor.vrm";

export function VRMYogaAvatar({
  frame,
  lerpAmount = 0.65,
}: {
  frame: PoseLandmarkFrame | null;
  lerpAmount?: number;
}) {
  const vrmRef = useRef<VRM | null>(null);
  const solvedRef = useRef<ReturnType<typeof solvePoseFromVisionFrame>>(null);

  const gltf = useLoader(GLTFLoader, VRM_URL, (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });

  useEffect(() => {
    const vrm = gltf.userData.vrm as VRM | undefined;
    if (!vrm) return;
    VRMUtils.removeUnnecessaryJoints(vrm.scene);
    vrm.scene.rotation.y = Math.PI;
    vrmRef.current = vrm;
  }, [gltf]);

  useEffect(() => {
    if (!frame) {
      solvedRef.current = null;
      return;
    }
    solvedRef.current = solvePoseFromVisionFrame(frame);
  }, [frame]);

  useFrame((_state, delta) => {
    const vrm = vrmRef.current;
    const solved = solvedRef.current;
    if (!vrm || !solved) return;
    applyVisionPoseToVrm(vrm, solved, lerpAmount);
    vrm.update(delta);
  });

  if (!gltf.scene) return null;
  return <primitive object={gltf.scene} scale={1.05} position={[0, 0, 0]} />;
}
