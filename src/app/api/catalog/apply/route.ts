import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { mergeAugmentationIntoCatalog } from "@/lib/catalog/augmentation";
import type { AugmentationRecord } from "@/lib/catalog/augmentation";

// Note: In production, use a database instead of filesystem
const CATALOG_PATH = join(process.cwd(), "src/data/asana-catalog.json");

/**
 * POST /api/catalog/apply
 * Apply approved augmentation to the catalog
 *
 * Body:
 * {
 *   "asanaSlug": "trikonasana",
 *   "augmentationId": "extraction_...",
 *   "action": "approve" | "reject"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { asanaSlug, augmentationId, action } = body;

    if (!asanaSlug || !augmentationId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: asanaSlug, augmentationId, action",
        },
        { status: 400 }
      );
    }

    // Read current catalog
    const catalogJson = readFileSync(CATALOG_PATH, "utf-8");
    const catalog = JSON.parse(catalogJson);

    // Find asana entry
    const asanaIndex = catalog.asanas.findIndex(
      (a: any) => a.identity.slug === asanaSlug
    );

    if (asanaIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Asana not found: ${asanaSlug}` },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // In a real implementation, fetch the augmentation from database
      // For now, return a placeholder
      return NextResponse.json({
        success: true,
        message:
          "Augmentation approved (full implementation requires database)",
        asanaSlug,
        augmentationId,
      });
    } else if (action === "reject") {
      return NextResponse.json({
        success: true,
        message: "Augmentation rejected",
        asanaSlug,
        augmentationId,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error applying augmentation:", error);
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
 * GET /api/catalog/backup
 * Create backup of current catalog before augmentation
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "backup") {
      const catalogJson = readFileSync(CATALOG_PATH, "utf-8");
      const backup = {
        timestamp: new Date().toISOString(),
        filename: `catalog-backup-${Date.now()}.json`,
        data: JSON.parse(catalogJson),
      };

      return NextResponse.json({
        success: true,
        message: "Catalog backup created",
        backup,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error backing up catalog:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
