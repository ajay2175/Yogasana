import type {
  BiomechanicsProfile,
  ClaimRecord,
  Contraindication,
  DimensionCluster,
  DoshaEffect,
  EvidenceCode,
  IyengarPedagogy,
  LineageTag,
  LineageVariant,
  SrotasEngagement,
  TrigunaTendency,
  TrividhaHetu,
} from "./ontology";

export interface AsanaIdentity {
  slug: string;
  nameEnglish: string;
  nameSanskrit: string;
  aliases: string[];
  family: BiomechanicsProfile["family"];
  lineages: LineageTag[];
  lineageVariants?: LineageVariant[];
  classicalSources?: string[];
}

export interface AsanaRecord {
  identity: AsanaIdentity;
  summary: string;
  lineageEvidence: string;
  insulinGlucose: string;
  shariraWellbeing: string;
  manasAyurveda: string;
  safety: string;
  dosha?: DoshaEffect;
  srotas?: SrotasEngagement[];
  triguna?: TrigunaTendency;
  trividhaHetu?: TrividhaHetu[];
  iyengar?: IyengarPedagogy;
  contraindications: Contraindication[];
  claims?: ClaimRecord[];
  clusters?: DimensionCluster[];
  evidenceCodes: EvidenceCode[];
}

export interface AsanaCatalog {
  version: string;
  updated: string;
  sourceNotes: string[];
  asanas: AsanaRecord[];
}
