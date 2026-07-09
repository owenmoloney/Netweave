import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');

beforeAll(() => {
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.JWT_SECRET = 'test-secret-key-for-vitest-only';
  execSync('npx prisma migrate deploy', {
    cwd: serverRoot,
    env: { ...process.env },
    stdio: 'pipe',
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();
  await prisma.user.deleteMany();
});

async function registerAndGetToken(email = 'test@example.com') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'password123' });
  return res.body.token as string;
}

describe('API integration', () => {
  it('registers, logs in, and accesses protected route', async () => {
    const email = 'user1@example.com';
    const register = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123' });
    expect(register.status).toBe(201);
    expect(register.body.token).toBeTruthy();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'password123' });
    expect(login.status).toBe(200);

    const graph = await request(app)
      .get('/api/v1/graph')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(graph.status).toBe(200);
    expect(graph.body.nodes.length).toBeGreaterThan(0);
  });

  it('returns 401 with bad token', async () => {
    const res = await request(app)
      .get('/api/v1/graph')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  it('returns 404 for unknown API route', async () => {
    const token = await registerAndGetToken('404@example.com');
    const res = await request(app)
      .get('/api/v1/unknown-route')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('full node lifecycle', async () => {
    const token = await registerAndGetToken('lifecycle@example.com');

    const created = await request(app)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'COMPANY', companyName: 'Test Co' });
    expect(created.status).toBe(201);

    const nodeId = created.body.id;
    const fetched = await request(app)
      .get(`/api/v1/nodes/${nodeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.body.companyName).toBe('Test Co');

    const updated = await request(app)
      .patch(`/api/v1/nodes/${nodeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ industry: 'Tech' });
    expect(updated.body.industry).toBe('Tech');

    const deleted = await request(app)
      .delete(`/api/v1/nodes/${nodeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);
  });

  it('sanitizes HTML in node input', async () => {
    const token = await registerAndGetToken('sanitize@example.com');
    const res = await request(app)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'PERSON', fullName: '<b>Safe</b> Name' });
    expect(res.status).toBe(201);
    expect(res.body.fullName).toBe('Safe Name');
  });

  it('deleting person removes connected edges', async () => {
    const token = await registerAndGetToken('cascade@example.com');

    const company = await request(app)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'COMPANY', companyName: 'Cascade Inc' });

    const person = await request(app)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'PERSON', fullName: 'Dana', companyId: company.body.id });

    const graphBefore = await request(app)
      .get('/api/v1/graph')
      .set('Authorization', `Bearer ${token}`);
    expect(graphBefore.body.edges.length).toBeGreaterThan(0);

    await request(app)
      .delete(`/api/v1/nodes/${person.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    const graphAfter = await request(app)
      .get('/api/v1/graph')
      .set('Authorization', `Bearer ${token}`);
    const personEdges = graphAfter.body.edges.filter(
      (e: { sourceId: string; targetId: string }) =>
        e.sourceId === person.body.id || e.targetId === person.body.id,
    );
    expect(personEdges).toHaveLength(0);
  });
});

describe('graphService', () => {
  it('assembles graph response correctly', async () => {
    const token = await registerAndGetToken('graph@example.com');
    const res = await request(app)
      .get('/api/v1/graph')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveProperty('nodes');
    expect(res.body).toHaveProperty('edges');
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(res.body.nodes.some((n: { type: string }) => n.type === 'SELF')).toBe(true);
  });
});
