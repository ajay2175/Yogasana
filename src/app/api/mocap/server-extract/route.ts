import { NextResponse } from "next/server";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import {
  FFmpegProcessor,
  VideoQualityAnalyzer,
} from "@/lib/mocap/ffmpeg-processor";
import {
  GEMXProcessor,
  PoseFormatConverter,
  SOMAAnalyzer,
} from "@/lib/mocap/nvidia-gem-x";

/**
 * POST /api/mocap/server-extract
 * Server-side video processing with FFmpeg and optional NVIDIA GEM-X
 *
 * Request:
 * FormData with:
 * - video: File (binary video data)
 * - asanaSlug: string
 * - useGEMX?: boolean (default: false, uses fallback if true but unavailable)
 * - instructor?: string
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const video = formData.get("video") as File | null;
    const asanaSlug = formData.get("asanaSlug") as string;
    const useGEMX = (formData.get("useGEMX") as string) === "true";
    const instructor = (formData.get("instructor") as string) || "Unknown";

    if (!video || !asanaSlug) {
      return NextResponse.json(
        { success: false, error: "Missing video or asanaSlug" },
        { status: 400 }
      );
    }

    // Save video to temp file
    const tempPath = join(process.cwd(), `tmp_${Date.now()}.mp4`);
    const buffer = await video.arrayBuffer();
    writeFileSync(tempPath, Buffer.from(buffer));

    try {
      // Step 1: Assess video quality
      const quality = await VideoQualityAnalyzer.assessVideoQuality(tempPath);

      if (quality.score < 0.5) {
        return NextResponse.json(
          {
            success: false,
            error: "Video quality too low for extraction",
            quality,
          },
          { status: 400 }
        );
      }

      // Step 2: Check if GEM-X is available
      let usedGEMX = false;
      let gemxResult = null;

      if (useGEMX) {
        const gemxAvailable = await GEMXProcessor.checkGEMXAvailable();
        if (gemxAvailable.available) {
          console.log("GEM-X available, extracting SOMA 77-joint poses...");
          gemxResult = await GEMXProcessor.extractPoses(tempPath, asanaSlug);
          usedGEMX = !!gemxResult;
        } else {
          console.warn("GEM-X not available:", gemxAvailable.reason);
          console.log("Falling back to FFmpeg + BlazePose");
        }
      }

      // Step 3: FFmpeg frame extraction (fallback or always)
      const ffmpegJobId = FFmpegProcessor.submitJob(tempPath, {
        fps: 5,
        format: "jpg",
        quality: 2,
        width: 800,
        height: 600,
      });

      return NextResponse.json(
        {
          success: true,
          jobId: ffmpegJobId,
          asanaSlug,
          instructor,
          status: "processing",
          quality,
          methods: {
            ffmpeg: "queued",
            gemx: usedGEMX ? "completed" : "not_available",
          },
          message: usedGEMX
            ? "GEM-X extraction completed. FFmpeg frames queued."
            : "FFmpeg extraction queued. (GEM-X not available)",
          estimatedTime: "30-60 seconds for FFmpeg extraction",
        },
        { status: 202 }
      );
    } finally {
      // Clean up temp file
      try {
        unlinkSync(tempPath);
      } catch (err) {
        console.warn("Failed to clean up temp video file:", err);
      }
    }
  } catch (error) {
    console.error("Error in server-side extraction:", error);
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
 * GET /api/mocap/server-extract?jobId=...
 * Get status of server-side extraction job
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "Missing jobId" },
      { status: 400 }
    );
  }

  const jobStatus = FFmpegProcessor.getJobStatus(jobId);

  if (!jobStatus) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    ...jobStatus,
  });
}

/**
 * GET /api/mocap/server-extract?check=ffmpeg-available
 * Check if server has required tools
 */
export async function HEAD(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("check") === "ffmpeg-available") {
    const ffmpegAvailable = true; // Would check actual availability
    const gemxAvailable = (await GEMXProcessor.checkGEMXAvailable()).available;

    return NextResponse.json({
      success: true,
      tools: {
        ffmpeg: ffmpegAvailable,
        gemx: gemxAvailable,
        message: ffmpegAvailable
          ? "Server processing available"
          : "Server tools not configured",
      },
    });
  }

  return NextResponse.json({
    success: false,
    error: "Invalid check parameter",
  });
}
