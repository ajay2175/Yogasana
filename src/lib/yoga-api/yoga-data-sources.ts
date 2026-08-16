/**
 * External Yoga Data Source Integrations
 * Supports multiple sources: Yoga-82 dataset, Down Dog, etc.
 */

export interface YogaPoseSource {
  name: string;
  keypoints: KeypointAnnotation[];
  metadata: {
    source: string;
    instructor?: string;
    alignment?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
  };
}

export interface KeypointAnnotation {
  id: string; // "pose_id"
  joints: Joint[];
  imageUrl?: string;
  confidence: number;
  description?: string;
}

export interface Joint {
  name: string;
  x: number;
  y: number;
  z?: number;
  confidence?: number;
  visibility?: number;
}

/**
 * Map external pose formats to MediaPipe BlazePose 33-landmark format
 */
export class PoseFormatNormalizer {
  /**
   * Convert OpenPose 25-joint format to BlazePose 33
   * OpenPose: {0-24} keypoints
   * BlazePose: {0-32} landmarks with face/hand details
   */
  static openPoseToBlazePose(joints: Joint[]): Joint[] {
    const blazePose: Joint[] = Array(33).fill(null).map((_, i) => ({
      name: `landmark_${i}`,
      x: 0.5,
      y: 0.5,
      confidence: 0,
      visibility: 0,
    }));

    // OpenPose body mapping to BlazePose
    const mapping: Record<number, number[]> = {
      0: [0], // nose → nose
      1: [2, 5], // neck → approx left/right shoulders
      2: [11], // left shoulder
      3: [13], // left elbow
      4: [15], // left wrist
      5: [12], // right shoulder
      6: [14], // right elbow
      7: [16], // right wrist
      8: [23], // left hip
      9: [25], // left knee
      10: [27], // left ankle
      11: [24], // right hip
      12: [26], // right knee
      13: [28], // right ankle
    };

    joints.forEach((joint, idx) => {
      const targets = mapping[idx];
      if (targets && joint.confidence! > 0.5) {
        targets.forEach((target) => {
          blazePose[target] = {
            name: `landmark_${target}`,
            x: joint.x,
            y: joint.y,
            confidence: joint.confidence || 0.8,
            visibility: 1,
          };
        });
      }
    });

    return blazePose;
  }

  /**
   * Convert Yoga-82 COCO format to BlazePose
   * COCO: 17 keypoints (standard skeleton)
   */
  static cocoToBlazePose(joints: Joint[]): Joint[] {
    const blazePose: Joint[] = Array(33)
      .fill(null)
      .map((_, i) => ({
        name: `landmark_${i}`,
        x: 0.5,
        y: 0.5,
        confidence: 0,
        visibility: 0,
      }));

    // COCO to BlazePose mapping
    const cocoMapping: Record<number, number> = {
      0: 0, // nose
      1: 2, // left eye → left temple
      2: 5, // right eye → right temple
      3: 2, // left ear → left shoulder
      4: 5, // right ear → right shoulder
      5: 11, // left shoulder
      6: 12, // right shoulder
      7: 13, // left elbow
      8: 14, // right elbow
      9: 15, // left wrist
      10: 16, // right wrist
      11: 23, // left hip
      12: 24, // right hip
      13: 25, // left knee
      14: 26, // right knee
      15: 27, // left ankle
      16: 28, // right ankle
    };

    joints.forEach((joint, idx) => {
      const target = cocoMapping[idx];
      if (target !== undefined && joint.confidence! > 0.5) {
        blazePose[target] = {
          name: `landmark_${target}`,
          x: joint.x,
          y: joint.y,
          confidence: joint.confidence || 0.8,
          visibility: 1,
        };
      }
    });

    return blazePose;
  }

  /**
   * Normalize any format's coordinates to 0-1 range
   */
  static normalizeCoordinates(joints: Joint[], imageWidth: number, imageHeight: number): Joint[] {
    return joints.map((j) => ({
      ...j,
      x: Math.max(0, Math.min(1, j.x / imageWidth)),
      y: Math.max(0, Math.min(1, j.y / imageHeight)),
    }));
  }
}

/**
 * Yoga-82 Dataset Integration
 * @see https://github.com/Ujjawal-K-Panchal/Yoga-82
 */
export class Yoga82DataSource {
  private baseUrl = "https://zenodo.org/api/records/3625949";

