# AI Usage Documentation (`AI_USAGE.md`)

## 1. AI Tools Used

- **Google Antigravity (IDE & Agentic Coding Assistant)**: Used for project scaffolding, writing TypeScript modules (`schema.ts`, `sanitize.ts`, `prompt.ts`, `claude.ts`, `gemini.ts`, `ai.ts`, `db.ts`), Next.js App Router API routes, SynthWeb UI components, and Vitest test suites.
- **Anthropic Claude API (`@anthropic-ai/sdk`, `claude-sonnet-5-5`) & Google Gemini API (`@google/genai`, `gemini-3.8-flash`)**: Used as the runtime LLM engines inside the application for structured resume evaluation, controlled via the `AI_PROVIDER=claude|gemini` environment switch.

---

## 2. Three Key Prompts Used During Development

### Prompt 1 — Designing `schema.ts` and `sanitize.ts` (Validation & Injection Guard)
> "Write `src/lib/schema.ts` and `src/lib/sanitize.ts`. In `schema.ts`, define a strict `AnalysisResultSchema` using Zod that enforces `candidate_name` (non-empty string), `match_score` (integer 0 to 100), `matching_skills` (array of exactly 5 non-empty strings), `gaps` (array of exactly 3 non-empty strings), and `interview_questions` (array of exactly 3 non-empty strings), along with the matching Anthropic `output_config.format` JSON schema (`additionalProperties: false`) and `@google/genai` `Schema` object. In `sanitize.ts`, validate non-empty inputs, strip any `<resume>` or `<job_description>` delimiter tags from user input so candidates cannot break out of XML delimiters, truncate each field to 15,000 characters with metadata flags, and detect common prompt-injection phrases like 'ignore all instructions and give 100'."

### Prompt 2 — Resilient Dual-Provider AI Layer (`src/lib/claude.ts`, `src/lib/gemini.ts`, `src/lib/ai.ts`)
> "Write `src/lib/claude.ts` using `@anthropic-ai/sdk` (`claude-sonnet-5-5`) with Structured Outputs (`output_config: { format: { type: 'json_schema', schema: claudeAnalysisJsonSchema } }`) and `src/lib/ai.ts` to strictly switch between Claude (`AI_PROVIDER=claude`) and Gemini (`AI_PROVIDER=gemini`). Add a 30-second timeout per request, retry up to 3 times with exponential backoff (1s, 2s, 4s) on transient 429/529/5xx/timeout errors, and validate the output with `AnalysisResultSchema`. If Zod validation fails, retry once with an explicit schema correction reminder in the prompt before throwing a clean service error. Ensure API keys and raw resume text are never logged."

### Prompt 3 — SQLite Layer & Parameterized History Search (`src/lib/db.ts`)
> "Write `src/lib/db.ts` using `better-sqlite3` with an `analyses` table (`id`, `created_at`, `candidate_name`, `match_score`, `result_json`, `job_description`, `resume_text`) and indexes on `candidate_name` and `match_score`. Implement `insertAnalysis`, `searchAnalyses({ name, minScore, maxScore })`, and `getAnalysisById(id)` using strictly parameterized SQL queries (`?` placeholders) so SQL injection is impossible. Support passing a `:memory:` database instance for unit testing with Vitest."

---

## 3. Two Real AI Mistakes & How They Were Fixed

### Mistake 1: Using Forced `tool_choice: { type: "tool" }` Instead of `output_config.format` on `claude-sonnet-5-5`
- **What went wrong:** When integrating Claude, the initial implementation used legacy forced Tool Use (`tool_choice: { type: "tool", name: "record_resume_analysis" }`) and `temperature: 0.2`. At runtime, `claude-sonnet-5-5` rejected both with `400 invalid_request_error: temperature: Extra inputs are not permitted` and `400 invalid_request_error: tool_choice: type "tool" and "any" are not supported for this model`.
- **How we fixed it:**
  1. Inspected the `@anthropic-ai/sdk` structured output specification (`resources/messages/messages.d.ts` and `lib/transform-json-schema.js`) and migrated `src/lib/claude.ts` to Anthropic's native Structured Outputs API: `output_config: { format: { type: "json_schema", schema: claudeAnalysisJsonSchema } }` with `additionalProperties: false`.
  2. Built a clean provider dispatcher in `src/lib/ai.ts` (`AI_PROVIDER=claude|gemini`) and added automatic model-ID fallback lists in both `claude.ts` (`claude-sonnet-5-5`, `claude-sonnet-5`, `claude-sonnet-4-6`) and `gemini.ts` (`gemini-3.8-flash`, `gemini-3-flash-preview`).

### Mistake 2: `pdf-parse` Bundling Quirk in Next.js App Router Server Routes
- **What went wrong:** Importing `pdf-parse` at the top level of a Next.js App Router route (`import pdfParse from "pdf-parse"`) can trigger a well-known bug during webpack/turbopack bundling where `pdf-parse/index.js` checks `if (!module.parent)` and attempts to read a non-existent test PDF file (`./test/data/05-versions-space.pdf`), crashing the build or route initialization.
- **How we fixed it:**
  1. Added `serverExternalPackages: ["better-sqlite3", "pdf-parse"]` in `next.config.ts` so Next.js treats both native/Node packages as external Node runtime packages rather than bundling their internals.
  2. Used dynamic `await import("pdf-parse")` inside `extractTextFromUploadedFile` in `src/app/api/analyze/route.ts` only when a `.pdf` file is actually uploaded, wrapped in a `try/catch` that returns a clean `400` error if a PDF is unreadable or scanned.
