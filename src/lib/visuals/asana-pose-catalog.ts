import type { Landmark } from "@mediapipe/tasks-vision";
import type { PoseLandmarkFrame } from "./mediapipe-pose-engine";

/** BlazePose topology edges for skeleton rendering */
export const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32],
];

type Point = { x: number; y: number; z: number };

function pt(x: number, y: number, z = 0): Point {
  return { x, y, z };
}

/** Build 33 BlazePose landmarks from key body points (interpolates fingers/toes/face). */
function buildLandmarks(key: Partial<Record<number, Point>>): Landmark[] {
  const points: Point[] = Array.from({ length: 33 }, () => pt(0.5, 0.5, 0));

  for (const [idx, p] of Object.entries(key)) {
    points[Number(idx)] = p!;
  }

  const mid = (a: number, b: number): Point => {
    const pa = points[a];
    const pb = points[b];
    return pt((pa.x + pb.x) / 2, (pa.y + pb.y) / 2, (pa.z + pb.z) / 2);
  };

  if (!key[0] && key[11] && key[12]) points[0] = pt((points[11].x + points[12].x) / 2, Math.min(points[11].y, points[12].y) - 0.08, 0);
  if (!key[1]) points[1] = pt(points[0].x, points[0].y - 0.02, points[0].z);
  if (!key[2]) points[2] = pt(points[0].x - 0.02, points[0].y - 0.01, points[0].z);
  if (!key[3]) points[3] = pt(points[0].x + 0.02, points[0].y - 0.01, points[0].z);
  if (!key[23] && key[11] && key[12]) points[23] = pt(points[11].x, points[11].y + 0.12, 0);
  if (!key[24] && key[11] && key[12]) points[24] = pt(points[12].x, points[12].y + 0.12, 0);

  for (const i of [4, 5, 6, 7, 8, 9, 10]) {
    if (!key[i]) points[i] = pt(points[0].x + (i < 7 ? -0.03 : 0.03), points[0].y, 0);
  }
  for (const i of [17, 18, 19, 20, 21, 22]) {
    if (!key[i] && key[15] && key[16]) {
      const wrist = i % 2 === 1 ? points[15] : points[16];
      points[i] = pt(wrist.x, wrist.y + 0.02, wrist.z);
    }
  }
  for (const i of [29, 30, 31, 32]) {
    if (!key[i] && key[27] && key[28]) {
      const ankle = i < 31 ? points[27] : points[28];
      points[i] = pt(ankle.x, ankle.y + 0.02, ankle.z);
    }
  }

  if (key[11] && key[12] && !key[23]) points[23] = pt(points[11].x, points[11].y + 0.1, points[11].z);
  if (key[11] && key[12] && !key[24]) points[24] = pt(points[12].x, points[12].y + 0.1, points[12].z);

  return points.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: 1 }));
}

function normalizedToWorld(normalized: Landmark[]): Landmark[] {
  const hips = normalized[23] && normalized[24]
    ? { x: (normalized[23].x + normalized[24].x) / 2, y: (normalized[23].y + normalized[24].y) / 2, z: 0 }
    : { x: 0.5, y: 0.55, z: 0 };

  const scale = 1.75;
  return normalized.map((p) => ({
    x: (p.x - hips.x) * scale,
    y: (hips.y - p.y) * scale,
    z: -p.z * scale * 0.6,
    visibility: 1,
  }));
}

function toFrame(normalized: Landmark[]): PoseLandmarkFrame {
  return {
    normalized,
    world: normalizedToWorld(normalized),
    imageWidth: 800,
    imageHeight: 600,
  };
}

function blendNorm(a: Landmark[], b: Landmark[], t: number): Landmark[] {
  return a.map((p, i) => {
    const q = b[i] ?? p;
    return {
      x: p.x + (q.x - p.x) * t,
      y: p.y + (q.y - p.y) * t,
      z: p.z + (q.z - p.z) * t,
      visibility: 1,
    };
  });
}

