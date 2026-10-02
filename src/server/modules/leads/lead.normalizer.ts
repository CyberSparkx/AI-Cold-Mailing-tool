import "server-only";
import { RawLead } from "./providers/provider.interface";
import { normalizeEmail, isValidEmail, isRoleAccount } from "@/lib/email-address";

export interface NormalizedLeadData extends RawLead {
  websiteDomain?: string;
  emailNormalized?: string;
  emailIsRole?: boolean;
  phoneE164?: string;
  dedupeKey: string;
}

export function extractDomainFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function normalizePhoneNumber(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Clean non-digit characters except leading plus
  const cleaned = phone.replace(/[^\d+]/g, "").trim();
  if (cleaned.length < 7) return undefined;
  return cleaned;
}

export function normalizeLead(lead: RawLead): NormalizedLeadData {
  const websiteDomain = extractDomainFromUrl(lead.website);
  const emailValid = lead.email ? isValidEmail(lead.email) : false;
  const emailNormalized = emailValid && lead.email ? normalizeEmail(lead.email) : undefined;
  const emailIsRole = emailNormalized ? isRoleAccount(emailNormalized) : undefined;
  const phoneE164 = normalizePhoneNumber(lead.phone);

  // Generate dedupeKey: domain || email || phone || hash(businessName + postalCode)
  let dedupeKey = "";
  if (websiteDomain) {
    dedupeKey = `dom:${websiteDomain}`;
  } else if (emailNormalized) {
    dedupeKey = `em:${emailNormalized}`;
  } else if (phoneE164) {
    dedupeKey = `ph:${phoneE164}`;
  } else {
    const namePart = lead.businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cityPart = (lead.city || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    dedupeKey = `geo:${namePart}_${cityPart}`;
  }

  return {
    ...lead,
    websiteDomain,
    email: emailNormalized || lead.email,
    emailNormalized,
    emailIsRole,
    phoneE164,
    dedupeKey,
  };
}
