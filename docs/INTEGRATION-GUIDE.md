# Yogasana Integration Guide: Phase 1 & 2

## Overview

This document covers Phase 1 (external yoga API integration) and Phase 2 (mocap/video extraction) implementations.

---

## Phase 1: External Yoga API Integration

### What's Integrated

- **Yoga-82 Dataset** (academic, open-source)
  - COCO keypoint format → BlazePose (33 landmarks) conversion
  - Local pose references for: trikonasana, vrikshasana, adho_mukha_svanasana
  - Format normalizers for OpenPose, COCO, and custom formats

### Endpoints

#### GET /api/poses/external-sources

Fetch verified pose landmarks from integrated datasets.

**Example requests:**

```bash
# List available poses in Yoga-82
curl http://localhost:3000/api/poses/external-sources?source=yoga-82

# Get specific pose landmarks
curl http://localhost:3000/api/poses/external-sources?source=yoga-82&pose=trikonasana
```

**Response:**

```json
{
  "success": true,
  "pose": "trikonasana",
  "source": "Yoga-82",
  "landmarks": [
    { "name": "nose", "x": 0.5, "y": 0.2, "confidence": 1 },
    { "name": "left_shoulder", "x": 0.3, "y": 0.35, "confidence": 1 }
  ],
  "metadata": {
    "source": "Yoga-82 public dataset",
    "alignment": "Classic triangle pose with level hips",
    "difficulty": "beginner"
  }
}
```

### Usage in Code

```typescript
import { Yoga82DataSource, PoseFormatNormalizer } from "@/lib/yoga-api/yoga-data-sources";

// Get local Yoga-82 references
const yoga82 = new Yoga82DataSource();
const references = yoga82.getLocalPoseReferences();

// Convert OpenPose format to BlazePose
const openposeJoints = [...]; // 25 joints from OpenPose
const blazePose = PoseFormatNormalizer.openPoseToBlazePose(openposeJoints);

// Convert COCO format to BlazePose
const cocoJoints = [...]; // 17 keypoints COCO format
const blazePose2 = PoseFormatNormalizer.cocoToBlazePose(cocoJoints);
```

---

## Phase 2: Mocap / Video Extraction

### What's Implemented

- **Browser-side video frame extraction** (Canvas API)
- **Frame-level pose detection** (MediaPipe Pose Landmarker)
- **Keyframe selection** (representative pose samples)
- **Quality validation** (confidence, visibility, stability checks)

### Endpoints

#### POST /api/mocap/extract

Upload instructor yoga video for pose extraction.

**Request:**

```bash
curl -X POST http://localhost:3000/api/mocap/extract \
  -F "video=@instructor_trikonasana.mp4" \
  -F "asanaSlug=trikonasana" \
  -F "instructor=John Doe"
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "jobId": "mocap_1692345678",
  "status": "processing",
  "message": "Video extraction initiated.",
  "asanaSlug": "trikonasana",
  "instructor": "John Doe"
}
```

#### GET /api/mocap/extract?jobId=...

Check extraction job status (future implementation).

### Client-Side Component: MocapVideoUploader

React component for extracting poses directly in the browser:

```tsx
import { MocapVideoUploader } from "@/components/MocapVideoUploader";

export function MyPosePage() {
  return (
    <MocapVideoUploader
      asanaSlug="trikonasana"
      onExtractComplete={(result) => {
        console.log("Extraction complete:", result);
        // Save to catalog, update UI, etc.
      }}
    />
  );
}
```

### Video Processing Pipeline

1. **Frame Extraction** (BrowserVideoExtractor)
   - Loads video file into Canvas element
   - Extracts frames at configurable rate (e.g., 5 FPS)
   - Returns frame images and timestamps

2. **Pose Detection** (MediaPipePoseDetector)
   - Runs on each frame (browser or server)
   - Returns 33-landmark BlazePose format
   - Confidence scores per landmark

3. **Keyframe Selection**
   - Selects 3-5 representative frames
   - Even distribution across video duration
   - Option to use distance-based clustering for pose changes

4. **Quality Validation** (PoseQualityValidator)
   - Minimum confidence threshold (default 0.6)
   - Visibility ratio per frame (70% visible required)
   - Stability scoring (how consistent is the pose hold)

### Usage in Code

