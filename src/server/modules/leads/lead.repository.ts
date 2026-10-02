import { prisma } from "@/server/platform/db/prisma";
import { NormalizedLeadData } from "./lead.normalizer";
import { ListLeadsQuery, UpdateLeadInput } from "./lead.schemas";
import { LeadStatus, EmailStatus } from "@prisma/client";

export class LeadRepository {
  async saveMany(userId: string, leads: NormalizedLeadData[]) {
    if (leads.length === 0) return { insertedCount: 0 };

    // MongoDB supports createMany
    const result = await prisma.lead.createMany({
      data: leads.map((lead) => ({
        userId,
        businessName: lead.businessName,
        category: lead.category,
        niche: lead.niche,
        website: lead.website,
        websiteDomain: lead.websiteDomain,
        email: lead.email,
        emailNormalized: lead.emailNormalized,
        emailIsRole: lead.emailIsRole,
        phone: lead.phone,
        phoneE164: lead.phoneE164,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        postalCode: lead.postalCode,
        latitude: lead.latitude,
        longitude: lead.longitude,
        rating: lead.rating,
        reviewCount: lead.reviewCount,
        source: lead.source,
        sourceUrl: lead.sourceUrl,
        externalId: lead.externalId,
        dedupeKey: lead.dedupeKey,
        status: LeadStatus.NEW,
        emailStatus: EmailStatus.NOT_SENT,
      })),
    });

    return { insertedCount: result.count };
  }

  async list(userId: string, query: ListLeadsQuery) {
    const { page, limit, search, category, city, status, emailStatus } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { emailNormalized: { contains: search.toLowerCase() } },
        { websiteDomain: { contains: search.toLowerCase() } },
      ];
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (status) {
      where.status = status as LeadStatus;
    }

    if (emailStatus) {
      where.emailStatus = emailStatus as EmailStatus;
    }

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + items.length < total,
    };
  }

  async findById(userId: string, id: string) {
    return prisma.lead.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, data: UpdateLeadInput) {
    return prisma.lead.updateMany({
      where: { id, userId },
      data: {
        ...(data.businessName && { businessName: data.businessName }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.email !== undefined && { email: data.email, emailNormalized: data.email ? data.email.toLowerCase().trim() : null }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.status && { status: data.status as LeadStatus }),
        ...(data.emailStatus && { emailStatus: data.emailStatus as EmailStatus }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async delete(userId: string, id: string) {
    return prisma.lead.deleteMany({
      where: { id, userId },
    });
  }

  async getAllForExport(userId: string, filter?: Partial<ListLeadsQuery>) {
    const where: any = { userId };
    if (filter?.category) where.category = { contains: filter.category, mode: "insensitive" };
    if (filter?.city) where.city = { contains: filter.city, mode: "insensitive" };
    if (filter?.status) where.status = filter.status as LeadStatus;

    return prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
  }
}

export const leadRepository = new LeadRepository();
