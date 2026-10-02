import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { campaignService } from "@/server/modules/campaigns/campaign.service";

// GET /api/campaigns/[id]/recipients - List recipients with pagination
export const GET = createAuthenticatedHandler(async (req, { user, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  return campaignService.getRecipients(user.id, id, page);
});
