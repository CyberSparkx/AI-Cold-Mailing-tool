import "server-only";
import { campaignRepository } from "./campaign.repository";
import { templateService } from "./template.service";
import { importRecipientsForCampaign, RecipientInput } from "./recipient.import";
import { CreateCampaignInput, CampaignActionInput } from "./campaign.schemas";
import { prisma } from "@/server/platform/db/prisma";
import { CampaignStatus } from "@prisma/client";
import { AppError } from "@/server/platform/errors/app-error";
import { ERROR_CODES } from "@/server/platform/errors/error-codes";
import { logger } from "@/server/platform/logger/logger";

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
          throw AppError.badRequest("Campaign is already running", undefined, ERROR_CODES.CAMPAIGN_ALREADY_RUNNING);
        }
        await campaignRepository.updateStatus(userId, id, CampaignStatus.RUNNING);
        logger.info({ userId, campaignId: id }, "Campaign started");
        break;

      case "PAUSE":
        await campaignRepository.updateStatus(userId, id, CampaignStatus.PAUSED);
        logger.info({ userId, campaignId: id }, "Campaign paused");
        break;

      case "RESUME":
        await campaignRepository.updateStatus(userId, id, CampaignStatus.RUNNING);
        logger.info({ userId, campaignId: id }, "Campaign resumed");
        break;

      case "CANCEL":
        await campaignRepository.updateStatus(userId, id, CampaignStatus.CANCELLED);
        logger.info({ userId, campaignId: id }, "Campaign cancelled");
        break;
    }

    return this.getCampaign(userId, id);
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
