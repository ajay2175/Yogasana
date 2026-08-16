"use client";

import { useState } from "react";
import type { RecommendationScore } from "@/lib/recommendations/instructor-ranker";

interface InstructorRecommendationsProps {
  asanaSlug: string;
  studentExperience?: "beginner" | "intermediate" | "advanced";
  studentGoals?: string[];
  studentLimitations?: string[];
  preferredStyle?: string;
}

export function InstructorRecommendations({
  asanaSlug,
  studentExperience = "beginner",
  studentGoals = ["flexibility"],
  studentLimitations = [],
  preferredStyle,
}: InstructorRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommendations/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asanaSlug,
          studentProfile: {
            experience: studentExperience,
            goals: studentGoals,
            limitations: studentLimitations,
            learningStyle: "visual",
            preferredStyle: preferredStyle || undefined,
            watchHistory: [],
            ratings: [],
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div>
        <h3 className="font-semibold text-purple-900">👨‍🏫 Find Your Instructor</h3>
        <p className="text-sm text-purple-800">
          Personalized recommendations for {asanaSlug}
        </p>
      </div>

      <button
        onClick={handleGetRecommendations}
        disabled={isLoading}
        className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {isLoading ? "Finding instructors..." : "Get Recommendations"}
      </button>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div key={rec.instructorId} className="space-y-2 rounded-lg bg-white p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">
                    #{idx + 1} — {rec.instructorName}
                  </p>
                  <p className="text-xs text-gray-600">{rec.explanation}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">{rec.score}</p>
                  <p className="text-xs text-gray-500">match</p>
                </div>
              </div>

              {/* Factor breakdown */}
              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2 text-xs">
                <div>
                  <p className="text-gray-600">Quality</p>
                  <p className="font-medium">{(rec.factors.qualityMatch * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Style</p>
                  <p className="font-medium">{(rec.factors.styleMatch * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Expertise</p>
                  <p className="font-medium">{(rec.factors.specialtyMatch * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Safe</p>
                  <p className="font-medium">{(rec.factors.limitationSafety * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && recommendations.length === 0 && !error && (
        <p className="text-sm text-gray-500">Click above to see recommendations</p>
      )}
    </div>
  );
}
