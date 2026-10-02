import { Job } from "bullmq";
import { prisma } from "@/server/platform/db/prisma";
import { EmailStatus } from "@prisma/client";
import { logger } from "@/server/platform/logger/logger";

export async function processMaintenanceJob(job: Job) {
  logger.info("Running queue maintenance: Reconciling stuck SENDING records");

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // Find recipients stuck in SENDING for > 10 minutes
  const stuck = await prisma.campaignLead.updateMany({
    where: {
      emailStatus: EmailStatus.SENDING,
      updatedAt: { lt: tenMinutesAgo },
    },
    data: {
      emailStatus: EmailStatus.NOT_SENT,
      attemptId: null,
      error: "Reconciled from crashed sending worker",
    },
  });

  if (stuck.count > 0) {
    logger.warn({ count: stuck.count }, "Reconciled crashed SENDING records back to NOT_SENT");
  }

  return { reconciledCount: stuck.count };
}
