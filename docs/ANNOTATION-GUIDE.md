# Hand-annotation guide (recommended path)

This is the **medium-effort / high-accuracy** option from the project roadmap. Synthetic 3D and auto-detected skeletons were removed; this is the correct way to add visual alignment back.

## Workflow (~30 min per asana)

1. Choose one **canonical reference photo** per pose (`public/reference-poses/{poseKey}.jpg`).
2. Open the photo in any image editor (Figma, Photoshop, or a simple web tool).
3. Mark **13 primary joints** (minimum) using normalized coordinates 0–1:
   - nose (0), shoulders (11–12), elbows (13–14), wrists (15–16)
   - hips (23–24), knees (25–26), ankles (27–28)
4. Add **alignment notes** (2–4 bullets) in Iyengar/classical language.
5. Add an entry to `src/data/asana-annotations.ts`.

## JSON shape

```typescript
{
  poseKey: "trikonasana",
  imageUrl: "/reference-poses/trikonasana.jpg",
  imageWidth: 800,
  imageHeight: 600,
  annotator: "Dr. X",
  reviewedBy: "Senior teacher Y",  // optional
  lineage: "Utthita Trikonasana",
  steps: [
    {
      stepIndex: 3,  // hold position
      label: "Hold",
      landmarks: {
        "11": { "x": 0.44, "y": 0.26 },
        // ...
      },
      alignmentNotes: ["Top arm in line with ear", "..."]
    }
  ]
}
```

## Currently annotated

- `trikonasana`
- `adho-mukha-svanasana`
- `vrikshasana`

## Roadmap table (other options)

| Approach | When to use |
|----------|-------------|
| **Hand-annotate (this doc)** | Now — teaching + future diagnosis overlay |
| Mocap | Clinical-grade movement analysis later |
| Fine-tune MediaPipe on Yoga-82 | Live camera feedback |
| Text-only | Vaidya Mitra clinical lens — already supported via anatomy tab |
| External yoga app API | Quick win if you accept no control |

## Future: live comparison

Once 15 poses are annotated, a webcam frame can be compared to stored landmarks (angle deltas per joint) — no fake avatar required.
