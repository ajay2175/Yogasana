# Phase 5: Auto Content Ingestion System

Generic, topic-based content discovery and transcription pipeline.

**Say "ayurveda" → Auto-discover all YouTube videos → Transcribe → Index → Done**

---

## Overview

The Auto Ingestion system discovers and transcribes ANY topic from multiple sources:

```
Input: "ayurveda"
    ↓
🔍 Discovery (YouTube API, Vimeo, web, allowlist)
    ↓
Found 47 videos
    ↓
📦 Queue for processing
    ↓
🎙️ Transcribe in parallel (3 concurrent)
    ↓
✅ Complete + Index
```

## Architecture

### Layer 1: Discovery Engine

**File:** `src/lib/ingestion/discovery-engine.ts`

Discovers content from multiple sources:

| Source | Method | Legal? |
|--------|--------|--------|
| YouTube | YouTube Data API v3 | ✅ Official, respects ToS |
| Vimeo | Vimeo API | ✅ Official |
| Web | Allowlist only | ✅ Direct URLs, no scraping |
| Allowlist | JSON file | ✅ User-controlled |

**Key Features:**
- Searches YouTube by topic with official API
- Ranks by relevance + view count
- Deduplicates across sources
- Extracts video metadata (duration, channel, captions)
- Filters by language preference

**Usage:**
```typescript
const engine = new DiscoveryEngine();
const discovery = await engine.discoverByTopic("ayurveda", 50);

console.log(`Found ${discovery.totalFound} videos`);
console.log(`Sources: ${JSON.stringify(discovery.sources)}`);
// Output:
// Found 47 videos
// Sources: { youtube: 45, vimeo: 2, web: 0, allowlist: 0 }
```

### Layer 2: Batch Ingestion Queue

**File:** `src/lib/ingestion/batch-ingestion-queue.ts`

Manages parallel transcription jobs:

- **Concurrency:** 3 videos at a time (configurable)
- **Status Tracking:** queued → downloading → transcribing → completed/failed
- **Retry Logic:** 3 automatic retries on failure
- **Job Store:** File-based (upgrade to Postgres for scale)

**Job Flow:**
```
Input: ContentCandidate[]
    ↓
Create IngestionJob for each
    ↓
Queue all jobs
    ↓
Process in parallel (max 3 active)
    ├── Get metadata
    ├── Download audio
    ├── Transcribe (Whisper)
    └── Save results
```

**Usage:**
```typescript
const queue = new BatchIngestionQueue();
const batchId = await queue.startBatch("ayurveda", candidates);

// Poll for progress
const status = await queue.getBatchStatus(batchId);
console.log(`${status.completedJobs}/${status.totalJobs} done`);
```

### Layer 3: Transcription Pipeline

Three-tier fallback strategy:

```
Tier 1: YouTube Official Captions
    ├── Fastest
    ├── ✅ If available
    └── Return immediately

Tier 2: Whisper Local
    ├── Download audio
    ├── Run Whisper (faster-whisper recommended)
    └── Parse JSON output

Tier 3: Cloud ASR (Future)
    └── AssemblyAI / Deepgram for scale
```

**Output Format:**
```typescript
interface TranscriptSegment {
  startSec: number;
  endSec: number;
  text: string;
  confidence?: number;
}
```

---

## API Endpoints

### POST /api/ingest/batch

Start auto-discovery and ingestion for a topic.

**Request:**
```bash
curl -X POST http://localhost:3000/api/ingest/batch \
  -H "Content-Type: application/json" \
  -d '{"topic": "ayurveda", "limit": 50}'
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "batchId": "batch_1723834567",
  "topic": "ayurveda",
  "totalFound": 47,
  "sources": {
    "youtube": 45,
    "vimeo": 2,
    "web": 0,
    "allowlist": 0
  },
  "message": "Discovered 47 videos for 'ayurveda'. Starting transcription...",
  "statusUrl": "/api/ingest/batch/status?batchId=batch_1723834567"
}
```

### GET /api/ingest/batch/status?batchId=...

Get real-time status of ingestion batch.

