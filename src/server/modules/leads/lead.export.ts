
export interface ExportableLead {
  businessName: string;
  category?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  status: string;
  emailStatus: string;
  createdAt: Date | string;
}

export function exportLeadsToCsv(leads: ExportableLead[]): string {
  const headers = [
    "Business Name",
    "Category",
    "Website",
    "Email",
    "Phone",
    "Address",
    "City",
    "Country",
    "Status",
    "Email Status",
    "Date Added",
  ];

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((lead) => [
    escapeCell(lead.businessName),
    escapeCell(lead.category),
    escapeCell(lead.website),
    escapeCell(lead.email),
    escapeCell(lead.phone),
    escapeCell(lead.address),
    escapeCell(lead.city),
    escapeCell(lead.country),
    escapeCell(lead.status),
    escapeCell(lead.emailStatus),
    escapeCell(lead.createdAt instanceof Date ? lead.createdAt.toISOString() : lead.createdAt),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
