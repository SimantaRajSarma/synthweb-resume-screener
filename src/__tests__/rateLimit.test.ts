import { describe, it, expect, beforeEach } from "vitest";
import {
  checkAndConsumeRateLimit,
  resetRateLimitsForTesting,
  RATE_LIMIT_WINDOW_MS,
} from "../lib/rateLimit";
import { initDatabase } from "../lib/db";

describe("rateLimit (10 requests / hour)", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    resetRateLimitsForTesting();
  });

  it("allows up to 10 requests per hour and blocks the 11th until the window resets", () => {
    const baseTime = 1_700_000_000_000;

    for (let i = 1; i <= 10; i++) {
      const res = checkAndConsumeRateLimit("127.0.0.1", baseTime + i * 1000, 10);
      expect(res.allowed).toBe(true);
      expect(res.limit).toBe(10);
      expect(res.remaining).toBe(10 - i);
    }

    // 11th request within the same hour must be blocked
    const blocked = checkAndConsumeRateLimit(
      "127.0.0.1",
      baseTime + 20_000,
      10
    );
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // Even a different IP is blocked once the global 10/hour credit cap is reached
    const blockedOtherIp = checkAndConsumeRateLimit(
      "192.168.1.50",
      baseTime + 25_000,
      10
    );
    expect(blockedOtherIp.allowed).toBe(false);

    // Once 1 hour has elapsed after the oldest request, new requests are allowed
    const afterOneHour = checkAndConsumeRateLimit(
      "127.0.0.1",
      baseTime + RATE_LIMIT_WINDOW_MS + 2000,
      10
    );
    expect(afterOneHour.allowed).toBe(true);
  });
});
