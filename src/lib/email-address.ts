const ROLE_BASED_PREFIXES = new Set([
  'admin',
  'billing',
  'compliance',
  'contact',
  'editor',
  'enquiries',
  'help',
  'hello',
  'hi',
  'info',
  'inquiries',
  'jobs',
  'marketing',
  'media',
  'news',
  'no-reply',
  'noreply',
  'office',
  'orders',
  'press',
  'privacy',
  'sales',
  'security',
  'service',
  'support',
  'team',
]);

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function isRoleAccount(email: string): boolean {
  const normalized = normalizeEmail(email);
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const localPart = parts[0];
  return ROLE_BASED_PREFIXES.has(localPart);
}

export function extractDomain(email: string): string | null {
  const normalized = normalizeEmail(email);
  const parts = normalized.split('@');
  return parts.length === 2 ? parts[1] : null;
}
