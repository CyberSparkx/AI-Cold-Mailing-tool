import { NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateQuery } from "@/server/platform/http/with-validation";
import { leadService } from "@/server/modules/leads/lead.service";
import { listLeadsQuerySchema } from "@/server/modules/leads/lead.schemas";

// GET /api/leads/export - Download leads as CSV
export const GET = createAuthenticatedHandler(async (req, { user }) => {
  const query = validateQuery(req, listLeadsQuerySchema);
  const csvData = await leadService.exportCsv(user.id, query);

  const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvData, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
