import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeValue } from './sanitize.js';

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
    expect(sanitizeString('<b>Bold</b> text')).toBe('Bold text');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });
});

describe('sanitizeValue', () => {
  it('sanitizes nested objects', () => {
    const result = sanitizeValue({
      fullName: '<img src=x onerror=alert(1)>Jane',
      nested: { notes: '<p>note</p>' },
    }) as Record<string, unknown>;

    expect(result.fullName).toBe('Jane');
    expect((result.nested as Record<string, string>).notes).toBe('note');
  });
});
