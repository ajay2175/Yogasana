"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
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
import { LandmarkSkeleton3D } from "./LandmarkSkeleton3D";
import { PhotoPoseSimulation } from "./PhotoPoseSimulation";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";

const xrStore = createXRStore();

export interface ImmersivePoseSimulatorProps {
  poseKey: string;
  poseName: string;
  steps: SimulationStep[];
  anatomyRegions: AnatomyRegion[];
  caption: string;
  photoUrl: string;
  visionStatus?: "idle" | "loading" | "ready" | "enhancing" | "error";
  visionSource?: "catalog" | "google-mediapipe" | "nvidia-gem";
  visionError?: string | null;
  stepFrames?: PoseLandmarkFrame[] | null;
  mode?: "simulation" | "anatomy" | "immersive";
  compact?: boolean;
}

export function ImmersivePoseSimulator({
  poseName,
  steps,
  caption,
  photoUrl,
  visionStatus = "ready",
  visionSource = "catalog",
  visionError,
  stepFrames,
  mode = "simulation",
  compact = false,
}: ImmersivePoseSimulatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [view, setView] = useState<"photo" | "3d">("photo");
  const [animFrame, setAnimFrame] = useState<PoseLandmarkFrame | null>(null);
  const progress = useRef(0);

  const current = steps[stepIndex] ?? steps[0];
  const autoOrbit = mode === "simulation" || mode === "immersive";
  const ready = (visionStatus === "ready" || visionStatus === "enhancing") && !!stepFrames?.length;
  const poseStep = Math.min(current.poseStep, 3);

  useEffect(() => {
    progress.current = 0;
    if (stepFrames) {
      setAnimFrame(getAnimatedVisionFrame(stepFrames, poseStep, 0));
    }
  }, [poseStep, stepFrames]);

  useEffect(() => {
    if (!stepFrames || !playing) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      progress.current += delta / (current.durationMs / 1000);

      if (progress.current >= 1) {
        progress.current = 0;
        setStepIndex((prev) => (prev + 1) % steps.length);
      } else {
        setAnimFrame(getAnimatedVisionFrame(stepFrames, poseStep, progress.current));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stepFrames, playing, current.durationMs, poseStep, steps.length]);

  useEffect(() => {
    if (!playing && stepFrames) {
      setAnimFrame(getAnimatedVisionFrame(stepFrames, poseStep, progress.current));
    }
  }, [playing, stepFrames, poseStep, stepIndex]);

  const statusLabel = useMemo(() => {
    if (visionStatus === "enhancing") return "Refining skeleton from reference photo…";
    if (visionSource === "google-mediapipe") return "Photo-aligned skeleton · MediaPipe + classical asana geometry";
    if (visionError) return visionError;
    return "Classical asana skeleton drawn on reference photo";
  }, [visionError, visionSource, visionStatus]);

  const canvasHeight = compact ? "h-44" : "h-[min(70vh,520px)]";

  return (
    <div className="space-y-4">
      {!compact ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("photo")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              view === "photo" ? "bg-teal-700 text-white" : "border border-zinc-300 text-zinc-600"
            }`}
          >
            Photo + skeleton
          </button>
          <button
            type="button"
            onClick={() => setView("3d")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              view === "3d" ? "bg-teal-700 text-white" : "border border-zinc-300 text-zinc-600"
            }`}
          >
            3D orbit / AR
          </button>
        </div>
      ) : null}

      <div className={`relative overflow-hidden rounded-2xl border border-teal-300 bg-slate-950 ${canvasHeight}`}>
        {ready && view === "photo" ? (
          <PhotoPoseSimulation
            photoUrl={photoUrl}
            frame={animFrame}
            poseName={poseName}
            stepLabel={current.label}
          />
        ) : null}

        {ready && view === "3d" ? (
          <CanvasErrorBoundary
            fallback={<div className="flex h-full items-center justify-center text-sm text-rose-200">3D view unavailable</div>}
          >
            <Canvas shadows dpr={[1, 2]}>
              <XR store={xrStore}>
                <Suspense fallback={null}>
                  <PerspectiveCamera makeDefault position={[0, 1.2, 2.4]} fov={42} />
                  <ambientLight intensity={0.7} />
                  <directionalLight castShadow intensity={1.1} position={[2, 4, 2]} />
                  <Environment preset="studio" />
                  <Grid infiniteGrid fadeDistance={12} sectionColor="#0d9488" cellColor="#475569" />
                  <LandmarkSkeleton3D frame={animFrame} />
                  <ContactShadows opacity={0.45} scale={8} blur={2.5} position={[0, 0.01, 0]} />
                  <OrbitControls
                    enablePan={false}
                    minDistance={1.2}
                    maxDistance={4}
                    target={[0, 0.9, 0]}
                    autoRotate={autoOrbit}
                    autoRotateSpeed={0.5}
                  />
                </Suspense>
              </XR>
            </Canvas>
          </CanvasErrorBoundary>
        ) : null}

        {!ready ? (
          <div className="flex h-full items-center justify-center text-sm text-teal-100">Loading pose simulation…</div>
        ) : null}

        <div className="pointer-events-none absolute left-3 top-3">
          <span className="rounded-full bg-emerald-600/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            {visionSource === "google-mediapipe" ? "Photo-aligned" : "Classical pose"}
          </span>
        </div>

        {view === "3d" && !compact ? (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button type="button" onClick={() => xrStore.enterVR()} className="pointer-events-auto rounded-full bg-violet-700 px-3 py-1.5 text-xs text-white">
              Enter VR
            </button>
            <button type="button" onClick={() => xrStore.enterAR()} className="pointer-events-auto rounded-full bg-indigo-700 px-3 py-1.5 text-xs text-white">
              Enter AR
            </button>
          </div>
        ) : null}
      </div>

      {!compact ? (
        <>
          <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{current.instruction}</p>
          <p className="text-xs text-zinc-500">{caption}</p>
          <p className="text-xs text-teal-700 dark:text-teal-300">{statusLabel}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPlaying((v) => !v)} className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white">
              {playing ? "Pause" : "Play"}
            </button>
            {steps.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setStepIndex(idx);
                  setPlaying(false);
                  progress.current = 0;
                }}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  idx === stepIndex ? "border-teal-600 bg-teal-50 text-teal-900" : "border-zinc-300 text-zinc-600"
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
