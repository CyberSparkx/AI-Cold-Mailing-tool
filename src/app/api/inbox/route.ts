import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateQuery } from "@/server/platform/http/with-validation";
import { inboxService } from "@/server/modules/inbox/inbox.service";
import { listInboxQuerySchema } from "@/server/modules/inbox/inbox.schemas";

// GET /api/inbox - List inbox messages & opportunities
export const GET = createAuthenticatedHandler(async (req, { user }) => {
  const query = validateQuery(req, listInboxQuerySchema);
  return inboxService.listMessages(user.id, query);
});
