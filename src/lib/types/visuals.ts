export type VisualTab = "simulation3d" | "immersive" | "anatomy";

export interface SimulationStep {
  id: string;
  label: string;
  instruction: string;
  /** 0-based step index rendered by PoseDiagram */
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
  /** Percent position on diagram canvas */
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