```typescript
import {
  BrowserVideoExtractor,
  MediaPipePoseDetector,
  PoseQualityValidator,
} from "@/lib/mocap/video-pose-extractor";

// Extract frames from video
const videoFile = /* File from input */;
const frames = await BrowserVideoExtractor.extractFrames(videoFile, 5); // 5 FPS

// Initialize MediaPipe and detect poses
const detector = new MediaPipePoseDetector();
for (const frame of frames) {
  const landmarks = await detector.detectPose(frame.imageBase64!);
  frame.landmarks = landmarks;
}

// Select key frames
const keyframes = BrowserVideoExtractor.selectKeyframes(frames, 5);

// Validate quality
const validFrames = frames.filter((f) =>
  PoseQualityValidator.validateExtractedFrame(f)
);
const stability = PoseQualityValidator.computeStability(validFrames);

console.log(`Extracted ${validFrames.length} valid frames with ${stability} stability`);
```

---

## Integration Examples

### Example 1: Add Yoga-82 Pose to Catalog

```typescript
// In your asana detail page
async function augmentWithYoga82() {
  const response = await fetch(
    "/api/poses/external-sources?source=yoga-82&pose=trikonasana"
  );
  const data = await response.json();

  // Merge with existing asana-catalog entry
  const asanaEntry = { ...catalogEntry, yoga82Landmarks: data.landmarks };
  return asanaEntry;
}
```

### Example 2: Instructor Video Upload UI

```tsx
// In your asana edit/create page
import { MocapVideoUploader } from "@/components/MocapVideoUploader";

export function EditAsanaPage({ asanaSlug }: { asanaSlug: string }) {
  return (
    <div>
      <h2>Edit {asanaSlug}</h2>

      <MocapVideoUploader
        asanaSlug={asanaSlug}
        onExtractComplete={(result) => {
          // Save extracted pose keyframes to catalog
          console.log("Extracted keyframes:", result);
          // POST to /api/catalog/add-extraction
        }}
      />

      {/* Rest of form */}
    </div>
  );
}
```

---

## Future Enhancements

### Phase 3: Advanced Mocap

- **Server-side FFmpeg processing** for robust video handling
- **NVIDIA GEM-X integration** for 77-joint SOMA format
- **Batch job processing** with status tracking
- **Video quality assessment** (lighting, visibility, motion blur)

### Phase 4: Catalog Augmentation

- **Automatic merging** of extracted poses into catalog
- **Provenance tracking** (which pose came from which source)
- **Quality dashboards** (confidence, stability metrics per asana)
- **Community contributions** (instructor video uploads)

### Phase 5: Advanced Features

- **3D pose reconstruction** from monocular video
- **Pose comparison** (instructor vs. student)
- **Alignment suggestions** based on classical texts
- **Video recommendation engine** (find best instructor for each asana)

---

## Testing

### Test Phase 1 (External Sources)

```bash
# List available Yoga-82 poses
curl http://localhost:3000/api/poses/external-sources?source=yoga-82

# Get trikonasana landmarks
curl http://localhost:3000/api/poses/external-sources?source=yoga-82&pose=trikonasana
```

### Test Phase 2 (Video Extraction)

1. Record a short (~10 sec) yoga video with clear body visibility
2. Open the asana detail page
3. Use the **MocapVideoUploader** component
4. Check progress and quality metrics
5. Verify landmarks match the pose

### Debug Commands

```typescript
// Check PoseFormatNormalizer conversions
import { PoseFormatNormalizer } from "@/lib/yoga-api/yoga-data-sources";

const openPoseJoints = [...]; // your data
const result = PoseFormatNormalizer.openPoseToBlazePose(openPoseJoints);
console.log("Converted landmarks:", result);

// Check video extraction
import { BrowserVideoExtractor } from "@/lib/mocap/video-pose-extractor";
const frames = await BrowserVideoExtractor.extractFrames(videoFile, 5);
console.log(`Extracted ${frames.length} frames`);
```

---

## Resources

- Yoga-82 Dataset: https://github.com/Ujjawal-K-Panchal/Yoga-82
- MediaPipe Pose: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
- NVIDIA GEM-X: https://github.com/NVlabs/GEM-X
- BlazePose Format: 33 landmarks for full body pose
