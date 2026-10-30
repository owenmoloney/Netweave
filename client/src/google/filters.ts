import { HOME_COMPANY_NAME, isHomeCompanyEmail } from './homeCompany';

const JUNK_LOCAL_PART =
  /^(no-?reply|do-?not-?reply|donotreply|noreply|notifications?|mailer-daemon|bounce|calendar-notification|invites?)$/i;

const RESOURCE_DOMAINS = new Set([
  'resource.calendar.google.com',
  'group.calendar.google.com',
  'calendar.google.com',
]);

const CONSUMER_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'gmx.com',
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseEmail(raw: string): string | null {
  const trimmed = raw.trim();
  const angle = trimmed.match(/<([^>]+)>/);
  const candidate = normalizeEmail(angle ? angle[1] : trimmed);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return null;
  return candidate;
}

export function emailDomain(email: string): string {
  return normalizeEmail(email).split('@')[1] ?? '';
}

export function emailLocalPart(email: string): string {
  return normalizeEmail(email).split('@')[0] ?? '';
}

export function isJunkEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const local = emailLocalPart(normalized);
  const domain = emailDomain(normalized);
  if (!normalized.includes('@')) return true;
  if (RESOURCE_DOMAINS.has(domain)) return true;
  if (JUNK_LOCAL_PART.test(local)) return true;
  if (local.includes('unsubscribe') || local.includes('newsletter')) return true;
  return false;
}

export function isOwnEmail(email: string, selfEmails: Set<string>): boolean {
  return selfEmails.has(normalizeEmail(email));
}

export function isConsumerDomain(email: string): boolean {
  return CONSUMER_DOMAINS.has(emailDomain(email));
}

export function companyNameFromEmail(email: string): string | null {
  if (isHomeCompanyEmail(email)) return HOME_COMPANY_NAME;
  if (isConsumerDomain(email) || isJunkEmail(email)) return null;
  const domain = emailDomain(email);
  const slug = domain.split('.')[0];
  if (!slug) return null;
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function displayNameFromParts(displayName: string | undefined, email: string): string {
  const cleaned = displayName?.trim();
  if (cleaned && !cleaned.includes('@')) return cleaned;
  const local = emailLocalPart(email).replace(/[._-]+/g, ' ');
  return local
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
