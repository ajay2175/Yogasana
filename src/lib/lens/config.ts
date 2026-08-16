import type { ComplexityLevel, LensId } from "@/lib/types/ontology";

export interface LensConfig {
  id: LensId;
  label: string;
  description: string;
  defaultComplexity: ComplexityLevel;
  maxComplexity: ComplexityLevel;
  disclaimer?: string;
}

export const LENSES: Record<LensId, LensConfig> = {
  clinical: {
    id: "clinical",
    label: "Clinical",
    description: "Full samprapti, evidence tiers, contraindications, export-ready detail.",
    defaultComplexity: 3,
    maxComplexity: 4,
    disclaimer:
      "Adjunct to standard medical care — not a replacement for diagnosis or treatment.",
  },
  wellness: {
    id: "wellness",
    label: "Wellness",
    description: "Plain-language goals, safety-first guidance for self-practice.",
    defaultComplexity: 1,
    maxComplexity: 2,
    disclaimer:
      "Consult your physician before starting or changing any exercise program.",
  },
  pedagogy: {
    id: "pedagogy",
    label: "Pedagogy",
    description: "Alignment, props, progressions, and lineage-aware teaching notes.",
    defaultComplexity: 2,
    maxComplexity: 3,
  },
  scholar: {
    id: "scholar",
    label: "Scholar",
    description: "Tantrayukti provenance, claim layers, and research gaps.",
    defaultComplexity: 4,
    maxComplexity: 4,
  },
};

export const COMPLEXITY_LABELS: Record<ComplexityLevel, string> = {
  1: "Essential",
  2: "Standard",
  3: "Detailed",
  4: "Full",
};
