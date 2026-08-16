/**
 * Instructor Recommendation Engine
 * ML-based ranking of instructors by quality, style, and student preference
 */

export interface InstructorProfile {
  id: string;
  name: string;
  imageUrl?: string;
  style: "classical" | "modern" | "therapeutic" | "athletic";
  experience: number; // years
  specialties: string[]; // "beginners", "flexibility", "strength", etc.
  avgQualityScore: number; // 0-1 (from past extractions)
  totalExtractionsReviewed: number;
}

export interface StudentProfile {
  id: string;
  experience: "beginner" | "intermediate" | "advanced";
  goals: string[]; // "flexibility", "strength", "mindfulness", etc.
  limitations: string[]; // "knee_issues", "shoulder_pain", etc.
  preferredStyle?: string;
  learningStyle: "visual" | "verbal" | "kinesthetic" | "mixed";
  watchedInstructors: Set<string>; // instructor IDs
  ratings: Map<string, number>; // instructor ID → 1-5 star rating
}

export interface RecommendationScore {
  instructorId: string;
  instructorName: string;
  score: number; // 0-100
  factors: {
    qualityMatch: number;
    styleMatch: number;
    specialtyMatch: number;
    limitationSafety: number;
    personalHistory: number;
  };
  explanation: string;
}

/**
 * Instructor Ranking Engine
 * Considers quality, student profile, learning style, specialties
 */
