import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody } from "@/server/platform/http/with-validation";
import { prisma } from "@/server/platform/db/prisma";
import { suppressionEntrySchema } from "@/server/modules/campaigns/campaign.schemas";
import { normalizeEmail, extractDomain } from "@/lib/email-address";
import { AppError } from "@/server/platform/errors/app-error";

// GET /api/suppression - List suppression entries
export const GET = createAuthenticatedHandler(async (_req, { user }) => {
  return prisma.suppressionEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
});

// POST /api/suppression - Add email or domain to suppression list
export const POST = createAuthenticatedHandler(async (req, { user }) => {
  const body = await validateBody(req, suppressionEntrySchema);

  if (!body.email && !body.domain) {
    throw AppError.badRequest("Either email or domain is required");
  }

  const emailNormalized = body.email ? normalizeEmail(body.email) : undefined;
  const domain = body.domain?.toLowerCase().trim() || (emailNormalized ? extractDomain(emailNormalized) : undefined);

  const entry = await prisma.suppressionEntry.upsert({
    where: {
      userId_emailNormalized: {
        userId: user.id,
        emailNormalized: emailNormalized || "",
      },
    },
    update: {
      domain,
      reason: body.reason,
      note: body.note,
    },
    create: {
      userId: user.id,
      emailNormalized,
      domain,
      reason: body.reason,
      note: body.note,
    },
  });

  return { success: true, entry };
});

// DELETE /api/suppression - Remove an entry
export const DELETE = createAuthenticatedHandler(async (req, { user }) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) throw AppError.badRequest("Entry ID is required");

  await prisma.suppressionEntry.deleteMany({
    where: { id, userId: user.id },
  });

  return { success: true };
});
