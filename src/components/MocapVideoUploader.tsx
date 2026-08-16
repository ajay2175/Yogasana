"use client";

import { useState } from "react";
import { BrowserVideoExtractor, PoseQualityValidator } from "@/lib/mocap/video-pose-extractor";

interface MocapVideoUploaderProps {
  asanaSlug: string;
  onExtractComplete?: (result: any) => void;
}

export function MocapVideoUploader({ asanaSlug, onExtractComplete }: MocapVideoUploaderProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideo(file);
      setError(null);
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
      // Step 1: Extract frames from video
      setProgress(10);
      const { frames, metadata } = await BrowserVideoExtractor.extractFrames(video, 5); // 5 FPS

      setProgress(40);
      // Step 2: Select keyframes
      const keyframes = BrowserVideoExtractor.selectKeyframes(frames, 5);

      setProgress(60);
      // Step 3: Validate quality
      const validFrames = frames.filter((f) =>
        PoseQualityValidator.validateExtractedFrame(f)
      );
      const stability = PoseQualityValidator.computeStability(validFrames);

      setProgress(100);

      const extractionResult = {
        poseId: `${asanaSlug}_${Date.now()}`,
        asanaSlug,
        totalFrames: metadata.totalFrames,
        validFrames: validFrames.length,
        keyframesCount: keyframes.length,
        confidence: validFrames.length > 0 ? 0.85 : 0,
        stability,
        duration: metadata.duration,
        extractedAt: new Date().toISOString(),
        videoDimensions: metadata.videoDimensions,
        message:
          validFrames.length > 0
            ? `✅ Extracted ${validFrames.length}/${frames.length} valid frames. Stability: ${(stability * 100).toFixed(0)}%`
            : "⚠️ No valid landmarks detected. Try better lighting and clear body visibility.",
      };

      setResult(extractionResult);
      onExtractComplete?.(extractionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">📹 Extract Pose from Video</h3>

      <div className="space-y-2">
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
          disabled={isProcessing}
          className="block w-full text-sm border rounded p-2"
        />
        {video && (
          <p className="text-sm text-gray-600">
            Selected: {video.name} ({(video.size / 1024 / 1024).toFixed(1)} MB)
          </p>
        )}
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      {isProcessing && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">Processing... {progress}%</p>
        </div>
      )}

      {result && (
        <div className="space-y-2 p-3 bg-green-50 rounded">
          <p className="text-sm font-semibold text-green-800">{result.message}</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📊 Valid frames: {result.validFrames}/{result.totalFrames}</p>
            <p>⚡ Stability: {(result.stability * 100).toFixed(0)}%</p>
            <p>🔑 Keyframes: {result.keyframesCount}</p>
          </div>
          {result.confidence > 0 && (
            <button
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={() => {
                // In a real app, this would save the result
                console.log("Would save extraction result:", result);
              }}
            >
              Save to Catalog
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleExtract}
        disabled={!video || isProcessing}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Extracting..." : "Extract Pose Landmarks"}
      </button>
    </div>
  );
}
