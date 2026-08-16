/** Evidence and epistemology codes from the research monograph. */
export type EvidenceCode = "T1" | "T2" | "B0" | "B1" | "B2" | "B3" | "A1" | "A2";

export type ClaimLayer =
  | "textual"
  | "biomedical"
  | "integrative"
  | "lineage_belief";

export type LensId = "clinical" | "wellness" | "pedagogy" | "scholar";

export type ComplexityLevel = 1 | 2 | 3 | 4;

export type ContraindicationStrength = "absolute" | "relative" | "precaution";

export type DoshaDirection = "increase" | "decrease" | "balance" | "neutral";

export type TrigunaTendency = "sattvic" | "rajasic" | "tamasic" | "mixed";

export type TrividhaHetu = "adhyatmika" | "adhibhautika" | "adhidaivika";

export type AsanaFamily =
  | "meditative_seated"
  | "standing"
  | "forward_fold"
  | "backbend"
  | "twist"
  | "inversion"
  | "arm_balance"
  | "prone_supine_strength"
  | "restorative"
  | "dynamic_flow";

export type LineageTag =
  | "classical"
  | "iyengar"
  | "ashtanga"
  | "sivananda"
  | "bikram"
  | "kundalini"
  | "yin"
  | "viniyoga"
  | "krishnamacharya"
  | "modern_common";

/** Cluster IDs for progressive disclosure in the UI. */
export type DimensionClusterId =
  | "identity"
  | "sharira_avayava"
  | "indriya_manas"
  | "dosha_guna"
  | "dhatu_mala"
  | "srotas_marma"
  | "kala_agni"
  | "biomechanics"
  | "clinical_metabolic"
  | "trividha_swastha"
  | "lineage_pedagogy"
  | "contraindications"
  | "evidence_provenance"
  | "scholar_meta";

export interface ClaimRecord {
  id: string;
  statement: string;
  layer: ClaimLayer;
  evidenceCodes: EvidenceCode[];
  tantrayukti?: string[];
  source?: string;
  falsifiable?: boolean;
}

export interface Contraindication {
  condition: string;
  strength: ContraindicationStrength;
  rationale: string;
  evidenceCodes: EvidenceCode[];
}

export interface LineageVariant {
  lineage: LineageTag;
  name?: string;
  notes?: string;
}

export interface IyengarPedagogy {
  alignmentCues?: string[];
  props?: string[];
  holdSeconds?: number;
  lightOnYogaRef?: string;
  therapeuticUse?: string;
}

export interface DoshaEffect {
  vata?: DoshaDirection;
  pitta?: DoshaDirection;
  kapha?: DoshaDirection;
  gunas?: string[];
  notes?: string;
  evidenceCodes: EvidenceCode[];
}

export interface SrotasEngagement {
  srotas: string;
  moolaSthana?: string[];
  mechanism?: string;
  evidenceCodes: EvidenceCode[];
}

export interface BiomechanicsProfile {
  family: AsanaFamily;
  jointActions?: string[];
  loadedRegions?: string[];
  contractionType?: string[];
  metEstimate?: "very_low" | "low" | "moderate" | "high";
  glucosePlausibility?: EvidenceCode;
  insulinNotes?: string;
  postMealSuitability?: "preferred" | "neutral" | "avoid";
}

export interface DimensionCluster {
  id: DimensionClusterId;
  title: string;
  summary: string;
  details?: Record<string, string | string[]>;
  claims?: ClaimRecord[];
  minComplexity: ComplexityLevel;
  lenses: LensId[];
}
