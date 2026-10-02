import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody } from "@/server/platform/http/with-validation";
import { campaignService } from "@/server/modules/campaigns/campaign.service";
import { createCampaignSchema } from "@/server/modules/campaigns/campaign.schemas";

// GET /api/campaigns - List all campaigns
export const GET = createAuthenticatedHandler(async (_req, { user }) => {
  return campaignService.listCampaigns(user.id);
});

// POST /api/campaigns - Create a new campaign with recipient snapshots
export const POST = createAuthenticatedHandler(async (req, { user }) => {
  const body = await validateBody(req, createCampaignSchema);
  return campaignService.createCampaign(user.id, body);
});
