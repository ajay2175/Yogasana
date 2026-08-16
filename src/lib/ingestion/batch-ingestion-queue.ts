/**
 * Batch Ingestion Queue
 * Takes discovered videos and processes them in parallel:
 * Download → Transcribe → Extract → Enrich
 */

import type { ContentCandidate } from "./discovery-engine";

export interface IngestionJob {
  jobId: string;
  batchId: string;
  sourceUrl: string;
  platform: "youtube" | "vimeo" | "web" | "self-hosted";
  title: string;
  channel?: string;
  topic: string;
  status: "queued" | "downloading" | "transcribing" | "completed" | "failed";
  progress: number; // 0-100
  result?: {
    transcript: Array<{ startSec: number; endSec: number; text: string; confidence?: number }>;
    duration: number;
    language: string;
    summary?: string;
  };
  error?: string;
  retries: number;
  createdAt: string;
  completedAt?: string;
}

export interface BatchIngestionState {
  batchId: string;
  topic: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  progress: number;
  createdAt: string;
  completedAt?: string;
}

/**
 * File-based job store (upgrade to database later)
 */
class JobStore {
  private jobsDir = "./data/ingest-jobs";
  private batchDir = "./data/ingest-batches";

  async saveJob(job: IngestionJob): Promise<void> {
    // In production, write to Postgres
    // For now, log to console
    console.log(`[JobStore] Saving job: ${job.jobId}`);
  }

  async getJob(jobId: string): Promise<IngestionJob | null> {
    // Retrieve from store
    return null;
  }

  async getJobsByBatch(batchId: string): Promise<IngestionJob[]> {
    return [];
  }

  async getJobsByStatus(status: string): Promise<IngestionJob[]> {
    return [];
  }

  async saveBatch(batch: BatchIngestionState): Promise<void> {
    console.log(`[JobStore] Saving batch: ${batch.batchId}`);
  }

  async getBatch(batchId: string): Promise<BatchIngestionState | null> {
    return null;
  }
}

/**
 * Batch Ingestion Queue Manager
 */
export class BatchIngestionQueue {
  private jobStore = new JobStore();
  private concurrency = 3; // Process 3 videos at once
  private activeJobs = new Map<string, Promise<void>>();

