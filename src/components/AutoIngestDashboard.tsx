"use client";

import { useState } from "react";

export function AutoIngestDashboard() {
  const [topic, setTopic] = useState("ayurveda");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batch, setBatch] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/ingest/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, limit: 50 }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start ingestion");
        return;
      }

      setBatchId(data.batchId);
      setBatch({
        topic: data.topic,
        totalJobs: data.totalFound,
        completedJobs: 0,
        failedJobs: 0,
        progress: 0,
        createdAt: new Date().toISOString(),
        jobs: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poll for status updates
  useState(() => {
    if (!batchId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ingest/batch/status?batchId=${batchId}`);
        const data = await response.json();

        if (data.success) {
          setBatch(data);

          // Stop polling when complete
          if (data.progress === 100) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Status poll error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [batchId]);

  return (
    <div className="space-y-6 rounded-3xl border-2 border-gradient-to-r from-purple-300 to-indigo-300 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8 shadow-lg">
      {/* Header */}
      <div className="text-center">
        <div className="mb-2 text-4xl">🤖</div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Auto Yoga Content Ingestion
        </h2>
        <p className="mt-2 text-gray-600">
          Say a topic → Auto-discover → Transcribe → Done
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enter Topic (e.g., ayurveda, yoga, meditation, nutrition)
          </label>
          <input
            type="text"
            placeholder="Type any topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isSubmitting || !!batchId}
            className="w-full rounded-xl border-2 border-purple-200 bg-white px-4 py-3 text-lg font-medium placeholder-gray-400 disabled:bg-gray-100 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !!batchId || !topic}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-lg font-bold text-white disabled:opacity-50 hover:shadow-lg transition-shadow"
        >
          {isSubmitting ? "🔍 Discovering..." : "🚀 Start Auto Ingestion"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {/* Progress Display */}
      {batch && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
              <p className="text-xs font-semibold text-blue-700 uppercase">Found</p>
              <p className="text-2xl font-bold text-blue-600">{batch.totalJobs}</p>
            </div>

            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-xs font-semibold text-green-700 uppercase">✅ Done</p>
              <p className="text-2xl font-bold text-green-600">{batch.completedJobs}</p>
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
              <p className="text-xs font-semibold text-red-700 uppercase">❌ Failed</p>
              <p className="text-2xl font-bold text-red-600">{batch.failedJobs}</p>
            </div>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center">
              <p className="text-xs font-semibold text-yellow-700 uppercase">⏳ Queue</p>
              <p className="text-2xl font-bold text-yellow-600">
                {batch.totalJobs - batch.completedJobs - batch.failedJobs}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-700">Progress</span>
              <span className="font-bold text-purple-600">{batch.progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 transition-all duration-300"
                style={{ width: `${batch.progress}%` }}
              />
            </div>
          </div>

          {/* Topic Info */}
          <div className="rounded-lg bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Topic:</span> <span className="text-lg text-purple-600 font-bold">{batch.topic}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Started: {new Date(batch.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Job List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Recent Jobs</h3>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
              {batch.jobs?.length > 0 ? (
                batch.jobs.slice(0, 10).map((job: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{job.title}</p>
                      {job.channel && <p className="text-xs text-gray-500">{job.channel}</p>}
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <div className="w-20">
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full ${
                              job.status === "completed"
                                ? "bg-green-500"
                                : job.status === "failed"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${
                          job.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : job.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">Loading jobs...</p>
              )}
            </div>
          </div>

          {/* Results Preview */}
          {batch.results?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">📝 Completed Transcriptions</h3>
              <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4">
                {batch.results.map((result: any, idx: number) => (
                  <div key={idx} className="border-b border-green-100 pb-2 text-sm last:border-b-0">
                    <p className="font-medium text-gray-800">{result.title}</p>
                    <p className="text-xs text-gray-600">
                      📺 {result.channel} • 📝 {result.transcriptSegments} segments •{" "}
                      {Math.round(result.duration / 60)} min
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {batch.progress === 100 && (
            <div className="rounded-lg bg-green-50 border-2 border-green-300 p-4 text-center">
              <p className="text-lg font-bold text-green-700">
                ✨ Ingestion Complete!
              </p>
              <p className="text-sm text-green-600 mt-1">
                {batch.completedJobs} videos transcribed and indexed
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!batch && !isSubmitting && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Enter a topic above and click "Start Auto Ingestion"
          </p>
        </div>
      )}
    </div>
  );
}
