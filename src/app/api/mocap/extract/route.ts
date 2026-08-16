import { NextResponse } from "next/server";
import type { PoseExtractionResult } from "@/lib/mocap/video-pose-extractor";

/**
 * POST /api/mocap/extract
 * Upload instructor yoga video and extract pose keyframes
 *
 * Request body: FormData with:
 * - video: File (MP4, WebM)
 * - asanaSlug: string (e.g., "trikonasana")
 * - instructor: string (optional)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const video = formData.get("video") as File | null;
    const asanaSlug = formData.get("asanaSlug") as string;
    const instructor = formData.get("instructor") as string | null;

    if (!video || !asanaSlug) {
      return NextResponse.json(
        { success: false, error: "Missing video or asanaSlug" },
        { status: 400 }
      );
    }

    // Validate video file
    if (!video.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "File must be a video" },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Save video to temp storage
    // 2. Extract frames using FFmpeg (server-side)
    // 3. Run MediaPipe pose detection on each frame
    // 4. Select keyframes and validate quality
    // 5. Return structured pose data

    const jobId = `mocap_${Date.now()}`;

    return NextResponse.json(
      {
        success: true,
        jobId,
        status: "processing",
        message:
          "Video extraction initiated. Client-side MediaPipe processing available at /api/mocap/client-extract",
        asanaSlug,
        instructor: instructor || "Unknown",
        estimatedProcessingTime: "30-60 seconds for 1-min video",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error in mocap extraction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mocap/extract?jobId=...
 * Check status of extraction job
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "Missing jobId parameter" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    jobId,
    status: "queued",
    message: "Job status tracking not yet implemented",
  });
}
