import { z } from "zod";
import { Type, type Schema } from "@google/genai";

/**
 * Strict Zod schema for the AI Resume Screener output.
 * Enforces exact array counts and integer score bounds (0-100).
 */
export const AnalysisResultSchema = z.object({
  candidate_name: z
    .string()
    .trim()
    .min(1, "Candidate name is required"),
  match_score: z
    .number()
    .int("Match score must be an integer")
    .min(0, "Match score cannot be less than 0")
    .max(100, "Match score cannot exceed 100"),
  matching_skills: z
    .array(z.string().trim().min(1, "Skill cannot be empty"))
    .length(5, "Must return exactly 5 matching skills"),
  gaps: z
    .array(z.string().trim().min(1, "Gap cannot be empty"))
    .length(3, "Must return exactly 3 gaps"),
  interview_questions: z
    .array(z.string().trim().min(1, "Question cannot be empty"))
    .length(3, "Must return exactly 3 interview questions"),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * Gemini responseSchema definition matching AnalysisResultSchema.
 * Even when using Gemini JSON mode with this schema, we still validate with Zod
 * at runtime because LLM outputs should never be trusted blindly.
 */
export const geminiAnalysisResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    candidate_name: {
      type: Type.STRING,
      description:
        "Full name of the candidate extracted from the resume, or 'Unknown Candidate' if not present.",
    },
    match_score: {
      type: Type.INTEGER,
      description:
        "Overall fit score from 0 to 100 based on the rubric (0-30 poor, 31-60 partial, 61-80 good, 81-100 excellent).",
    },
    matching_skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Exactly 5 key matching skills, qualifications, or relevant experiences found in the resume.",
    },
    gaps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Exactly 3 missing skills, experience gaps, or areas of concern relative to the job description.",
    },
    interview_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Exactly 3 tailored interview questions designed to probe the candidate's gaps and verify their claimed strengths.",
    },
  },
  required: [
    "candidate_name",
    "match_score",
    "matching_skills",
    "gaps",
    "interview_questions",
  ],
};
