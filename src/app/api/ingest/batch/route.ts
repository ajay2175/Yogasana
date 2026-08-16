import { NextResponse } from "next/server";
import { DiscoveryEngine } from "@/lib/ingestion/discovery-engine";
import { BatchIngestionQueue } from "@/lib/ingestion/batch-ingestion-queue";

const discoveryEngine = new DiscoveryEngine();
const ingestionQueue = new BatchIngestionQueue();

/**
 * POST /api/ingest/batch
 * Start auto-discovery and ingestion for any topic
 *
 * Request:
 * {
 *   "topic": "ayurveda",
 *   "limit": 50 (optional)
 * }
 *
 * Response (202 Accepted):
 * {
 *   "success": true,
 *   "batchId": "batch_...",
 *   "topic": "ayurveda",
 *   "totalFound": 47,
 *   "statusUrl": "/api/ingest/batch/status?batchId=..."
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, limit = 50 } = body;

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid topic" },
        { status: 400 }
      );
    }

    console.log(`\n🚀 Starting ingestion batch for topic: "${topic}"`);

    // Step 1: Discover content
    console.log(`🔍 Discovering content...`);
    const discovery = await discoveryEngine.discoverByTopic(topic, limit);

    if (discovery.totalFound === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No content found for topic: "${topic}"`,
        },
        { status: 404 }
      );
    }

    // Step 2: Start batch ingestion
    console.log(`📦 Queuing ${discovery.totalFound} videos for ingestion...`);
    const batchId = await ingestionQueue.startBatch(topic, discovery.candidates);

    console.log(`✅ Batch created: ${batchId}\n`);

    return NextResponse.json(
      {
        success: true,
        batchId,
        topic,
        totalFound: discovery.totalFound,
        sources: discovery.sources,
        message: `Discovered ${discovery.totalFound} videos for "${topic}". Starting transcription...`,
        statusUrl: `/api/ingest/batch/status?batchId=${batchId}`,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Batch ingestion error:", error);
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
 * GET /api/ingest/batch/status?batchId=batch_...
 * Get status of ingestion batch
 *
 * Response:
 * {
 *   "success": true,
 *   "batchId": "batch_...",
 *   "topic": "ayurveda",
 *   "totalJobs": 47,
 *   "completedJobs": 12,
 *   "failedJobs": 1,
 *   "progress": 28,
 *   "jobs": [
 *     {
 *       "jobId": "batch_..._0",
 *       "title": "Ayurveda Basics - Doshas Explained",
 *       "channel": "Yoga With Adriene",
 *       "status": "completed",
 *       "progress": 100
 *     }
 *   ]
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: "Missing batchId" },
        { status: 400 }
      );
    }

    const batch = await ingestionQueue.getBatchStatus(batchId);

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const jobs = await ingestionQueue.getJobsByBatch(batchId);

    // Group by status for summary
    const byStatus = {
      completed: jobs.filter((j) => j.status === "completed"),
      failed: jobs.filter((j) => j.status === "failed"),
      active: jobs.filter((j) => j.status === "downloading" || j.status === "transcribing"),
      queued: jobs.filter((j) => j.status === "queued"),
    };

    return NextResponse.json({
      success: true,
      batchId,
      topic: batch.topic,
      totalJobs: batch.totalJobs,
      completedJobs: batch.completedJobs,
      failedJobs: batch.failedJobs,
      progress: batch.progress,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
      status: {
        completed: byStatus.completed.length,
        failed: byStatus.failed.length,
        active: byStatus.active.length,
        queued: byStatus.queued.length,
      },
      // Sample of jobs
      jobs: jobs.slice(0, 20).map((j) => ({
        jobId: j.jobId,
        title: j.title,
        channel: j.channel,
        status: j.status,
        progress: j.progress,
        error: j.error,
      })),
      // Detailed results for completed jobs
      results:
        byStatus.completed.length > 0
          ? byStatus.completed.slice(0, 5).map((j) => ({
              title: j.title,
              channel: j.channel,
              transcriptSegments: j.result?.transcript?.length || 0,
              duration: j.result?.duration,
            }))
          : [],
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
