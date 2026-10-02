import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody } from "@/server/platform/http/with-validation";
import { leadService } from "@/server/modules/leads/lead.service";
import { updateLeadSchema } from "@/server/modules/leads/lead.schemas";

// PATCH /api/leads/[id] - Update lead details
export const PATCH = createAuthenticatedHandler(async (req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const body = await validateBody(req, updateLeadSchema);
  return leadService.updateLead(user.id, id, body);
});

// DELETE /api/leads/[id] - Delete a lead
export const DELETE = createAuthenticatedHandler(async (req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return leadService.deleteLead(user.id, id);
});
