# Step 4: ML Instructor Recommendation Engine

Data-driven instructor recommendations based on quality, student profile, and learning preferences.

---

## Overview

The recommendation engine learns from:
1. **Instructor quality** (extraction confidence + stability)
2. **Student profile** (experience, goals, limitations, learning style)
3. **Personal history** (ratings, watch history)
4. **Collaborative signals** (similar students' preferences)

Recommends the best instructor for each asana based on the student's needs.

---

## How It Works

### Scoring Factors (0-100)

Each instructor gets a composite score based on:

| Factor | Weight | What It Measures |
|--------|--------|---|
| **Quality Match** | 30% | Technical skill (past extraction confidence/stability) |
| **Style Match** | 20% | Teaching style alignment (classical vs. modern vs. athletic) |
| **Specialty Match** | 25% | Expertise in student's goals (flexibility, strength, etc.) |
| **Safety** | 15% | Knowledge of modifications for limitations |
| **Personal History** | 10% | Student's past ratings + watch history |

### Example Calculation

Student: Beginner, flexibility goal, knee issues, prefers modern style

```
Instructor: "Yoga With Adriene"
- Quality: 92% (high confidence extractions)
- Style: 100% (matches "modern" preference)
- Specialty: 90% (teaches flexibility well)
- Safety: 85% (good with modifications)
- History: 60% (student hasn't watched yet)

Score = 92×0.3 + 100×0.2 + 90×0.25 + 85×0.15 + 60×0.1 = 87.5
```

---

## Using the Recommendation Engine

### 1. React Component

```tsx
import { InstructorRecommendations } from "@/components/InstructorRecommendations";

export function AsanaDetailPage({ asanaSlug }: { asanaSlug: string }) {
  return (
    <InstructorRecommendations
      asanaSlug={asanaSlug}
      studentExperience="beginner"
      studentGoals={["flexibility", "mindfulness"]}
      studentLimitations={["knee_issues"]}
      preferredStyle="modern"
    />
  );
}
```

**Props:**
- `asanaSlug` (required): e.g., "trikonasana"
- `studentExperience`: "beginner" | "intermediate" | "advanced"
- `studentGoals`: string[] of goals
- `studentLimitations`: string[] of physical issues
- `preferredStyle`: "classical" | "modern" | "therapeutic" | "athletic"

**Output:**
```
1. Yoga With Adriene (87/100 match)
   Excellent quality, matches modern style, expert in flexibility
   
2. Restorative Yoga (79/100 match)
   Good for modifications, therapeutic approach
   
3. Iyengar Institute (76/100 match)
   Highest quality overall, but classical style
```

### 2. API Endpoint

```bash
curl -X POST http://localhost:3000/api/recommendations/instructors \
  -H "Content-Type: application/json" \
  -d '{
    "asanaSlug": "trikonasana",
    "studentProfile": {
      "experience": "beginner",
      "goals": ["flexibility"],
      "limitations": ["knee_issues"],
      "learningStyle": "visual",
      "preferredStyle": "modern",
      "watchHistory": [],
      "ratings": []
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "asanaSlug": "trikonasana",
  "recommendations": [
    {
      "instructorId": "instr_001",
      "instructorName": "Yoga With Adriene",
      "score": 87.5,
      "factors": {
        "qualityMatch": 0.92,
        "styleMatch": 1.0,
        "specialtyMatch": 0.90,
        "limitationSafety": 0.85,
        "personalHistory": 0.60
      },
      "explanation": "Yoga With Adriene: excellent technique and matches your style."
    }
  ]
}
```

### 3. Programmatic Usage

```typescript
import {
  InstructorRanker,
  StudentProfileBuilder,
  InstructorMetrics,
  InstructorProfile,
} from "@/lib/recommendations/instructor-ranker";

// Build student profile
const student = StudentProfileBuilder.buildProfile({
  experience: "intermediate",
  goals: ["strength", "balance"],
  limitations: ["shoulder_pain"],
  learningStyle: "kinesthetic",
  watchHistory: [{ instructorId: "instr_001", asanaSlug: "trikonasana" }],
  ratings: [{ instructorId: "instr_001", rating: 4 }],
  preferredStyle: "athletic",
});

// Get recommendations
const instructors: InstructorProfile[] = [...]; // your instructors
const recommendations = InstructorRanker.rankInstructors(
  instructors,
  "vrikshasana",
  student,
  new Map()
);

// Use top recommendation
const best = recommendations[0];
console.log(`${best.instructorName}: ${best.score}/100`);
console.log(best.explanation);
```

---

## Data Structures

### StudentProfile

```typescript
{
  id: string;
  experience: "beginner" | "intermediate" | "advanced";
  goals: string[];                    // e.g., ["flexibility", "strength"]
  limitations: string[];              // e.g., ["knee_issues", "shoulder_pain"]
  preferredStyle?: string;            // e.g., "modern"
  learningStyle: "visual" | "verbal" | "kinesthetic" | "mixed";
  watchedInstructors: Set<string>;    // instructor IDs they've watched
  ratings: Map<string, number>;       // instructor ID → 1-5 stars
}
```

### InstructorProfile

```typescript
{
  id: string;
  name: string;
  imageUrl?: string;
  style: "classical" | "modern" | "therapeutic" | "athletic";
  experience: number;                 // years teaching
  specialties: string[];              // e.g., ["beginners", "flexibility", "anatomy"]
  avgQualityScore: number;            // 0-1 from past extractions
  totalExtractionsReviewed: number;   // how many videos analyzed
}
```

### RecommendationScore

```typescript
{
  instructorId: string;
  instructorName: string;
  score: number;                      // 0-100
  factors: {
    qualityMatch: number;             // 0-1
    styleMatch: number;
    specialtyMatch: number;
    limitationSafety: number;
    personalHistory: number;
  };
  explanation: string;                // human-readable summary
}
```

---

## Advanced Features

### Collaborative Filtering

Find similar students and recommend their favorite instructors:

```typescript
import { CollaborativeFiltering } from "@/lib/recommendations/instructor-ranker";

// Get all students' profiles
const allStudents = [...];

// Find students similar to your student
const similar = CollaborativeFiltering.findSimilarStudents(
  myStudent,
  allStudents,
  0.7  // similarity threshold 0-1
);

// Get their high-rated instructors
const recommendations = CollaborativeFiltering.recommendFromSimilarStudents(
  myStudent,
  similar.map((s) => s.student)
);

// Use recommendations
for (const [instructorId, score] of recommendations) {
  console.log(`Instructor ${instructorId}: score ${score}`);
}
```

### Instructor Performance Ranking

Track and rank instructors by quality:

```typescript
import { InstructorMetrics } from "@/lib/recommendations/instructor-ranker";

// Calculate average quality from augmentations
const averageQualities = InstructorMetrics.calculateAverageQuality(
  augmentations  // from catalog augmentations
);

console.log(averageQualities);
// Map<"John Doe" → 0.92, "Jane Smith" → 0.85, ...>

// Get ranked list
const ranked = InstructorMetrics.rankByQuality(instructors);
ranked.forEach((instr) => {
  console.log(`#${instr.rank}: ${instr.name} (${instr.avgQualityScore})`);
});
```

### Student Profile Updates

Track student interactions and update profile:

```typescript
import { StudentProfileBuilder } from "@/lib/recommendations/instructor-ranker";

