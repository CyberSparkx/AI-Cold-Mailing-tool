import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody } from "@/server/platform/http/with-validation";
import { inboxService } from "@/server/modules/inbox/inbox.service";
import { updateInboxMessageSchema } from "@/server/modules/inbox/inbox.schemas";

// PATCH /api/inbox/[id] - Update opportunity status or manual category correction
export const PATCH = createAuthenticatedHandler(async (req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const body = await validateBody(req, updateInboxMessageSchema);
  return inboxService.updateMessage(user.id, id, body);
});
