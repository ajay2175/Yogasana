# Yogasana — Asana Integrative Advisor

Unified Yoga–Ayurveda–biomechanics knowledge platform with four audience lenses (Clinical, Wellness, Pedagogy, Scholar).

## Clone and run locally

```bash
git clone https://github.com/ajay2175/Yogasana.git
cd Yogasana
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser (not the project folder in Finder).

If port 3000 is busy:

```bash
npm run dev -- -p 3001
```

Production build check:

```bash
npm run build
npm run start
```

Open **http://localhost:3000** after `npm run start`.

## Visual studio (each asana)

Each pose detail page uses a **Google Vision → VRM 3D pipeline** (no YouTube embeds):

| Layer | Technology |
|-------|------------|
| Pose extraction | Google **MediaPipe Pose Landmarker (Heavy)** — 33 3D landmarks from reference photo |
| Retargeting | **Kalidokit** bone solver |
| Avatar | Rigged **VRM** humanoid + WebXR AR/VR |

| Mode | Purpose |
|------|---------|
| **3D simulation video** | Auto-playing VRM avatar: setup → entry → hold → refine |
| **VR / AR view** | Orbit in 3D; **Enter AR** / **Enter VR** on supported phones & headsets |
| **3D anatomy overlay** | Anatomy notes alongside the vision-driven avatar |

First load analyzes the reference photo (~15 MB MediaPipe model, cached). See `docs/vision-3d-pipeline.md` for NVIDIA Kimodo offline motion generation (Phase 2).

## Project structure

- `src/data/asana-catalog.json` — seed knowledge graph
- `src/lib/types/` — ontology and asana TypeScript types
- `src/lib/lens/` — four-lens formatting rules
- `docs/superpowers/specs/` — approved design specification

## Phases

1. Lookup, lenses, evidence badges (current)
2. Condition advisor with anshamsha matching
3. Sequence studio and Iyengar progressions
4. Tantrayukti provenance UI
5. AIA integration and grounded LLM explainer

## Source documents

- `Asana_Insulin_Whole_Person_Research_Monograph.docx`
- `Asanas.pdf` drill-down companion
