import type { Node } from '@netweave/shared';

function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

export const HOME_COMPANY_NAME = 'Booz Allen Hamilton';

const HOME_COMPANY_ALIASES = new Set([
  'bah',
  'booz allen',
  'booz allen hamilton',
  'boozallen',
  'boozallen.com',
  'bah.com',
]);

const HOME_COMPANY_DOMAINS = new Set(['boozallen.com', 'bah.com']);

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/[.,]+$/g, '');
}

export function isHomeCompanyName(name: string | null | undefined): boolean {
  if (!name) return false;
  return HOME_COMPANY_ALIASES.has(normalizeAlias(name));
}

export function isHomeCompanyEmail(email: string): boolean {
  return HOME_COMPANY_DOMAINS.has(emailDomain(email));
}

export function findHomeCompany(nodes: Node[]): Node | undefined {
  const matches = nodes.filter(
    (node) => node.type === 'COMPANY' && isHomeCompanyName(node.companyName),
  );
  return matches.find((node) => node.companyName === HOME_COMPANY_NAME) ?? matches[0];
}
