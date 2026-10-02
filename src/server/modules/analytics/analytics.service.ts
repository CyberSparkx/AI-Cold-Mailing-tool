import { prisma } from "@/server/platform/db/prisma";
import { getRedisClient } from "@/server/platform/redis/client";
import { logger } from "@/server/platform/logger/logger";
import { CampaignStatus, InboxCategory, OpportunityStatus } from "@prisma/client";

export interface AnalyticsSummary {
  leads: {
    total: number;
    withEmail: number;
  };
  campaigns: {
    total: number;
    running: number;
    draft: number;
    paused: number;
    completed: number;
  };
  delivery: {
    totalSent: number;
    totalReplied: number;
    totalBounced: number;
    replyRatePct: number;
    bounceRatePct: number;
    sentToday: number;
    dailyLimit: number;
  };
  inbox: {
    totalOpportunities: number;
    newOpportunities: number;
    categoryBreakdown: Record<string, number>;
  };
  activityTimeline: Array<{
    date: string;
    label: string;
    sent: number;
    failed: number;
  }>;
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: CampaignStatus;
    total: number;
    sent: number;
    replied: number;
    bounced: number;
  }>;
}

export class AnalyticsService {
  private static CACHE_TTL_SECONDS = 60;

  static async getOverviewMetrics(userId: string): Promise<AnalyticsSummary> {
    const cacheKey = `analytics:overview:${userId}`;

    // Try Redis cache
    try {
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached) as AnalyticsSummary;
        }
      }
    } catch {
      // Non-blocking fallback
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Parallel aggregate queries
    const [
      totalLeads,
      leadsWithEmail,
      campaigns,
      dailyCounter,
      totalOpportunities,
      newOpportunities,
      categoryGroups,
      emailLogs7Days,
    ] = await Promise.all([
      prisma.lead.count({ where: { userId } }),
      prisma.lead.count({
        where: {
          userId,
          emailNormalized: { not: null },
        },
      }),
      prisma.campaign.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          stats: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.dailySendCounter.findUnique({
        where: {
          userId_date: {
            userId,
            date: todayStr,
          },
        },
      }),
      prisma.inboxMessage.count({
        where: { userId, isOpportunity: true },
      }),
      prisma.inboxMessage.count({
        where: { userId, isOpportunity: true, opportunityStatus: OpportunityStatus.NEW },
      }),
      prisma.inboxMessage.groupBy({
        by: ["classification"],
        where: {
          userId,
          isOpportunity: true,
          classification: { not: null },
        },
        _count: true,
      }),
      prisma.emailLog.findMany({
        where: {
          userId,
          sentAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          sentAt: true,
          status: true,
        },
      }),
    ]);

    // Aggregate campaign metrics
    let running = 0;
    let draft = 0;
    let paused = 0;
    let completed = 0;
    let totalSent = 0;
    let totalReplied = 0;
    let totalBounced = 0;

    for (const c of campaigns) {
      if (c.status === "RUNNING") running++;
      else if (c.status === "DRAFT") draft++;
      else if (c.status === "PAUSED") paused++;
      else if (c.status === "COMPLETED") completed++;

      if (c.stats) {
        totalSent += c.stats.sent || 0;
        totalReplied += c.stats.replied || 0;
        totalBounced += c.stats.bounced || 0;
      }
    }

    const replyRatePct = totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0;
    const bounceRatePct = totalSent > 0 ? Math.round((totalBounced / totalSent) * 1000) / 10 : 0;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {
      WEBSITE_INQUIRY: 0,
      SOFTWARE_INQUIRY: 0,
      FREELANCE_OPPORTUNITY: 0,
      JOB_OPPORTUNITY: 0,
      PARTNERSHIP: 0,
      GENERAL: 0,
    };
    for (const group of categoryGroups) {
      if (group.classification) {
        categoryBreakdown[group.classification] = group._count;
      }
    }

    // Build 7-day timeline
    const timelineMap: Record<string, { sent: number; failed: number }> = {};
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      timelineMap[iso] = { sent: 0, failed: 0 };
    }

    for (const log of emailLogs7Days) {
      const dayKey = log.sentAt.toISOString().slice(0, 10);
      if (timelineMap[dayKey]) {
        if (log.status === "SENT") {
          timelineMap[dayKey].sent++;
        } else if (log.status === "FAILED") {
          timelineMap[dayKey].failed++;
        }
      }
    }

    const activityTimeline = Object.entries(timelineMap).map(([date, counts]) => {
      const d = new Date(date + "T00:00:00Z");
      const label = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
      return {
        date,
        label,
        sent: counts.sent,
        failed: counts.failed,
      };
    });

    const recentCampaigns = campaigns.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      total: c.stats?.total || 0,
      sent: c.stats?.sent || 0,
      replied: c.stats?.replied || 0,
      bounced: c.stats?.bounced || 0,
    }));

    const result: AnalyticsSummary = {
      leads: {
        total: totalLeads,
        withEmail: leadsWithEmail,
      },
      campaigns: {
        total: campaigns.length,
        running,
        draft,
        paused,
        completed,
      },
      delivery: {
        totalSent,
        totalReplied,
        totalBounced,
        replyRatePct,
        bounceRatePct,
        sentToday: dailyCounter?.count || 0,
        dailyLimit: dailyCounter?.limit || 25,
      },
      inbox: {
        totalOpportunities,
        newOpportunities,
        categoryBreakdown,
      },
      activityTimeline,
      recentCampaigns,
    };

    // Cache in Redis
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(result), "EX", this.CACHE_TTL_SECONDS);
      }
    } catch (err) {
      logger.warn({ err }, "Could not set analytics cache in Redis");
    }

    return result;
  }
}
