import { NextResponse } from "next/server";
import {
  createAugmentationFromExtraction,
  AugmentationStore,
  generateAugmentationReport,
} from "@/lib/catalog/augmentation";
import type { ExtractedFrame } from "@/lib/mocap/video-pose-extractor";

// In-memory store for this session
// In production, use a database
const augmentationStore = new AugmentationStore();

/**
 * POST /api/catalog/augment
 * Submit extracted pose for catalog augmentation
 *
 * Body:
 * {
 *   "asanaSlug": "trikonasana",
 *   "validFrames": [...],
 *   "keyframes": [...],
 *   "confidence": 0.92,
 *   "stability": 0.87,
 *   "instructor": "John Doe"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      asanaSlug,
      validFrames = [],
      keyframes = [],
      confidence = 0,
      stability = 0,
      instructor,
    } = body;

    if (!asanaSlug) {
      return NextResponse.json(
        { success: false, error: "Missing asanaSlug" },
        { status: 400 }
      );
    }

    // Create augmentation record
    const augmentation = createAugmentationFromExtraction(
      asanaSlug,
      validFrames as ExtractedFrame[],
      keyframes as ExtractedFrame[],
      confidence,
      stability,
      instructor
    );

    // Store in augmentation store
    augmentationStore.addAugmentation(augmentation);

    // Generate quality report
    const report = generateAugmentationReport(augmentation);

    return NextResponse.json({
      success: true,
      augmentationId: augmentation.id,
      asanaSlug,
      report,
      message: "Extraction submitted for review",
    });
  } catch (error) {
    console.error("Error creating augmentation:", error);
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
 * GET /api/catalog/augment?asanaSlug=trikonasana&status=pending
 * Get pending augmentations for review
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asanaSlug = searchParams.get("asanaSlug");
  const status = searchParams.get("status") || "pending";

  if (!asanaSlug) {
    return NextResponse.json(
      { success: false, error: "Missing asanaSlug" },
      { status: 400 }
    );
  }

  const augmentations =
    status === "pending"
      ? augmentationStore.getPending(asanaSlug)
      : augmentationStore.getAllForAsana(asanaSlug);

  const reports = augmentations.map((a) => ({
    ...a,
    report: generateAugmentationReport(a),
  }));

  return NextResponse.json({
    success: true,
    asanaSlug,
    count: augmentations.length,
    augmentations: reports,
  });
}
