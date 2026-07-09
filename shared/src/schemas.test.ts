import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  PersonCreateSchema,
  CompanyCreateSchema,
  EdgeCreateSchema,
  NodePositionSchema,
} from './schemas';

describe('RegisterSchema', () => {
  it('accepts valid input', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('PersonCreateSchema', () => {
  it('accepts valid person', () => {
    const result = PersonCreateSchema.safeParse({
      type: 'PERSON',
      fullName: 'Jane Doe',
      jobTitle: 'Engineer',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing fullName', () => {
    const result = PersonCreateSchema.safeParse({ type: 'PERSON', fullName: '' });
    expect(result.success).toBe(false);
  });
});

describe('CompanyCreateSchema', () => {
  it('accepts valid company', () => {
    const result = CompanyCreateSchema.safeParse({
      type: 'COMPANY',
      companyName: 'Acme Corp',
    });
    expect(result.success).toBe(true);
  });
});

describe('EdgeCreateSchema', () => {
  it('accepts valid edge', () => {
    const result = EdgeCreateSchema.safeParse({
      sourceId: '550e8400-e29b-41d4-a716-446655440000',
      targetId: '550e8400-e29b-41d4-a716-446655440001',
      relationshipType: 'colleague',
      strength: 4,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = EdgeCreateSchema.safeParse({
      sourceId: 'not-a-uuid',
      targetId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(false);
  });
});

describe('NodePositionSchema', () => {
  it('accepts coordinates', () => {
    const result = NodePositionSchema.safeParse({ x: 100, y: 200 });
    expect(result.success).toBe(true);
  });
});

describe('LoginSchema', () => {
  it('requires password', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });
});
