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

Honest instruction — **no synthetic 3D simulation**:

| Tab | Content |
|-----|---------|
| **Step guide** | Reference photo + 4 auto-playing setup/hold steps |
| **Demonstration video** | Verified YouTube (Yoga With Adriene, Iyengar, etc.) |
| **Reference photo** | Local image in `public/reference-poses/` |
| **Anatomy & load** | Clinical + Ayurveda notes from the monograph |

See `docs/INSTRUCTION-MEDIA.md` for why 3D auto-generation was removed and how to add instructor MP4 or mocap later.

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
