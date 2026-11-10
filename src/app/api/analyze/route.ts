import { NextRequest, NextResponse } from "next/server";
import { sanitizeInputs } from "@/lib/sanitize";
import { analyzeResume, AIServiceError } from "@/lib/ai";
import { insertAnalysis } from "@/lib/db";
import { checkAndConsumeRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

async function extractTextFromUploadedFile(
  file: File
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (file.size === 0) {
    return {
      ok: false,
      error:
        "The uploaded file is empty. Please upload a valid .pdf or .txt file.",
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error:
        "The uploaded file exceeds the 10 MB limit. Please upload a smaller .pdf or .txt file.",
    };
  }

  const fileName = file.name.toLowerCase();
  const isTxt = fileName.endsWith(".txt") || file.type === "text/plain";
  const isPdf = fileName.endsWith(".pdf") || file.type === "application/pdf";

  if (!isTxt && !isPdf) {
    return {
      ok: false,
      error:
        "Unsupported file format. Only .pdf and .txt resume files are supported.",
    };
  }

  if (isTxt) {
    const text = await file.text();
    if (!text.trim()) {
      return {
        ok: false,
        error: "The uploaded .txt file contains no readable text.",
      };
    }
    return { ok: true, text };
  }

  // PDF extraction
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default ?? pdfParseModule;
    const parsed = await pdfParse(buffer);
    const extracted = parsed?.text?.trim() ?? "";

    if (!extracted) {
      return {
        ok: false,
        error:
          "Couldn't read text from this PDF. It appears to be a scanned image or contains no selectable text—please paste the resume text directly.",
      };
    }

    return { ok: true, text: extracted };
  } catch {
    return {
      ok: false,
      error:
        "Couldn't read text from the uploaded PDF file. The file may be corrupted, password-protected, or a scanned image.",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let rawJobDescription: unknown = "";
    let rawResumeText: unknown = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      rawJobDescription = formData.get("jobDescription") ?? "";
      const resumeFile = formData.get("resumeFile");
      const textField = formData.get("resumeText");

      if (resumeFile instanceof File && resumeFile.size > 0) {
        const extracted = await extractTextFromUploadedFile(resumeFile);
        if (!extracted.ok) {
          return NextResponse.json({ error: extracted.error }, { status: 400 });
        }
        rawResumeText = extracted.text;
      } else if (
        resumeFile instanceof File &&
        resumeFile.size === 0 &&
        resumeFile.name
      ) {
        return NextResponse.json(
          {
            error:
              "The uploaded file is empty. Please choose a non-empty .pdf or .txt file.",
          },
          { status: 400 }
        );
      } else {
        rawResumeText = typeof textField === "string" ? textField : "";
      }
    } else {
      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON request body." },
          { status: 400 }
        );
      }
      rawJobDescription = body.jobDescription;
      rawResumeText = body.resumeText;
    }

    // 1. Validate, sanitize, truncate, and check for prompt injection
    const sanitizedResult = sanitizeInputs(rawJobDescription, rawResumeText);
    if (!sanitizedResult.ok) {
      return NextResponse.json(
        { error: sanitizedResult.error },
        { status: 400 }
      );
    }

    const {
      jobDescription,
      resumeText,
      wasTruncated,
      truncatedFields,
      injectionDetected,
      injectionReasons,
    } = sanitizedResult.data;

    // 2. Enforce 10 requests / hour rate limit before calling the LLM API
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp =
      (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    const rateLimit = checkAndConsumeRateLimit(clientIp);
    if (!rateLimit.allowed) {
      const retryMins = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60));
      return NextResponse.json(
        {
          error: `Hourly rate limit reached (${rateLimit.limit} analyses per hour to protect live API credits). Please try again in ~${retryMins} minute${retryMins === 1 ? "" : "s"}.`,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAtMs / 1000)),
          },
        }
      );
    }

    // 3. Call active AI provider (Claude by default, or Gemini when AI_PROVIDER=gemini)
    const { result: analysis, provider } = await analyzeResume(
      jobDescription,
      resumeText
    );

    const warnings: string[] = [];
    if (wasTruncated) {
      const labels = truncatedFields.map((f) =>
        f === "jobDescription" ? "Job Description" : "Resume"
      );
      warnings.push(
        `Input exceeded 15,000 characters (${labels.join(
          " and "
        )}) and was truncated before analysis.`
      );
    }

    if (injectionDetected) {
      warnings.push(
        `Prompt-injection pattern detected in input (${injectionReasons.join(
          ", "
        )}). The input was isolated inside data delimiters and evaluated strictly on qualifications.`
      );
    }

    // 3. Persist to SQLite (non-fatal if DB write fails)
    let savedRecordId: number | null = null;
    let savedToDb = true;

    try {
      const record = insertAnalysis({
        candidate_name: analysis.candidate_name,
        match_score: analysis.match_score,
        result: {
          ...analysis,
          meta: {
            wasTruncated,
            truncatedFields,
            injectionDetected,
            injectionReasons,
          },
        },
        job_description: jobDescription,
        resume_text: resumeText,
      });
      savedRecordId = record.id;
    } catch (dbErr) {
      savedToDb = false;
      const safeMsg =
        dbErr instanceof Error ? dbErr.message.slice(0, 120) : "DB error";
      console.error(`[db] Failed to persist analysis: ${safeMsg}`);
      warnings.push(
        "Analysis succeeded, but the report could not be saved to the local database."
      );
    }

    return NextResponse.json(
      {
        id: savedRecordId,
        savedToDb,
        provider,
        analysis,
        meta: {
          wasTruncated,
          truncatedFields,
          injectionDetected,
          injectionReasons,
          warnings,
          rateLimit: {
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
          },
        },
      },
      {
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAtMs / 1000)),
        },
      }
    );
  } catch (err) {
    if (err instanceof AIServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    console.error("[api/analyze] Unexpected error occurred");
    return NextResponse.json(
      { error: "An unexpected server error occurred. Please try again." },
      { status: 500 }
    );
  }
}
