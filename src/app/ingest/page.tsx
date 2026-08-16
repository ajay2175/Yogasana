import { AutoIngestDashboard } from "@/components/AutoIngestDashboard";

export const metadata = {
  title: "Auto Content Ingestion | Yogasana",
  description: "Auto-discover, transcribe, and index yoga and wellness content",
};

export default function IngestPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-4xl">
        <AutoIngestDashboard />

        {/* Info Section */}
        <div className="mt-12 space-y-6 rounded-xl border border-gray-200 bg-white p-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">How It Works</h3>
            <ol className="mt-4 space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                  1
                </span>
                <span>
                  <strong>Enter Topic:</strong> Type any topic (ayurveda, yoga, meditation, etc.)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                  2
                </span>
                <span>
                  <strong>Auto-Discover:</strong> System searches YouTube, Vimeo, and web for relevant content
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                  3
                </span>
                <span>
                  <strong>Batch Process:</strong> All videos are transcribed in parallel (respects rate limits)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                  4
                </span>
                <span>
                  <strong>Enrich Database:</strong> Transcripts are indexed, instructor profiles updated, catalog expanded
                </span>
              </li>
            </ol>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-gray-900">Features</h3>
            <ul className="mt-4 space-y-2 text-gray-700">
              <li>✅ <strong>Multi-source Discovery:</strong> YouTube API, Vimeo, RSS feeds, web crawling</li>
              <li>✅ <strong>Parallel Processing:</strong> 3 concurrent transcriptions with queue management</li>
              <li>✅ <strong>Smart Transcription:</strong> YouTube captions first, then Whisper fallback</li>
              <li>✅ <strong>Automatic Retry:</strong> Failed videos retry up to 3 times</li>
              <li>✅ <strong>Generic & Extensible:</strong> Works for any topic, links to any knowledge base</li>
              <li>✅ <strong>Real-time Progress:</strong> Live status updates every 3 seconds</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-gray-900">Try It Now</h3>
            <p className="mt-2 text-gray-700">
              Examples: <code className="rounded bg-gray-100 px-2 py-1">ayurveda</code>{" "}
              <code className="rounded bg-gray-100 px-2 py-1">trikonasana</code>{" "}
              <code className="rounded bg-gray-100 px-2 py-1">meditation</code>{" "}
              <code className="rounded bg-gray-100 px-2 py-1">pranayama</code>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
