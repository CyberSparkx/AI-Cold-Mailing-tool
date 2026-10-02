import "server-only";
import { prisma } from "@/server/platform/db/prisma";
import { CampaignStatus } from "@prisma/client";

export class CampaignRepository {
  async list(userId: string) {
    return prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(userId: string, id: string) {
    return prisma.campaign.findFirst({
      where: { id, userId },
      include: {
        recipients: {
          take: 100,
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    subjectTemplate: string;
    bodyTemplate: string;
    dailyLimit: number;
    sendWindowStart: number;
    sendWindowEnd: number;
    useAiPersonalization: boolean;
    isFollowUp: boolean;
  }) {
    return prisma.campaign.create({
      data: {
        userId: data.userId,
        name: data.name,
        subjectTemplate: data.subjectTemplate,
        bodyTemplate: data.bodyTemplate,
        dailyLimit: data.dailyLimit,
        sendWindowStart: data.sendWindowStart,
        sendWindowEnd: data.sendWindowEnd,
        useAiPersonalization: data.useAiPersonalization,
        isFollowUp: data.isFollowUp,
        status: CampaignStatus.READY,
        stats: {
          total: 0,
          sent: 0,
          failed: 0,
          queued: 0,
          replied: 0,
          bounced: 0,
          skipped: 0,
        },
      },
    });
  }

  async updateStatus(userId: string, id: string, status: CampaignStatus) {
    const data: any = { status };
    if (status === CampaignStatus.RUNNING) data.startedAt = new Date();
    if (status === CampaignStatus.PAUSED) data.pausedAt = new Date();
    if (status === CampaignStatus.COMPLETED) data.completedAt = new Date();

    return prisma.campaign.updateMany({
      where: { id, userId },
      data,
    });
  }

  async getRecipients(userId: string, campaignId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.campaignLead.findMany({
        where: { userId, campaignId },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      }),
      prisma.campaignLead.count({ where: { userId, campaignId } }),
    ]);

    return { items, total, page, limit };
  }

  async getLogs(userId: string, campaignId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.emailLog.findMany({
        where: { userId, campaignId },
        skip,
        take: limit,
        orderBy: { sentAt: "desc" },
      }),
      prisma.emailLog.count({ where: { userId, campaignId } }),
    ]);

    return { items, total, page, limit };
  }

  async delete(userId: string, id: string) {
    return prisma.campaign.deleteMany({
      where: { id, userId },
    });
  }
}

export const campaignRepository = new CampaignRepository();
