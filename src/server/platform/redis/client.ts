import "server-only";
import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../logger/logger";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    redisClient.on("error", (err) => {
      logger.warn({ err: err.message }, "Redis connection warning; operating in resilient mode");
    });

    redisClient.on("connect", () => {
      logger.info("Redis client connected");
    });
  } catch (err) {
    logger.warn({ err }, "Could not initialize Redis client");
  }

  return redisClient!;
}