**Response:**
```json
{
  "success": true,
  "batchId": "batch_1723834567",
  "topic": "ayurveda",
  "totalJobs": 47,
  "completedJobs": 12,
  "failedJobs": 1,
  "progress": 28,
  "status": {
    "completed": 12,
    "failed": 1,
    "active": 2,
    "queued": 32
  },
  "jobs": [
    {
      "jobId": "batch_..._0",
      "title": "Ayurveda Basics - Doshas Explained",
      "channel": "Yoga With Adriene",
      "status": "completed",
      "progress": 100
    }
  ],
  "results": [
    {
      "title": "Introduction to Ayurveda",
      "channel": "Ayurvedic Healing",
      "transcriptSegments": 156,
      "duration": 2400
    }
  ]
}
```

---

## Web UI

**Page:** `/ingest`

Dashboard for starting and monitoring ingestion:

1. **Input:** Enter any topic
2. **Submit:** Click "Start Auto Ingestion"
3. **Monitor:** Real-time progress with:
   - Total found / Completed / Failed / Queued
   - Progress bar
   - Job list (most recent first)
   - Completed transcription preview

---

## Configuration

### Environment Variables

```bash
# YouTube Data API key (free tier: 10K quota/day)
YOUTUBE_API_KEY=your_key_here

# Vimeo Access Token (optional)
VIMEO_ACCESS_TOKEN=your_token_here
```

Get YouTube API key:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project
3. Enable YouTube Data API v3
4. Create API key (restrict to `youtube.googleapis.com`)
5. Add to `.env.local`

### Concurrency & Rate Limits

```typescript
// In BatchIngestionQueue
private concurrency = 3; // Adjust as needed

// YouTube API: 10K units/day (search ≈ 100 units each, video detail ≈ 1 unit)
// Whisper: Local (no limits) or cloud (check provider limits)
```

### Whisper Setup (Local)

```bash
# Install faster-whisper (recommended: 10x faster than official)
pip install faster-whisper

# Run locally
whisper audio.mp3 --output_format json --model base
```

---

## Data Flow

```
Topic Input (e.g., "ayurveda")
    ↓
DiscoveryEngine.discoverByTopic()
    ├── YouTube API search
    ├── Vimeo API search
    ├── Allowlist lookup
    └── Rank & deduplicate
    ↓
ContentCandidate[] (47 videos)
    ↓
BatchIngestionQueue.startBatch()
    ├── Create IngestionJob for each
    └── Queue all jobs
    ↓
processJob() × 3 (concurrent)
    ├── Download metadata
    ├── Fetch/transcribe captions
    ├── Parse transcript
    └── Save IngestionJob with results
    ↓
Job Results
    ├── Stored in JobStore (file/DB)
    ├── Accessible via /api/ingest/batch/status
    └── Ready for enrichment (Phase 6)
```

---

## Examples

### Example 1: Basic Ingestion

```bash
# Terminal
curl -X POST http://localhost:3000/api/ingest/batch \
  -H "Content-Type: application/json" \
  -d '{"topic": "pranayama"}'

# Response
{
  "batchId": "batch_1234567",
  "totalFound": 23,
  "statusUrl": "/api/ingest/batch/status?batchId=batch_1234567"
}

# Poll status
curl http://localhost:3000/api/ingest/batch/status?batchId=batch_1234567
```

### Example 2: React Component

```tsx
import { AutoIngestDashboard } from "@/components/AutoIngestDashboard";

export default function IngestPage() {
  return <AutoIngestDashboard />;
}
```

### Example 3: Programmatic Usage

```typescript
import { DiscoveryEngine } from "@/lib/ingestion/discovery-engine";
import { BatchIngestionQueue } from "@/lib/ingestion/batch-ingestion-queue";

async function ingestTopic(topic: string) {
  // Discover
  const engine = new DiscoveryEngine();
  const discovery = await engine.discoverByTopic(topic, 50);

  console.log(`Found ${discovery.totalFound} videos`);

  // Queue
  const queue = new BatchIngestionQueue();
  const batchId = await queue.startBatch(topic, discovery.candidates);

  console.log(`Batch ID: ${batchId}`);

  // Monitor (in real app, use polling)
  while (true) {
    const status = await queue.getBatchStatus(batchId);
    console.log(`Progress: ${status.progress}%`);

    if (status.progress === 100) break;
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log("✅ Done!");
}

await ingestTopic("ayurveda");
```

