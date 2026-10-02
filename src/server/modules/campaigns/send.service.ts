import "server-only";
import { prisma } from "@/server/platform/db/prisma";
import { gmailSendingService } from "@/server/integrations/google/gmail";
import { templateService } from "./template.service";
import { limitsService } from "./limits.service";
import { checkRecipientEligibility } from "./eligibility";
import { EmailStatus, EmailLogStatus, CampaignStatus } from "@prisma/client";
import crypto from "crypto";
import { AppError } from "@/server/platform/errors/app-error";
import { ERROR_CODES } from "@/server/platform/errors/error-codes";
import { logger } from "@/server/platform/logger/logger";

export interface ProcessOneResult {
  success: boolean;
  status: "SENT" | "SKIPPED" | "FAILED" | "LIMIT_REACHED" | "NOT_RUNNING" | "ALREADY_PROCESSED";
  recipientEmail?: string;
  error?: string;
}

export class SendService {
  async processOneRecipient(userId: string, campaignLeadId: string): Promise<ProcessOneResult> {
    // 1. Fetch recipient and campaign
    const campaignLead = await prisma.campaignLead.findFirst({
      where: { id: campaignLeadId, userId },
      include: {
        campaign: true,
      },
    });

    if (!campaignLead) {
      return { success: false, status: "NOT_RUNNING", error: "Recipient not found" };
    }

    const campaign = campaignLead.campaign;

    // 2. Check campaign status
    if (campaign.status !== CampaignStatus.RUNNING) {
      return { success: false, status: "NOT_RUNNING", error: "Campaign is not in RUNNING state" };
    }

    // 3. Check daily limits
    const limitCheck = await limitsService.checkCanSendToday(userId, campaign.dailyLimit);
    if (!limitCheck.canSend) {
      logger.warn({ userId, campaignId: campaign.id }, "Daily send limit reached for today");
      return { success: false, status: "LIMIT_REACHED", error: "Daily sending limit reached" };
    }

    // 4. Check eligibility (suppression + global ContactLedger duplicate prevention)
    const eligibility = await checkRecipientEligibility({
      userId,
      campaignId: campaign.id,
      emailNormalized: campaignLead.emailNormalized,
      isFollowUp: campaign.isFollowUp,
    });

    if (!eligibility.eligible) {
      await prisma.campaignLead.update({
        where: { id: campaignLead.id },
        data: {
          emailStatus: EmailStatus.SKIPPED,
          error: eligibility.details,
        },
      });
      return {
        success: false,
        status: "SKIPPED",
        recipientEmail: campaignLead.email,
        error: eligibility.details,
      };
    }

    // 5. Layer 3 Duplicate Protection: Atomic single-document claim
    const attemptId = crypto.randomUUID();
    const claim = await prisma.campaignLead.updateMany({
      where: {
        id: campaignLead.id,
        emailStatus: { in: [EmailStatus.NOT_SENT, EmailStatus.QUEUED] },
      },
      data: {
        emailStatus: EmailStatus.SENDING,
        attemptId,
      },
    });

    if (claim.count === 0) {
      return {
        success: false,
        status: "ALREADY_PROCESSED",
        recipientEmail: campaignLead.email,
        error: "Recipient already processed or in progress",
      };
    }

    // 6. Build email content
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, settings: true },
    });

    const senderName = user?.settings?.senderName || user?.name || "Naren Roy";
    const portfolioUrl = user?.settings?.portfolioUrl || "https://narenroy.in/";
    const postalAddress = user?.settings?.postalAddress || "Kolkata, West Bengal, India";

    const vars = {
      businessName: campaignLead.businessName,
      category: campaignLead.category || "",
      city: campaignLead.location || "",
      location: campaignLead.location || "",
      website: campaignLead.website || "",
      senderName,
      portfolioUrl,
    };

    const emailContent = templateService.buildFullEmail({
      userId,
      recipientEmail: campaignLead.email,
      campaignId: campaign.id,
      subjectTemplate: campaign.subjectTemplate,
      bodyTemplate: campaign.bodyTemplate,
      variables: vars,
      postalAddress,
    });

    // 7. Dispatch via Gmail API
    try {
      const sendResult = await gmailSendingService.sendEmail({
        userId,
        to: campaignLead.email,
        subject: emailContent.subject,
        bodyText: emailContent.bodyText,
        bodyHtml: emailContent.bodyHtml,
        unsubscribeUrl: emailContent.unsubscribeUrl,
        senderName,
      });

      const now = new Date();

      // Success updates
      await prisma.$transaction([
        // Update recipient record
        prisma.campaignLead.update({
          where: { id: campaignLead.id },
          data: {
            emailStatus: EmailStatus.SENT,
            providerMessageId: sendResult.providerMessageId,
            threadId: sendResult.threadId,
            rfcMessageId: sendResult.rfcMessageId,
            sentAt: now,
            error: null,
          },
        }),
        // Record in ContactLedger (Layer 2 global duplicate prevention)
        prisma.contactLedger.upsert({
          where: {
            userId_emailNormalized: {
              userId,
              emailNormalized: campaignLead.emailNormalized,
            },
          },
          update: {
            lastContactedAt: now,
            contactCount: { increment: 1 },
          },
          create: {
            userId,
            emailNormalized: campaignLead.emailNormalized,
            firstCampaignId: campaign.id,
            lastContactedAt: now,
            contactCount: 1,
          },
        }),
        // Log in EmailLog
        prisma.emailLog.create({
          data: {
            userId,
            campaignId: campaign.id,
            campaignLeadId: campaignLead.id,
            recipient: campaignLead.email,
            subject: emailContent.subject,
            status: EmailLogStatus.SENT,
            providerMessageId: sendResult.providerMessageId,
            threadId: sendResult.threadId,
            rfcMessageId: sendResult.rfcMessageId,
            sentAt: now,
          },
        }),
        // Update campaign denormalized counter
        prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            stats: {
              ...campaign.stats,
              sent: campaign.stats.sent + 1,
            },
          },
        }),
      ]);

      // Increment daily counter
      await limitsService.incrementDailyCounter(userId, campaign.dailyLimit);

      // If linked to Leads module, update Lead email status
      if (campaignLead.leadId) {
        await prisma.lead.updateMany({
          where: { id: campaignLead.leadId, userId },
          data: { emailStatus: EmailStatus.SENT },
        });
      }

      logger.info({ campaignLeadId, to: campaignLead.email }, "Email successfully dispatched and logged");

      return {
        success: true,
        status: "SENT",
        recipientEmail: campaignLead.email,
      };
    } catch (err: any) {
      logger.error({ err, campaignLeadId, to: campaignLead.email }, "Send attempt failed");

      await prisma.campaignLead.update({
        where: { id: campaignLead.id },
        data: {
          emailStatus: EmailStatus.FAILED,
          error: err.message || "Failed to deliver via Gmail",
          errorRetryable: err.statusCode === 429 || err.statusCode >= 500,
        },
      });

      await prisma.emailLog.create({
        data: {
          userId,
          campaignId: campaign.id,
          campaignLeadId: campaignLead.id,
          recipient: campaignLead.email,
          subject: emailContent.subject,
          status: EmailLogStatus.FAILED,
          error: err.message || "Unknown delivery error",
          errorCode: err.code || "SEND_ERROR",
          sentAt: new Date(),
        },
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          stats: {
            ...campaign.stats,
            failed: campaign.stats.failed + 1,
          },
        },
      });

      return {
        success: false,
        status: "FAILED",
        recipientEmail: campaignLead.email,
        error: err.message,
      };
    }
  }

  async sendTestEmail(userId: string, campaignId: string): Promise<{ success: boolean; recipient: string; message: string }> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId },
    });

    if (!campaign) {
      throw AppError.notFound("Campaign not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, settings: true },
    });

    if (!user) {
      throw AppError.unauthorized("User not found");
    }

    const senderName = user.settings?.senderName || user.name || "Naren Roy";
    const portfolioUrl = user.settings?.portfolioUrl || "https://narenroy.in/";
    const postalAddress = user.settings?.postalAddress || "Kolkata, West Bengal, India";

    const vars = {
      businessName: "Acme Enterprises (Test Recipient)",
      category: "Software & Technology",
      city: "Bangalore",
      location: "Bangalore",
      website: "https://example.com",
      senderName,
      portfolioUrl,
    };

    const emailContent = templateService.buildFullEmail({
      userId,
      recipientEmail: user.email,
      campaignId: campaign.id,
      subjectTemplate: `[TEST] ${campaign.subjectTemplate}`,
      bodyTemplate: campaign.bodyTemplate,
      variables: vars,
      postalAddress,
    });

    await gmailSendingService.sendEmail({
      userId,
      to: user.email,
      subject: emailContent.subject,
      bodyText: emailContent.bodyText,
      bodyHtml: emailContent.bodyHtml,
      unsubscribeUrl: emailContent.unsubscribeUrl,
      senderName,
    });

    return {
      success: true,
      recipient: user.email,
      message: `Test email successfully sent to ${user.email}`,
    };
  }
}

export const sendService = new SendService();
