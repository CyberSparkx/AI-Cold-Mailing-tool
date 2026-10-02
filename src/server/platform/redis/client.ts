import "server-only";
import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../logger/logger";

let redisClient: Redis | null = null;
let hasLoggedOfflineWarning = false;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        // Backoff progressively if Redis isn't running locally (up to 10 seconds)
        const delay = Math.min(times * 500, 10000);
        return delay;
      },
    });

    redisClient.on("error", (err) => {
      if (!hasLoggedOfflineWarning) {
        hasLoggedOfflineWarning = true;
        logger.warn(
          { err: err.message, url: env.REDIS_URL },
          "Redis is offline or unreachable; background queues and caching will use resilient mode until Redis is started."
        );
      }
    });

    redisClient.on("connect", () => {
      hasLoggedOfflineWarning = false;
      logger.info("Redis client connected successfully");
    });
  } catch (err: any) {
    logger.warn({ err: err?.message }, "Could not initialize Redis client");
  }

  return redisClient!;
}
