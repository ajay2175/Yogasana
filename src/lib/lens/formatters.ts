import type { AsanaRecord } from "@/lib/types/asana";
import type { ComplexityLevel, LensId } from "@/lib/types/ontology";
import { LENSES } from "./config";

export interface LensContextValue {
  lens: LensId;
  complexity: ComplexityLevel;
  setLens: (lens: LensId) => void;
  setComplexity: (level: ComplexityLevel) => void;
  config: (typeof LENSES)[LensId];
}

export function shouldShowCluster(
  minComplexity: ComplexityLevel,
  lens: LensId,
  clusterLenses: LensId[] | undefined,
  complexity: ComplexityLevel,
): boolean {
  if (clusterLenses && !clusterLenses.includes(lens)) {
    return false;
  }
  return complexity >= minComplexity;
}

export function formatAsanaSummary(
  asana: AsanaRecord,
  lens: LensId,
): string {
  switch (lens) {
    case "wellness":
      return asana.shariraWellbeing.split(".")[0] + ".";
    case "pedagogy":
      return asana.iyengar?.therapeuticUse ?? asana.shariraWellbeing.split(".")[0] + ".";
    case "scholar":
      return `${asana.identity.nameEnglish}: ${asana.lineageEvidence}`;
    case "clinical":
    default:
      return asana.summary;
  }
}

export function visibleEvidenceCodes(
  asana: AsanaRecord,
  lens: LensId,
): string[] {
  if (lens === "wellness") {
    return asana.evidenceCodes.filter((code) => code.startsWith("B") || code === "T1");
  }
  return asana.evidenceCodes;
}
