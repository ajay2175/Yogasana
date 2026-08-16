# Catalog Augmentation System (Step 2)

Merge extracted pose data into `asana-catalog.json` with full provenance tracking and quality review.

---

## Overview

The augmentation system:
1. **Captures** extracted poses with metadata (confidence, stability, instructor)
2. **Stores** augmentations in a pending queue
3. **Reviews** with quality metrics and recommendations
4. **Approves** and merges into catalog with full history
5. **Tracks** provenance so you can always see the source

---

## Workflow

```
Extract Pose (MocapVideoUploader)
    ↓
Create AugmentationRecord
    ↓
POST /api/catalog/augment
    ↓
Store in AugmentationStore (pending)
    ↓
Review Panel displays pending augmentations
    ↓
User approves/rejects
    ↓
POST /api/catalog/apply
    ↓
Merged into asana-catalog.json
```

---

## Using the Augmentation System

### 1. Extract a Pose (as before)

```tsx
import { MocapVideoUploader } from "@/components/MocapVideoUploader";

export function TrikonasanaPage() {
  return (
    <MocapVideoUploader
      asanaSlug="trikonasana"
      onExtractComplete={(result) => {
        console.log("Extraction complete:", result);
        // Automatically submits to augmentation system
      }}
    />
  );
}
```

### 2. Review Pending Augmentations

```tsx
import { AugmentationReviewPanel } from "@/components/AugmentationReviewPanel";

export function AugmentationPage() {
  return (
    <AugmentationReviewPanel
      asanaSlug="trikonasana"
      onApply={(augmentationId) => {
        console.log("Augmentation approved:", augmentationId);
        // Reload catalog or refresh view
      }}
    />
  );
}
```

### 3. Programmatic Integration

```typescript
import {
  createAugmentationFromExtraction,
  mergeAugmentationIntoCatalog,
  generateAugmentationReport,
} from "@/lib/catalog/augmentation";

// Create augmentation from extraction
const augmentation = createAugmentationFromExtraction(
  "trikonasana",
  validFrames, // ExtractedFrame[]
  keyframes,   // ExtractedFrame[]
  0.92,        // confidence
  0.87,        // stability
  "Instructor Name"
);

// Generate quality report
const report = generateAugmentationReport(augmentation);
console.log(`Quality Score: ${report.score}`);
console.log("Recommendations:", report.recommendations);

// Merge into catalog (when approved)
const updated = mergeAugmentationIntoCatalog(catalogEntry, augmentation);
```

---

## API Endpoints

### POST /api/catalog/augment

Submit extracted pose for augmentation

**Request:**
```json
{
  "asanaSlug": "trikonasana",
  "validFrames": [...],      // ExtractedFrame[]
  "keyframes": [...],        // ExtractedFrame[]
  "confidence": 0.92,        // 0-1
  "stability": 0.87,         // 0-1
  "instructor": "John Doe"   // optional
}
```

**Response:**
```json
{
  "success": true,
  "augmentationId": "extraction_1723834567_abc123def",
  "asanaSlug": "trikonasana",
  "report": {
    "score": 0.90,
    "summary": "John Doe - 42/50 valid frames",
    "recommendations": ["✅ High quality - safe to apply automatically"]
  }
}
```

### GET /api/catalog/augment?asanaSlug=trikonasana&status=pending

Get pending augmentations for review

**Response:**
```json
{
  "success": true,
  "asanaSlug": "trikonasana",
  "count": 3,
  "augmentations": [
    {
      "id": "extraction_...",
      "sourceType": "mocap-video",
      "sourceMetadata": {
        "instructor": "John Doe",
        "date": "2026-08-16T14:30:00Z",
        "confidence": 0.92,
        "stability": 0.87,
        "validFrameCount": 42,
        "totalFrameCount": 50
      },
      "status": "pending",
      "report": {
        "score": 0.90,
        "summary": "...",
        "recommendations": [...]
      }
    }
  ]
}
```

### POST /api/catalog/apply

Approve or reject augmentation

**Request:**
```json
{
  "asanaSlug": "trikonasana",
  "augmentationId": "extraction_...",
  "action": "approve" | "reject"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Augmentation approved",
  "asanaSlug": "trikonasana",
  "augmentationId": "extraction_..."
}
```

### GET /api/catalog/apply?action=backup

Create backup of catalog before applying augmentations

**Response:**
```json
{
  "success": true,
  "backup": {
    "timestamp": "2026-08-16T14:30:00Z",
    "filename": "catalog-backup-1723834567000.json",
    "data": { ... }
  }
}
```

---

## Quality Metrics

Each augmentation is scored on:

| Metric | Weight | Meaning |
|--------|--------|---------|
| **Confidence** | 60% | MediaPipe landmark visibility/accuracy (0-1) |
| **Stability** | 40% | How consistent pose hold was across frames (0-1) |

**Score** = (Confidence × 0.6) + (Stability × 0.4)

### Recommendations

- **✅ High quality (≥ 0.85)**: Safe to apply automatically
- **⚠️ Medium quality (0.7-0.84)**: Review recommended
- **❌ Low quality (< 0.7)**: Manual review required

---

## Data Structures

### AugmentationRecord

