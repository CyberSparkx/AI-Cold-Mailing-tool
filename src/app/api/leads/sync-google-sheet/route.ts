import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody } from "@/server/platform/http/with-validation";
import { googleSheetsService } from "@/server/integrations/google/sheets";
import { leadRepository } from "@/server/modules/leads/lead.repository";
import { prisma } from "@/server/platform/db/prisma";
import { SheetPurpose } from "@prisma/client";
import { z } from "zod";

const syncSheetSchema = z.object({
  title: z.string().min(1).default(`Leads Export ${new Date().toISOString().slice(0, 10)}`),
});

// POST /api/leads/sync-google-sheet - Create and sync leads to a Google Sheet
export const POST = createAuthenticatedHandler(async (req, { user }) => {
  const body = await validateBody(req, syncSheetSchema);

  // 1. Fetch leads
  const leads = await leadRepository.getAllForExport(user.id);
  if (leads.length === 0) {
    return { success: false, message: "No leads to export" };
  }

  // 2. Create Spreadsheet
  const { spreadsheetId, spreadsheetUrl } = await googleSheetsService.createSpreadsheet(
    user.id,
    body.title
  );

  // 3. Format rows
  const rows = leads.map((lead) => [
    lead.id,
    lead.businessName,
    lead.category || "",
    lead.website || "",
    lead.email || "",
    lead.phone || "",
    lead.city || "",
    lead.country || "",
    "NOT_SENT", // Initial status
    "",         // Last contacted
    "",         // Campaign ID
    "",         // Message ID
  ]);

  // 4. Batch append rows
  const appendResult = await googleSheetsService.appendLeadRows(
    user.id,
    spreadsheetId,
    "Leads",
    rows
  );

  // 5. Save SheetLink record in DB
  await prisma.sheetLink.create({
    data: {
      userId: user.id,
      spreadsheetId,
      sheetTitle: "Leads",
      purpose: SheetPurpose.LEAD_EXPORT,
      columnMap: {
        leadId: "A",
        businessName: "B",
        email: "E",
        status: "I",
      },
      lastSyncedAt: new Date(),
    },
  });

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    rowsCount: appendResult.updatedRows,
    message: `Exported ${leads.length} leads to Google Sheet successfully`,
  };
});
