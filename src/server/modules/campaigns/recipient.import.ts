import "server-only";
import { prisma } from "@/server/platform/db/prisma";
import { normalizeEmail, isValidEmail } from "@/lib/email-address";
import { checkRecipientEligibility } from "./eligibility";
import { EmailStatus } from "@prisma/client";
import { logger } from "@/server/platform/logger/logger";

export interface RecipientInput {
  businessName: string;
  email: string;
  category?: string;
  location?: string;
  website?: string;
  leadId?: string;
}

export async function importRecipientsForCampaign(params: {
  userId: string;
  campaignId: string;
  recipients: RecipientInput[];
  isFollowUp?: boolean;
}) {
  const { userId, campaignId, recipients, isFollowUp = false } = params;

  const validRecipients: RecipientInput[] = [];
  const seenEmails = new Set<string>();

  for (const r of recipients) {
    if (!r.email || !isValidEmail(r.email)) continue;
    const norm = normalizeEmail(r.email);
    if (seenEmails.has(norm)) continue;
    seenEmails.add(norm);
    validRecipients.push({ ...r, email: norm });
  }

  let eligibleCount = 0;
  let ineligibleCount = 0;
  const snapshotData: any[] = [];

  for (const r of validRecipients) {
    const eligibility = await checkRecipientEligibility({
      userId,
      campaignId,
      emailNormalized: r.email,
      isFollowUp,
    });

    if (eligibility.eligible) {
      eligibleCount++;
      snapshotData.push({
        userId,
        campaignId,
        leadId: r.leadId || null,
        businessName: r.businessName,
        email: r.email,
        emailNormalized: r.email,
        category: r.category || null,
        location: r.location || null,
        website: r.website || null,
        emailStatus: EmailStatus.NOT_SENT,
      });
    } else {
      ineligibleCount++;
      snapshotData.push({
        userId,
        campaignId,
        leadId: r.leadId || null,
        businessName: r.businessName,
        email: r.email,
        emailNormalized: r.email,
        category: r.category || null,
        location: r.location || null,
        website: r.website || null,
        emailStatus: EmailStatus.SKIPPED,
        error: eligibility.details || "Ineligible for outreach",
      });
    }
  }

  if (snapshotData.length > 0) {
    await prisma.campaignLead.createMany({
      data: snapshotData,
    });
  }

  // Update campaign stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      stats: {
        total: snapshotData.length,
        sent: 0,
        failed: 0,
        queued: 0,
        replied: 0,
        bounced: 0,
        skipped: ineligibleCount,
      },
    },
  });

  logger.info(
    { campaignId, total: snapshotData.length, eligibleCount, ineligibleCount },
    "Recipients imported into campaign snapshot"
  );

  return {
    totalImported: snapshotData.length,
    eligibleCount,
    ineligibleCount,
  };
}
