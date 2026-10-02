import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { prisma } from "@/server/platform/db/prisma";
import { validateBody } from "@/server/platform/http/with-validation";
import { z } from "zod";

const disconnectSchema = z.object({
  service: z.enum(["SHEETS", "GMAIL_SEND", "GMAIL_READ", "ALL"]).default("ALL"),
});

// POST /api/google/disconnect - Revoke or remove local tokens
export const POST = createAuthenticatedHandler(async (req, { user }) => {
  const body = await validateBody(req, disconnectSchema);

  if (body.service === "ALL") {
    await prisma.googleAccount.deleteMany({
      where: { userId: user.id },
    });
  } else {
    const account = await prisma.googleAccount.findFirst({
      where: { userId: user.id },
    });

    if (account) {
      const updatedServices = account.services.filter((s) => s !== body.service);
      await prisma.googleAccount.update({
        where: { id: account.id },
        data: {
          services: updatedServices,
        },
      });
    }
  }

  return { success: true, message: `Disconnected ${body.service}` };
});