export class InstructorRanker {
  /**
   * Recommend instructors for an asana + student combination
   */
  static rankInstructors(
    candidates: InstructorProfile[],
    asanaSlug: string,
    student: StudentProfile,
    availableInstances: Map<string, number> // instructor ID → video count
  ): RecommendationScore[] {
    const scores: RecommendationScore[] = candidates.map((instructor) => {
      const factors = {
        qualityMatch: this.scoreQualityMatch(instructor),
        styleMatch: this.scoreStyleMatch(instructor, student),
        specialtyMatch: this.scoreSpecialtyMatch(instructor, student, asanaSlug),
        limitationSafety: this.scoreLimitationSafety(instructor, student),
        personalHistory: this.scorePersonalHistory(instructor, student),
      };

      const score =
        factors.qualityMatch * 0.3 +
        factors.styleMatch * 0.2 +
        factors.specialtyMatch * 0.25 +
        factors.limitationSafety * 0.15 +
        factors.personalHistory * 0.1;

      return {
        instructorId: instructor.id,
        instructorName: instructor.name,
        score: Math.round(score * 100) / 100,
        factors,
        explanation: this.generateExplanation(instructor, factors, score),
      };
    });

    // Sort by score, descending
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Quality Score: Based on past extraction results
   * Higher confidence + stability = better instructor
   */
  private static scoreQualityMatch(instructor: InstructorProfile): number {
    if (instructor.totalExtractionsReviewed === 0) {
      return 0.5; // Neutral for new instructors
    }

    // Reward consistency
    const consistency = Math.min(
      1.0,
      instructor.totalExtractionsReviewed / 50
    );
    return instructor.avgQualityScore * 0.7 + consistency * 0.3;
  }

  /**
   * Style Match: Align instructor style with student preference
   */
  private static scoreStyleMatch(
    instructor: InstructorProfile,
    student: StudentProfile
  ): number {
    if (!student.preferredStyle) {
      return 0.6; // Neutral if no preference
    }

    if (instructor.style === student.preferredStyle) {
      return 1.0;
    }

    // Similar styles get partial credit
    const styleAffinities: Record<string, string[]> = {
      classical: ["therapeutic"],
      therapeutic: ["classical"],
      modern: ["athletic"],
      athletic: ["modern"],
    };

    const affinities = styleAffinities[student.preferredStyle] || [];
    return affinities.includes(instructor.style) ? 0.7 : 0.3;
  }

  /**
   * Specialty Match: Does instructor teach this asana well?
   */
  private static scoreSpecialtyMatch(
    instructor: InstructorProfile,
    student: StudentProfile,
    asanaSlug: string
  ): number {
    let score = 0;

    // Match student goals
    const matchingGoals = instructor.specialties.filter((s) =>
      student.goals.some((g) =>
        s.toLowerCase().includes(g.toLowerCase()) ||
        g.toLowerCase().includes(s.toLowerCase())
      )
    );
    score += matchingGoals.length * 0.2;

    // Match experience level
    const experienceLevelSpecialties = {
      beginner: ["beginners", "fundamentals", "basics"],
      intermediate: ["intermediate", "refinement", "depth"],
      advanced: ["advanced", "mastery", "variations"],
    };

    const levelSpecialties = experienceLevelSpecialties[student.experience];
    if (levelSpecialties.some((s) => instructor.specialties.includes(s))) {
      score += 0.4;
    }

    // Bonus for general teaching skill
    score += 0.2;

    return Math.min(1.0, score);
  }

  /**
   * Limitation Safety: Does instructor account for student limitations?
   */
  private static scoreLimitationSafety(
    instructor: InstructorProfile,
    student: StudentProfile
  ): number {
    if (student.limitations.length === 0) {
      return 1.0; // No limitations = full score
    }

    // Check if instructor has therapeutic specialties
    const therapeuticSpecialties = instructor.specialties.filter((s) =>
      ["therapeutic", "modifications", "adjustments", "injuries"].some((t) =>
        s.toLowerCase().includes(t)
      )
    );

    if (therapeuticSpecialties.length > 0) {
      return 0.95; // High confidence
    }

    // Check experience level
    if (instructor.experience > 10) {
      return 0.85; // Veteran instructors likely know modifications
    }

    return 0.7; // Neutral if no therapeutic focus
  }

  /**
   * Personal History: Student's past interactions with this instructor
   */
  private static scorePersonalHistory(
    instructor: InstructorProfile,
    student: StudentProfile
  ): number {
    // Student has rated this instructor
    if (student.ratings.has(instructor.id)) {
      const rating = student.ratings.get(instructor.id) || 0;
      return rating / 5; // 1-5 stars → 0.2-1.0
    }

    // Student hasn't watched this instructor before
    if (!student.watchedInstructors.has(instructor.id)) {
      return 0.5; // Neutral (slightly exploratory bias)
    }

    // Student has watched but not rated (mild positive signal)
    return 0.65;
  }

  /**
   * Generate human-readable explanation
   */
  private static generateExplanation(
    instructor: InstructorProfile,
    factors: Record<string, number>,
    score: number
  ): string {
    const strengths: string[] = [];

    if (factors.qualityMatch > 0.85) {
      strengths.push("excellent technique");
    }
    if (factors.styleMatch > 0.85) {
      strengths.push("matches your style");
    }
    if (factors.specialtyMatch > 0.8) {
      strengths.push("expert in your goals");
    }
    if (factors.limitationSafety > 0.8) {
      strengths.push("good with modifications");
    }
    if (factors.personalHistory > 0.8) {
      strengths.push("you've rated them highly");
    }

    if (strengths.length === 0) {
      return `${instructor.name} is a solid choice for this pose.`;
    }

    if (strengths.length === 1) {
      return `${instructor.name} is recommended: ${strengths[0]}.`;
    }

    return `${instructor.name}: ${strengths.slice(0, 2).join(" and ")}.`;
  }
}

/**
 * Student Learning Profile Builder
 * Builds student profile from interaction history
 */
export class StudentProfileBuilder {
  /**
   * Create profile from interaction data
   */
  static buildProfile(
    studentData: {
      experience: "beginner" | "intermediate" | "advanced";
      goals: string[];
      limitations: string[];
      learningStyle: "visual" | "verbal" | "kinesthetic" | "mixed";
      watchHistory: Array<{ instructorId: string; asanaSlug: string }>;
      ratings: Array<{ instructorId: string; rating: number }>;
      preferredStyle?: string;
    }
  ): StudentProfile {
    return {
      id: `student_${Date.now()}`,
      experience: studentData.experience,
      goals: studentData.goals,
      limitations: studentData.limitations,
      preferredStyle: studentData.preferredStyle,
      learningStyle: studentData.learningStyle,
      watchedInstructors: new Set(
        studentData.watchHistory.map((w) => w.instructorId)
      ),
      ratings: new Map(studentData.ratings.map((r) => [r.instructorId, r.rating])),
    };
  }