```typescript
{
  id: string;                    // unique ID
  asanaSlug: string;             // target asana
  sourceType: "yoga-82" | "mocap-video" | "manual-annotation";
  sourceMetadata: {
    instructor?: string;
    date: string;               // ISO timestamp
    confidence: number;         // 0-1
    stability: number;          // 0-1
    validFrameCount: number;
    totalFrameCount: number;
  };
  keyframes: ExtractedFrame[];   // representative frames
  averageLandmarks?: {           // computed average pose
    index: number;
    x: number;
    y: number;
    z: number;
    visibility: number;
  }[];
  status: "pending" | "approved" | "rejected";
  appliedAt?: string;
  notes?: string;
}
```

### Enhanced Catalog Entry

When augmentations are approved, the catalog entry is updated:

```typescript
{
  // ... existing asana fields ...
  augmentations?: AugmentationRecord[];    // history
  preferredLandmarks?: {
    source: string;                        // which extraction
    landmarks: any[];                      // computed average
    confidence: number;
  };
  lastAugmented?: string;                  // timestamp
}
```

---

## Workflow Examples

### Example 1: Auto-Approve High-Quality Extraction

```typescript
// After extraction completes
const report = generateAugmentationReport(augmentation);

if (report.score >= 0.85) {
  // Auto-approve high-quality extractions
  await fetch("/api/catalog/apply", {
    method: "POST",
    body: JSON.stringify({
      asanaSlug,
      augmentationId: augmentation.id,
      action: "approve",
    }),
  });
  console.log("✅ Auto-approved high-quality augmentation");
} else {
  console.log("⏳ Needs manual review");
}
```

### Example 2: Aggregate Multiple Extractions

```typescript
// Compare multiple extractions for the same asana
const augmentations = await fetch(
  `/api/catalog/augment?asanaSlug=trikonasana&status=pending`
).then((r) => r.json());

// Select best quality augmentation
const best = augmentations.augmentations.reduce((max, current) =>
  current.report.score > max.report.score ? current : max
);

// Apply the best one
await fetch("/api/catalog/apply", {
  method: "POST",
  body: JSON.stringify({
    asanaSlug: "trikonasana",
    augmentationId: best.id,
    action: "approve",
  }),
});
```

### Example 3: Batch Review Dashboard

```tsx
export function CatalogAugmentationDashboard() {
  const asanas = ["trikonasana", "vrikshasana", "adho_mukha_svanasana"];

  return (
    <div className="space-y-6">
      {asanas.map((slug) => (
        <AugmentationReviewPanel key={slug} asanaSlug={slug} />
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. Always Backup Before Bulk Approval

```typescript
// Create backup first
await fetch("/api/catalog/apply?action=backup");

// Then approve multiple augmentations
// If something goes wrong, restore from backup
```

### 2. Review Low-Stability Extractions Manually

```typescript
if (augmentation.sourceMetadata.stability < 0.7) {
  // Force manual review
  console.warn("⚠️ Low stability - skipping auto-approval");
}
```

### 3. Track Instructor Performance

```typescript
// Monitor which instructors produce high-quality extractions
const byInstructor = augmentations.reduce((acc, a) => {
  const key = a.sourceMetadata.instructor;
  acc[key] = acc[key] || [];
  acc[key].push(a);
  return acc;
}, {});

for (const [instructor, extractions] of Object.entries(byInstructor)) {
  const avgScore = extractions.reduce((s, e) => s + e.report.score, 0) / extractions.length;
  console.log(`${instructor}: avg quality ${(avgScore * 100).toFixed(0)}%`);
}
```

### 4. Maintain Catalog History

```typescript
// Don't delete augmentations after approval
// Keep them for rollback and auditing
// Query all augmentations: /api/catalog/augment?status=approved
```

---

## Future Enhancements

- [ ] Database-backed augmentation store (persistent)
- [ ] Batch approval UI for multiple asanas
- [ ] Automatic merging for high-quality augmentations
- [ ] Augmentation diff viewer (old vs. new landmarks)
- [ ] Instructor performance leaderboard
- [ ] Weighted averaging (combine multiple extractions)
- [ ] Confidence intervals for landmark positions

---

## Testing

### Test Augmentation Creation

```typescript
import {
  createAugmentationFromExtraction,
  generateAugmentationReport,
} from "@/lib/catalog/augmentation";

const frames = []; // your extracted frames
const augmentation = createAugmentationFromExtraction(
  "trikonasana",
  frames,
  frames.slice(0, 3), // keyframes
  0.92,
  0.87,
  "Test Instructor"
);

const report = generateAugmentationReport(augmentation);
console.assert(report.score >= 0.85, "Score should be high");
console.assert(
  report.recommendations.includes("✅"),
  "Should have approval recommendation"
);
```

### Test API Endpoints

```bash
# Submit augmentation
curl -X POST http://localhost:3000/api/catalog/augment \
  -H "Content-Type: application/json" \
  -d '{
    "asanaSlug": "trikonasana",
    "confidence": 0.92,
    "stability": 0.87,
    "validFrames": [],
    "keyframes": [],
    "instructor": "Test"
  }'

# Get pending
curl http://localhost:3000/api/catalog/augment?asanaSlug=trikonasana&status=pending

# Approve (requires augmentationId from POST response)
curl -X POST http://localhost:3000/api/catalog/apply \
  -H "Content-Type: application/json" \
  -d '{
    "asanaSlug": "trikonasana",
    "augmentationId": "extraction_...",
    "action": "approve"
  }'
```

---

## See Also

- `INTEGRATION-GUIDE.md` — Phase 1 & 2 overview
- `src/lib/catalog/augmentation.ts` — Core augmentation logic
- `src/components/AugmentationReviewPanel.tsx` — Review UI
