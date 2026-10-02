import "server-only";
import { providerRegistry } from "./providers/registry";
import { normalizeLead } from "./lead.normalizer";
import { dedupeAgainstDatabase } from "./lead.dedupe";
import { leadRepository } from "./lead.repository";
import { exportLeadsToCsv } from "./lead.export";
import { SearchLeadsInput, SaveLeadsInput, ListLeadsQuery, UpdateLeadInput } from "./lead.schemas";
import { RawLead } from "./providers/provider.interface";
import { AppError } from "@/server/platform/errors/app-error";
import { logger } from "@/server/platform/logger/logger";

export class LeadService {
  async searchLeads(input: SearchLeadsInput) {
    const provider = providerRegistry.get(input.provider);
    
    logger.info({ provider: input.provider, city: input.city, category: input.category }, "Searching leads");
    const result = await provider.search(input);

    // Normalize results
    const normalized = result.leads.map(normalizeLead);

    return {
      provider: result.provider,
      totalFound: result.totalFound,
      leads: normalized,
      estimatedCostUnits: result.estimatedCostUnits || 0,
    };
  }

  async saveLeads(userId: string, input: SaveLeadsInput) {
    // 1. Normalize
    const normalized = input.leads.map(normalizeLead);

    // 2. Dedupe against batch and database
    const { uniqueLeads, duplicateCount } = await dedupeAgainstDatabase(userId, normalized);

    if (uniqueLeads.length === 0) {
      return {
        savedCount: 0,
        duplicateCount,
        message: "All selected leads are already saved in your database",
      };
    }

    // 3. Persist
    const result = await leadRepository.saveMany(userId, uniqueLeads);

    logger.info({ userId, insertedCount: result.insertedCount, duplicateCount }, "Leads saved");

    return {
      savedCount: result.insertedCount,
      duplicateCount,
      message: `Successfully saved ${result.insertedCount} leads (${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} skipped)`,
    };
  }

  async listLeads(userId: string, query: ListLeadsQuery) {
    return leadRepository.list(userId, query);
  }

  async updateLead(userId: string, id: string, data: UpdateLeadInput) {
    const existing = await leadRepository.findById(userId, id);
    if (!existing) {
      throw AppError.notFound("Lead not found");
    }
    await leadRepository.update(userId, id, data);
    return { success: true };
  }

  async deleteLead(userId: string, id: string) {
    const existing = await leadRepository.findById(userId, id);
    if (!existing) {
      throw AppError.notFound("Lead not found");
    }
    await leadRepository.delete(userId, id);
    return { success: true };
  }

  async exportCsv(userId: string, query: Partial<ListLeadsQuery>): Promise<string> {
    const leads = await leadRepository.getAllForExport(userId, query);
    return exportLeadsToCsv(leads);
  }
}

export const leadService = new LeadService();