let profile = StudentProfileBuilder.buildProfile(initialData);

// Student watches a class
profile = StudentProfileBuilder.updateProfile(profile, {
  type: "watched",
  instructorId: "instr_001",
  asanaSlug: "trikonasana",
});

// Student rates the class
profile = StudentProfileBuilder.updateProfile(profile, {
  type: "rated",
  instructorId: "instr_001",
  rating: 5,
});

// New recommendations will factor in this history
```

---

## Integration Examples

### Example 1: Show Recommendations on Asana Page

```tsx
// pages/asana/[slug].tsx
import { InstructorRecommendations } from "@/components/InstructorRecommendations";
import { useUser } from "@/hooks/useUser";

export default function AsanaPage({ params }: { params: { slug: string } }) {
  const user = useUser();

  return (
    <div>
      <h1>{params.slug}</h1>
      
      <InstructorRecommendations
        asanaSlug={params.slug}
        studentExperience={user.experience}
        studentGoals={user.goals}
        studentLimitations={user.limitations}
        preferredStyle={user.preferences.style}
      />
    </div>
  );
}
```

### Example 2: Instructor Leaderboard

```tsx
export async function InstructorLeaderboard() {
  const response = await fetch(
    "/api/recommendations/instructors?action=metrics"
  );
  const data = await response.json();

  return (
    <div>
      <h2>Top Instructors</h2>
      {data.instructors.map((instr) => (
        <div key={instr.id}>
          <p>#{instr.rank} {instr.name}</p>
          <p>Quality: {(instr.qualityScore * 100).toFixed(0)}%</p>
          <p>Reviews: {instr.extractionsReviewed}</p>
          <p>Specialties: {instr.specialties.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Personalized Sequence Suggestion

```typescript
async function suggestSequence(studentProfile) {
  // Get student's top 5 asanas
  const topAsanas = ["trikonasana", "vrikshasana", "adho_mukha_svanasana"];
  
  // Get best instructor for each asana
  const recommendations = await Promise.all(
    topAsanas.map(async (asana) => {
      const response = await fetch("/api/recommendations/instructors", {
        method: "POST",
        body: JSON.stringify({ asanaSlug: asana, studentProfile }),
      });
      return response.json();
    })
  );

  // Find instructor that appears in top 3 for most asanas
  const instructorScores = {};
  recommendations.forEach((rec) => {
    rec.recommendations.slice(0, 3).forEach((r) => {
      instructorScores[r.instructorName] =
        (instructorScores[r.instructorName] || 0) + 1;
    });
  });

  // Return most consistent instructor
  const best = Object.entries(instructorScores).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return {
    instructor: best[0],
    confidence: best[1] / topAsanas.length,
    asanas: topAsanas,
  };
}
```

---

## Scoring Deep Dive

### Quality Match (30%)

Based on instructor's historical extractions:

```
Confidence: avg of MediaPipe landmark visibility across videos
Stability: how consistent the pose hold is across frames

Quality = (Confidence × 0.6 + Stability × 0.4)
         × Consistency Bonus (min(totalExtractions / 50, 1.0))
```

**Examples:**
- New instructor (0 extractions): 0.5 (neutral)
- 10 extractions, 0.90 avg: 0.80
- 50+ extractions, 0.95 avg: 0.95

### Style Match (20%)

Exact or similar styles:

```
Exact match (e.g., "modern" → "modern"): 1.0
Similar (e.g., "classical" → "therapeutic"): 0.7
Opposite (e.g., "classical" → "athletic"): 0.3
No preference: 0.6
```

### Specialty Match (25%)

Weighted match on:
- **Goals alignment** (student wants flexibility → instructor teaches flexibility)
- **Experience level** (beginners prefer beginner-friendly instructors)
- **General teaching skill** (bonus for all good teachers)

```
Score = min(1.0, goal_matches × 0.2 + level_match × 0.4 + 0.2)
```

### Safety (15%)

Instructor knowledge for modifications:

```
If student has limitations:
  - Therapeutic specialties (e.g., "therapeutic", "injuries"): 0.95
  - Veteran teacher (10+ years): 0.85
  - No special knowledge: 0.7
Else (no limitations): 1.0
```

### Personal History (10%)

Leverages student's past interactions:

```
If student rated instructor: rating / 5  (1-5 stars → 0.2-1.0)
If student watched (not rated): 0.65
If student hasn't seen: 0.5
```

---

## Future Enhancements

### Phase 5: Advanced ML

- [ ] Embeddings for instructor and student profiles
- [ ] Neural network for scoring
- [ ] A/B testing framework for recommendation quality
- [ ] Reinforcement learning from student feedback

### Phase 6: Social Features

- [ ] Student community and friend recommendations
- [ ] Instructor certification levels
- [ ] Review system with detailed feedback
- [ ] Class completion badges

### Phase 7: Content Intelligence

- [ ] Automatic learning path generation
- [ ] Progression tracking (beginner → advanced)
- [ ] Prerequisite asana mapping
- [ ] Customized practice sequences

---

## Testing

### Unit Tests

```typescript
import { InstructorRanker, StudentProfileBuilder } from "@/lib/recommendations/instructor-ranker";

describe("InstructorRanker", () => {
  it("ranks high-quality instructors first", () => {
    const instructor1 = { id: "1", avgQualityScore: 0.95, ... };
    const instructor2 = { id: "2", avgQualityScore: 0.70, ... };
    const student = StudentProfileBuilder.buildProfile({ ... });

    const ranked = InstructorRanker.rankInstructors(
      [instructor1, instructor2],
      "trikonasana",
      student
    );

    expect(ranked[0].instructorId).toBe("1");
  });

  it("respects style preference", () => {
    const modernInstr = { id: "1", style: "modern", ... };
    const classicalInstr = { id: "2", style: "classical", ... };
    const student = StudentProfileBuilder.buildProfile({
      preferredStyle: "modern",
      ...
    });

    const ranked = InstructorRanker.rankInstructors(
      [classicalInstr, modernInstr],
      "trikonasana",
      student
    );

    expect(ranked[0].instructorId).toBe("1");
  });
});
```

### Integration Test

```bash
# Get recommendations
curl -X POST http://localhost:3000/api/recommendations/instructors \
  -H "Content-Type: application/json" \
  -d '{"asanaSlug":"trikonasana","studentProfile":{...}}'

# Verify top 5 recommendations returned
# Verify score is 0-100
# Verify factors sum to 1.0
```

---

## See Also

- `INTEGRATION-GUIDE.md` — Phase 1 & 2 overview
- `CATALOG-AUGMENTATION.md` — How quality metrics are collected
- `SERVER-PROCESSING.md` — Advanced extraction for quality data
