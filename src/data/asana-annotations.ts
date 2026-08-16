import type { ManualAnnotationCatalog } from "@/lib/types/visuals";

/**
 * Instructor-verified landmark positions on reference photos.
 * Coordinates are normalized 0–1 (x left→right, y top→bottom).
 * Add poses via docs/ANNOTATION-GUIDE.md — ~30 min per asana.
 */
const catalog: ManualAnnotationCatalog = {
  version: "1.0.0",
  description: "Hand-annotated BlazePose landmarks on reference photos",
  annotations: [
    {
      poseKey: "trikonasana",
      imageUrl: "/reference-poses/trikonasana.jpg",
      imageWidth: 800,
      imageHeight: 600,
      annotator: "curated alignment (Iyengar-style triangle)",
      lineage: "Utthita Trikonasana — front view",
      steps: [
        {
          stepIndex: 3,
          label: "Hold",
          landmarks: {
            "0": { x: 0.48, y: 0.14 },
            "11": { x: 0.44, y: 0.26 },
            "12": { x: 0.56, y: 0.3 },
            "13": { x: 0.4, y: 0.36 },
            "14": { x: 0.62, y: 0.42 },
            "15": { x: 0.36, y: 0.48 },
            "16": { x: 0.68, y: 0.16 },
            "23": { x: 0.46, y: 0.46 },
            "24": { x: 0.58, y: 0.48 },
            "25": { x: 0.4, y: 0.62 },
            "26": { x: 0.66, y: 0.64 },
            "27": { x: 0.36, y: 0.88 },
            "28": { x: 0.7, y: 0.9 },
          },
          alignmentNotes: [
            "Front leg knee tracks over ankle; back leg strong.",
            "Top arm in line with ear; chest opens toward ceiling.",
            "Bottom hand to shin/block — not collapsing into knee.",
          ],
        },
      ],
    },
    {
      poseKey: "adho-mukha-svanasana",
      imageUrl: "/reference-poses/adho-mukha-svanasana.jpg",
      imageWidth: 800,
      imageHeight: 600,
      annotator: "curated alignment",
      lineage: "Adho Mukha Svanasana — side view",
      steps: [
        {
          stepIndex: 3,
          label: "Hold",
          landmarks: {
            "0": { x: 0.52, y: 0.72 },
            "11": { x: 0.42, y: 0.44 },
            "12": { x: 0.58, y: 0.44 },
            "13": { x: 0.36, y: 0.34 },
            "14": { x: 0.64, y: 0.34 },
            "15": { x: 0.32, y: 0.24 },
            "16": { x: 0.68, y: 0.24 },
            "23": { x: 0.46, y: 0.5 },
            "24": { x: 0.54, y: 0.5 },
            "25": { x: 0.42, y: 0.66 },
            "26": { x: 0.58, y: 0.66 },
            "27": { x: 0.4, y: 0.88 },
            "28": { x: 0.6, y: 0.88 },
          },
          alignmentNotes: [
            "Hips high; spine lengthens toward thighs.",
            "Weight between hands and feet; heels toward floor.",
            "Head relaxed between upper arms.",
          ],
        },
      ],
    },
    {
      poseKey: "vrikshasana",
      imageUrl: "/reference-poses/vrikshasana.jpg",
      imageWidth: 800,
      imageHeight: 600,
      annotator: "curated alignment",
      lineage: "Vrikshasana — tree pose",
      steps: [
        {
          stepIndex: 3,
          label: "Hold",
          landmarks: {
            "0": { x: 0.5, y: 0.12 },
            "11": { x: 0.42, y: 0.24 },
            "12": { x: 0.58, y: 0.24 },
            "13": { x: 0.38, y: 0.34 },
            "14": { x: 0.62, y: 0.34 },
            "15": { x: 0.36, y: 0.44 },
            "16": { x: 0.64, y: 0.44 },
            "23": { x: 0.44, y: 0.48 },
            "24": { x: 0.56, y: 0.48 },
            "25": { x: 0.44, y: 0.68 },
            "26": { x: 0.62, y: 0.58 },
            "27": { x: 0.44, y: 0.9 },
            "28": { x: 0.62, y: 0.72 },
          },
          alignmentNotes: [
            "Standing leg strong; foot of lifted leg above or below knee — never on knee.",
            "Pelvis level; hands at heart or overhead.",
            "Drishti forward for balance.",
          ],
        },
      ],
    },
  ],
};

export function getManualAnnotation(poseKey: string) {
  return catalog.annotations.find((a) => a.poseKey === poseKey) ?? null;
}

export function getAnnotatedStep(poseKey: string, stepIndex: number) {
  const ann = getManualAnnotation(poseKey);
  if (!ann) return null;
  return ann.steps.find((s) => s.stepIndex === stepIndex) ?? ann.steps[ann.steps.length - 1] ?? null;
}

export function listAnnotatedPoseKeys(): string[] {
  return catalog.annotations.map((a) => a.poseKey);
}
