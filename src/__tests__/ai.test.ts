import { describe, it, expect, afterEach } from "vitest";
import { getActiveProvider, analyzeResume } from "@/lib/ai";
import { claudeAnalysisJsonSchema } from "@/lib/schema";

describe("AI Provider Switch (Claude Primary / Gemini Switch)", () => {
  const originalProvider = process.env.AI_PROVIDER;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    process.env.AI_PROVIDER = originalProvider;
    process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    process.env.GEMINI_API_KEY = originalGeminiKey;
  });

  it("defaults to 'claude' when AI_PROVIDER is unset or set to 'claude'", () => {
    delete process.env.AI_PROVIDER;
    expect(getActiveProvider()).toBe("claude");

    process.env.AI_PROVIDER = "claude";
    expect(getActiveProvider()).toBe("claude");
  });

  it("switches strictly to 'gemini' when AI_PROVIDER=gemini", () => {
    process.env.AI_PROVIDER = "gemini";
    expect(getActiveProvider()).toBe("gemini");

    process.env.AI_PROVIDER = "GEMINI";
    expect(getActiveProvider()).toBe("gemini");
  });

  it("defines valid Anthropic Structured Output JSON schema with additionalProperties: false", () => {
    expect(claudeAnalysisJsonSchema.type).toBe("object");
    expect(claudeAnalysisJsonSchema.additionalProperties).toBe(false);
    expect(claudeAnalysisJsonSchema.required).toEqual([
      "candidate_name",
      "match_score",
      "matching_skills",
      "gaps",
      "interview_questions",
    ]);
  });

  it("throws MISSING_API_KEY for the active provider without falling back across providers", async () => {
    process.env.AI_PROVIDER = "claude";
    delete process.env.ANTHROPIC_API_KEY;
    process.env.GEMINI_API_KEY = "dummy-gemini-key";

    await expect(
      analyzeResume("Senior Engineer", "Candidate Resume")
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
