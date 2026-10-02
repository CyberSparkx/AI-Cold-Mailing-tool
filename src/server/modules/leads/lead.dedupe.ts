import "server-only";
import { NormalizedLeadData } from "./lead.normalizer";
import { prisma } from "@/server/platform/db/prisma";

export async function dedupeAgainstDatabase(
  userId: string,
  leads: NormalizedLeadData[]
): Promise<{
  uniqueLeads: NormalizedLeadData[];
  duplicateCount: number;
}> {
  if (leads.length === 0) {
    return { uniqueLeads: [], duplicateCount: 0 };
  }

  // 1. In-batch deduplication by dedupeKey
  const seenKeys = new Set<string>();
  const inBatchUnique: NormalizedLeadData[] = [];
  let inBatchDuplicates = 0;

  for (const lead of leads) {
    if (seenKeys.has(lead.dedupeKey)) {
      inBatchDuplicates++;
      continue;
    }
    seenKeys.add(lead.dedupeKey);
    inBatchUnique.push(lead);
  }

  // 2. Query MongoDB for existing dedupeKeys belonging to this user
  const dedupeKeys = inBatchUnique.map((l) => l.dedupeKey);
  const existingLeads = await prisma.lead.findMany({
    where: {
      userId,
      dedupeKey: { in: dedupeKeys },
    },
    select: { dedupeKey: true },
  });

  const existingKeySet = new Set(existingLeads.map((l) => l.dedupeKey));
  const finalUnique = inBatchUnique.filter((l) => !existingKeySet.has(l.dedupeKey));
  const dbDuplicates = inBatchUnique.length - finalUnique.length;

  return {
    uniqueLeads: finalUnique,
    duplicateCount: inBatchDuplicates + dbDuplicates,
  };
}
