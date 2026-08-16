# Instruction media — what works and what does not

## What we stopped doing (and why)

Synthetic 3D avatars, skeleton overlays, and guessed joint angles **cannot** reliably represent Iyengar-classical asana alignment. Multiple attempts (procedural mesh, MediaPipe + VRM, photo skeleton) produced poses with **no faithful relation** to the named asana. That path is retired from the UI.

## What works today

| Tab | Source | Purpose |
|-----|--------|---------|
| **Step guide** | Local reference photo + 4 written steps | Auto-playing slideshow — honest instruction |
| **Demonstration video** | Verified YouTube embeds (Adriene, Iyengar, etc.) | Real human teacher; scrub to relevant segment |
| **Reference photo** | `public/reference-poses/{poseKey}.jpg` | Static alignment reference |
| **Anatomy & load** | Monograph-derived notes | Clinical / Ayurveda layers |

## How to improve further (realistic paths)

1. **Hand-annotate keypoints** (recommended) — see `docs/ANNOTATION-GUIDE.md`. ~30 min/pose; high accuracy for teaching + future diagnosis. Three seed poses are live: trikonasana, adho-mukha-svanasana, vrikshasana.
2. **Your own instructor footage** — film each asana; place MP4 at `public/media/yoga/{poseKey}.mp4`.
3. **Licensed mocap bundle** — clinical-grade movement analysis.
4. **Fine-tune MediaPipe on Yoga-82** — live camera generalization.
5. **Text-only clinical lens** — anatomy tab + monograph (Vaidya Mitra); no visualization required.

## Adding a self-hosted video

```bash
# Example after you record or license footage
cp my-trikonasana.mp4 public/media/yoga/trikonasana.mp4
```

Then extend `DemonstrationVideo` with optional `localSrc` in `asana-visuals.json` (future schema).