  /**
   * Start ingestion batch for topic
   */
  async startBatch(topic: string, candidates: ContentCandidate[]): Promise<string> {
    const batchId = `batch_${Date.now()}`;

    console.log(`📦 Starting batch ingestion for topic: "${topic}"`);
    console.log(`📺 Processing ${candidates.length} videos`);

    // Create jobs from candidates
    const jobs: IngestionJob[] = candidates.map((c, idx) => ({
      jobId: `${batchId}_${idx}`,
      batchId,
      sourceUrl: c.sourceUrl,
      platform: c.platform,
      title: c.title,
      channel: c.channel,
      topic,
      status: "queued",
      progress: 0,
      retries: 0,
      createdAt: new Date().toISOString(),
    }));

    // Save batch metadata
    const batch: BatchIngestionState = {
      batchId,
      topic,
      totalJobs: jobs.length,
      completedJobs: 0,
      failedJobs: 0,
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    await this.jobStore.saveBatch(batch);

    // Queue all jobs
    for (const job of jobs) {
      await this.jobStore.saveJob(job);
    }

    // Start worker
    this.startWorker(batchId);

    return batchId;
  }

  /**
   * Process jobs from queue
   * Maintains concurrency limit
   */
  private async startWorker(batchId: string) {
    // Check how many jobs are active
    const active = Array.from(this.activeJobs.values()).length;

    if (active >= this.concurrency) {
      console.log(`⏳ At concurrency limit (${this.concurrency}), waiting...`);
      return;
    }

    // Get next queued job
    const jobs = await this.jobStore.getJobsByBatch(batchId);
    const queued = jobs.filter((j) => j.status === "queued").slice(0, 1);

    if (queued.length === 0) {
      console.log(`✅ All jobs in batch ${batchId} processed`);
      return;
    }

    const job = queued[0];

    // Process job
    const promise = this.processJob(job).then(() => {
      this.activeJobs.delete(job.jobId);
      // Start next job
      this.startWorker(batchId);
    });

    this.activeJobs.set(job.jobId, promise);

    // Try to start another job (up to concurrency limit)
    if (active + 1 < this.concurrency) {
      this.startWorker(batchId);
    }
  }

  /**
   * Process single job: Download → Transcribe
   */
  private async processJob(job: IngestionJob): Promise<void> {
    try {
      console.log(`🎬 Processing job: ${job.jobId}`);
      console.log(`   ${job.title}`);

      // Step 1: Get video metadata
      job.status = "downloading";
      job.progress = 10;
      await this.jobStore.saveJob(job);

      const metadata = await this.getVideoMetadata(job.sourceUrl, job.platform);
      if (!metadata) {
        throw new Error("Failed to get video metadata");
      }

      // Step 2: Transcribe
      job.status = "transcribing";
      job.progress = 30;
      await this.jobStore.saveJob(job);

      console.log(`   🎙️ Transcribing... (${Math.round(metadata.duration / 60)} min)`);
      const transcript = await this.transcribeVideo(job.sourceUrl, job.platform);

      job.result = {
        transcript,
        duration: metadata.duration,
        language: "en",
      };

      // Generate summary
      job.progress = 90;
      await this.jobStore.saveJob(job);

      console.log(`   ✅ Transcribed: ${transcript.length} segments`);

      // Mark complete
      job.status = "completed";
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      await this.jobStore.saveJob(job);

      console.log(`   ✨ Complete!`);
    } catch (err) {
      job.error = err instanceof Error ? err.message : "Unknown error";
      job.retries++;

      if (job.retries < 3) {
        job.status = "queued";
        console.log(`   ⚠️ Retry ${job.retries}/3`);
      } else {
        job.status = "failed";
        console.log(`   ❌ Failed after ${job.retries} retries`);
      }

      await this.jobStore.saveJob(job);
    }
  }

  /**
   * Get video metadata (duration, etc.)
   */
  private async getVideoMetadata(
    sourceUrl: string,
    platform: string
  ): Promise<{ duration: number } | null> {
    if (platform === "youtube") {
      // For YouTube, we already got duration in discovery
      // For now, estimate based on typical video length
      return { duration: 1200 }; // 20 minutes default
    }

    return { duration: 1200 };
  }

  /**
   * Transcribe video using Whisper
   * Falls back to YouTube captions if available
   */
  private async transcribeVideo(
    sourceUrl: string,
    platform: string
  ): Promise<Array<{ startSec: number; endSec: number; text: string; confidence?: number }>> {
    // Step 1: Try to get captions from platform
    if (platform === "youtube") {
      const captions = await this.fetchYouTubeCaption(sourceUrl);
      if (captions.length > 0) {
        console.log(`   📝 Using YouTube captions`);
        return captions;
      }
    }

    // Step 2: Download audio and transcribe with Whisper
    console.log(`   🎙️ Running Whisper transcription...`);
    const transcript = await this.transcribeWithWhisper(sourceUrl);

    return transcript;
  }

  /**
   * Fetch auto-generated or manual captions from YouTube
   */
  private async fetchYouTubeCaption(
    youtubeUrl: string
  ): Promise<Array<{ startSec: number; endSec: number; text: string }>> {
    // Extract video ID
    const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (!match) return [];

    const videoId = match[1];

    try {
      // Use yt-dlp to fetch captions
      // Command: yt-dlp --write-auto-sub --skip-download <url>
      // Parse the resulting .vtt file

      // For now, return empty (would be implemented in production)
      return [];
    } catch (err) {
      console.warn("Failed to fetch YouTube captions:", err);
      return [];
    }
  }

  /**
   * Transcribe audio using Whisper
   * Uses faster-whisper for speed
   */
  private async transcribeWithWhisper(
    sourceUrl: string
  ): Promise<Array<{ startSec: number; endSec: number; text: string; confidence?: number }>> {
    // In production:
    // 1. Download video with yt-dlp
    // 2. Extract audio: ffmpeg -i video.mp4 -f mp3 audio.mp3
    // 3. Run Whisper: whisper audio.mp3 --output_format json
    // 4. Parse JSON output

    // For now, return mock data
    return [
      { startSec: 0, endSec: 5, text: "Welcome to today's session", confidence: 0.95 },
      { startSec: 5, endSec: 15, text: "We're going to explore the basics of this practice", confidence: 0.93 },
      { startSec: 15, endSec: 30, text: "Make sure you have a comfortable space and clear mind", confidence: 0.91 },
    ];
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<BatchIngestionState | null> {
    const batch = await this.jobStore.getBatch(batchId);
    if (!batch) return null;

    const jobs = await this.jobStore.getJobsByBatch(batchId);
    batch.completedJobs = jobs.filter((j) => j.status === "completed").length;
    batch.failedJobs = jobs.filter((j) => j.status === "failed").length;
    batch.progress = Math.round(((batch.completedJobs + batch.failedJobs) / batch.totalJobs) * 100);

    if (batch.completedJobs + batch.failedJobs === batch.totalJobs) {
      batch.completedAt = new Date().toISOString();
    }

    return batch;
  }

  /**
   * Get all jobs in batch
   */
  async getJobsByBatch(batchId: string): Promise<IngestionJob[]> {
    return this.jobStore.getJobsByBatch(batchId);
  }
}
