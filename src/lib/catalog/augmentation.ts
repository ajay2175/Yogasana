/**
 * Catalog Augmentation System
 * Merges extracted pose data into asana-catalog.json with provenance tracking
 */

import type { ExtractedFrame } from "@/lib/mocap/video-pose-extractor";

export interface AugmentationRecord {
  id: string; // unique ID for this augmentation
  asanaSlug: string;
  sourceType: "yoga-82" | "mocap-video" | "manual-annotation";
  sourceMetadata: {
    instructor?: string;
    date: string;
    confidence: number;
    stability: number;
    validFrameCount: number;
    totalFrameCount: number;
  };
  keyframes: ExtractedFrame[];
  averageLandmarks?: Array<{
    index: number;
    x: number;
    y: number;
    z: number;
    visibility: number;
  }>;
  status: "pending" | "approved" | "rejected";
  appliedAt?: string;
  notes?: string;
}

/**
 * Catalog structure enhancement with extraction history
 */
export interface AugmentedAsanaEntry {
  // ... existing asana fields ...
  augmentations?: AugmentationRecord[];
  preferredLandmarks?: {
    source: string;
    landmarks: any[];
    confidence: number;
  };
  lastAugmented?: string;
}

/**
 * Storage for pending augmentations (in-memory or filesystem)
 * In production, use a database
 */
export class AugmentationStore {
  private augmentations: Map<string, AugmentationRecord[]> = new Map();

  /**
   * Add new extraction as pending augmentation
   */
  addAugmentation(record: AugmentationRecord): void {
    const key = record.asanaSlug;
    if (!this.augmentations.has(key)) {
      this.augmentations.set(key, []);
    }
    this.augmentations.get(key)!.push(record);
  }

  /**
   * Get pending augmentations for an asana
   */
  getPending(asanaSlug: string): AugmentationRecord[] {
    return (this.augmentations.get(asanaSlug) || []).filter(
      (a) => a.status === "pending"
    );
  }

  /**
   * Get all augmentations (approved + pending) for an asana
   */
  getAllForAsana(asanaSlug: string): AugmentationRecord[] {
    return this.augmentations.get(asanaSlug) || [];
  }

  /**
   * Approve augmentation and apply to catalog
   */
  approveAugmentation(
    asanaSlug: string,
    augmentationId: string
  ): AugmentationRecord | null {
    const records = this.augmentations.get(asanaSlug);
    if (!records) return null;

    const index = records.findIndex((a) => a.id === augmentationId);
    if (index === -1) return null;

    const record = records[index];
    record.status = "approved";
    record.appliedAt = new Date().toISOString();
    return record;
  }

  /**
   * Reject augmentation
   */
  rejectAugmentation(
    asanaSlug: string,
    augmentationId: string,
    reason: string
  ): void {
    const records = this.augmentations.get(asanaSlug);
    if (!records) return;

    const record = records.find((a) => a.id === augmentationId);
    if (record) {
      record.status = "rejected";
      record.notes = reason;
    }
  }
}

/**
 * Compute average landmarks from multiple extraction frames
 * Useful for creating a canonical pose representation
 */
export function computeAverageLandmarks(
  keyframes: ExtractedFrame[]
): Array<{
  index: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
}> {
  if (keyframes.length === 0) return [];

  const numLandmarks = keyframes[0].landmarks.length;
  const averages: Array<{
    index: number;
    x: number;
    y: number;
    z: number;
    visibility: number;
  }> = [];

  for (let i = 0; i < numLandmarks; i++) {
    const samples = keyframes
      .map((f) => f.landmarks[i])
      .filter((l) => l && (l.visibility ?? 0) > 0.5);

    if (samples.length === 0) continue;

    const avg = {
      index: i,
      x: samples.reduce((sum, l) => sum + l.x, 0) / samples.length,
      y: samples.reduce((sum, l) => sum + l.y, 0) / samples.length,
      z: samples.reduce((sum, l) => sum + l.z, 0) / samples.length,
      visibility:
        samples.reduce((sum, l) => sum + (l.visibility ?? 0), 0) / samples.length,
    };
    averages.push(avg);
  }

  return averages;
}

/**
 * Create provenance-tracked augmentation from extraction result
 */
export function createAugmentationFromExtraction(
  asanaSlug: string,
  validFrames: ExtractedFrame[],
  keyframes: ExtractedFrame[],
  confidence: number,
  stability: number,
  instructor?: string
): AugmentationRecord {
  return {
    id: `extraction_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    asanaSlug,
    sourceType: "mocap-video",
    sourceMetadata: {
      instructor: instructor || "Unknown",
      date: new Date().toISOString(),
      confidence,
      stability,
      validFrameCount: validFrames.length,
      totalFrameCount: validFrames.length + (keyframes.length - validFrames.length),
    },
    keyframes,
    averageLandmarks: computeAverageLandmarks(keyframes),
    status: "pending",
  };
}

/**
 * Merge augmentations into catalog entry
 * Keeps history and allows rollback
 */
export function mergeAugmentationIntoCatalog(
  catalogEntry: any,
  augmentation: AugmentationRecord
): any {
  const updated = { ...catalogEntry };

  if (!updated.augmentations) {
    updated.augmentations = [];
  }

  updated.augmentations.push(augmentation);

  // Update preferred landmarks if this augmentation has high confidence
  if (
    augmentation.status === "approved" &&
    augmentation.sourceMetadata.confidence > 0.8
  ) {
    updated.preferredLandmarks = {
      source: `${augmentation.sourceType} (${augmentation.sourceMetadata.instructor})`,
      landmarks: augmentation.averageLandmarks || [],
      confidence: augmentation.sourceMetadata.confidence,
    };
    updated.lastAugmented = augmentation.appliedAt || new Date().toISOString();
  }

  return updated;
}

/**
 * Quality report for augmentation review
 */
export function generateAugmentationReport(
  augmentation: AugmentationRecord
): {
  asanaSlug: string;
  score: number;
  summary: string;
  recommendations: string[];
} {
  const { sourceMetadata, keyframes } = augmentation;
  const score =
    sourceMetadata.confidence * 0.6 + sourceMetadata.stability * 0.4;
  const validRatio =
    sourceMetadata.validFrameCount / sourceMetadata.totalFrameCount;

  const recommendations: string[] = [];

  if (score < 0.7) {
    recommendations.push("⚠️ Low confidence - consider manual review");
  }
  if (sourceMetadata.stability < 0.7) {
    recommendations.push("⚠️ Low stability - pose hold was inconsistent");
  }
  if (validRatio < 0.5) {
    recommendations.push("⚠️ Many invalid frames - check lighting and visibility");
  }
  if (score >= 0.85 && validRatio > 0.7) {
    recommendations.push("✅ High quality - safe to apply automatically");
  }

  return {
    asanaSlug: augmentation.asanaSlug,
    score: Math.round(score * 100) / 100,
    summary: `${sourceMetadata.instructor} - ${sourceMetadata.validFrameCount}/${sourceMetadata.totalFrameCount} valid frames`,
    recommendations,
  };
}
