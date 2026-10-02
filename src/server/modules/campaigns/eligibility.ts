import { prisma } from "@/server/platform/db/prisma";
import { extractDomain } from "@/lib/email-address";

export interface EligibilityResult {
  eligible: boolean;
  reason?: "SUPPRESSED" | "ALREADY_CONTACTED" | "ALREADY_SENT_IN_CAMPAIGN" | "INVALID_EMAIL";
  details?: string;
}

export async function checkRecipientEligibility(params: {
  userId: string;
  campaignId: string;
  emailNormalized: string;
  isFollowUp?: boolean;
}): Promise<EligibilityResult> {
  const { userId, campaignId, emailNormalized, isFollowUp = false } = params;

  if (!emailNormalized || !emailNormalized.includes("@")) {
    return { eligible: false, reason: "INVALID_EMAIL", details: "Recipient email is malformed" };
  }

  const domain = extractDomain(emailNormalized);

  // 1. Check suppression list (email or whole domain)
  const suppression = await prisma.suppressionEntry.findFirst({
    where: {
      userId,
      OR: [
        { emailNormalized },
        ...(domain ? [{ domain }] : []),
      ],
    },
  });

  if (suppression) {
    return {
      eligible: false,
      reason: "SUPPRESSED",
      details: `Recipient is on suppression list (Reason: ${suppression.reason})`,
    };
  }

  // 2. Check global ContactLedger (unless campaign is an authorized follow-up)
  if (!isFollowUp) {
    const contacted = await prisma.contactLedger.findUnique({
      where: {
        userId_emailNormalized: {
          userId,
          emailNormalized,
        },
      },
    });

    if (contacted) {
      return {
        eligible: false,
        reason: "ALREADY_CONTACTED",
        details: `Recipient was previously contacted on ${contacted.lastContactedAt.toISOString().slice(0, 10)}`,
      };
    }
  }

  // 3. Check within this campaign
  const campaignLead = await prisma.campaignLead.findFirst({
    where: {
      campaignId,
      emailNormalized,
    },
    select: { emailStatus: true },
  });

  if (campaignLead && campaignLead.emailStatus === "SENT") {
    return {
      eligible: false,
      reason: "ALREADY_SENT_IN_CAMPAIGN",
      details: "Email has already been sent to this recipient in this campaign",
    };
  }

  return { eligible: true };
}
