import { google } from "googleapis";
import { prisma } from "@/server/platform/db/prisma";
import { getValidGoogleClient } from "@/server/integrations/google/token-store";
import { GoogleService, InboxCategory, OpportunityStatus } from "@prisma/client";
import { inboxRepository } from "./inbox.repository";
import { runDeterministicPreFilter } from "./prefilter";
import { ListInboxQuery, UpdateInboxMessageInput } from "./inbox.schemas";
import { truncate } from "@/lib/utils";
import { logger } from "@/server/platform/logger/logger";

export class InboxService {
  async listMessages(userId: string, query: ListInboxQuery) {
    return inboxRepository.list(userId, query);
  }

  async updateMessage(userId: string, id: string, data: UpdateInboxMessageInput) {
    return inboxRepository.update(userId, id, data);
  }

  async syncGmailInbox(userId: string) {
    logger.info({ userId }, "Initiating Gmail inbox synchronization");

    try {
      const { oauth2Client, senderEmail } = await getValidGoogleClient(userId, GoogleService.GMAIL_READ);
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      // Fetch latest messages (metadata only to avoid heavy body payloads)
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        maxResults: 15,
        q: "newer_than:14d -category:promotions -category:social -category:updates",
      });

      const messageRefs = listResponse.data.messages || [];
      let newCount = 0;

      for (const ref of messageRefs) {
        if (!ref.id) continue;

        // Check if already stored
        const existing = await prisma.inboxMessage.findUnique({
          where: {
            userId_gmailMessageId: {
              userId,
              gmailMessageId: ref.id,
            },
          },
        });

        if (existing) continue;

        // Fetch format=metadata
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: ref.id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date", "List-Unsubscribe"],
        });

        const headers = msg.data.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

        const from = getHeader("From");
        const subject = getHeader("Subject") || "No Subject";
        const dateStr = getHeader("Date");
        const listUnsubscribe = Boolean(getHeader("List-Unsubscribe"));
        const snippet = truncate(msg.data.snippet || "", 300);

        // Extract sender email
        const emailMatch = from.match(/<([^>]+)>/) || [null, from];
        const senderEmail = (emailMatch[1] || from).trim();

        // Run deterministic pre-filter
        const preFilter = runDeterministicPreFilter({
          senderEmail,
          subject,
          snippet,
          hasListUnsubscribeHeader: listUnsubscribe,
          userEmail: senderEmail,
        });

        const classification = preFilter.classification || InboxCategory.GENERAL;

        await prisma.inboxMessage.create({
          data: {
            userId,
            gmailMessageId: ref.id,
            threadId: msg.data.threadId || ref.id,
            sender: from,
            senderEmail,
            subject,
            snippet,
            receivedAt: dateStr ? new Date(dateStr) : new Date(),
            classification,
            isOpportunity: preFilter.isOpportunity,
            opportunityStatus: preFilter.isOpportunity ? OpportunityStatus.NEW : OpportunityStatus.REVIEWED,
            reason: preFilter.reason,
            confidence: 0.9,
          },
        });

        newCount++;
      }

      await inboxRepository.updateSyncState(userId, String(Date.now()));
      return { syncedCount: newCount };
    } catch (err: any) {
      logger.error({ err, userId }, "Gmail inbox sync failed");
      throw err;
    }
  }
}

export const inboxService = new InboxService();
