import "server-only";
import { prisma } from "@/server/platform/db/prisma";
import { LIMITS } from "@/server/platform/config/limits";
import { AppError } from "@/server/platform/errors/app-error";
import { ERROR_CODES } from "@/server/platform/errors/error-codes";

export class LimitsService {
  getDateString(timezone = "UTC"): string {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  async checkCanSendToday(userId: string, campaignLimit?: number): Promise<{ canSend: boolean; remaining: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, settings: true },
    });

    const timezone = user?.timezone || "UTC";
    const dateStr = this.getDateString(timezone);

    const configuredLimit = Math.min(
      campaignLimit || user?.settings?.defaultDailyLimit || LIMITS.DEFAULT_DAILY_LIMIT,
      LIMITS.HARD_DAILY_CAP
    );

    const counter = await prisma.dailySendCounter.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateStr,
        },
      },
    });

    const currentCount = counter?.count || 0;
    const remaining = Math.max(0, configuredLimit - currentCount);

    if (currentCount >= configuredLimit) {
      return { canSend: false, remaining: 0 };
    }

    return { canSend: true, remaining };
  }

  async incrementDailyCounter(userId: string, campaignLimit?: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, settings: true },
    });

    const timezone = user?.timezone || "UTC";
    const dateStr = this.getDateString(timezone);

    const configuredLimit = Math.min(
      campaignLimit || user?.settings?.defaultDailyLimit || LIMITS.DEFAULT_DAILY_LIMIT,
      LIMITS.HARD_DAILY_CAP
    );

    return prisma.dailySendCounter.upsert({
      where: {
        userId_date: {
          userId,
          date: dateStr,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        date: dateStr,
        count: 1,
        limit: configuredLimit,
      },
    });
  }
}

export const limitsService = new LimitsService();
