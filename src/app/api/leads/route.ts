import { NextRequest } from "next/server";
import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody, validateQuery } from "@/server/platform/http/with-validation";
import { leadService } from "@/server/modules/leads/lead.service";
import { listLeadsQuerySchema, saveLeadsSchema } from "@/server/modules/leads/lead.schemas";

// GET /api/leads - List leads with filtering and pagination
export const GET = createAuthenticatedHandler(async (req, { user }) => {
  const query = validateQuery(req, listLeadsQuerySchema);
  return leadService.listLeads(user.id, query);
});

// POST /api/leads - Save selected leads with deduplication
export const POST = createAuthenticatedHandler(async (req, { user }) => {
  const body = await validateBody(req, saveLeadsSchema);
  return leadService.saveLeads(user.id, body);
});
