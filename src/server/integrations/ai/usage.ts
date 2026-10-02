import { prisma } from "@/server/platform/db/prisma";
import { LIMITS } from "@/server/platform/config/limits";
import { logger } from "@/server/platform/logger/logger";

export class AiUsageService {
  getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  }

  async checkCanSpendTokens(userId: string): Promise<{ canSpend: boolean; currentTotalTokens: number }> {
    const month = this.getCurrentMonth();

    const usages = await prisma.aiUsage.findMany({
      where: { userId, month },
    });

    const totalTokens = usages.reduce((acc, u) => acc + u.inputTokens + u.outputTokens, 0);

    if (totalTokens >= LIMITS.AI_MONTHLY_TOKEN_CAP) {
      logger.warn({ userId, totalTokens, cap: LIMITS.AI_MONTHLY_TOKEN_CAP }, "Monthly AI token budget cap exceeded");
      return { canSpend: false, currentTotalTokens: totalTokens };
    }

    return { canSpend: true, currentTotalTokens: totalTokens };
  }

  async recordUsage(params: {
    userId: string;
    task: "classify" | "personalize";
    model: string;
    inputTokens: number;
    outputTokens: number;
  }) {
    const { userId, task, model, inputTokens, outputTokens } = params;
    const month = this.getCurrentMonth();

    return prisma.aiUsage.upsert({
      where: {
        userId_month_task_model: {
          userId,
          month,
          task,
          model,
        },
      },
      update: {
        calls: { increment: 1 },
        inputTokens: { increment: inputTokens },
        outputTokens: { increment: outputTokens },
      },
      create: {
        userId,
        month,
        task,
        model,
        calls: 1,
        inputTokens,
        outputTokens,
      },
    });
  }

  async getMonthlySummary(userId: string) {
    const month = this.getCurrentMonth();
    const usages = await prisma.aiUsage.findMany({
      where: { userId, month },
    });

    const totalCalls = usages.reduce((acc, u) => acc + u.calls, 0);
    const totalInput = usages.reduce((acc, u) => acc + u.inputTokens, 0);
    const totalOutput = usages.reduce((acc, u) => acc + u.outputTokens, 0);
    const totalTokens = totalInput + totalOutput;

    // Approximate Gemini Flash pricing ($0.075 per 1M input, $0.30 per 1M output)
    const estimatedCostUsd = (totalInput / 1_000_000) * 0.075 + (totalOutput / 1_000_000) * 0.3;

    return {
      month,
      totalCalls,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalTokens,
      tokenCap: LIMITS.AI_MONTHLY_TOKEN_CAP,
      percentUsed: Math.min(100, Math.round((totalTokens / LIMITS.AI_MONTHLY_TOKEN_CAP) * 100)),
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
      breakdown: usages,
    };
  }
}

export const aiUsageService = new AiUsageService();
