import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { campaignService } from "@/server/modules/campaigns/campaign.service";
import { campaignRepository } from "@/server/modules/campaigns/campaign.repository";

// GET /api/campaigns/[id] - Get campaign details
export const GET = createAuthenticatedHandler(async (_req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return campaignService.getCampaign(user.id, id);
});

// DELETE /api/campaigns/[id] - Delete a campaign
export const DELETE = createAuthenticatedHandler(async (_req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return campaignRepository.delete(user.id, id);
});
