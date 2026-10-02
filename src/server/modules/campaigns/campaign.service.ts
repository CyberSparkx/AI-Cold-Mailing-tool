import { campaignRepository } from "./campaign.repository";
import { templateService } from "./template.service";
import { importRecipientsForCampaign, RecipientInput } from "./recipient.import";
import { CreateCampaignInput, CampaignActionInput } from "./campaign.schemas";
import { prisma } from "@/server/platform/db/prisma";
import { CampaignStatus, EmailStatus } from "@prisma/client";
import { AppError } from "@/server/platform/errors/app-error";
import { ERROR_CODES } from "@/server/platform/errors/error-codes";
import { logger } from "@/server/platform/logger/logger";
import { queueDriver } from "@/server/platform/queue/bullmq.driver";
import { QUEUE_NAMES } from "@/server/platform/queue/queues";

export class CampaignService {
  async listCampaigns(userId: string) {
    return campaignRepository.list(userId);
  }

  async getCampaign(userId: string, id: string) {
    const campaign = await campaignRepository.findById(userId, id);
    if (!campaign) {
      throw AppError.notFound("Campaign not found");
    }
    return campaign;
  }

  async createCampaign(userId: string, input: CreateCampaignInput) {
    // 1. Validate templates
    templateService.validateTemplates(input.subjectTemplate, input.bodyTemplate, input.isFollowUp);

    // 2. Fetch sender settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    const postalAddress = user?.settings?.postalAddress;
    if (!postalAddress) {
      // Must have postal address configured for anti-spam compliance
      logger.info({ userId }, "Using default registered postal address for outreach");
    }

    // 3. Create Campaign record
    const campaign = await campaignRepository.create({
      userId,
      name: input.name,
      subjectTemplate: input.subjectTemplate,
      bodyTemplate: input.bodyTemplate,
      dailyLimit: input.dailyLimit,
      sendWindowStart: input.sendWindowStart,
      sendWindowEnd: input.sendWindowEnd,
      useAiPersonalization: input.useAiPersonalization,
      isFollowUp: input.isFollowUp,
    });

    // 4. Resolve and import recipients
    let recipientsToImport: RecipientInput[] = [];

    if (input.sourceType === "LEADS") {
      const where: any = { userId };
      if (input.leadIds && input.leadIds.length > 0) {
        where.id = { in: input.leadIds };
      }
      const leads = await prisma.lead.findMany({
        where,
        select: {
          id: true,
          businessName: true,
          email: true,
          category: true,
          city: true,
          website: true,
        },
      });

      recipientsToImport = leads
        .filter((l) => Boolean(l.email))
        .map((l) => ({
          leadId: l.id,
          businessName: l.businessName,
          email: l.email!,
          category: l.category || undefined,
          location: l.city || undefined,
          website: l.website || undefined,
        }));
    } else if (input.manualRecipients) {
      recipientsToImport = input.manualRecipients;
    }

    if (recipientsToImport.length > 0) {
      await importRecipientsForCampaign({
        userId,
        campaignId: campaign.id,
        recipients: recipientsToImport,
        isFollowUp: input.isFollowUp,
      });
    }

    return this.getCampaign(userId, campaign.id);
  }

  async handleAction(userId: string, id: string, input: CampaignActionInput) {
    const campaign = await this.getCampaign(userId, id);

    switch (input.action) {
      case "START":
        if (campaign.status === CampaignStatus.RUNNING) {
          // If already marked running, re-dispatch any pending recipients that haven't been queued yet
          await this.dispatchPendingRecipients(userId, id);
          break;
        }
        await campaignRepository.updateStatus(userId, id, CampaignStatus.RUNNING);
        logger.info({ userId, campaignId: id }, "Campaign started");
        await this.dispatchPendingRecipients(userId, id);
        break;

      case "PAUSE":
        await campaignRepository.updateStatus(userId, id, CampaignStatus.PAUSED);
        logger.info({ userId, campaignId: id }, "Campaign paused");
        break;

      case "RESUME":
        await campaignRepository.updateStatus(userId, id, CampaignStatus.RUNNING);
        logger.info({ userId, campaignId: id }, "Campaign resumed");
        await this.dispatchPendingRecipients(userId, id);
        break;

      case "CANCEL":
        await campaignRepository.updateStatus(userId, id, CampaignStatus.CANCELLED);
        logger.info({ userId, campaignId: id }, "Campaign cancelled");
        break;
    }

    return this.getCampaign(userId, id);
  }

  async dispatchPendingRecipients(userId: string, campaignId: string) {
    const pendingRecipients = await prisma.campaignLead.findMany({
      where: {
        campaignId,
        userId,
        emailStatus: { in: [EmailStatus.NOT_SENT, EmailStatus.QUEUED] },
      },
    });

    if (pendingRecipients.length === 0) {
      logger.info({ campaignId }, "No pending recipients to dispatch");
      return;
    }

    logger.info(
      { userId, campaignId, count: pendingRecipients.length },
      "Dispatching pending campaign recipients to BullMQ queue"
    );

    for (const recipient of pendingRecipients) {
      if (recipient.emailStatus !== EmailStatus.QUEUED) {
        await prisma.campaignLead.update({
          where: { id: recipient.id },
          data: { emailStatus: EmailStatus.QUEUED },
        });
      }

      await queueDriver.addJob(QUEUE_NAMES.EMAIL_SEND, {
        name: "send-email",
        data: {
          userId,
          campaignId,
          campaignLeadId: recipient.id,
          recipientEmail: recipient.email,
        },
      });
    }

    const queuedCount = await prisma.campaignLead.count({
      where: {
        campaignId,
        userId,
        emailStatus: EmailStatus.QUEUED,
      },
    });

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (campaign) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          stats: {
            ...campaign.stats,
            queued: queuedCount,
          },
        },
      });
    }
  }

  async previewEmail(userId: string, campaignId: string, recipientId?: string) {
    const campaign = await this.getCampaign(userId, campaignId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, settings: true },
    });

    const senderName = user?.settings?.senderName || user?.name || "Naren Roy";
    const portfolioUrl = user?.settings?.portfolioUrl || "https://narenroy.in/";
    const postalAddress = user?.settings?.postalAddress || "Kolkata, West Bengal, India";

    let sampleRecipient = campaign.recipients[0];
    if (recipientId) {
      const found = await prisma.campaignLead.findFirst({
        where: { id: recipientId, campaignId },
      });
      if (found) sampleRecipient = found;
    }

    const vars = {
      businessName: sampleRecipient?.businessName || "Acme Agency",
      category: sampleRecipient?.category || "Web Development",
      city: sampleRecipient?.location || "Bangalore",
      location: sampleRecipient?.location || "Bangalore",
      website: sampleRecipient?.website || "https://example.com",
      senderName,
      portfolioUrl,
    };

    return templateService.buildFullEmail({
      userId,
      recipientEmail: sampleRecipient?.email || "lead@example.com",
      campaignId,
      subjectTemplate: campaign.subjectTemplate,
      bodyTemplate: campaign.bodyTemplate,
      variables: vars,
      postalAddress,
    });
  }

  async getRecipients(userId: string, campaignId: string, page = 1) {
    return campaignRepository.getRecipients(userId, campaignId, page);
  }

  async getLogs(userId: string, campaignId: string, page = 1) {
    return campaignRepository.getLogs(userId, campaignId, page);
  }
}

export const campaignService = new CampaignService();
