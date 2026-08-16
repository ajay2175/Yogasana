/**
 * FFmpeg Server-Side Video Processing
 * Robust frame extraction using FFmpeg (requires system installation)
 *
 * @see https://ffmpeg.org/
 */

import { spawn } from "child_process";
import { createWriteStream, mkdirSync } from "fs";
import { join } from "path";
import { rm } from "fs/promises";

export interface FFmpegExtractionOptions {
  fps?: number;
  format?: "png" | "jpg";
  quality?: number;
  width?: number;
  height?: number;
  maxFrames?: number;
}

export interface FFmpegJobResult {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  framesExtracted: number;
  frameDirectory: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

/**
 * Queue-based FFmpeg processor for server-side extraction
 * Handles one video at a time to manage system resources
 */
export class FFmpegProcessor {
  private static queue: Map<string, FFmpegJobResult> = new Map();
  private static processing = false;
  private static currentJobId: string | null = null;

  static getJobStatus(jobId: string): FFmpegJobResult | null {
    return this.queue.get(jobId) || null;
  }

  /**
   * Queue a video for extraction
   */
  static submitJob(
    videoPath: string,
    options: FFmpegExtractionOptions = {}
  ): string {
    const jobId = `ffmpeg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const result: FFmpegJobResult = {
      jobId,
      status: "queued",
      progress: 0,
      framesExtracted: 0,
      frameDirectory: `./frames/${jobId}`,
      startedAt: new Date().toISOString(),
    };

    this.queue.set(jobId, result);
    this.processQueue(videoPath, jobId, options);

    return jobId;
  }

  /**
   * Process jobs from queue
   */
  private static async processQueue(
    videoPath: string,
    jobId: string,
    options: FFmpegExtractionOptions
  ) {
    if (this.processing) return;

    this.processing = true;
    this.currentJobId = jobId;
    const job = this.queue.get(jobId)!;

    try {
      job.status = "processing";
      await this.extractFramesWithFFmpeg(videoPath, jobId, options);
      job.status = "completed";
      job.completedAt = new Date().toISOString();
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Unknown error";
      job.completedAt = new Date().toISOString();
    } finally {
      this.processing = false;
      this.currentJobId = null;
    }
  }

  /**
   * Extract frames using FFmpeg system command
   *
   * Command pattern:
   * ffmpeg -i input.mp4 -vf fps=5,scale=800:600 -q:v 2 frames/%04d.jpg
   */
  private static extractFramesWithFFmpeg(
    videoPath: string,
    jobId: string,
    options: FFmpegExtractionOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const fps = options.fps || 5;
      const format = options.format || "jpg";
      const quality = options.quality || 2;
      const frameDir = `./frames/${jobId}`;

      // Create frame directory
      try {
        mkdirSync(frameDir, { recursive: true });
      } catch (err) {
        reject(new Error(`Failed to create frame directory: ${err}`));
        return;
      }

      // Build FFmpeg filter chain
      let filterChain = `fps=${fps}`;
      if (options.width && options.height) {
        filterChain += `,scale=${options.width}:${options.height}`;
      }

      const framePattern = `${frameDir}/frame_%05d.${format}`;

      // FFmpeg command
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-vf",
        filterChain,
        `-q:v`,
        quality.toString(),
        framePattern,
      ]);

      let progress = 0;

      ffmpeg.stderr.on("data", (data) => {
        const output = data.toString();
        // Parse FFmpeg progress output
        // Example: "frame= 150 fps= 45 q= 28.0 Lsize=N/A time=00:00:30.00"
        const frameMatch = output.match(/frame=\s*(\d+)/);
        if (frameMatch) {
          const frameNum = parseInt(frameMatch[1]);
          const job = this.queue.get(jobId);
          if (job) {
            job.framesExtracted = frameNum;
            // Estimate progress (rough)
            job.progress = Math.min(95, frameNum / 30); // adjust divisor based on expected duration
          }
        }
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          const job = this.queue.get(jobId);
          if (job) {
            job.progress = 100;
          }
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on("error", (err) => {
        reject(new Error(`FFmpeg process error: ${err.message}`));
      });
    });
  }

  /**
   * Clean up extracted frames after processing
   */
  static async cleanupFrames(jobId: string): Promise<void> {
    const job = this.queue.get(jobId);
    if (!job) return;

    try {
      await rm(job.frameDirectory, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to cleanup frames for job ${jobId}:`, err);
    }
  }

  /**
   * Check if FFmpeg is available on system
   */
  static async checkFFmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn("ffmpeg", ["-version"]);
      ffmpeg.on("close", (code) => {
        resolve(code === 0);
      });
      ffmpeg.on("error", () => {
        resolve(false);
      });
    });
  }
}

/**
 * Video Quality Assessment
 * Analyzes video properties for extraction suitability
 */
export class VideoQualityAnalyzer {
  /**
   * Probe video metadata using FFprobe
   *
   * Returns: {duration, fps, width, height, codec, bitrate}
   */
  static async probeVideo(
    videoPath: string
  ): Promise<{
    duration: number;
    fps: number;
    width: number;
    height: number;
    codec: string;
    bitrate: string;
  } | null> {
    return new Promise((resolve) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        videoPath,
      ]);

      let output = "";

      ffprobe.stdout.on("data", (data) => {
        output += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code !== 0) {
          resolve(null);
          return;
        }

        try {
          const data = JSON.parse(output);
          const videoStream = data.streams.find(
            (s: any) => s.codec_type === "video"
          );
          if (!videoStream) {
            resolve(null);
            return;
          }

          resolve({
            duration: parseFloat(data.format.duration || "0"),
            fps: eval(videoStream.r_frame_rate || "30/1"),
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            codec: videoStream.codec_name || "unknown",
            bitrate: data.format.bit_rate || "unknown",
          });
        } catch (err) {
          resolve(null);
        }
      });

      ffprobe.on("error", () => {
        resolve(null);
      });
    });
  }

  /**
   * Assess video suitability for pose extraction
   *
   * Returns quality score 0-1 based on:
   * - Duration (should be 20+ seconds)
   * - Resolution (should be 720p+)
   * - Frame rate (should be 24+ fps)
   */
  static async assessVideoQuality(videoPath: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const metadata = await this.probeVideo(videoPath);
    if (!metadata) {
      return {
        score: 0,
        issues: ["Could not read video metadata"],
        recommendations: ["Verify the video file is valid and readable"],
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Duration check
    if (metadata.duration < 20) {
      issues.push(`Video too short (${metadata.duration.toFixed(1)}s, need 20+)`);
      score -= 0.3;
      recommendations.push("Record a longer video (20-30 seconds minimum)");
    }

    // Resolution check
    if (metadata.width < 720 || metadata.height < 480) {
      issues.push(
        `Low resolution (${metadata.width}x${metadata.height}, need 720p+)`
      );
      score -= 0.2;
      recommendations.push("Use higher resolution video (720p or better)");
    }

    // Frame rate check
    if (metadata.fps < 24) {
      issues.push(`Low frame rate (${metadata.fps.toFixed(1)} fps, need 24+)`);
      score -= 0.1;
      recommendations.push("Use video with at least 24 fps");
    }

    // Codec check
    if (!["h264", "hevc", "vp9"].includes(metadata.codec)) {
      recommendations.push(
        `Video codec ${metadata.codec} may need conversion`
      );
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      issues,
      recommendations,
    };
  }
}
