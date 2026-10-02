import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody } from "@/server/platform/http/with-validation";
import { leadService } from "@/server/modules/leads/lead.service";
import { searchLeadsSchema } from "@/server/modules/leads/lead.schemas";

// POST /api/leads/search - Search leads via provider
export const POST = createAuthenticatedHandler(async (req) => {
  const body = await validateBody(req, searchLeadsSchema);
  return leadService.searchLeads(body);
});
