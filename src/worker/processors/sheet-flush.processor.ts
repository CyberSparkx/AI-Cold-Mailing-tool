import { Job } from "bullmq";
import { prisma } from "@/server/platform/db/prisma";
import { googleSheetsService } from "@/server/integrations/google/sheets";
import { logger } from "@/server/platform/logger/logger";

interface OutboxItem {
  id: string;
  userId: string;
  sheetLinkId: string;
  campaignLeadId: string;
  patch: any;
  createdAt: Date;
}

export async function processSheetFlushJob(_job: Job) {
  logger.info("Running write-behind SheetSyncOutbox flusher");

  // Fetch pending outbox records
  const outboxRecords = await prisma.sheetSyncOutbox.findMany({
    take: 50,
    orderBy: { createdAt: "asc" },
  });

  if (outboxRecords.length === 0) {
    return { flushed: 0 };
  }

  // Group by sheetLinkId
  const bySheet = new Map<string, OutboxItem[]>();
  for (const record of outboxRecords) {
    const list = bySheet.get(record.sheetLinkId) || [];
    list.push(record);
    bySheet.set(record.sheetLinkId, list);
  }

  let totalFlushed = 0;

  for (const [sheetLinkId, records] of Array.from(bySheet.entries())) {
    const link = await prisma.sheetLink.findUnique({
      where: { id: sheetLinkId },
    });

    if (!link) continue;

    // Collect updates
    const updates = records.map((r: OutboxItem, idx: number) => {
      const patch = r.patch || {};
      return {
        rowIndex: idx + 2, // 1-indexed header + offset
        status: patch.status || "SENT",
        lastContacted: patch.lastContacted,
        messageId: patch.messageId,
      };
    });

    await googleSheetsService.batchUpdateRowStatuses(
      records[0].userId,
      link.spreadsheetId,
      link.sheetTitle,
      updates
    );

    // Delete processed outbox rows
    await prisma.sheetSyncOutbox.deleteMany({
      where: {
        id: { in: records.map((r: OutboxItem) => r.id) },
      },
    });

    totalFlushed += records.length;
  }

  logger.info({ totalFlushed }, "Sheet sync outbox successfully flushed");
  return { flushed: totalFlushed };
}
