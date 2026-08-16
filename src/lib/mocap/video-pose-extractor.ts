/**
 * Video-to-Pose Extraction Pipeline
 * Extracts instructor pose data from yoga teaching videos
 * Uses MediaPipe for browser extraction or server-side processing
 */

export interface ExtractedFrame {
  frameNumber: number;
  timestamp: number; // ms
  landmarks: Landmark[];
  confidence: number;
  imageBase64?: string; // optional frame thumbnail
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
  name?: string;
}

export interface PoseExtractionResult {
  poseId: string;
  asanaSlug: string;
  duration: number; // seconds
  fps: number;
  totalFrames: number;
  extractedFrames: ExtractedFrame[];
  keyframes: ExtractedFrame[]; // 3-5 representative frames
  confidence: number; // avg confidence across frames
  metadata: {
    sourceFile: string;
    extractedAt: string;
    instructor?: string;
    notes?: string;
  };
}

/**
 * Browser-side video frame extraction using Canvas API
 * Loads video and extracts frames at intervals
 */
export class BrowserVideoExtractor {
  static async extractFrames(
    videoFile: File,
    framesPerSecond: number = 5
  ): Promise<ExtractedFrame[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Cannot get 2D context from canvas"));
        return;
      }

      const frames: ExtractedFrame[] = [];
      const reader = new FileReader();

      reader.onload = (e) => {
        video.src = e.target?.result as string;
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const frameInterval = 1 / framesPerSecond;
          let frameNumber = 0;
          const duration = video.duration;

          const extractNextFrame = () => {
            const time = frameNumber * frameInterval;
            if (time > duration) {
              resolve(frames);
              return;
            }

            video.currentTime = time;

            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push({
                frameNumber,
                timestamp: time * 1000,
                landmarks: [], // will be filled by MediaPipe
                confidence: 0,
                imageBase64: canvas.toDataURL("image/jpeg", 0.7),
              });
              frameNumber++;
              extractNextFrame();
            };
          };

          extractNextFrame();
        };
      };

      reader.readAsDataURL(videoFile);
    });
  }

  /**
   * Simplify frames to key poses (select representative frames)
   * Uses distance-based clustering to find distinct poses
   */
  static selectKeyframes(frames: ExtractedFrame[], targetCount: number = 5): ExtractedFrame[] {
    if (frames.length <= targetCount) {
      return frames;
    }

    // Simple sampling strategy: select evenly distributed frames
    const step = Math.floor(frames.length / targetCount);
    const keyframes: ExtractedFrame[] = [];

    for (let i = 0; i < frames.length; i += step) {
      keyframes.push(frames[i]);
    }

    // Always include last frame if not already included
    if (keyframes[keyframes.length - 1].frameNumber !== frames[frames.length - 1].frameNumber) {
      keyframes.push(frames[frames.length - 1]);
    }

    return keyframes.slice(0, targetCount);
  }
}

/**
 * Server-side video processing
 * Requires FFmpeg for frame extraction
 */
export class ServerVideoProcessor {
  /**
   * Extract frames using FFmpeg (for server deployment)
   * Command: ffmpeg -i video.mp4 -vf fps=5 frame_%04d.png
   */
  static async extractFramesWithFFmpeg(
    videoPath: string,
    fps: number = 5
  ): Promise<ExtractedFrame[]> {
    // In a real implementation, this would spawn an FFmpeg process
    // For now, return a placeholder
    console.warn("Server FFmpeg extraction not yet implemented. Use browser extraction.");
    return [];
  }

  /**
   * Process video to extract and normalize landmarks
   * Returns structured pose data ready for catalog augmentation
   */
  static createPoseExtractionJob(
    asanaSlug: string,
    videoFile: File,
    instructor?: string
  ): PoseExtractionResult {
    return {
      poseId: `${asanaSlug}_${Date.now()}`,
      asanaSlug,
      duration: 0, // will be filled
      fps: 5,
      totalFrames: 0,
      extractedFrames: [],
      keyframes: [],
      confidence: 0,
      metadata: {
        sourceFile: videoFile.name,
        extractedAt: new Date().toISOString(),
        instructor,
      },
    };
  }
}

/**
 * MediaPipe Pose Detector wrapper for extracted frames
 * Takes frame images and runs pose detection
 */
export class MediaPipePoseDetector {
  private poseDetector: any = null;

  async initialize() {
    const vision = await import("@mediapipe/tasks-vision");
    const { PoseLandmarker, FilesetResolver } = vision;

    const filesetResolver = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

    this.poseDetector = await PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "/mediapipe/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
    });
  }

  /**
   * Detect pose in an image (from frame)
   */
  async detectPose(imageSource: HTMLCanvasElement | HTMLImageElement | string) {
    if (!this.poseDetector) {
      await this.initialize();
    }

    try {
      const result = this.poseDetector.detect(imageSource);
      return result.landmarks[0] || []; // Return first detected person
    } catch (error) {
      console.error("Error detecting pose:", error);
      return [];
    }
  }
}

/**
 * Quality validation for extracted poses
 */
export class PoseQualityValidator {
  /**
   * Check if extracted landmarks meet quality thresholds
   */
  static validateExtractedFrame(frame: ExtractedFrame, minConfidence: number = 0.6): boolean {
    if (frame.landmarks.length === 0) {
      return false;
    }

    const visibleLandmarks = frame.landmarks.filter((l) => (l.visibility || 0) > 0.5);
    const visibilityRatio = visibleLandmarks.length / frame.landmarks.length;

    return frame.confidence >= minConfidence && visibilityRatio > 0.7;
  }

  /**
   * Compute pose stability (how much does the pose change between frames)
   * Low change = good steady hold for teaching
   */
  static computeStability(frames: ExtractedFrame[], windowSize: number = 3): number {
    if (frames.length < windowSize) return 0;

    let totalChange = 0;
    for (let i = windowSize; i < frames.length; i++) {
      const prev = frames[i - windowSize];
      const curr = frames[i];

      let frameChange = 0;
      for (let j = 0; j < Math.min(prev.landmarks.length, curr.landmarks.length); j++) {
        const dx = curr.landmarks[j].x - prev.landmarks[j].x;
        const dy = curr.landmarks[j].y - prev.landmarks[j].y;
        frameChange += Math.sqrt(dx * dx + dy * dy);
      }
      totalChange += frameChange;
    }

    const avgChange = totalChange / Math.max(1, frames.length - windowSize);
    // Convert to stability score (1 = very stable, 0 = very unstable)
    return Math.max(0, 1 - avgChange);
  }
}
