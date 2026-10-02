import { Job } from "bullmq";
import { sendService } from "@/server/modules/campaigns/send.service";
import { acquireLock, releaseLock } from "@/server/platform/redis/lock";
import { REDIS_KEYS } from "@/server/platform/redis/keys";
import { delay } from "@/lib/utils";
import { LIMITS } from "@/server/platform/config/limits";
import { logger } from "@/server/platform/logger/logger";

export interface SendEmailJobData {
  userId: string;
  campaignId: string;
  campaignLeadId: string;
  recipientEmail: string;
}

export async function processSendEmailJob(job: Job<SendEmailJobData>) {
  const { userId, campaignLeadId, recipientEmail } = job.data;

  // Layer 4 Duplicate Protection: Redis distributed lock per recipient
  const lockKey = REDIS_KEYS.sendLock(userId, recipientEmail);
  const lockToken = await acquireLock(lockKey, 30000);

  if (!lockToken) {
    logger.warn({ recipientEmail }, "Send lock already held by another worker; skipping duplicate attempt");
    return { skipped: true, reason: "Lock already held" };
  }

  try {
    // Human-like sending jitter delay (45 - 150s in production, 2s in dev)
    const jitterDelay = process.env.NODE_ENV === "production"
      ? Math.floor(Math.random() * (LIMITS.SEND_MAX_DELAY_SEC - LIMITS.SEND_MIN_DELAY_SEC + 1) + LIMITS.SEND_MIN_DELAY_SEC) * 1000
      : 2000;

    logger.info({ recipientEmail, jitterDelayMs: jitterDelay }, "Applying humanized pacing jitter");
    await delay(jitterDelay);

    // Process through 4-tier guarded send pipeline
    const result = await sendService.processOneRecipient(userId, campaignLeadId);
    return result;
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}
