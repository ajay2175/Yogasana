import { NextResponse } from "next/server";

/**
 * NVIDIA GEM-X (Generalist Model for Human Motion) — server-side hook.
 * GEM recovers 77-joint SOMA motion from monocular video (GPU / Python).
 * This route documents status; precomputed JSON can be dropped in public/motions/{poseKey}.json.
 *
 * @see https://github.com/NVlabs/GEM-X
 * @see https://huggingface.co/nvidia/GEM-X
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const poseKey = searchParams.get("poseKey");

  return NextResponse.json({
    available: false,
    model: "NVIDIA GEM-X (SOMA 77-joint)",
    poseKey,
    message:
      "GEM runs offline on GPU via Python. Drop precomputed motion at public/motions/{poseKey}.json or run scripts/nvidia-gem-extract.sh.",
    alternatives: {
      browser: "Google MediaPipe Pose Landmarker (self-hosted in /public/mediapipe/)",
      immediate: "Anatomy-guided keyframes (always available, no network)",
      enterprise: "NVIDIA TAO BodyPose3DNet — 34 3D keypoints (TensorRT deploy)",
    },
    docs: "/docs/vision-3d-pipeline.md",
  });
}
