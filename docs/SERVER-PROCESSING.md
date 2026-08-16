# Step 3: Server-Side Processing (FFmpeg + NVIDIA GEM-X)

Advanced video processing with robust frame extraction and optional high-quality 3D pose estimation.

---

## Overview

**Browser extraction** (Phases 1-2) works great for quick feedback, but has limitations:
- Limited to real-time processing (slow for long videos)
- Browser memory constraints
- Can't leverage GPU acceleration

**Server-side processing** (Phase 3) addresses these:
- ✅ Robust FFmpeg frame extraction
- ✅ Optional NVIDIA GEM-X for 77-joint SOMA format
- ✅ Batch job processing with queue management
- ✅ Video quality assessment before processing
- ✅ 3D pose estimation and biomechanical analysis

---

## Installation & Setup

### System Requirements

**FFmpeg** (required):
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Verify installation
ffmpeg -version
ffprobe -version
```

**NVIDIA GEM-X** (optional, for advanced 77-joint extraction):
```bash
# Requires: Python 3.8+, CUDA-compatible GPU

pip install gem-x
# or from source: https://github.com/NVlabs/GEM-X

# Verify
python3 -c "from gem.models import GEM; print('✅ GEM-X available')"
```

### Environment

Add to `.env.local`:
```
NEXT_PUBLIC_SERVER_PROCESSING_ENABLED=true
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
GEMX_GPU_ID=0  # which GPU to use
```

---

## Features

### 1. FFmpeg Processor

Robust server-side frame extraction using FFmpeg system command.

```typescript
import { FFmpegProcessor, VideoQualityAnalyzer } from "@/lib/mocap/ffmpeg-processor";

// Submit job
const jobId = FFmpegProcessor.submitJob(videoPath, {
  fps: 5,        // frames per second
  format: "jpg", // png or jpg
  quality: 2,    // FFmpeg quality (0-31, lower=better)
  width: 800,
  height: 600,
  maxFrames: 300,
});

// Check status
const status = FFmpegProcessor.getJobStatus(jobId);
console.log(`Progress: ${status.progress}%`);
console.log(`Frames extracted: ${status.framesExtracted}`);

// Assess video before processing
const quality = await VideoQualityAnalyzer.assessVideoQuality(videoPath);
console.log(`Quality score: ${quality.score}`);
console.log("Issues:", quality.issues);
console.log("Recommendations:", quality.recommendations);
```

**Quality Metrics:**
- ✅ Duration ≥ 20 seconds
- ✅ Resolution ≥ 720p
- ✅ Frame rate ≥ 24 fps
- ✅ Codec: H.264, HEVC, VP9

### 2. NVIDIA GEM-X Integration

High-quality 77-joint SOMA pose extraction from monocular video.

```typescript
import { GEMXProcessor, PoseFormatConverter, SOMAAnalyzer } from "@/lib/mocap/nvidia-gem-x";

// Check availability
const available = await GEMXProcessor.checkGEMXAvailable();
if (available.available) {
  // Extract SOMA 77-joint poses
  const result = await GEMXProcessor.extractPoses(videoPath, "trikonasana");
  
  console.log(`Extracted ${result.frameCount} frames`);
  console.log(`77-joint poses: ${result.joints77.length}`);
  
  // Analyze poses
  const angles = SOMAAnalyzer.computeJointAngles(result.joints77[0], [
    [7, 8, 9],    // left shoulder-elbow-wrist
    [13, 14, 15], // right shoulder-elbow-wrist
    [20, 21, 22], // left hip-knee-ankle
    [26, 27, 28], // right hip-knee-ankle
  ]);
  
  console.log("Joint angles:", angles);
}

// Convert BlazePose to SOMA 77
const soma77 = PoseFormatConverter.blazePoseToSOMA77(blazePose33);
```

**SOMA 77 Joint Format:**
- Full skeletal hierarchy with 77 joints
- Includes fingers, toes, spine details
- Better for detailed biomechanical analysis
- More robust to occlusion

### 3. Job Queue System

Batch processing with queue management to control resource usage.

```typescript
// Single job at a time to avoid GPU overload
const jobId = FFmpegProcessor.submitJob(videoPath, options);

// Jobs queued automatically
// Process one at a time: "queued" → "processing" → "completed"

