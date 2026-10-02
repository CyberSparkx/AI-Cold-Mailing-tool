import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { campaignService } from "@/server/modules/campaigns/campaign.service";

// GET /api/campaigns/[id]/preview - Render safe HTML preview
export const GET = createAuthenticatedHandler(async (req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const recipientId = req.nextUrl.searchParams.get("recipientId") || undefined;
  return campaignService.previewEmail(user.id, id, recipientId);
});
