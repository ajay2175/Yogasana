# Vision-driven 3D pose pipeline

## Load order (nothing should fail)

| Priority | Source | When |
|----------|--------|------|
| 1 | **Anatomy-guided keyframes** | Always — instant VRM simulation, no network |
| 2 | **Google MediaPipe** (self-hosted) | When `/public/reference-poses/{poseKey}.jpg` exists |
| 3 | **NVIDIA GEM-X** (offline GPU) | When `public/motions/{poseKey}.json` is precomputed |

Previous "failed to load" errors came from **broken Wikimedia URLs (404)** and **cross-origin image fetches**. Reference paths now point to local files only.

## Google MediaPipe (browser)

Self-hosted in `/public/mediapipe/`:

- WASM: `/mediapipe/wasm/`
- Model: `/mediapipe/pose_landmarker_lite.task` (~5.5 MB)

Add photos to `/public/reference-poses/trikonasana.jpg` etc. to enable photo-accurate enhancement.

## NVIDIA vision models (not VLA)

| Model | Purpose | Where it runs |
|-------|---------|----------------|
| **GEM-X** | 77-joint SOMA 3D motion from **video** | GPU Python — [github.com/NVlabs/GEM-X](https://github.com/NVlabs/GEM-X) |
| **BodyPose3DNet** (TAO) | 34 3D keypoints from **image** | TensorRT / TAO deploy |
| **Kimodo** | Text + constraints → skeletal animation | GPU Python |
| **GR00T / Alpamayo VLA** | Robotics / AV — **not for yoga browsers** | — |

Check NVIDIA status: `GET /api/vision/nvidia?poseKey=trikonasana`

### GEM offline (Phase 2)

```bash
# Requires CUDA + GEM repo clone
git clone https://github.com/NVlabs/GEM-X
# Process instructor video per asana → export SOMA JSON → public/motions/trikonasana.json
```

## Deploy notes

- AR requires HTTPS (Vercel).
- Replace `public/models/yoga-instructor.vrm` with your instructor avatar.
- MediaPipe + WASM are bundled in `public/` — no external CDN required.
