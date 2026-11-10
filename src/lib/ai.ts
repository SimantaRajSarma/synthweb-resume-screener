import type { AnalysisResult } from "./schema";
import { analyzeResumeWithClaude } from "./claude";
import { analyzeResumeWithGemini, GeminiServiceError } from "./gemini";

export type AIProvider = "claude" | "gemini";

export { GeminiServiceError as AIServiceError };

/**
 * Resolves the active AI provider strictly from the AI_PROVIDER environment variable.
 * Defaults to "claude". Set AI_PROVIDER=gemini in .env.local to switch back to Gemini anytime.
 */
export function getActiveProvider(): AIProvider {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "gemini") {
    return "gemini";
  }
  return "claude";
}

/**
 * Dispatches resume analysis strictly to the configured AI_PROVIDER ("claude" or "gemini").
 */
export async function analyzeResume(
  jobDescription: string,
  resumeText: string
): Promise<{ result: AnalysisResult; provider: AIProvider }> {
  const provider = getActiveProvider();

  if (provider === "gemini") {
    const result = await analyzeResumeWithGemini(jobDescription, resumeText);
    return { result, provider: "gemini" };
  }

  const result = await analyzeResumeWithClaude(jobDescription, resumeText);
  return { result, provider: "claude" };
}