---

## How It Works: Step-by-Step

### 1️⃣ Discovery

User enters "ayurveda" → YouTube Data API searches for:
- Title contains "ayurveda"
- Type = video
- Sort by relevance
- Include captions (prefer closed captions)

Result: 45 YouTube videos + 2 Vimeo videos

### 2️⃣ Queueing

All 47 videos queued as `IngestionJob`:
- Status: `queued`
- Retries: 0
- Created at: now

### 3️⃣ Processing (3 concurrent)

Each job:
1. **Download metadata** (1 sec)
   - Duration, channel, captions availability
   - Update job progress: 10%

2. **Get captions** (2-5 sec)
   - Try YouTube official first
   - Fall back to Whisper if none
   - Update progress: 30%

3. **Transcribe** (duration-dependent)
   - If Whisper: audio downloaded + transcribed
   - For 10-min video: ~1-2 seconds (faster-whisper)
   - Update progress: 50% → 100%

4. **Save results**
   - Transcript segments stored in IngestionJob
   - Status: `completed`
   - Timestamp saved

### 4️⃣ Monitoring

Real-time dashboard shows:
- Progress bar (0-100%)
- Completed / Failed counts
- Recent job status
- Completed transcription preview

---

## Limitations & Future Enhancements

### Current Limitations

- Job store is file-based (single machine only)
- No clustering (all jobs on one server)
- Whisper runs on CPU (slow for large batches)
- No language detection (assumes English)

### Phase 6 Enhancements

- [ ] Postgres job store for multi-server
- [ ] Distributed processing (Celery or Bull queue)
- [ ] GPU Whisper for 10x speed
- [ ] Multi-language support
- [ ] Automatic enrichment (link to catalog, update instructor profiles)
- [ ] Vaidya Mitra integration (extract clinical data)
- [ ] Deduplication (same pose, different instructors)

---

## Troubleshooting

### "No content found for topic"

1. Check YouTube API key is valid: `curl "https://www.googleapis.com/youtube/v3/search?q=test&key=YOUR_KEY"`
2. Check quota isn't exceeded: [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)
3. Try a more specific topic (e.g., "ayurveda basics" instead of "ayurveda")

### "YouTube API error: 403"

1. Check API key has YouTube Data API v3 enabled
2. Check IP is whitelisted (if restricted)
3. Check quota: 10K units/day, searches cost ~100 units

### "Whisper not found"

Install locally:
```bash
pip install faster-whisper
# or
npm install whisper.cpp
```

### Videos not transcribed

1. Check job status: `/api/ingest/batch/status?batchId=...`
2. Look for `status: "failed"` and `error` field
3. Most common: video has no captions AND Whisper not installed

---

## Testing

### Test Discovery

```bash
curl -X POST http://localhost:3000/api/ingest/batch \
  -H "Content-Type: application/json" \
  -d '{"topic": "yoga basics", "limit": 10}'
```

Expected: ~5-10 YouTube videos found in <2 seconds

### Test Ingestion

Start batch, then poll:
```bash
curl http://localhost:3000/api/ingest/batch/status?batchId=batch_...
```

Watch progress increase every 5 seconds as videos are transcribed

### Test with Allowlist

Add video to `/public/video-sources-allowlist.json`, then ingest "ayurveda"

The allowlist video should be included (highest priority)

---

## See Also

- `INTEGRATION-GUIDE.md` — Phase 1-2 (basics)
- `CATALOG-AUGMENTATION.md` — Phase 2 (merging)
- `SERVER-PROCESSING.md` — Phase 3 (FFmpeg + GEM-X)
- `INSTRUCTOR-RECOMMENDATIONS.md` — Phase 4 (ML ranking)
