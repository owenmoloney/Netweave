import type { GraphResponse } from '@netweave/shared';
import { prisma } from '../prisma.js';
import { serializeEdge, serializeNode } from '../utils/serialize.js';

export async function getGraphForUser(userId: string): Promise<GraphResponse> {
  const [nodes, edges] = await Promise.all([
    prisma.node.findMany({ where: { userId } }),
    prisma.edge.findMany({ where: { userId } }),
  ]);

  return {
    nodes: nodes.map(serializeNode),
    edges: edges.map(serializeEdge),
  };
}

export async function createSelfNodeForUser(userId: string, email: string) {
  const initials = email.slice(0, 2).toUpperCase();

  return prisma.node.create({
    data: {
      userId,
      type: 'SELF',
      fullName: 'You',
      posX: 0,
      posY: 0,
      notes: `Self node for ${initials}`,
    },
  });
}

export async function createDemoNodesForUser(userId: string, selfNodeId: string) {
  const company = await prisma.node.create({
    data: {
      userId,
      type: 'COMPANY',
      companyName: 'Acme Corp',
      industry: 'Technology',
      location: 'San Francisco, CA',
      posX: 150,
      posY: -80,
    },
  });

  const person = await prisma.node.create({
    data: {
      userId,
      type: 'PERSON',
      fullName: 'Jane Smith',
      jobTitle: 'Product Manager',
      companyId: company.id,
      posX: 200,
      posY: 50,
    },
  });

  await prisma.edge.createMany({
    data: [
      {
        userId,
        sourceId: selfNodeId,
        targetId: person.id,
        relationshipType: 'colleague',
        strength: 4,
        howMet: 'Met at a conference',
      },
      {
        userId,
        sourceId: selfNodeId,
        targetId: company.id,
        relationshipType: 'client',
        strength: 3,
      },
      {
        userId,
        sourceId: person.id,
        targetId: company.id,
        relationshipType: 'colleague',
        strength: 5,
      },
    ],
  });
}
