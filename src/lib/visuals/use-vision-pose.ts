"use client";

import { useEffect, useMemo, useState } from "react";
import {
  blendLandmarkFrames,
  detectPoseFromImageUrl,
  isLikelyBrokenRemoteUrl,
  localReferencePath,
  type PoseLandmarkFrame,
} from "./mediapipe-pose-engine";
import { buildAnatomyGuidedStepFrames } from "./joint-pose-to-landmarks";
import { NEUTRAL_POSE_FRAME, STEP_BLEND_TARGETS } from "./neutral-pose-landmarks";

export type VisionPoseStatus = "idle" | "loading" | "ready" | "enhancing" | "error";
export type VisionPoseSource = "anatomy" | "google-mediapipe" | "nvidia-gem";

export function useVisionPose(poseKey: string, referenceImageUrl?: string) {
  const anatomyFrames = useMemo(() => buildAnatomyGuidedStepFrames(poseKey), [poseKey]);

  const [stepFrames, setStepFrames] = useState<PoseLandmarkFrame[]>(() =>
    anatomyFrames.map((frame, i) =>
      blendLandmarkFrames(NEUTRAL_POSE_FRAME, frame, STEP_BLEND_TARGETS[i] ?? 1),
    ),
  );
  const [status, setStatus] = useState<VisionPoseStatus>("ready");
  const [source, setSource] = useState<VisionPoseSource>("anatomy");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseFrames = anatomyFrames.map((frame, i) =>
      blendLandmarkFrames(NEUTRAL_POSE_FRAME, frame, STEP_BLEND_TARGETS[i] ?? 1),
    );
    setStepFrames(baseFrames);
    setSource("anatomy");
    setStatus("ready");
    setError(null);

    const candidates = [
      localReferencePath(poseKey),
      referenceImageUrl && !isLikelyBrokenRemoteUrl(referenceImageUrl) ? referenceImageUrl : null,
    ].filter(Boolean) as string[];

    if (!candidates.length) return;

    let cancelled = false;
    setStatus("enhancing");

    (async () => {
      for (const url of candidates) {
        try {
          const hold = await detectPoseFromImageUrl(url);
          if (cancelled || !hold) continue;

          const enhanced = STEP_BLEND_TARGETS.map((weight) =>
            blendLandmarkFrames(NEUTRAL_POSE_FRAME, hold, weight),
          );
          setStepFrames(enhanced);
          setSource("google-mediapipe");
          setStatus("ready");
          setError(null);
          return;
        } catch {
          // try next candidate
        }
      }

      if (!cancelled) {
        setStatus("ready");
        setSource("anatomy");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [anatomyFrames, poseKey, referenceImageUrl]);

  return { stepFrames, status, source, error };
}

export function getAnimatedVisionFrame(
  stepFrames: PoseLandmarkFrame[] | null,
  stepIndex: number,
  progress: number,
): PoseLandmarkFrame | null {
  if (!stepFrames?.length) return null;
  const current = stepFrames[Math.min(stepIndex, stepFrames.length - 1)] ?? stepFrames[0];
  const next = stepFrames[Math.min(stepIndex + 1, stepFrames.length - 1)] ?? current;
  if (stepIndex >= stepFrames.length - 1) return blendLandmarkFrames(current, next, progress);
  return blendLandmarkFrames(current, next, progress * 0.35);
}
