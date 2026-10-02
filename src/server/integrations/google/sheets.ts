import "server-only";
import { google } from "googleapis";
import { getValidGoogleClient } from "./token-store";
import { GoogleService } from "@prisma/client";
import { AppError } from "@/server/platform/errors/app-error";
import { logger } from "@/server/platform/logger/logger";

export class GoogleSheetsService {
  private async getSheetsClient(userId: string) {
    const { oauth2Client } = await getValidGoogleClient(userId, GoogleService.SHEETS);
    return google.sheets({ version: "v4", auth: oauth2Client });
  }

  async createSpreadsheet(userId: string, title: string) {
    const sheets = await this.getSheetsClient(userId);

    try {
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title },
          sheets: [
            {
              properties: {
                title: "Leads",
                gridProperties: { rowCount: 1000, columnCount: 12 },
              },
            },
          ],
        },
      });

      const spreadsheetId = response.data.spreadsheetId;
      if (!spreadsheetId) {
        throw new Error("Spreadsheet ID was not returned by Google");
      }

      // Add standard column headers
      const headers = [
        "Lead ID",
        "Business Name",
        "Category",
        "Website",
        "Email",
        "Phone",
        "City",
        "Country",
        "Email Status",
        "Last Contacted",
        "Campaign ID",
        "Message ID",
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Leads!A1:L1",
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });

      return {
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      };
    } catch (err: any) {
      logger.error({ err, userId }, "Failed to create Google Spreadsheet");
      throw AppError.badRequest(err.message || "Failed to create Google Sheet");
    }
  }

  async appendLeadRows(
    userId: string,
    spreadsheetId: string,
    sheetTitle: string,
    rows: (string | number | null | undefined)[][]
  ) {
    if (rows.length === 0) return { updatedRows: 0 };
    const sheets = await this.getSheetsClient(userId);

    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetTitle}!A:L`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: rows.map((r) => r.map((c) => (c === undefined || c === null ? "" : String(c)))),
        },
      });

      return {
        updatedRows: response.data.updates?.updatedRows || 0,
      };
    } catch (err: any) {
      logger.error({ err, spreadsheetId }, "Failed to append rows to Google Sheet");
      throw AppError.badRequest(err.message || "Failed to append rows to Google Sheet");
    }
  }

  async batchUpdateRowStatuses(
    userId: string,
    spreadsheetId: string,
    sheetTitle: string,
    updates: { rowIndex: number; status: string; lastContacted?: string; messageId?: string }[]
  ) {
    if (updates.length === 0) return;
    const sheets = await this.getSheetsClient(userId);

    const data = updates.map((u) => ({
      range: `${sheetTitle}!I${u.rowIndex}:L${u.rowIndex}`,
      values: [[u.status, u.lastContacted || new Date().toISOString(), "", u.messageId || ""]],
    }));

    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "RAW",
          data,
        },
      });
    } catch (err: any) {
      logger.error({ err, spreadsheetId }, "Failed to batch update row statuses in Google Sheet");
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
