import "server-only";
import { LeadSourceProvider, LeadSearchParams, LeadSearchResult, RawLead } from "./provider.interface";

export class CsvProvider implements LeadSourceProvider {
  readonly key = "csv";
  readonly name = "CSV / File Import";
  readonly requiresApiKey = false;

  isConfigured(): boolean {
    return true;
  }

  async search(_params: LeadSearchParams): Promise<LeadSearchResult> {
    return {
      leads: [],
      totalFound: 0,
      provider: this.key,
    };
  }

  parseCsvContent(csvContent: string): RawLead[] {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const leads: RawLead[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length === 0) continue;

      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (values[index]) {
          record[header] = values[index].trim();
        }
      });

      const businessName =
        record["businessname"] ||
        record["business_name"] ||
        record["company"] ||
        record["name"] ||
        record["organization"];

      if (!businessName) continue;

      const email = record["email"] || record["email_address"] || record["contact_email"];
      const website = record["website"] || record["url"] || record["domain"];
      const phone = record["phone"] || record["telephone"] || record["mobile"];
      const city = record["city"] || record["location"];
      const category = record["category"] || record["industry"];

      leads.push({
        businessName,
        category,
        website: website ? (website.startsWith("http") ? website : `https://${website}`) : undefined,
        email: email?.toLowerCase().trim(),
        phone: phone?.trim(),
        city,
        source: this.key,
        externalId: `csv-row-${i}`,
      });
    }

    return leads;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, ""));
    return result;
  }
}
