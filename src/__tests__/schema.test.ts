import { describe, it, expect } from "vitest";
import { AnalysisResultSchema } from "@/lib/schema";

describe("AnalysisResultSchema (Zod validation)", () => {
  const validPayload = {
    candidate_name: "Rahul Sharma",
    match_score: 85,
    matching_skills: [
      "TypeScript",
      "Next.js App Router",
      "Google Gemini API",
      "SQLite & SQL",
      "Vitest unit testing",
    ],
    gaps: [
      "Limited production Kubernetes experience",
      "No mention of GraphQL API design",
      "Short tenure at previous startup",
    ],
    interview_questions: [
      "Can you walk through how you handled schema validation failures with Gemini?",
      "How did you design indexes for your SQLite search queries?",
      "Describe a complex production outage you debugged in a Next.js service.",
    ],
  };

  it("accepts a valid analysis result matching all constraints", () => {
    const parsed = AnalysisResultSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("rejects match_score greater than 100 or less than 0", () => {
    const tooHigh = AnalysisResultSchema.safeParse({
      ...validPayload,
      match_score: 150,
    });
    expect(tooHigh.success).toBe(false);

    const negative = AnalysisResultSchema.safeParse({
      ...validPayload,
      match_score: -5,
    });
    expect(negative.success).toBe(false);
  });

  it("rejects wrong array counts for matching_skills, gaps, or interview_questions", () => {
    const fourSkills = AnalysisResultSchema.safeParse({
      ...validPayload,
      matching_skills: ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
    });
    expect(fourSkills.success).toBe(false);

    const twoGaps = AnalysisResultSchema.safeParse({
      ...validPayload,
      gaps: ["Gap 1", "Gap 2"],
    });
    expect(twoGaps.success).toBe(false);

    const fourQuestions = AnalysisResultSchema.safeParse({
      ...validPayload,
      interview_questions: ["Q1", "Q2", "Q3", "Q4"],
    });
    expect(fourQuestions.success).toBe(false);
  });
});
