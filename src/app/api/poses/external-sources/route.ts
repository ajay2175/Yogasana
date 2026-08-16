import { NextResponse } from "next/server";
import { Yoga82DataSource, PoseFormatNormalizer } from "@/lib/yoga-api/yoga-data-sources";

/**
 * GET /api/poses/external-sources
 * Fetch verified pose data from external yoga datasets (Yoga-82, etc.)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "yoga-82";
  const poseSlug = searchParams.get("pose");

  try {
    if (source === "yoga-82") {
      const yoga82 = new Yoga82DataSource();
      const references = yoga82.getLocalPoseReferences();

      if (poseSlug && poseSlug in references) {
        const poseRef = references[poseSlug as keyof typeof references];
        return NextResponse.json({
          success: true,
          pose: poseSlug,
          source: "Yoga-82",
          landmarks: poseRef.keypoints[0]?.joints || [],
          metadata: poseRef.metadata,
        });
      }

      return NextResponse.json({
        success: true,
        available: Object.keys(references),
        source: "Yoga-82",
        message: "Use ?pose=trikonasana to fetch specific pose landmarks",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Unknown source: ${source}`,
        available_sources: ["yoga-82"],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching external pose source:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
