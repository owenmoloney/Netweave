import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createDemoNodesForUser, createSelfNodeForUser } from '../src/services/graphService.js';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@netweave.app';
  const password = 'password123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed user already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const selfNode = await createSelfNodeForUser(user.id, email);
  await createDemoNodesForUser(user.id, selfNode.id);

  console.log('Seed complete. Login with:', email, '/', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
