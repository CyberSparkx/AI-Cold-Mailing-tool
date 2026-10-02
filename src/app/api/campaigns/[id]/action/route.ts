import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody } from "@/server/platform/http/with-validation";
import { campaignService } from "@/server/modules/campaigns/campaign.service";
import { campaignActionSchema } from "@/server/modules/campaigns/campaign.schemas";

// POST /api/campaigns/[id]/action - Start, pause, resume, cancel
export const POST = createAuthenticatedHandler(async (req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const body = await validateBody(req, campaignActionSchema);
  return campaignService.handleAction(user.id, id, body);
});
