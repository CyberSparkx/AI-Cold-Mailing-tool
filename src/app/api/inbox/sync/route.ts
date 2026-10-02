import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { inboxService } from "@/server/modules/inbox/inbox.service";

// POST /api/inbox/sync - Sync latest relevant emails from Gmail
export const POST = createAuthenticatedHandler(async (_req, { user }) => {
  return inboxService.syncGmailInbox(user.id);
});
