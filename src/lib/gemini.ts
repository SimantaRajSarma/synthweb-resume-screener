import { GoogleGenAI } from "@google/genai";
import {
  AnalysisResultSchema,
  geminiAnalysisResponseSchema,
  type AnalysisResult,
} from "./schema";
import { buildScreeningPrompt, SYSTEM_INSTRUCTION } from "./prompt";

const DEFAULT_MODEL = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_API_RETRIES = 3;

export class GeminiServiceError extends Error {
  public readonly statusCode: number;
  public readonly code:
    | "MISSING_API_KEY"
    | "SERVICE_BUSY"
    | "INVALID_AI_OUTPUT";

  constructor(
    message: string,
    code: "MISSING_API_KEY" | "SERVICE_BUSY" | "INVALID_AI_OUTPUT",
    statusCode: number = 503
  ) {
    super(message);
    this.name = "GeminiServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Strips optional markdown code fences (e.g. ```json ... ```) if the model includes them.
 */
export function cleanJsonResponse(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

/**
 * Determines whether an error from the Gemini SDK is transient (rate limit 429, 5xx, network/timeout).
 */
function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg =
    "message" in err && typeof err.message === "string"
      ? err.message.toLowerCase()
      : "";
  const status =
    "status" in err && typeof err.status === "number" ? err.status : undefined;

  if (status === 429 || (status !== undefined && status >= 500)) {
    return true;
  }

  return (
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
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
 * Executes a single Gemini generateContent call with a 30s timeout and exponential backoff
 * on 429 / 5xx / timeout errors.
 */
async function callGeminiWithBackoff(
  ai: GoogleGenAI,
  model: string,
  prompt: string
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_API_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Gemini request timed out after 30s")),
          REQUEST_TIMEOUT_MS
        )
      );

      const responsePromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: geminiAnalysisResponseSchema,
        },
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);
      const text = response.text;

      if (!text || !text.trim()) {
        throw new Error("Empty response received from Gemini");
      }

      return text;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_API_RETRIES - 1 && isTransientError(err)) {
        const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        await sleep(delayMs);
        continue;
      }
      break;
    }
  }

  // Never log API keys or full resume text
  const safeReason =
    lastError instanceof Error ? lastError.message.slice(0, 160) : "Unknown error";
  console.error(`[gemini] API call failed after retries: ${safeReason}`);

  throw new GeminiServiceError(
    "Service busy, please try again in a moment.",
    "SERVICE_BUSY",
    503
  );
}

/**
 * Calls Gemini to analyze the resume against the job description, validates with Zod,
 * and retries once with a schema reminder if the JSON is malformed or fails Zod validation.
 */
export async function analyzeResumeWithGemini(
  jobDescription: string,
  resumeText: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiServiceError(
      "GEMINI_API_KEY is not configured on the server. Please add it to .env.local.",
      "MISSING_API_KEY",
      500
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  // Up to 2 validation attempts: initial call + 1 retry if JSON or Zod validation fails
  for (let validationAttempt = 0; validationAttempt < 2; validationAttempt++) {
    const isRetry = validationAttempt > 0;
    const prompt = buildScreeningPrompt(jobDescription, resumeText, isRetry);
    const rawOutput = await callGeminiWithBackoff(ai, model, prompt);

    try {
      const cleaned = cleanJsonResponse(rawOutput);
      const parsedJson = JSON.parse(cleaned);
      const validated = AnalysisResultSchema.safeParse(parsedJson);

      if (validated.success) {
        return validated.data;
      }

      console.warn(
        `[gemini] Zod validation failed on attempt ${validationAttempt + 1}:`,
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      );
    } catch {
      console.warn(
        `[gemini] Malformed JSON received on attempt ${validationAttempt + 1}`
      );
    }
  }

  throw new GeminiServiceError(
    "The AI returned an invalid analysis format after retrying. Please try again.",
    "INVALID_AI_OUTPUT",
    502
  );
}
