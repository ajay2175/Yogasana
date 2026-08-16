"use client";

import { useEffect, useMemo, useState } from "react";
import {
  blendLandmarkFrames,
  detectPoseFromImageUrl,
  type PoseLandmarkFrame,
} from "./mediapipe-pose-engine";
import { NEUTRAL_POSE_FRAME, STEP_BLEND_TARGETS } from "./neutral-pose-landmarks";

export type VisionPoseStatus = "idle" | "loading" | "ready" | "error";

export function useVisionPose(referenceImageUrl: string | undefined) {
  const [holdFrame, setHoldFrame] = useState<PoseLandmarkFrame | null>(null);
  const [status, setStatus] = useState<VisionPoseStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!referenceImageUrl) {
      setStatus("error");
      setError("No reference image for vision pose extraction.");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);

    detectPoseFromImageUrl(referenceImageUrl)
      .then((frame) => {
        if (cancelled) return;
        if (!frame) {
          setStatus("error");
          setError("MediaPipe could not detect a body in the reference image.");
          return;
        }
        setHoldFrame(frame);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Vision pose extraction failed.");
      });

    return () => {
      cancelled = true;
    };
  }, [referenceImageUrl]);

  const stepFrames = useMemo(() => {
    if (!holdFrame) return null;
    return STEP_BLEND_TARGETS.map((weight) => blendLandmarkFrames(NEUTRAL_POSE_FRAME, holdFrame, weight));
  }, [holdFrame]);

  return { holdFrame, stepFrames, status, error };
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
