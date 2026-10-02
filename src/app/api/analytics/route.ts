import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { AnalyticsService } from "@/server/modules/analytics/analytics.service";

// GET /api/analytics - Get comprehensive analytics summary
export const GET = createAuthenticatedHandler(async (_req, { user }) => {
  const metrics = await AnalyticsService.getOverviewMetrics(user.id);
  return metrics;
});
