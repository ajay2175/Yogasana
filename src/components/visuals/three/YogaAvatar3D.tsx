"use client";

import { useRef } from "react";
import * as THREE from "three";
import type { JointPose } from "@/lib/visuals/pose-joints";
import type { AnatomyRegion } from "@/lib/types/visuals";

const SKIN = "#e8b896";
const JOINT = "#0d9488";
const HIGHLIGHT = "#ef4444";

interface SegmentProps {
  length: number;
  radius: number;
  color?: string;
  emissive?: string;
  children?: React.ReactNode;
}

function Segment({ length, radius, color = SKIN, emissive, children }: SegmentProps) {
  return (
    <group>
      <mesh position={[0, -length / 2, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[radius, length, 6, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 0.45 : 0}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>
      <group position={[0, -length, 0]}>{children}</group>
    </group>
  );
}

function JointSphere({ active }: { active?: boolean }) {
  return (
    <mesh castShadow>
      <sphereGeometry args={[0.055, 12, 12]} />
      <meshStandardMaterial color={active ? HIGHLIGHT : JOINT} emissive={active ? HIGHLIGHT : JOINT} emissiveIntensity={active ? 0.35 : 0.15} />
    </mesh>
  );
}

export function YogaAvatar3D({
  pose,
  highlightIds = [],
  regions = [],
}: {
  pose: JointPose;
  highlightIds?: string[];
  regions?: AnatomyRegion[];
}) {
  const root = useRef<THREE.Group>(null);

  const regionActive = (id: string) => highlightIds.includes(id);

  return (
    <group
      ref={root}
      position={[pose.rootShiftX ?? 0, pose.pelvisY, pose.rootShiftZ ?? 0]}
      rotation={[0, pose.rootRotY, 0]}
    >
      {/* Pelvis */}
      <mesh castShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[0.32, 0.12, 0.18]} />
        <meshStandardMaterial color={regionActive("hip") || regionActive("abdomen") ? "#fca5a5" : SKIN} />
      </mesh>

      {/* Spine chain */}
      <group position={[0, 0, 0]} rotation={[pose.spineRotX, 0, 0]}>
        <Segment length={0.28} radius={0.09}>
          <group rotation={[pose.chestRotX, 0, 0]}>
            <Segment length={0.22} radius={0.085}>
              {/* Head */}
              <group rotation={[pose.headRotX, 0, 0]}>
                <JointSphere active={regionActive("cervical") || regionActive("ocular")} />
                <mesh position={[0, -0.14, 0]} castShadow>
                  <sphereGeometry args={[0.11, 16, 16]} />
                  <meshStandardMaterial color={regionActive("ocular") ? "#fca5a5" : SKIN} />
                </mesh>
              </group>
            </Segment>
          </group>
        </Segment>
      </group>

      {/* Left arm */}
      <group position={[0.18, -0.02, 0]} rotation={pose.leftUpperArm}>
        <JointSphere active={regionActive("shoulders")} />
        <Segment length={0.28} radius={0.055}>
          <group rotation={pose.leftForearm}>
            <JointSphere />
            <Segment length={0.26} radius={0.045} />
          </group>
        </Segment>
      </group>

      {/* Right arm */}
      <group position={[-0.18, -0.02, 0]} rotation={pose.rightUpperArm}>
        <JointSphere active={regionActive("shoulders")} />
        <Segment length={0.28} radius={0.055}>
          <group rotation={pose.rightForearm}>
            <JointSphere />
            <Segment length={0.26} radius={0.045} />
          </group>
        </Segment>
      </group>

      {/* Left leg */}
      <group position={[0.1, -0.05, 0]} rotation={pose.leftThigh}>
        <JointSphere active={regionActive("quads") || regionActive("knee") || regionActive("hamstrings") || regionActive("legs") || regionActive("ankle")} />
        <Segment length={0.42} radius={0.065} color={regionActive("quads") ? "#fca5a5" : SKIN}>
          <group rotation={pose.leftShin}>
            <JointSphere active={regionActive("knee") || regionActive("ankle")} />
            <Segment length={0.42} radius={0.055} color={regionActive("hamstrings") ? "#fca5a5" : SKIN} />
          </group>
        </Segment>
      </group>

      {/* Right leg */}
      <group position={[-0.1, -0.05, 0]} rotation={pose.rightThigh}>
        <JointSphere active={regionActive("glutes") || regionActive("legs")} />
        <Segment length={0.42} radius={0.065}>
          <group rotation={pose.rightShin}>
            <JointSphere />
            <Segment length={0.42} radius={0.055} />
          </group>
        </Segment>
      </group>

      {/* Anatomy marker orbs (world-space hints) */}
      {regions.map((region) => (
        <mesh
          key={region.id}
          position={[
            ((region.x - 50) / 50) * 0.35,
            ((100 - region.y) / 100) * 1.2,
            0.15,
          ]}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color={HIGHLIGHT}
            emissive={HIGHLIGHT}
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}
