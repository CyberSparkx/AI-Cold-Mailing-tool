import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { sendService } from "@/server/modules/campaigns/send.service";

// POST /api/campaigns/[id]/test-send - Dispatch 1 test email to user's authenticated address
export const POST = createAuthenticatedHandler(async (_req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return sendService.sendTestEmail(user.id, id);
});
