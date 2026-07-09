// Test environment defaults
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-key-for-vitest-only';
