import { sha256 } from "@/server/platform/crypto/tokens";
import { getRedisClient } from "@/server/platform/redis/client";
import { REDIS_KEYS } from "@/server/platform/redis/keys";
import { logger } from "@/server/platform/logger/logger";

const inMemoryAiCache = new Map<string, { value: any; expiresAt: number }>();

export class AiCache {
  generateKey(promptName: string, model: string, input: string): string {
    const normalizedInput = input.trim().toLowerCase();
    const hash = sha256(`${promptName}:${model}:${normalizedInput}`);
    return hash;
  }

  async get<T>(hash: string): Promise<T | null> {
    // Check in-memory first
    const mem = inMemoryAiCache.get(hash);
    if (mem && mem.expiresAt > Date.now()) {
      return mem.value as T;
    }

    // Check Redis
    try {
      const redis = getRedisClient();
      const val = await redis.get(REDIS_KEYS.aiPromptCache(hash));
      if (val) {
        return JSON.parse(val) as T;
      }
    } catch {
      // offline fallback
    }

    return null;
  }

  async set<T>(hash: string, value: T, ttlSec = 86400 * 7): Promise<void> {
    // Store in-memory
    inMemoryAiCache.set(hash, {
      value,
      expiresAt: Date.now() + ttlSec * 1000,
    });

    // Store in Redis
    try {
      const redis = getRedisClient();
      await redis.set(REDIS_KEYS.aiPromptCache(hash), JSON.stringify(value), "EX", ttlSec);
    } catch (err) {
      logger.warn({ err }, "Failed to write to Redis AI cache");
    }
  }
}

export const aiCache = new AiCache();
