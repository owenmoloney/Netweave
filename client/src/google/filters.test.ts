import { describe, expect, it } from 'vitest';
import {
  companyNameFromEmail,
  displayNameFromParts,
  isJunkEmail,
  isOwnEmail,
  normalizeEmail,
  parseEmail,
} from './filters';

describe('google filters', () => {
  it('strips display-name wrappers and lowercases', () => {
    expect(parseEmail('Jane Smith <Jane.Smith@Acme.COM>')).toBe('jane.smith@acme.com');
    expect(normalizeEmail('  A@B.COM ')).toBe('a@b.com');
  });

  it('drops noreply, rooms, and notification senders', () => {
    expect(isJunkEmail('noreply@acme.com')).toBe(true);
    expect(isJunkEmail('no-reply@acme.com')).toBe(true);
    expect(isJunkEmail('notifications@linkedin.com')).toBe(true);
    expect(isJunkEmail('room@resource.calendar.google.com')).toBe(true);
    expect(isJunkEmail('jane@acme.com')).toBe(false);
  });

  it('recognizes the user aliases', () => {
    const self = new Set(['owen@gmail.com']);
    expect(isOwnEmail('Owen@Gmail.com', self)).toBe(true);
    expect(isOwnEmail('other@gmail.com', self)).toBe(false);
  });

  it('infers a company only for work domains', () => {
    expect(companyNameFromEmail('jane@acme.com')).toBe('Acme');
    expect(companyNameFromEmail('jane@gmail.com')).toBeNull();
    expect(companyNameFromEmail('noreply@acme.com')).toBeNull();
    expect(companyNameFromEmail('pat@boozallen.com')).toBe('Booz Allen Hamilton');
    expect(companyNameFromEmail('pat@bah.com')).toBe('Booz Allen Hamilton');
  });

  it('prefers a human display name over the local part', () => {
    expect(displayNameFromParts('Jane Smith', 'jane.smith@acme.com')).toBe('Jane Smith');
    expect(displayNameFromParts(undefined, 'jane.smith@acme.com')).toBe('Jane Smith');
  });
});
