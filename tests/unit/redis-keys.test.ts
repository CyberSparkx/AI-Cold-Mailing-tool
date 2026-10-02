import { describe, it, expect } from "vitest";
import { REDIS_KEYS } from "@/server/platform/redis/keys";
import { env } from "@/server/platform/config/env";

describe("Redis Key Formatting and Namespace Isolation", () => {
  it("should format sendLock with environment prefix, userId, and normalized email", () => {
    const key = REDIS_KEYS.sendLock("user123", "target@domain.com");
    expect(key).toBe(`${env.REDIS_KEY_PREFIX}lock:send:user123:target@domain.com`);
    expect(key.startsWith(env.REDIS_KEY_PREFIX)).toBe(true);
  });

  it("should format campaignLock with campaign ID", () => {
    const key = REDIS_KEYS.campaignLock("camp456");
    expect(key).toBe(`${env.REDIS_KEY_PREFIX}lock:campaign:camp456`);
  });

  it("should format rateLimitSend with date partition", () => {
    const key = REDIS_KEYS.rateLimitSend("user123", "2026-10-03");
    expect(key).toBe(`${env.REDIS_KEY_PREFIX}ratelimit:send:user123:2026-10-03`);
  });

  it("should format aiPromptCache with hash", () => {
    const key = REDIS_KEYS.aiPromptCache("sha256hash123");
    expect(key).toBe(`${env.REDIS_KEY_PREFIX}cache:ai:sha256hash123`);
  });
});
