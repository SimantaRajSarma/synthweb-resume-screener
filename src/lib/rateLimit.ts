import { initDatabase } from "./db";

export const DEFAULT_MAX_REQUESTS_PER_HOUR = 10;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAtMs: number;
}

// In-memory fallback store (key -> array of request timestamps in ms)
const memoryBuckets = new Map<string, number[]>();

function getMaxRequestsPerHour(): number {
  const raw = process.env.RATE_LIMIT_MAX_PER_HOUR;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_MAX_REQUESTS_PER_HOUR;
}

function pruneAndEvaluateMemory(
  key: string,
  nowMs: number,
  windowMs: number,
  limit: number,
  consume: boolean
): RateLimitResult {
  const cutoff = nowMs - windowMs;
  const existing = memoryBuckets.get(key) ?? [];
  const active = existing.filter((ts) => ts > cutoff);

  if (active.length >= limit) {
    memoryBuckets.set(key, active);
    const oldest = active[0] ?? nowMs;
    const resetAtMs = oldest + windowMs;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((resetAtMs - nowMs) / 1000)
    );
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
      resetAtMs,
    };
  }

  if (consume) {
    active.push(nowMs);
  }
  memoryBuckets.set(key, active);

  const oldest = active[0] ?? nowMs;
  const resetAtMs = oldest + windowMs;
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - active.length),
    retryAfterSeconds: 0,
    resetAtMs,
  };
}

/**
 * Checks and consumes 1 request from the 10/hour rate limit.
 * Enforces both a global hourly cap (to protect total API credit spend) and a per-IP cap,
 * backed by both SQLite persistence and an in-memory sliding window.
 */
export function checkAndConsumeRateLimit(
  clientIp: string = "global",
  nowMs: number = Date.now(),
  customLimit?: number
): RateLimitResult {
  const limit = customLimit ?? getMaxRequestsPerHour();
  const windowMs = RATE_LIMIT_WINDOW_MS;
  const cutoff = nowMs - windowMs;
  const normalizedIp = (clientIp || "unknown").trim().slice(0, 100);

  // 1. Check in-memory global & per-IP buckets first (without consuming yet)
  const memGlobalCheck = pruneAndEvaluateMemory(
    "__global__",
    nowMs,
    windowMs,
    limit,
    false
  );
  if (!memGlobalCheck.allowed) {
    return memGlobalCheck;
  }

  const memIpCheck = pruneAndEvaluateMemory(
    `ip:${normalizedIp}`,
    nowMs,
    windowMs,
    limit,
    false
  );
  if (!memIpCheck.allowed) {
    return memIpCheck;
  }

  // 2. Check SQLite persistence (non-fatal fallback to memory if DB unavailable)
  try {
    const db = initDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS rate_limit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_key TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at
        ON rate_limit_events(created_at_ms);
    `);

    // Prune expired events older than 1 hour
    db.prepare(`DELETE FROM rate_limit_events WHERE created_at_ms <= ?`).run(
      cutoff
    );

    const globalRow = db
      .prepare(
        `SELECT COUNT(*) as count, MIN(created_at_ms) as oldest
         FROM rate_limit_events
         WHERE created_at_ms > ?`
      )
      .get(cutoff) as { count: number; oldest: number | null };

    if (globalRow.count >= limit) {
      const oldest = globalRow.oldest ?? nowMs;
      const resetAtMs = oldest + windowMs;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((resetAtMs - nowMs) / 1000)
      );
      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterSeconds,
        resetAtMs,
      };
    }

    // Record the new event in SQLite
    db.prepare(
      `INSERT INTO rate_limit_events (client_key, created_at_ms) VALUES (?, ?)`
    ).run(normalizedIp, nowMs);

    // Sync in-memory buckets
    pruneAndEvaluateMemory("__global__", nowMs, windowMs, limit, true);
    pruneAndEvaluateMemory(`ip:${normalizedIp}`, nowMs, windowMs, limit, true);

    const newCount = globalRow.count + 1;
    const oldest = globalRow.oldest ?? nowMs;
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - newCount),
      retryAfterSeconds: 0,
      resetAtMs: oldest + windowMs,
    };
  } catch {
    // Fallback to in-memory consumption if SQLite is read-only or unavailable
    pruneAndEvaluateMemory(`ip:${normalizedIp}`, nowMs, windowMs, limit, true);
    return pruneAndEvaluateMemory("__global__", nowMs, windowMs, limit, true);
  }
}

/**
 * Resets in-memory and SQLite rate-limit state (used in unit tests).
 */
export function resetRateLimitsForTesting(): void {
  memoryBuckets.clear();
  try {
    const db = initDatabase();
    db.exec(`DROP TABLE IF EXISTS rate_limit_events;`);
  } catch {
    // ignore in tests if DB not initialized
  }
}
