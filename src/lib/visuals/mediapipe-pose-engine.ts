import {
  FilesetResolver,
  PoseLandmarker,
  type Landmark,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export type PoseLandmarkFrame = {
  world: Landmark[];
  normalized: Landmark[];
  imageWidth: number;
  imageHeight: number;
};

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const HEAVY_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task";

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HEAVY_MODEL,
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
      });
    })();
  }
  return landmarkerPromise;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load pose reference image: ${url}`));
    img.src = url;
  });
}

function toFrame(result: PoseLandmarkerResult, width: number, height: number): PoseLandmarkFrame | null {
  const world = result.worldLandmarks[0];
  const normalized = result.landmarks[0];
  if (!world || !normalized) return null;
  return { world, normalized, imageWidth: width, imageHeight: height };
}

const frameCache = new Map<string, PoseLandmarkFrame>();

/** Google MediaPipe Pose Landmarker (Heavy / BlazePose GHUM 3D). */
export async function detectPoseFromImageUrl(url: string): Promise<PoseLandmarkFrame | null> {
  const cached = frameCache.get(url);
  if (cached) return cached;

  const img = await loadImage(url);
  const landmarker = await getPoseLandmarker();
  const result = landmarker.detect(img);
  const frame = toFrame(result, img.naturalWidth, img.naturalHeight);
  if (frame) frameCache.set(url, frame);
  return frame;
}

export function blendLandmarkFrames(
  a: PoseLandmarkFrame,
  b: PoseLandmarkFrame,
  t: number,
): PoseLandmarkFrame {
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const mix = (x: number, y: number) => x + (y - x) * clamp(t);

  const blendList = (left: Landmark[], right: Landmark[]): Landmark[] =>
    left.map((point, i) => {
      const other = right[i] ?? point;
      return {
        x: mix(point.x, other.x),
        y: mix(point.y, other.y),
        z: mix(point.z, other.z),
        visibility: mix(point.visibility ?? 1, other.visibility ?? 1),
      };
    });

  return {
    world: blendList(a.world, b.world),
    normalized: blendList(a.normalized, b.normalized),
    imageWidth: b.imageWidth,
    imageHeight: b.imageHeight,
  };
}
