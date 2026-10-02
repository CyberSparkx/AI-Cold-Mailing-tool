// Note: .env.local is loaded by Node via --env-file flag in package.json worker:dev script
import { Worker } from "bullmq";
import { getRedisClient } from "@/server/platform/redis/client";
import { QUEUE_NAMES } from "@/server/platform/queue/queues";
import { processSendEmailJob } from "./processors/send-email.processor";
import { processSheetFlushJob } from "./processors/sheet-flush.processor";
import { processMaintenanceJob } from "./processors/maintenance.processor";
import { logger } from "@/server/platform/logger/logger";

const connection = getRedisClient();

logger.info("Initializing BullMQ background workers...");

// 1. Email Send Worker (concurrency 1 for safe rate limiting)
const sendEmailWorker = new Worker(
  QUEUE_NAMES.EMAIL_SEND,
  async (job) => {
    return processSendEmailJob(job);
  },
  {
    connection,
    concurrency: 1, // Single concurrency ensures strictly sequential dispatch per worker
  }
);

sendEmailWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Email send job completed successfully");
});

sendEmailWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Email send job failed");
});

// 2. Sheet Flush Worker
const sheetFlushWorker = new Worker(
  QUEUE_NAMES.SHEET_FLUSH,
  async (job) => {
    return processSheetFlushJob(job);
  },
  { connection, concurrency: 1 }
);

// 3. Maintenance Worker
const maintenanceWorker = new Worker(
  QUEUE_NAMES.MAINTENANCE,
  async (job) => {
    return processMaintenanceJob(job);
  },
  { connection, concurrency: 1 }
);

logger.info("Background workers successfully started and listening for jobs");

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received: Closing background workers cleanly");
  await sendEmailWorker.close();
  await sheetFlushWorker.close();
  await maintenanceWorker.close();
  process.exit(0);
});
