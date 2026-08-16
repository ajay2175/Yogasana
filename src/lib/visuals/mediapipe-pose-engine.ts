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

/** Self-hosted assets — avoids CDN / CORS failures in production and offline dev. */
const WASM_ROOT = "/mediapipe/wasm";
const LITE_MODEL = "/mediapipe/pose_landmarker_lite.task";

async function createLandmarker(delegate: "GPU" | "CPU"): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: LITE_MODEL,
      delegate,
    },
    runningMode: "IMAGE",
    numPoses: 1,
  });
}

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      try {
        return await createLandmarker("GPU");
      } catch {
        return createLandmarker("CPU");
      }
    })();
  }
  return landmarkerPromise;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const sameOrigin =
      url.startsWith("/") ||
      (typeof window !== "undefined" && url.startsWith(window.location.origin));
    if (!sameOrigin) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image at ${url}`));
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

export function localReferencePath(poseKey: string): string {
  return `/reference-poses/${poseKey}.jpg`;
}

export function isLikelyBrokenRemoteUrl(url: string): boolean {
  return url.includes("upload.wikimedia.org");
}