  /**
   * Update profile with new interaction
   */
  static updateProfile(
    profile: StudentProfile,
    interaction: {
      type: "watched" | "rated" | "completed";
      instructorId: string;
      rating?: number;
      asanaSlug?: string;
    }
  ): StudentProfile {
    const updated = { ...profile };

    if (interaction.type === "watched" && interaction.asanaSlug) {
      updated.watchedInstructors.add(interaction.instructorId);
    }

    if (interaction.type === "rated" && interaction.rating) {
      updated.ratings.set(interaction.instructorId, interaction.rating);
    }

    return updated;
  }
}

/**
 * Instructor Performance Metrics
 */
export class InstructorMetrics {
  /**
   * Calculate average quality from extractions
   */
  static calculateAverageQuality(
    augmentations: Array<{
      sourceMetadata: {
        instructor: string;
        confidence: number;
        stability: number;
      };
    }>
  ): Map<string, number> {
    const instructorScores = new Map<string, number[]>();

    augmentations.forEach((aug) => {
      const instructor = aug.sourceMetadata.instructor;
      const score =
        aug.sourceMetadata.confidence * 0.6 +
        aug.sourceMetadata.stability * 0.4;

      if (!instructorScores.has(instructor)) {
        instructorScores.set(instructor, []);
      }
      instructorScores.get(instructor)!.push(score);
    });

    const averages = new Map<string, number>();
    instructorScores.forEach((scores, instructor) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      averages.set(instructor, avg);
    });

    return averages;
  }

  /**
   * Rank instructors by quality
   */
  static rankByQuality(
    instructors: InstructorProfile[]
  ): Array<InstructorProfile & { rank: number }> {
    const sorted = [...instructors].sort(
      (a, b) => b.avgQualityScore - a.avgQualityScore
    );
    return sorted.map((i, idx) => ({ ...i, rank: idx + 1 }));
  }
}

/**
 * Collaborative Filtering for Recommendations
 * Find students with similar taste and recommend their favorite instructors
 */
export class CollaborativeFiltering {
  /**
   * Find similar students based on rating patterns
   */
  static findSimilarStudents(
    targetStudent: StudentProfile,
    otherStudents: StudentProfile[],
    similarityThreshold: number = 0.7
  ): Array<{ student: StudentProfile; similarity: number }> {
    const similarities = otherStudents
      .map((other) => ({
        student: other,
        similarity: this.computeSimilarity(targetStudent, other),
      }))
      .filter((s) => s.similarity > similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity);

    return similarities;
  }

  /**
   * Compute Jaccard similarity between two student profiles
   */
  private static computeSimilarity(
    student1: StudentProfile,
    student2: StudentProfile
  ): number {
    const goals1 = new Set(student1.goals);
    const goals2 = new Set(student2.goals);

    const intersection = [...goals1].filter((g) => goals2.has(g)).length;
    const union = new Set([...goals1, ...goals2]).size;

    const goalsJaccard = union === 0 ? 0 : intersection / union;

    // Also consider rating correlation
    let ratingCorr = 0;
    let count = 0;

    for (const [instructorId, rating1] of student1.ratings) {
      const rating2 = student2.ratings.get(instructorId);
      if (rating2) {
        ratingCorr += Math.abs(rating1 - rating2) / 5;
        count++;
      }
    }

    const ratingJaccard = count === 0 ? 0 : 1 - ratingCorr / count;

    return goalsJaccard * 0.6 + ratingJaccard * 0.4;
  }

  /**
   * Recommend instructors based on similar students
   */
  static recommendFromSimilarStudents(
    targetStudent: StudentProfile,
    similarStudents: StudentProfile[]
  ): Map<string, number> {
    const recommendations = new Map<string, number>();

    similarStudents.forEach((similar) => {
      // Collect high-rated instructors from similar students
      for (const [instructorId, rating] of similar.ratings) {
        if (rating >= 4 && !targetStudent.ratings.has(instructorId)) {
          const current = recommendations.get(instructorId) || 0;
          recommendations.set(instructorId, current + rating);
        }
      }
    });

    return recommendations;
  }
}
