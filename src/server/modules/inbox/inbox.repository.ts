import "server-only";
import { prisma } from "@/server/platform/db/prisma";
import { ListInboxQuery, UpdateInboxMessageInput } from "./inbox.schemas";
import { InboxCategory, OpportunityStatus } from "@prisma/client";

export class InboxRepository {
  async list(userId: string, query: ListInboxQuery) {
    const { page, limit, category, opportunityStatus, onlyOpportunities } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (category) {
      where.classification = category as InboxCategory;
    }

    if (opportunityStatus) {
      where.opportunityStatus = opportunityStatus as OpportunityStatus;
    }

    if (onlyOpportunities) {
      where.isOpportunity = true;
    }

    const [items, total] = await Promise.all([
      prisma.inboxMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: "desc" },
      }),
      prisma.inboxMessage.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(userId: string, id: string) {
    return prisma.inboxMessage.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, data: UpdateInboxMessageInput) {
    return prisma.inboxMessage.updateMany({
      where: { id, userId },
      data: {
        ...(data.opportunityStatus && { opportunityStatus: data.opportunityStatus as OpportunityStatus }),
        ...(data.userOverrideCategory && { userOverrideCategory: data.userOverrideCategory as InboxCategory }),
      },
    });
  }

  async getSyncState(userId: string) {
    return prisma.inboxSyncState.findUnique({
      where: { userId },
    });
  }

  async updateSyncState(userId: string, historyId: string) {
    return prisma.inboxSyncState.upsert({
      where: { userId },
      update: {
        historyId,
        lastSyncAt: new Date(),
        status: "IDLE",
      },
      create: {
        userId,
        historyId,
        lastSyncAt: new Date(),
        status: "IDLE",
      },
    });
  }
}

export const inboxRepository = new InboxRepository();
