"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { PoseLandmarkFrame } from "@/lib/visuals/mediapipe-pose-engine";
import { POSE_CONNECTIONS } from "@/lib/visuals/asana-pose-catalog";

function jointPosition(frame: PoseLandmarkFrame, index: number): THREE.Vector3 {
  const p = frame.world[index];
  if (!p) return new THREE.Vector3(0, 1, 0);
  return new THREE.Vector3(p.x, p.y, p.z);
}

function Bone({
  frame,
  a,
  b,
}: {
  frame: PoseLandmarkFrame;
  a: number;
  b: number;
}) {
  const start = jointPosition(frame, a);
  const end = jointPosition(frame, b);
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  if (len < 0.001) return null;
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize(),
  );

  return (
    <mesh position={mid} quaternion={quat} castShadow>
      <capsuleGeometry args={[0.035, Math.max(len - 0.07, 0.02), 4, 8]} />
      <meshStandardMaterial color="#f5c4a1" roughness={0.45} />
    </mesh>
  );
}

function Joint({ frame, index, highlight }: { frame: PoseLandmarkFrame; index: number; highlight?: boolean }) {
  const p = jointPosition(frame, index);
  return (
    <mesh position={p} castShadow>
      <sphereGeometry args={[0.045, 10, 10]} />
      <meshStandardMaterial
        color={highlight ? "#ef4444" : "#0d9488"}
        emissive={highlight ? "#991b1b" : "#134e4a"}
        emissiveIntensity={0.25}
      />
    </mesh>
  );
}

export function LandmarkSkeleton3D({ frame }: { frame: PoseLandmarkFrame | null }) {
  const connections = useMemo(() => POSE_CONNECTIONS, []);
  if (!frame) return null;

  return (
    <group position={[0, 0.05, 0]}>
      {connections.map(([a, b]) => (
        <Bone key={`${a}-${b}`} frame={frame} a={a} b={b} />
      ))}
      {[0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map((i) => (
        <Joint key={i} frame={frame} index={i} />
      ))}
    </group>
  );
}
