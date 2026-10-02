import "server-only";
import { env } from "../config/env";

export const REDIS_KEYS = {
  // Sending lock (Layer 4 duplicate protection)
  sendLock: (userId: string, emailNormalized: string) =>
    `${env.REDIS_KEY_PREFIX}lock:send:${userId}:${emailNormalized}`,

  // Campaign run lock
  campaignLock: (campaignId: string) =>
    `${env.REDIS_KEY_PREFIX}lock:campaign:${campaignId}`,

  // Rate limit keys
  rateLimitSend: (userId: string, date: string) =>
    `${env.REDIS_KEY_PREFIX}ratelimit:send:${userId}:${date}`,

  // AI cache
  aiPromptCache: (hash: string) =>
    `${env.REDIS_KEY_PREFIX}cache:ai:${hash}`,
};
