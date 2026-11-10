import Anthropic from "@anthropic-ai/sdk";
import {
  AnalysisResultSchema,
  claudeAnalysisJsonSchema,
  type AnalysisResult,
} from "./schema";
import { buildScreeningPrompt, SYSTEM_INSTRUCTION } from "./prompt";
import { cleanJsonResponse, GeminiServiceError } from "./gemini";

const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5-5";
const FALLBACK_CLAUDE_MODELS = [
  "claude-sonnet-5-5",
  "claude-sonnet-5",
  "claude-sonnet-4-6",
  "claude-haiku-5-5",
  "claude-haiku-4-5",
];
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_API_RETRIES = 3;

function isModelNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status =
    "status" in err && typeof err.status === "number" ? err.status : undefined;
  const msg =
    "message" in err && typeof err.message === "string"
      ? err.message.toLowerCase()
      : "";

  return status === 404 || msg.includes("not_found_error");
}

function isTransientClaudeError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status =
    "status" in err && typeof err.status === "number" ? err.status : undefined;
  const msg =
    "message" in err && typeof err.message === "string"
      ? err.message.toLowerCase()
      : "";

  // 429 rate limit, 529 overloaded, or 5xx server error
  if (
    status === 429 ||
    status === 529 ||
    (status !== undefined && status >= 500)
  ) {
    return true;
  }

  return (
    msg.includes("429") ||
    msg.includes("529") ||
    msg.includes("rate_limit") ||
    msg.includes("overloaded") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("fetch failed") ||
    msg.includes("network")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls Anthropic Claude API using native Structured Outputs (`output_config.format` with `json_schema`),
 * a 30s timeout (cleaned up on completion), model-ID fallback on 404, and exponential backoff on 429/529/5xx errors.
 */
async function callClaudeWithBackoff(
  client: Anthropic,
  preferredModel: string,
  prompt: string
): Promise<string> {
  const candidateModels = Array.from(
    new Set([preferredModel, ...FALLBACK_CLAUDE_MODELS])
  );
  let modelIndex = 0;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_API_RETRIES; attempt++) {
    const activeModel =
      candidateModels[Math.min(modelIndex, candidateModels.length - 1)];
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Claude request timed out after 30s")),
          REQUEST_TIMEOUT_MS
        );
      });

      const responsePromise = client.messages.create({
        model: activeModel,
        max_tokens: 1500,
        system: SYSTEM_INSTRUCTION,
        output_config: {
          format: {
            type: "json_schema",
            schema: claudeAnalysisJsonSchema,
          },
        },
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);

      const textBlock = response.content.find((block) => block.type === "text");
      if (textBlock && textBlock.type === "text" && textBlock.text.trim()) {
        return textBlock.text;
      }

      throw new Error("Empty response received from Claude");
    } catch (err) {
      lastError = err;
      const errMsg =
        err instanceof Error ? err.message.slice(0, 240) : "Unknown error";
      console.warn(
        `[claude] Attempt with model '${activeModel}' failed: ${errMsg}`
      );

      if (
        isModelNotFoundError(err) &&
        modelIndex < candidateModels.length - 1
      ) {
        modelIndex++;
        attempt--;
        continue;
      }

      if (attempt < MAX_API_RETRIES - 1 && isTransientClaudeError(err)) {
        const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        await sleep(delayMs);
        continue;
      }
      break;
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  // Never log API keys or full resume text
  const safeReason =
    lastError instanceof Error ? lastError.message.slice(0, 300) : "Unknown error";
  console.error(`[claude] API call failed after retries: ${safeReason}`);

  throw new GeminiServiceError(
    "Service busy or unavailable, please try again in a moment.",
    "SERVICE_BUSY",
    503
  );
}

/**
 * Analyzes a resume against a job description using Anthropic Claude Structured Outputs,
 * validates output with Zod, and retries once with a corrective prompt reminder if validation fails.
 */
export async function analyzeResumeWithClaude(
  jobDescription: string,
  resumeText: string
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiServiceError(
      "ANTHROPIC_API_KEY is not configured on the server. Please add it to .env.local (or set AI_PROVIDER=gemini).",
      "MISSING_API_KEY",
      500
    );
  }

  const preferredModel =
    process.env.CLAUDE_MODEL?.trim() || DEFAULT_CLAUDE_MODEL;
  const client = new Anthropic({ apiKey });

  // Up to 2 validation attempts: initial call + 1 retry if JSON or Zod validation fails
  for (let validationAttempt = 0; validationAttempt < 2; validationAttempt++) {
    const isRetry = validationAttempt > 0;
    const prompt = buildScreeningPrompt(jobDescription, resumeText, isRetry);
    const rawOutput = await callClaudeWithBackoff(
      client,
      preferredModel,
      prompt
    );

    try {
      const cleaned = cleanJsonResponse(rawOutput);
      const parsedJson = JSON.parse(cleaned);
      const validated = AnalysisResultSchema.safeParse(parsedJson);

      if (validated.success) {
        return validated.data;
      }

      console.warn(
        `[claude] Zod validation failed on attempt ${validationAttempt + 1}:`,
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      );
    } catch {
      console.warn(
        `[claude] Malformed JSON received on attempt ${validationAttempt + 1}`
      );
    }
  }

  throw new GeminiServiceError(
    "The AI returned an invalid analysis format after retrying. Please try again.",
    "INVALID_AI_OUTPUT",
    502
  );
}
