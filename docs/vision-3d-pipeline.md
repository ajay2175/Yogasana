# Vision-driven 3D pose pipeline

## Current (browser)

| Layer | Technology | Role |
|-------|------------|------|
| Pose extraction | **Google MediaPipe Pose Landmarker (Heavy)** | BlazePose GHUM — 33 3D world landmarks from reference photo |
| Retargeting | **Kalidokit** | Landmark → humanoid bone rotations |
| Avatar | **VRM** (`public/models/yoga-instructor.vrm`) | Rigged human mesh, WebXR AR/VR |

Reference photos in `src/data/asana-visuals.json` are analyzed once per pose (cached). Steps interpolate from a neutral standing template → vision-detected hold pose.

## Why not NVIDIA VLA in the browser?

NVIDIA **VLA** models (GR00T, Alpamayo) target **robotics / autonomous driving** — camera + language → robot or vehicle actions. They do not ship a browser API for yoga instruction.

For **cinematic human motion generation**, NVIDIA **Kimodo** (kinematic motion diffusion) is the relevant tool: text + pose constraints → 3D skeletal animation (SMPL-X / G1). That runs on GPU via Python, not in Next.js client code.

## Optional Phase 2: Kimodo offline generation

```bash
# Requires CUDA GPU + kimodo package (see https://github.com/nv-tlabs/kimodo)
pip install kimodo
kimodo_gen \
  --prompt "yoga trikonasana triangle pose, side bend, arms extended" \
  --duration 8 \
  --model nvidia/Kimodo-G1-RP-v1 \
  --output public/motions/trikonasana.bvh
```

Export BVH/GLB per asana, load in Three.js `AnimationMixer` for film-quality motion. Kimodo complements (does not replace) MediaPipe for **photo-accurate** alignment to your reference images.

## Deploy notes

- MediaPipe WASM + Heavy model load from CDN on first pose view (~15 MB).
- AR requires **HTTPS** (deploy to Vercel) + WebXR-capable device.
- Replace `public/models/yoga-instructor.vrm` with a custom instructor avatar (Mixamo → VRM) for branding.
