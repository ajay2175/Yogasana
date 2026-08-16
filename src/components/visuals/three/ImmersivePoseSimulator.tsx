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
import type { PoseLandmarkFrame } from "@/lib/visuals/mediapipe-pose-engine";
import { getAnimatedVisionFrame } from "@/lib/visuals/use-vision-pose";
import { VRMYogaAvatar } from "./VRMYogaAvatar";

const xrStore = createXRStore();

interface VisionAvatarSceneProps {
  stepIndex: number;
  playing: boolean;
  stepDurationMs: number;
  autoOrbit: boolean;
  stepFrames: PoseLandmarkFrame[];
  onStepComplete?: () => void;
}

function VisionAvatarScene({
  stepIndex,
  playing,
  stepDurationMs,
  autoOrbit,
  stepFrames,
  onStepComplete,
}: VisionAvatarSceneProps) {
  const progress = useRef(0);
  const [frame, setFrame] = useState<PoseLandmarkFrame | null>(() =>
    getAnimatedVisionFrame(stepFrames, stepIndex, 0),
  );

  useFrame((_state, delta) => {
    if (playing) {
      progress.current += delta / (stepDurationMs / 1000);
      if (progress.current >= 1) {
        progress.current = 0;
        onStepComplete?.();
      }
    }
    setFrame(getAnimatedVisionFrame(stepFrames, stepIndex, Math.min(progress.current, 1)));
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0.2, 1.35, 2.6]} fov={38} />
      <ambientLight intensity={0.65} />
      <directionalLight castShadow intensity={1.25} position={[3, 5, 2]} shadow-mapSize={[2048, 2048]} />
      <directionalLight intensity={0.35} position={[-2, 3, -1]} />
      <Environment preset="studio" />

      <Grid
        infiniteGrid
        fadeDistance={14}
        sectionColor="#0d9488"
        cellColor="#475569"
        position={[0, 0, 0]}
      />

      <VRMYogaAvatar frame={frame} />

      <ContactShadows opacity={0.55} scale={10} blur={2.8} far={4} position={[0, 0.01, 0]} />
      <OrbitControls
        enablePan={false}
        minDistance={1.4}
        maxDistance={4.5}
        target={[0, 0.95, 0]}
        maxPolarAngle={Math.PI / 1.65}
        autoRotate={autoOrbit}
        autoRotateSpeed={0.6}
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
  referenceImageUrl?: string;
  visionStatus?: "idle" | "loading" | "ready" | "error";
  visionError?: string | null;
  stepFrames?: PoseLandmarkFrame[] | null;
  mode?: "simulation" | "anatomy" | "immersive";
  compact?: boolean;
}

export function ImmersivePoseSimulator({
  poseName,
  steps,
  caption,
  visionStatus = "ready",
  visionError,
  stepFrames,
  mode = "simulation",
  compact = false,
}: ImmersivePoseSimulatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const current = steps[stepIndex] ?? steps[0];
  const autoOrbit = mode === "simulation" || mode === "immersive";

  const handleStepComplete = () => {
    setStepIndex((prev) => (prev + 1) % steps.length);
  };

  const canvasHeight = compact ? "h-44" : "h-[min(70vh,520px)]";
  const ready = visionStatus === "ready" && !!stepFrames?.length;

  const statusLabel = useMemo(() => {
    switch (visionStatus) {
      case "loading":
        return "Google MediaPipe Heavy — analyzing reference pose…";
      case "error":
        return visionError ?? "Vision pose extraction failed.";
      case "ready":
        return "Google Vision 3D · Kalidokit retarget · VRM avatar";
      default:
        return "Initializing vision pipeline…";
    }
  }, [visionError, visionStatus]);

  return (
    <div className="space-y-4">
      <div className={`relative overflow-hidden rounded-2xl border border-teal-300 bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 ${canvasHeight}`}>
        {ready ? (
          <Canvas shadows dpr={[1, 2]}>
            <XR store={xrStore}>
              <Suspense fallback={null}>
                <VisionAvatarScene
                  stepIndex={Math.min(current.poseStep, 3)}
                  playing={playing}
                  stepDurationMs={current.durationMs}
                  autoOrbit={autoOrbit}
                  stepFrames={stepFrames!}
                  onStepComplete={handleStepComplete}
                />
              </Suspense>
            </XR>
          </Canvas>
        ) : (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center">
            {visionStatus === "loading" ? (
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
            ) : null}
            <p className="text-sm font-medium text-teal-100">{statusLabel}</p>
            <p className="max-w-md text-xs text-teal-200/80">
              BlazePose GHUM extracts 33 3D landmarks from the reference photo, retargeted to a rigged VRM
              humanoid. No YouTube embeds.
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-14 left-3 right-3">
          <p className="rounded-lg bg-black/60 px-3 py-2 text-sm font-medium text-white">
            {poseName} — {current.label}
          </p>
        </div>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
          <span className="rounded-full bg-emerald-600/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            Google Vision ML
          </span>
          {ready ? (
            <span className="rounded-full bg-teal-500/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              VRM 3D avatar
            </span>
          ) : null}
          {mode === "immersive" && ready ? (
            <span className="rounded-full bg-violet-600/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              VR / AR ready
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-3 right-3 flex gap-2">
          {!compact && ready ? (
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
          <p className="text-xs text-teal-700 dark:text-teal-300">{statusLabel}</p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!ready}
              onClick={() => setPlaying((v) => !v)}
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {playing ? "Pause simulation" : "Play simulation"}
            </button>
            {steps.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                disabled={!ready}
                onClick={() => {
                  setStepIndex(idx);
                  setPlaying(false);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs disabled:opacity-50 ${
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
