import "server-only";
import { prisma } from "@/server/platform/db/prisma";
import { verifyUnsubscribeToken } from "@/server/platform/crypto/tokens";
import { normalizeEmail, extractDomain } from "@/lib/email-address";
import { SuppressionReason, EmailStatus, LeadStatus } from "@prisma/client";
import { AppError } from "@/server/platform/errors/app-error";
import { logger } from "@/server/platform/logger/logger";

export class UnsubscribeService {
  async processToken(token: string) {
    const payload = verifyUnsubscribeToken(token);
    if (!payload) {
      throw AppError.badRequest("Invalid or expired unsubscribe token");
    }

    const { userId, email } = payload;
    const emailNormalized = normalizeEmail(email);

    // 1. Upsert suppression entry
    await prisma.suppressionEntry.upsert({
      where: {
        userId_emailNormalized: {
          userId,
          emailNormalized,
        },
      },
      update: {
        reason: SuppressionReason.UNSUBSCRIBED,
        note: "One-click unsubscribe link clicked",
      },
      create: {
        userId,
        emailNormalized,
        domain: extractDomain(emailNormalized),
        reason: SuppressionReason.UNSUBSCRIBED,
        note: "One-click unsubscribe link clicked",
      },
    });

    // 2. Mark any pending CampaignLead rows for this address as UNSUBSCRIBED
    await prisma.campaignLead.updateMany({
      where: {
        userId,
        emailNormalized,
        emailStatus: { in: [EmailStatus.NOT_SENT, EmailStatus.QUEUED] },
      },
      data: {
        emailStatus: EmailStatus.UNSUBSCRIBED,
      },
    });

    // 3. Mark Lead record status as DO_NOT_CONTACT
    await prisma.lead.updateMany({
      where: {
        userId,
        emailNormalized,
      },
      data: {
        status: LeadStatus.DO_NOT_CONTACT,
        emailStatus: EmailStatus.UNSUBSCRIBED,
      },
    });

    logger.info({ userId, email: emailNormalized }, "Recipient successfully unsubscribed and suppressed");

    return {
      success: true,
      email: emailNormalized,
      message: "You have been successfully unsubscribed from all future outreach.",
    };
  }
}

export const unsubscribeService = new UnsubscribeService();