// Monitor progress
const interval = setInterval(() => {
  const status = FFmpegProcessor.getJobStatus(jobId);
  if (status?.status === "completed") {
    clearInterval(interval);
    console.log("✅ Job complete");
  }
}, 1000);
```

### 4. Pose Format Conversion

Automatic conversion between formats for compatibility.

```typescript
import { PoseFormatConverter } from "@/lib/mocap/nvidia-gem-x";

// BlazePose (33 joints) → SOMA (77 joints)
const soma77 = PoseFormatConverter.blazePoseToSOMA77(blazePose);

// Handles:
// - Known joint mapping
// - Interpolation for missing joints
// - Confidence propagation
```

---

## API Endpoints

### POST /api/mocap/server-extract

Submit video for server-side processing.

**Request:**
```bash
curl -X POST http://localhost:3000/api/mocap/server-extract \
  -F "video=@instructor_trikonasana.mp4" \
  -F "asanaSlug=trikonasana" \
  -F "useGEMX=true" \
  -F "instructor=John Doe"
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "jobId": "ffmpeg_1723834567_abc123",
  "asanaSlug": "trikonasana",
  "instructor": "John Doe",
  "status": "processing",
  "quality": {
    "score": 0.95,
    "issues": [],
    "recommendations": []
  },
  "methods": {
    "ffmpeg": "queued",
    "gemx": "completed"
  },
  "estimatedTime": "30-60 seconds for FFmpeg extraction"
}
```

### GET /api/mocap/server-extract?jobId=...

Get job status and progress.

**Response:**
```json
{
  "success": true,
  "jobId": "ffmpeg_...",
  "status": "processing",
  "progress": 65,
  "framesExtracted": 150,
  "frameDirectory": "./frames/ffmpeg_...",
  "startedAt": "2026-08-16T14:30:00Z"
}
```

### HEAD /api/mocap/server-extract?check=ffmpeg-available

Check server capabilities.

**Response:**
```json
{
  "success": true,
  "tools": {
    "ffmpeg": true,
    "gemx": true,
    "message": "Server processing available"
  }
}
```

---

## Workflow Examples

### Example 1: Quick Extract with FFmpeg

```tsx
export function QuickExtractPage() {
  const [jobId, setJobId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const response = await fetch("/api/mocap/server-extract", {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    if (data.success) {
      setJobId(data.jobId);
      // Poll for completion
      monitorJob(data.jobId);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="video" accept="video/*" />
      <input type="hidden" name="asanaSlug" value="trikonasana" />
      <button type="submit">Extract with Server</button>
      {jobId && <div>Job ID: {jobId}</div>}
    </form>
  );
}
```

### Example 2: GEM-X + Advanced Analysis

```typescript
async function advancedAnalysis(videoPath: string, asanaSlug: string) {
  // Check if GEM-X available
  const gemxCheck = await GEMXProcessor.checkGEMXAvailable();
  
  if (!gemxCheck.available) {
    console.log("GEM-X not available, using FFmpeg only");
    return;
  }

  // Extract with GEM-X
  const result = await GEMXProcessor.extractPoses(videoPath, asanaSlug);
  
  // Load reference pose
  const reference = await fetch(
    `/api/poses/external-sources?source=yoga-82&pose=${asanaSlug}`
  ).then((r) => r.json());
  
  // Analyze alignment
  const alignment = SOMAAnalyzer.assessAlignment(
    result.joints77[Math.floor(result.joints77.length / 2)], // middle frame
    reference.landmarks
  );
  
  console.log("Alignment score:", alignment.deviationScore);
  console.log("Problem areas:", alignment.problemAreas);
  
  return {
    poses: result.joints77,
    alignment,
    isAligned: alignment.deviationScore < 0.05,
  };
}
```

### Example 3: Batch Processing

```typescript
async function batchProcessVideos(videos: File[], asanaSlug: string) {
  const jobIds: string[] = [];

  for (const video of videos) {
    const formData = new FormData();
    formData.append("video", video);
    formData.append("asanaSlug", asanaSlug);
    formData.append("useGEMX", "true");

    const response = await fetch("/api/mocap/server-extract", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    jobIds.push(data.jobId);
  }

  // Monitor all jobs
  const results = await Promise.all(
    jobIds.map((jobId) => pollUntilComplete(jobId))
  );

  return results;
}

async function pollUntilComplete(jobId: string): Promise<any> {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const response = await fetch(
        `/api/mocap/server-extract?jobId=${jobId}`
      );
      const data = await response.json();

      if (data.status === "completed") {
        clearInterval(interval);
        resolve(data);
      } else if (data.status === "failed") {
        clearInterval(interval);
        resolve({ error: data.error });
      }
    }, 2000);
  });
}
```

---

## Performance Considerations

### FFmpeg Extraction Time

Typical processing times (on modern hardware):

| Video Duration | Resolution | FPS | Time (5fps extract) |
|---|---|---|---|
| 30 seconds | 1080p | 30fps | 5-8 seconds |
| 1 minute | 1080p | 30fps | 10-15 seconds |
| 2 minutes | 1080p | 30fps | 20-30 seconds |

### GEM-X Extraction Time

GEM-X runs on GPU, ~10-20x faster than real-time:

| Video Duration | GPU | Time |
|---|---|---|
| 30 seconds | RTX 3090 | 2-3 seconds |
| 1 minute | RTX 3090 | 4-5 seconds |
| 30 seconds | RTX 2080 | 5-7 seconds |

### Resource Usage

- FFmpeg: 100-200MB RAM, 1 CPU core
- GEM-X: 2-4GB VRAM, 1 GPU

### Optimization Tips

1. **Limit resolution** if processing many videos:
   ```typescript
   FFmpegProcessor.submitJob(path, { width: 640, height: 480 })
   ```

2. **Extract fewer frames** for long videos:
   ```typescript
   FFmpegProcessor.submitJob(path, { fps: 2 }) // every 0.5s instead of 0.2s
   ```

3. **Queue jobs** to avoid overwhelming system:
   ```typescript
   // One job at a time, automatic queue
   FFmpegProcessor.submitJob(path1);
   FFmpegProcessor.submitJob(path2); // waits for path1 to complete
   ```

---

## Troubleshooting

### "FFmpeg command not found"
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
sudo apt-get install ffmpeg  # Linux

# Verify
which ffmpeg
ffmpeg -version
```

