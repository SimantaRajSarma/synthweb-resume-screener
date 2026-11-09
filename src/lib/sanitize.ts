export const MAX_FIELD_CHARS = 15000;

const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  {
    pattern: /ignore\s+(all\s+|previous\s+|prior\s+|above\s+)?instructions/i,
    label: "ignore instructions directive",
  },
  {
    pattern: /disregard\s+(all\s+|previous\s+|prior\s+|above\s+)?(instructions|prompts|rules)/i,
    label: "disregard instructions directive",
  },
  {
    pattern: /system\s*prompt|developer\s*message|you\s+are\s+now/i,
    label: "system role override attempt",
  },
  {
    pattern: /(give|assign|return|output|set)\s+(a\s+|me\s+|the\s+)?(match[_\s]*score|score)\s*(of|to|=|:)?\s*100/i,
    label: "score manipulation attempt",
  },
  {
    pattern: /give\s+(this\s+candidate\s+|me\s+)?100/i,
    label: "direct score 100 override attempt",
  },
  {
    pattern: /forget\s+(everything|all\s+instructions|your\s+instructions)/i,
    label: "instruction reset attempt",
  },
];

const DELIMITER_TAG_REGEX = /<\/?(?:job_description|resume|system_instruction)>/gi;

export interface SanitizedInputResult {
  jobDescription: string;
  resumeText: string;
  wasTruncated: boolean;
  truncatedFields: ("jobDescription" | "resumeText")[];
  injectionDetected: boolean;
  injectionReasons: string[];
  delimiterTagsStripped: boolean;
}

/**
 * Strips XML-style delimiter tags that we use in our prompt so untrusted input
 * cannot prematurely close `<resume>` or `<job_description>` blocks.
 */
export function stripDelimiterTags(input: string): {
  cleaned: string;
  stripped: boolean;
} {
  const stripped = DELIMITER_TAG_REGEX.test(input);
  DELIMITER_TAG_REGEX.lastIndex = 0;
  const cleaned = input.replace(DELIMITER_TAG_REGEX, "[removed-tag]");
  return { cleaned, stripped };
}

/**
 * Truncates text to maxChars and reports whether truncation occurred.
 */
export function truncateText(
  input: string,
  maxChars: number = MAX_FIELD_CHARS
): { text: string; truncated: boolean } {
  if (input.length <= maxChars) {
    return { text: input, truncated: false };
  }
  return {
    text: input.slice(0, maxChars),
    truncated: true,
  };
}

/**
 * Scans text for common prompt-injection phrases.
 */
export function detectPromptInjection(input: string): {
  detected: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      reasons.push(label);
    }
  }
  return {
    detected: reasons.length > 0,
    reasons,
  };
}

/**
 * Full input pipeline: trims, checks for empty fields, neutralizes delimiter tags,
 * truncates overly long fields to 15,000 chars, and detects prompt injection attempts.
 */
export function sanitizeInputs(
  rawJobDescription: unknown,
  rawResumeText: unknown
):
  | { ok: true; data: SanitizedInputResult }
  | { ok: false; error: string } {
  if (typeof rawJobDescription !== "string" || typeof rawResumeText !== "string") {
    return {
      ok: false,
      error: "Both job description and resume text must be provided as strings.",
    };
  }

  const trimmedJob = rawJobDescription.trim();
  const trimmedResume = rawResumeText.trim();

  if (!trimmedJob && !trimmedResume) {
    return {
      ok: false,
      error: "Job description and resume text cannot be empty.",
    };
  }
  if (!trimmedJob) {
    return {
      ok: false,
      error: "Job description cannot be empty or whitespace only.",
    };
  }
  if (!trimmedResume) {
    return {
      ok: false,
      error: "Resume text cannot be empty or whitespace only.",
    };
  }

  // 1. Strip delimiter tags first
  const jobTagCheck = stripDelimiterTags(trimmedJob);
  const resumeTagCheck = stripDelimiterTags(trimmedResume);
  const delimiterTagsStripped = jobTagCheck.stripped || resumeTagCheck.stripped;

  // 2. Truncate to MAX_FIELD_CHARS (15,000 characters)
  const truncatedFields: ("jobDescription" | "resumeText")[] = [];
  const jobTrunc = truncateText(jobTagCheck.cleaned, MAX_FIELD_CHARS);
  if (jobTrunc.truncated) {
    truncatedFields.push("jobDescription");
  }

  const resumeTrunc = truncateText(resumeTagCheck.cleaned, MAX_FIELD_CHARS);
  if (resumeTrunc.truncated) {
    truncatedFields.push("resumeText");
  }

  // 3. Detect prompt injection patterns across both fields
  const combinedInjection = detectPromptInjection(
    `${jobTrunc.text}\n${resumeTrunc.text}`
  );
  const reasons = [...combinedInjection.reasons];
  if (delimiterTagsStripped) {
    reasons.push("delimiter tag breakout attempt");
  }

  return {
    ok: true,
    data: {
      jobDescription: jobTrunc.text,
      resumeText: resumeTrunc.text,
      wasTruncated: truncatedFields.length > 0,
      truncatedFields,
      injectionDetected: reasons.length > 0,
      injectionReasons: reasons,
      delimiterTagsStripped,
    },
  };
}
