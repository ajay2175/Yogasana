"use client";

import { useState } from "react";
import {
  BrowserVideoExtractor,
  MediaPipePoseDetector,
  PoseQualityValidator,
  type ExtractedFrame,
  type Landmark,
} from "@/lib/mocap/video-pose-extractor";

export interface MocapExtractionSummary {
  poseId: string;
  asanaSlug: string;
  totalFrames: number;
  validFrames: number;
  keyframesCount: number;
  confidence: number;
  stability: number;
  durationSec: number;
  extractedAt: string;
  message: string;
}

interface MocapVideoUploaderProps {
  asanaSlug: string;
  onExtractComplete?: (result: MocapExtractionSummary) => void;
}

function loadDataUrlImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load frame image"));
    img.src = dataUrl;
  });
}

async function detectLandmarksOnFrames(frames: ExtractedFrame[]): Promise<ExtractedFrame[]> {
  const detector = new MediaPipePoseDetector();
  await detector.initialize();
  const enriched: ExtractedFrame[] = [];

  for (const frame of frames) {
    if (!frame.imageBase64) {
      enriched.push(frame);
      continue;
    }
    const img = await loadDataUrlImage(frame.imageBase64);
    const raw = await detector.detectPose(img);
    const landmarks: Landmark[] = raw.map((l: { x: number; y: number; z?: number; visibility?: number }) => ({
      x: l.x,
      y: l.y,
      z: l.z ?? 0,
      visibility: l.visibility ?? 1,
    }));
    const confidence =
      landmarks.length > 0
        ? landmarks.reduce((sum: number, l: Landmark) => sum + (l.visibility ?? 0), 0) / landmarks.length
        : 0;

    enriched.push({ ...frame, landmarks, confidence });
  }

  return enriched;
}

export function MocapVideoUploader({ asanaSlug, onExtractComplete }: MocapVideoUploaderProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MocapExtractionSummary | null>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideo(file);
      setError(null);
      setResult(null);
    } else {
      setError("Please select a valid video file");
    }
  };

  const handleExtract = async () => {
    if (!video) {
      setError("Please select a video first");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(10);
      const frames = await BrowserVideoExtractor.extractFrames(video, 5);

      setProgress(35);
      const detected = await detectLandmarksOnFrames(frames);

      setProgress(70);
      const validFrames = detected.filter((f) => PoseQualityValidator.validateExtractedFrame(f));
      const keyframes = BrowserVideoExtractor.selectKeyframes(validFrames.length ? validFrames : detected, 5);
      const stability = PoseQualityValidator.computeStability(validFrames.length ? validFrames : detected);
      const durationSec =
        detected.length > 0 ? detected[detected.length - 1].timestamp / 1000 : 0;
      const confidence =
        validFrames.length > 0
          ? validFrames.reduce((s, f) => s + f.confidence, 0) / validFrames.length
          : 0;

      setProgress(100);

      const extractionResult: MocapExtractionSummary = {
        poseId: `${asanaSlug}_${Date.now()}`,
        asanaSlug,
        totalFrames: detected.length,
        validFrames: validFrames.length,
        keyframesCount: keyframes.length,
        confidence,
        stability,
        durationSec,
        extractedAt: new Date().toISOString(),
        message:
          validFrames.length > 0
            ? `Extracted ${validFrames.length}/${detected.length} valid frames. Stability: ${(stability * 100).toFixed(0)}%`
            : "No valid landmarks detected. Use good lighting, full body in frame, and hold the pose steadily.",
      };

      setResult(extractionResult);
      onExtractComplete?.(extractionResult);

      if (validFrames.length > 0) {
        await fetch("/api/mocap/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asanaSlug,
            summary: extractionResult,
            keyframeCount: keyframes.length,
          }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-900 dark:bg-indigo-950/20">
      <div>
        <h3 className="font-semibold text-indigo-950 dark:text-indigo-100">Extract pose from video</h3>
        <p className="mt-1 text-sm text-indigo-900/80 dark:text-indigo-200/80">
          Record 20–30 seconds holding the pose. MediaPipe runs in your browser — no upload of raw video to
          server.
        </p>
      </div>

      <input
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleVideoSelect}
        disabled={isProcessing}
        className="block w-full rounded-lg border border-indigo-200 bg-white p-2 text-sm dark:border-indigo-800 dark:bg-zinc-950"
      />

      {video ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Selected: {video.name} ({(video.size / 1024 / 1024).toFixed(1)} MB)
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {isProcessing ? (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded bg-indigo-100 dark:bg-indigo-900">
            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-zinc-600">Processing… {progress}%</p>
        </div>
      ) : null}

      {result ? (
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{result.message}</p>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Valid frames: {result.validFrames}/{result.totalFrames} · Keyframes: {result.keyframesCount}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleExtract}
        disabled={!video || isProcessing}
        className="w-full rounded-full bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isProcessing ? "Extracting…" : "Extract pose landmarks"}
      </button>
    </div>
  );
}
