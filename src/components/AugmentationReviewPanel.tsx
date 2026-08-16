"use client";

import { useState, useEffect } from "react";
import type { AugmentationRecord } from "@/lib/catalog/augmentation";

interface AugmentationWithReport extends AugmentationRecord {
  report: {
    asanaSlug: string;
    score: number;
    summary: string;
    recommendations: string[];
  };
}

interface AugmentationReviewPanelProps {
  asanaSlug: string;
  onApply?: (augmentationId: string) => void;
}

export function AugmentationReviewPanel({
  asanaSlug,
  onApply,
}: AugmentationReviewPanelProps) {
  const [augmentations, setAugmentations] = useState<AugmentationWithReport[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/catalog/augment?asanaSlug=${asanaSlug}&status=pending`
        );
        const data = await response.json();
        if (data.success) {
          setAugmentations(data.augmentations);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPending();
  }, [asanaSlug]);

  const handleApprove = async (augmentationId: string) => {
    try {
      const response = await fetch("/api/catalog/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asanaSlug,
          augmentationId,
          action: "approve",
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Remove from list
        setAugmentations((prev) =>
          prev.filter((a) => a.id !== augmentationId)
        );
        onApply?.(augmentationId);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    }
  };

  const handleReject = async (augmentationId: string, reason: string) => {
    try {
      const response = await fetch("/api/catalog/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asanaSlug,
          augmentationId,
          action: "reject",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAugmentations((prev) =>
          prev.filter((a) => a.id !== augmentationId)
        );
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Loading augmentations...</div>;
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-700">
        <p className="text-sm font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (augmentations.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        ✅ No pending augmentations
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-950">
        📋 Review {augmentations.length} Pending Augmentation
        {augmentations.length !== 1 ? "s" : ""}
      </h3>

      {augmentations.map((aug) => (
        <div
          key={aug.id}
          className="space-y-2 rounded-lg border border-amber-100 bg-white p-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">{aug.report.summary}</p>
              <p className="text-xs text-gray-500">
                {new Date(aug.sourceMetadata.date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-600">
                {Math.round(aug.report.score * 100)}%
              </p>
              <p className="text-xs text-gray-500">quality</p>
            </div>
          </div>

          <div className="space-y-1">
            {aug.report.recommendations.map((rec, idx) => (
              <p key={idx} className="text-xs text-gray-700">
                {rec}
              </p>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleApprove(aug.id)}
              className="flex-1 rounded bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              ✅ Approve
            </button>
            <button
              onClick={() =>
                handleReject(aug.id, "User rejected after review")
              }
              className="flex-1 rounded bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              ❌ Reject
            </button>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Details
            </summary>
            <div className="mt-2 space-y-1 text-gray-600">
              <p>
                Valid frames: {aug.sourceMetadata.validFrameCount}/
                {aug.sourceMetadata.totalFrameCount}
              </p>
              <p>Confidence: {(aug.sourceMetadata.confidence * 100).toFixed(0)}%</p>
              <p>Stability: {(aug.sourceMetadata.stability * 100).toFixed(0)}%</p>
              <p>Keyframes: {aug.keyframes.length}</p>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