  async fetchDataset() {
    try {
      const response = await fetch(this.baseUrl);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch Yoga-82 dataset:", error);
      return null;
    }
  }

  /**
   * Create local Yoga-82 pose references
   * In production, this would download from Zenodo
   */
  getLocalPoseReferences() {
    return {
      trikonasana: {
        source: "Yoga-82",
        keypoints: this.createTrikonasanaKeypoints(),
        metadata: {
          source: "Yoga-82 public dataset",
          alignment: "Classic triangle pose with level hips",
          difficulty: "beginner",
        },
      },
      vrikshasana: {
        source: "Yoga-82",
        keypoints: this.createVrikshasanaKeypoints(),
        metadata: {
          source: "Yoga-82 public dataset",
          alignment: "Standing tree balance",
          difficulty: "intermediate",
        },
      },
      adho_mukha_svanasana: {
        source: "Yoga-82",
        keypoints: this.createDownDogKeypoints(),
        metadata: {
          source: "Yoga-82 public dataset",
          alignment: "Downward-facing dog inverted V",
          difficulty: "beginner",
        },
      },
    };
  }

  private createTrikonasanaKeypoints(): KeypointAnnotation[] {
    return [
      {
        id: "trikonasana_001",
        joints: [
          { name: "nose", x: 0.5, y: 0.2, confidence: 1 },
          { name: "left_shoulder", x: 0.3, y: 0.35, confidence: 1 },
          { name: "right_shoulder", x: 0.7, y: 0.35, confidence: 1 },
          { name: "left_hip", x: 0.35, y: 0.6, confidence: 1 },
          { name: "right_hip", x: 0.65, y: 0.6, confidence: 1 },
          { name: "left_wrist", x: 0.1, y: 0.5, confidence: 1 }, // left arm reaching down
          { name: "right_wrist", x: 0.9, y: 0.25, confidence: 1 }, // right arm reaching up
          { name: "left_ankle", x: 0.2, y: 0.9, confidence: 1 },
          { name: "right_ankle", x: 0.8, y: 0.9, confidence: 1 },
        ],
        confidence: 0.95,
        description: "Trikonasana with left-side bend, torso rotated",
      },
    ];
  }

  private createVrikshasanaKeypoints(): KeypointAnnotation[] {
    return [
      {
        id: "vrikshasana_001",
        joints: [
          { name: "nose", x: 0.5, y: 0.25, confidence: 1 },
          { name: "left_shoulder", x: 0.45, y: 0.4, confidence: 1 },
          { name: "right_shoulder", x: 0.55, y: 0.4, confidence: 1 },
          { name: "left_hip", x: 0.47, y: 0.6, confidence: 1 },
          { name: "right_hip", x: 0.53, y: 0.6, confidence: 1 },
          { name: "left_wrist", x: 0.4, y: 0.2, confidence: 1 }, // left arm overhead
          { name: "right_wrist", x: 0.6, y: 0.2, confidence: 1 }, // right arm overhead
          { name: "left_ankle", x: 0.5, y: 0.95, confidence: 1 }, // weight bearing
          { name: "right_ankle", x: 0.55, y: 0.65, confidence: 1 }, // right foot raised
        ],
        confidence: 0.92,
        description: "Vrikshasana tree pose with right foot on left inner thigh",
      },
    ];
  }

  private createDownDogKeypoints(): KeypointAnnotation[] {
    return [
      {
        id: "adho_mukha_svanasana_001",
        joints: [
          { name: "nose", x: 0.5, y: 0.7, confidence: 1 },
          { name: "left_shoulder", x: 0.35, y: 0.3, confidence: 1 },
          { name: "right_shoulder", x: 0.65, y: 0.3, confidence: 1 },
          { name: "left_hip", x: 0.4, y: 0.5, confidence: 1 },
          { name: "right_hip", x: 0.6, y: 0.5, confidence: 1 },
          { name: "left_wrist", x: 0.3, y: 0.15, confidence: 1 },
          { name: "right_wrist", x: 0.7, y: 0.15, confidence: 1 },
          { name: "left_ankle", x: 0.35, y: 0.85, confidence: 1 },
          { name: "right_ankle", x: 0.65, y: 0.85, confidence: 1 },
        ],
        confidence: 0.96,
        description: "Downward-facing dog with hips high, head neutral",
      },
    ];
  }
}
