"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { createXRStore, XR } from "@react-three/xr";
import type { SimulationStep, AnatomyRegion } from "@/lib/types/visuals";
import { getPoseAtProgress } from "@/lib/visuals/pose-joints";
import { YogaAvatar3D } from "./YogaAvatar3D";

const xrStore = createXRStore();

interface SceneContentProps {
  poseKey: string;
  stepIndex: number;
  playing: boolean;
  stepDurationMs: number;
  autoOrbit: boolean;
  showAnatomy: boolean;
  anatomyRegions: AnatomyRegion[];
  onStepComplete?: () => void;
}

function AnimatedAvatar({
  poseKey,
  stepIndex,
  playing,
  stepDurationMs,
  autoOrbit,
  showAnatomy,
  anatomyRegions,
  onStepComplete,
}: SceneContentProps) {
  const progress = useRef(0);
  const [blend, setBlend] = useState(0);

  useFrame((_state, delta) => {
    if (playing) {
      progress.current += delta / (stepDurationMs / 1000);
      if (progress.current >= 1) {
        progress.current = 0;
        onStepComplete?.();
      }
      setBlend(progress.current);
    }
  });

  const pose = getPoseAtProgress(poseKey, stepIndex, Math.min(blend, 1));
  const highlightIds = showAnatomy ? anatomyRegions.map((r) => r.id) : [];

  return (
    <>
      <PerspectiveCamera makeDefault position={[2.8, 1.4, 2.8]} fov={42} />
      <ambientLight intensity={0.55} />
      <directionalLight castShadow intensity={1.1} position={[4, 6, 3]} shadow-mapSize={[1024, 1024]} />
      <Environment preset="city" />

      <Grid
        infiniteGrid
        fadeDistance={12}
        sectionColor="#0d9488"
        cellColor="#64748b"
        position={[0, 0, 0]}
      />

      <YogaAvatar3D pose={pose} highlightIds={highlightIds} regions={showAnatomy ? anatomyRegions : []} />

      <ContactShadows opacity={0.45} scale={8} blur={2.5} far={4} position={[0, 0.01, 0]} />
      <OrbitControls
        enablePan={false}
        minDistance={1.8}
        maxDistance={5.5}
        target={[0, 0.85, 0]}
        maxPolarAngle={Math.PI / 1.75}
        autoRotate={autoOrbit}
        autoRotateSpeed={0.85}
      />
    </>
  );
}

export interface ImmersivePoseSimulatorProps {
  poseKey: string;
  poseName: string;
  steps: SimulationStep[];
  anatomyRegions: AnatomyRegion[];
  caption: string;
  mode?: "simulation" | "anatomy" | "immersive";
  compact?: boolean;
}

export function ImmersivePoseSimulator({
  poseKey,
  poseName,
  steps,
  anatomyRegions,
  caption,
  mode = "simulation",
  compact = false,
}: ImmersivePoseSimulatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const current = steps[stepIndex] ?? steps[0];
  const showAnatomy = mode === "anatomy";
  const autoOrbit = mode === "simulation" || mode === "immersive";

  const handleStepComplete = () => {
    setStepIndex((prev) => (prev + 1) % steps.length);
  };

  const canvasHeight = compact ? "h-44" : "h-[min(70vh,520px)]";

  return (
    <div className="space-y-4">
      <div className={`relative overflow-hidden rounded-2xl border border-teal-300 bg-gradient-to-b from-slate-900 to-teal-950 ${canvasHeight}`}>
        <Canvas shadows dpr={[1, 2]}>
          <XR store={xrStore}>
            <Suspense fallback={null}>
              <AnimatedAvatar
                poseKey={poseKey}
                stepIndex={Math.min(current.poseStep, 3)}
                playing={playing}
                stepDurationMs={current.durationMs}
                autoOrbit={autoOrbit}
                showAnatomy={showAnatomy}
                anatomyRegions={anatomyRegions}
                onStepComplete={handleStepComplete}
              />
            </Suspense>
          </XR>
        </Canvas>

        <div className="pointer-events-none absolute bottom-14 left-3 right-3">
          <p className="rounded-lg bg-black/55 px-3 py-2 text-sm font-medium text-white">
            {poseName} — {current.label}
          </p>
        </div>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
          <span className="rounded-full bg-teal-500/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            3D simulation
          </span>
          {mode === "immersive" ? (
            <span className="rounded-full bg-violet-600/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              VR / AR ready
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-3 right-3 flex gap-2">
          {!compact ? (
            <>
              <button
                type="button"
                onClick={() => xrStore.enterVR()}
                className="pointer-events-auto rounded-full bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600"
              >
                Enter VR
              </button>
              <button
                type="button"
                onClick={() => xrStore.enterAR()}
                className="pointer-events-auto rounded-full bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
              >
                Enter AR
              </button>
            </>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <>
          <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{current.instruction}</p>
          <p className="text-xs text-zinc-500">{caption}</p>
          <p className="text-xs text-teal-700 dark:text-teal-300">
            Drag to orbit · Scroll to zoom · Auto-plays like a simulation video. On phone/tablet with AR
            support, tap Enter AR to place the avatar in your room.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
            >
              {playing ? "Pause simulation" : "Play simulation"}
            </button>
            {steps.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setStepIndex(idx);
                  setPlaying(false);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  idx === stepIndex
                    ? "border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
                    : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Lazy wrapper for explore cards */
export function Pose3DThumbnail({
  poseKey,
  poseName,
  steps,
  anatomyRegions,
}: {
  poseKey: string;
  poseName: string;
  steps: SimulationStep[];
  anatomyRegions: AnatomyRegion[];
}) {
  const caption = useMemo(() => "", []);
  return (
    <ImmersivePoseSimulator
      poseKey={poseKey}
      poseName={poseName}
      steps={steps}
      anatomyRegions={anatomyRegions}
      caption={caption}
      compact
    />
  );
}
