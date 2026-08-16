"use client";

import { useEffect, useMemo, useState } from "react";
import {
  blendLandmarkFrames,
  detectPoseFromImageUrl,
  localReferencePath,
  type PoseLandmarkFrame,
} from "./mediapipe-pose-engine";
import { getCatalogStepFrames, blendNorm, STAND, toFrame, normalizedToWorld } from "./asana-pose-catalog";

export type VisionPoseStatus = "idle" | "loading" | "ready" | "enhancing" | "error";
export type VisionPoseSource = "catalog" | "google-mediapipe" | "nvidia-gem";

const STEP_WEIGHTS = [0, 0.35, 0.7, 1] as const;

function buildStepsFromHold(hold: PoseLandmarkFrame): PoseLandmarkFrame[] {
  const stand = toFrame(STAND);
  return STEP_WEIGHTS.map((w) => {
    const normalized = blendNorm(stand.normalized, hold.normalized, w);
    return {
      normalized,
      world: normalizedToWorld(normalized),
      imageWidth: hold.imageWidth,
      imageHeight: hold.imageHeight,
    };
  });
}

export function useVisionPose(poseKey: string, referenceImageUrl?: string) {
  const catalogFrames = useMemo(() => getCatalogStepFrames(poseKey), [poseKey]);
  const photoUrl = referenceImageUrl?.startsWith("/")
    ? referenceImageUrl
    : localReferencePath(poseKey);

  const [stepFrames, setStepFrames] = useState<PoseLandmarkFrame[]>(catalogFrames);
  const [status, setStatus] = useState<VisionPoseStatus>("ready");
  const [source, setSource] = useState<VisionPoseSource>("catalog");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStepFrames(catalogFrames);
    setSource("catalog");
    setStatus("ready");
    setError(null);

    let cancelled = false;
    setStatus("enhancing");

    detectPoseFromImageUrl(photoUrl)
      .then((detected) => {
        if (cancelled) return;
        if (detected) {
          const catalogHold = catalogFrames[catalogFrames.length - 1]!;
          const mergedHold = blendLandmarkFrames(catalogHold, detected, 0.55);
          setStepFrames(buildStepsFromHold(mergedHold));
          setSource("google-mediapipe");
        } else {
          setStepFrames(catalogFrames);
          setSource("catalog");
        }
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStepFrames(catalogFrames);
        setSource("catalog");
        setStatus("ready");
      });

    return () => {
      cancelled = true;
    };
  }, [catalogFrames, photoUrl, poseKey]);

  return { stepFrames, status, source, error, photoUrl };
}

export function getAnimatedVisionFrame(
  stepFrames: PoseLandmarkFrame[] | null,
  stepIndex: number,
  progress: number,
): PoseLandmarkFrame | null {
  if (!stepFrames?.length) return null;
  const current = stepFrames[Math.min(stepIndex, stepFrames.length - 1)] ?? stepFrames[0];
  const next = stepFrames[Math.min(stepIndex + 1, stepFrames.length - 1)] ?? current;
  return blendLandmarkFrames(current, next, Math.min(progress, 1) * (stepIndex < stepFrames.length - 1 ? 0.4 : 1));
}
