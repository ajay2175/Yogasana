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

1. **Your own instructor footage** — film each asana once; place MP4 at `public/media/yoga/{poseKey}.mp4` (best quality, full control).
2. **Licensed mocap bundle** — e.g. CGTrader “30 Yoga Pose Animations” FBX/GLB → Three.js `AnimationMixer` (paid asset, one-time import).
3. **NVIDIA GEM-X offline** — monocular video → 77-joint SOMA motion on GPU; export JSON/BVH per asana (`docs/vision-3d-pipeline.md`).
4. **Per-pose dedicated YouTube** — replace general Iyengar class links with pose-specific verified IDs + `startSeconds`.

## Adding a self-hosted video

```bash
# Example after you record or license footage
cp my-trikonasana.mp4 public/media/yoga/trikonasana.mp4
```

Then extend `DemonstrationVideo` with optional `localSrc` in `asana-visuals.json` (future schema).