const STAND = buildLandmarks({
  0: pt(0.5, 0.14, 0),
  11: pt(0.42, 0.28, 0),
  12: pt(0.58, 0.28, 0),
  13: pt(0.38, 0.42, 0),
  14: pt(0.62, 0.42, 0),
  15: pt(0.36, 0.56, 0),
  16: pt(0.64, 0.56, 0),
  23: pt(0.44, 0.52, 0),
  24: pt(0.56, 0.52, 0),
  25: pt(0.44, 0.72, 0),
  26: pt(0.56, 0.72, 0),
  27: pt(0.44, 0.92, 0),
  28: pt(0.56, 0.92, 0),
});

/** Per-asana HOLD poses — normalized coords matched to classical alignment (front/side view). */
const HOLD: Record<string, Landmark[]> = {
  trikonasana: buildLandmarks({
    0: pt(0.52, 0.18, 0.02),
    11: pt(0.48, 0.32, 0.04),
    12: pt(0.62, 0.38, -0.02),
    13: pt(0.42, 0.44, 0.05),
    14: pt(0.68, 0.52, -0.04),
    15: pt(0.38, 0.58, 0.06),
    16: pt(0.72, 0.22, -0.05),
    23: pt(0.5, 0.5, 0.02),
    24: pt(0.62, 0.52, -0.02),
    25: pt(0.42, 0.72, 0.03),
    26: pt(0.7, 0.74, -0.03),
    27: pt(0.38, 0.92, 0.04),
    28: pt(0.74, 0.92, -0.04),
  }),
  "adho-mukha-svanasana": buildLandmarks({
    0: pt(0.5, 0.72, 0.08),
    11: pt(0.4, 0.48, 0.06),
    12: pt(0.6, 0.48, 0.06),
    13: pt(0.34, 0.38, 0.1),
    14: pt(0.66, 0.38, 0.1),
    15: pt(0.32, 0.28, 0.12),
    16: pt(0.68, 0.28, 0.12),
    23: pt(0.46, 0.52, 0.04),
    24: pt(0.54, 0.52, 0.04),
    25: pt(0.42, 0.68, 0.02),
    26: pt(0.58, 0.68, 0.02),
    27: pt(0.4, 0.88, 0),
    28: pt(0.6, 0.88, 0),
  }),
  vrikshasana: buildLandmarks({
    0: pt(0.5, 0.12, 0),
    11: pt(0.42, 0.26, 0),
    12: pt(0.58, 0.26, 0),
    13: pt(0.38, 0.36, 0.02),
    14: pt(0.62, 0.36, -0.02),
    15: pt(0.36, 0.46, 0.04),
    16: pt(0.64, 0.46, -0.04),
    23: pt(0.44, 0.5, 0),
    24: pt(0.56, 0.5, 0),
    25: pt(0.44, 0.72, 0),
    26: pt(0.62, 0.58, -0.08),
    27: pt(0.44, 0.92, 0),
    28: pt(0.64, 0.72, -0.1),
  }),
  utkatasana: buildLandmarks({
    0: pt(0.5, 0.16, 0),
    11: pt(0.4, 0.28, 0),
    12: pt(0.6, 0.28, 0),
    13: pt(0.34, 0.38, 0.02),
    14: pt(0.66, 0.38, -0.02),
    15: pt(0.32, 0.2, 0.04),
    16: pt(0.68, 0.2, -0.04),
    23: pt(0.44, 0.48, 0),
    24: pt(0.56, 0.48, 0),
    25: pt(0.4, 0.68, 0.06),
    26: pt(0.6, 0.68, 0.06),
    27: pt(0.38, 0.82, 0.08),
    28: pt(0.62, 0.82, 0.08),
  }),
  paschimottanasana: buildLandmarks({
    0: pt(0.52, 0.62, 0.06),
    11: pt(0.42, 0.48, 0.04),
    12: pt(0.58, 0.48, 0.04),
    13: pt(0.4, 0.58, 0.08),
    14: pt(0.6, 0.58, 0.08),
    15: pt(0.38, 0.72, 0.1),
    16: pt(0.62, 0.72, 0.1),
    23: pt(0.44, 0.52, 0.02),
    24: pt(0.56, 0.52, 0.02),
    25: pt(0.42, 0.68, 0.04),
    26: pt(0.58, 0.68, 0.04),
    27: pt(0.4, 0.88, 0.06),
    28: pt(0.6, 0.88, 0.06),
  }),
  matsyendrasana: buildLandmarks({
    0: pt(0.54, 0.28, 0.04),
    11: pt(0.46, 0.4, 0.06),
    12: pt(0.58, 0.42, 0.02),
    13: pt(0.42, 0.5, 0.08),
    14: pt(0.66, 0.46, -0.02),
    15: pt(0.38, 0.56, 0.1),
    16: pt(0.72, 0.38, -0.04),
    23: pt(0.48, 0.56, 0.04),
    24: pt(0.58, 0.58, 0),
    25: pt(0.42, 0.72, 0.06),
    26: pt(0.68, 0.7, -0.02),
    27: pt(0.4, 0.86, 0.08),
    28: pt(0.72, 0.84, 0),
  }),
  siddhasana: buildLandmarks({
    0: pt(0.5, 0.24, 0),
    11: pt(0.42, 0.36, 0),
    12: pt(0.58, 0.36, 0),
    13: pt(0.4, 0.46, 0.02),
    14: pt(0.6, 0.46, -0.02),
    15: pt(0.38, 0.54, 0.04),
    16: pt(0.62, 0.54, -0.04),
    23: pt(0.44, 0.5, 0),
    24: pt(0.56, 0.5, 0),
    25: pt(0.46, 0.62, 0.08),
    26: pt(0.58, 0.64, 0.06),
    27: pt(0.44, 0.72, 0.1),
    28: pt(0.6, 0.74, 0.08),
  }),
  vajrasana: buildLandmarks({
    0: pt(0.5, 0.2, 0),
    11: pt(0.42, 0.32, 0),
    12: pt(0.58, 0.32, 0),
    13: pt(0.4, 0.42, 0.02),
    14: pt(0.6, 0.42, -0.02),
    15: pt(0.38, 0.5, 0.04),
    16: pt(0.62, 0.5, -0.04),
    23: pt(0.44, 0.48, 0),
    24: pt(0.56, 0.48, 0),
    25: pt(0.44, 0.62, 0.1),
    26: pt(0.56, 0.62, 0.1),
    27: pt(0.42, 0.72, 0.12),
    28: pt(0.58, 0.72, 0.12),
  }),
  shavasana: buildLandmarks({
    0: pt(0.72, 0.42, 0),
    11: pt(0.62, 0.46, 0),
    12: pt(0.78, 0.46, 0),
    13: pt(0.56, 0.5, 0.02),
    14: pt(0.84, 0.5, -0.02),
    15: pt(0.52, 0.54, 0.04),
    16: pt(0.88, 0.54, -0.04),
    23: pt(0.64, 0.52, 0),
    24: pt(0.76, 0.52, 0),
    25: pt(0.58, 0.58, 0.02),
    26: pt(0.82, 0.58, -0.02),
    27: pt(0.54, 0.66, 0.04),
    28: pt(0.86, 0.66, -0.04),
  }),
  sirsasana: buildLandmarks({
    0: pt(0.5, 0.82, 0.06),
    11: pt(0.4, 0.52, 0.04),
    12: pt(0.6, 0.52, 0.04),
    13: pt(0.36, 0.42, 0.06),
    14: pt(0.64, 0.42, 0.06),
    15: pt(0.34, 0.32, 0.08),
    16: pt(0.66, 0.32, 0.08),
    23: pt(0.46, 0.56, 0.02),
    24: pt(0.54, 0.56, 0.02),
    25: pt(0.44, 0.68, 0),
    26: pt(0.56, 0.68, 0),
    27: pt(0.42, 0.78, -0.02),
    28: pt(0.58, 0.78, -0.02),
  }),
};

const STEP_WEIGHTS = [0, 0.35, 0.7, 1] as const;

export function getCatalogStepFrames(poseKey: string): PoseLandmarkFrame[] {
  const hold = HOLD[poseKey] ?? HOLD.trikonasana;
  return STEP_WEIGHTS.map((w) => toFrame(blendNorm(STAND, hold, w)));
}

export function getCatalogHoldFrame(poseKey: string): PoseLandmarkFrame {
  return toFrame(HOLD[poseKey] ?? HOLD.trikonasana);
}

export { STAND, HOLD, toFrame, blendNorm, normalizedToWorld };
