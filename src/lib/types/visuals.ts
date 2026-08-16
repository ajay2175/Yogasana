export type VisualTab = "steps" | "alignment" | "video" | "reference" | "anatomy";

/** Normalized image coords (0–1), BlazePose index 0–32 */
export interface AnnotatedLandmark {
  x: number;
  y: number;
  /** Optional depth hint for future 3D / comparison */
  z?: number;
}

export interface AnnotatedPoseStep {
  stepIndex: number;
  label: string;
  /** 33 landmarks keyed by index string "0".."32" */
  landmarks: Record<string, AnnotatedLandmark>;
  alignmentNotes?: string[];
}

export interface ManualPoseAnnotation {
  poseKey: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  annotator: string;
  reviewedBy?: string;
  lineage?: string;
  steps: AnnotatedPoseStep[];
}

export interface ManualAnnotationCatalog {
  version: string;
  description: string;
  annotations: ManualPoseAnnotation[];
}

export interface SimulationStep {
  id: string;
  label: string;
  instruction: string;
  poseStep: number;
  durationMs: number;
}

export interface ReferencePhoto {
  url: string;
  alt: string;
  credit: string;
  license?: string;
}

export interface DemonstrationVideo {
  id: string;
  title: string;
  youtubeId: string;
  startSeconds?: number;
  instructor: string;
  durationLabel: string;
  note: string;
}

export interface AnatomyRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  clinicalNote: string;
  ayurvedaNote?: string;
}

export interface AsanaVisualPack {
  slug: string;
  poseKey: string;
  simulationCaption: string;
  steps: SimulationStep[];
  referencePhoto?: ReferencePhoto;
  gallery?: ReferencePhoto[];
  videos: DemonstrationVideo[];
  anatomyRegions: AnatomyRegion[];
  biomechanicsCaption: string;
}

export interface AsanaVisualCatalog {
  version: string;
  packs: AsanaVisualPack[];
}
