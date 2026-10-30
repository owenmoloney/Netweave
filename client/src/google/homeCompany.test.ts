import { describe, expect, it } from 'vitest';
import type { Node } from '@netweave/shared';
import {
  HOME_COMPANY_NAME,
  findHomeCompany,
  isHomeCompanyEmail,
  isHomeCompanyName,
} from './homeCompany';

function company(id: string, companyName: string): Node {
  return {
    id,
    userId: 'user-1',
    type: 'COMPANY',
    notes: null,
    posX: 0,
    posY: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fullName: null,
    jobTitle: null,
    email: null,
    linkedInUrl: null,
    companyId: null,
    companyName,
    industry: null,
    location: null,
    website: null,
  };
}

describe('home company aliases', () => {
  it('matches Booz Allen names and domains', () => {
    expect(isHomeCompanyName('BAH')).toBe(true);
    expect(isHomeCompanyName('Booz Allen')).toBe(true);
    expect(isHomeCompanyName('Booz Allen Hamilton')).toBe(true);
    expect(isHomeCompanyName('Boozallen')).toBe(true);
    expect(isHomeCompanyName('boozallen.com')).toBe(true);
    expect(isHomeCompanyName('Acme')).toBe(false);
    expect(isHomeCompanyEmail('pat@boozallen.com')).toBe(true);
    expect(isHomeCompanyEmail('pat@bah.com')).toBe(true);
    expect(isHomeCompanyEmail('pat@gmail.com')).toBe(false);
  });

  it('prefers the canonical Booz Allen Hamilton node', () => {
    const home = findHomeCompany([
      company('stub', 'Boozallen'),
      company('canonical', HOME_COMPANY_NAME),
    ]);
    expect(home?.id).toBe('canonical');
  });
});