### "GEM-X extraction returned null"
```bash
# Check Python + GEM-X
python3 -c "from gem.models import GEM; print('OK')"

# Install if missing
pip install gem-x

# Check GPU
nvidia-smi  # should show available GPU
```

### "Video quality too low"
- Ensure video is 720p+ resolution
- Record in good lighting
- Keep video ≥ 20 seconds
- Use stable camera (tripod recommended)

### "Job stuck in 'processing'"
- Check system resources: `top`, `nvidia-smi`
- Restart the server
- Clear temp frames: `rm -rf ./frames/`

---

## Advanced: Custom Processing Pipeline

Create custom extraction workflows:

```typescript
export async function customPipeline(
  videoPath: string,
  asanaSlug: string
) {
  // 1. Assess quality
  const quality = await VideoQualityAnalyzer.assessVideoQuality(videoPath);
  if (quality.score < 0.7) {
    console.warn("⚠️ Low quality:", quality.recommendations);
  }

  // 2. Extract frames with FFmpeg
  const jobId = FFmpegProcessor.submitJob(videoPath, {
    fps: 5,
    width: 1280,
    height: 720,
  });

  // 3. Try GEM-X if available
  const gemxAvailable = await GEMXProcessor.checkGEMXAvailable();
  let soma77Poses = null;
  if (gemxAvailable.available) {
    const gemxResult = await GEMXProcessor.extractPoses(videoPath, asanaSlug);
    soma77Poses = gemxResult?.joints77;
  }

  // 4. Analyze
  if (soma77Poses) {
    const angles = SOMAAnalyzer.computeJointAngles(soma77Poses[0], [
      [7, 8, 9],
      [13, 14, 15],
      [20, 21, 22],
      [26, 27, 28],
    ]);
    console.log("Joint angles:", angles);
  }

  return {
    jobId,
    quality,
    soma77Poses,
  };
}
```

---

## See Also

- `INTEGRATION-GUIDE.md` — Phase 1 & 2 overview
- `CATALOG-AUGMENTATION.md` — Catalog integration
- FFmpeg Docs: https://ffmpeg.org/documentation.html
- NVIDIA GEM-X: https://github.com/NVlabs/GEM-X
