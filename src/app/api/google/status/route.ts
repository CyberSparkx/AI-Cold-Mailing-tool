import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { getGoogleConnectionStatus } from "@/server/integrations/google/token-store";

// GET /api/google/status - Return connection states for all services
export const GET = createAuthenticatedHandler(async (_req, { user }) => {
  return getGoogleConnectionStatus(user.id);
});
