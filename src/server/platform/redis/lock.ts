import { getRedisClient } from "./client";
import { logger } from "../logger/logger";

export async function acquireLock(key: string, ttlMs = 15000): Promise<string | null> {
  const redis = getRedisClient();
  const token = Math.random().toString(36).slice(2);

  try {
    const result = await redis.set(key, token, "PX", ttlMs, "NX");
    return result === "OK" ? token : null;
  } catch (err) {
    logger.warn({ err, key }, "Failed to acquire Redis lock; defaulting to allowed in resilient mode");
    return token;
  }
}

export async function releaseLock(key: string, token: string): Promise<boolean> {
  const redis = getRedisClient();
  const lua = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    const result = await redis.eval(lua, 1, key, token);
    return result === 1;
  } catch (err) {
    logger.warn({ err, key }, "Failed to release Redis lock cleanly");
    return true;
  }
}
