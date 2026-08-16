import { NextResponse } from "next/server";
import {
  InstructorRanker,
  StudentProfileBuilder,
  InstructorMetrics,
} from "@/lib/recommendations/instructor-ranker";
import type { StudentProfile, InstructorProfile } from "@/lib/recommendations/instructor-ranker";

// Mock instructor database
const MOCK_INSTRUCTORS: InstructorProfile[] = [
  {
    id: "instr_001",
    name: "Yoga With Adriene",
    style: "modern",
    experience: 15,
    specialties: ["beginners", "flexibility", "mindfulness"],
    avgQualityScore: 0.92,
    totalExtractionsReviewed: 45,
  },
  {
    id: "instr_002",
    name: "BJ Fogeat",
    style: "classical",
    experience: 20,
    specialties: ["advanced", "alignment", "anatomy"],
    avgQualityScore: 0.88,
    totalExtractionsReviewed: 32,
  },
  {
    id: "instr_003",
    name: "Iyengar Institute",
    style: "classical",
    experience: 30,
    specialties: ["therapeutic", "alignment", "modifications", "props"],
    avgQualityScore: 0.95,
    totalExtractionsReviewed: 67,
  },
  {
    id: "instr_004",
    name: "Power Yoga Flow",
    style: "athletic",
    experience: 10,
    specialties: ["strength", "athletic", "intermediate"],
    avgQualityScore: 0.85,
    totalExtractionsReviewed: 28,
  },
  {
    id: "instr_005",
    name: "Restorative Yoga",
    style: "therapeutic",
    experience: 12,
    specialties: ["therapeutic", "beginners", "stress-relief", "injuries"],
    avgQualityScore: 0.91,
    totalExtractionsReviewed: 38,
  },
];

/**
 * POST /api/recommendations/instructors
 * Get ranked instructor recommendations
 *
 * Body:
 * {
 *   "asanaSlug": "trikonasana",
 *   "studentProfile": {
 *     "experience": "beginner",
 *     "goals": ["flexibility", "mindfulness"],
 *     "limitations": [],
 *     "learningStyle": "visual",
 *     "preferredStyle": "modern"
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { asanaSlug, studentProfile } = body;

    if (!asanaSlug || !studentProfile) {
      return NextResponse.json(
        { success: false, error: "Missing asanaSlug or studentProfile" },
        { status: 400 }
      );
    }

    // Build student profile
    const student: StudentProfile = StudentProfileBuilder.buildProfile(
      studentProfile
    );

    // Rank instructors
    const recommendations = InstructorRanker.rankInstructors(
      MOCK_INSTRUCTORS,
      asanaSlug,
      student,
      new Map()
    );

    // Get top recommendations
    const top = recommendations.slice(0, 5);

    return NextResponse.json({
      success: true,
      asanaSlug,
      recommendations: top,
      studentProfile: {
        experience: student.experience,
        goals: student.goals,
        limitations: student.limitations,
        preferredStyle: student.preferredStyle,
      },
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommendations/instructors
 * Get instructor rankings and metrics
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "metrics") {
    // Return instructor performance metrics
    const ranked = InstructorMetrics.rankByQuality(MOCK_INSTRUCTORS);

    return NextResponse.json({
      success: true,
      instructors: ranked.map((i) => ({
        id: i.id,
        name: i.name,
        rank: i.rank,
        qualityScore: i.avgQualityScore,
        extractionsReviewed: i.totalExtractionsReviewed,
        specialties: i.specialties,
      })),
    });
  }

  if (action === "list") {
    // Return all available instructors
    return NextResponse.json({
      success: true,
      count: MOCK_INSTRUCTORS.length,
      instructors: MOCK_INSTRUCTORS.map((i) => ({
        id: i.id,
        name: i.name,
        style: i.style,
        experience: i.experience,
        specialties: i.specialties,
      })),
    });
  }

  return NextResponse.json(
    { success: false, error: "Unknown action" },
    { status: 400 }
  );
}
