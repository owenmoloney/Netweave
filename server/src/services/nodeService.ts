import type { NodeCreateInput, NodeUpdateInput } from '@netweave/shared';
import type { NodeType } from '@prisma/client';
import { prisma } from '../prisma.js';
import { serializeNode } from '../utils/serialize.js';

function emptyToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  return value;
}

export async function getNodesForUser(userId: string) {
  const nodes = await prisma.node.findMany({ where: { userId } });
  return nodes.map(serializeNode);
}

export async function getNodeById(userId: string, nodeId: string) {
  const node = await prisma.node.findFirst({ where: { id: nodeId, userId } });
  if (!node) return null;
  return serializeNode(node);
}

async function getSelfNode(userId: string) {
  return prisma.node.findFirst({ where: { userId, type: 'SELF' } });
}

async function getDefaultPosition(userId: string, companyId?: string | null) {
  if (companyId) {
    const company = await prisma.node.findFirst({
      where: { id: companyId, userId, type: 'COMPANY' },
    });
    if (company) {
      return {
        posX: (company.posX ?? 0) + (Math.random() * 80 - 40),
        posY: (company.posY ?? 0) + (Math.random() * 80 - 40),
      };
    }
  }

  const self = await getSelfNode(userId);
  return {
    posX: (self?.posX ?? 0) + (Math.random() * 120 - 60) + 100,
    posY: (self?.posY ?? 0) + (Math.random() * 120 - 60),
  };
}

export async function createNode(userId: string, input: NodeCreateInput) {
  const position =
    input.posX !== undefined && input.posY !== undefined
      ? { posX: input.posX, posY: input.posY }
      : await getDefaultPosition(
          userId,
          input.type === 'PERSON' ? input.companyId : undefined,
        );

  if (input.type === 'PERSON' && input.companyId) {
    const company = await prisma.node.findFirst({
      where: { id: input.companyId, userId, type: 'COMPANY' },
    });
    if (!company) {
      throw new NodeServiceError('NOT_FOUND', 'Company not found');
    }
  }

  const node = await prisma.node.create({
    data: {
      userId,
      type: input.type as NodeType,
      fullName: input.type === 'PERSON' ? input.fullName : null,
      jobTitle: input.type === 'PERSON' ? emptyToNull(input.jobTitle) : null,
      companyId: input.type === 'PERSON' ? input.companyId ?? null : null,
      email: input.type === 'PERSON' ? emptyToNull(input.email) : null,
      linkedInUrl: input.type === 'PERSON' ? emptyToNull(input.linkedInUrl) : null,
      companyName: input.type === 'COMPANY' ? input.companyName : null,
      industry: input.type === 'COMPANY' ? emptyToNull(input.industry) : null,
      location: input.type === 'COMPANY' ? emptyToNull(input.location) : null,
      website: input.type === 'COMPANY' ? emptyToNull(input.website) : null,
      notes: emptyToNull(input.notes),
      posX: position.posX,
      posY: position.posY,
    },
  });

  if (input.type === 'PERSON' && input.companyId) {
    await prisma.edge.create({
      data: {
        userId,
        sourceId: node.id,
        targetId: input.companyId,
        relationshipType: 'colleague',
        strength: 3,
      },
    });
  }

  return serializeNode(node);
}

export async function updateNode(userId: string, nodeId: string, input: NodeUpdateInput) {
  const existing = await prisma.node.findFirst({ where: { id: nodeId, userId } });
  if (!existing) return null;
  if (existing.type === 'SELF') {
    throw new NodeServiceError('FORBIDDEN', 'Cannot edit the Self node');
  }

  if ('companyId' in input && input.companyId) {
    const company = await prisma.node.findFirst({
      where: { id: input.companyId, userId, type: 'COMPANY' },
    });
    if (!company) {
      throw new NodeServiceError('NOT_FOUND', 'Company not found');
    }
  }

  const data: Record<string, unknown> = {};

  if ('fullName' in input && input.fullName !== undefined) data.fullName = input.fullName;
  if ('jobTitle' in input) data.jobTitle = emptyToNull(input.jobTitle);
  if ('companyId' in input) data.companyId = input.companyId ?? null;
  if ('email' in input) data.email = emptyToNull(input.email);
  if ('linkedInUrl' in input) data.linkedInUrl = emptyToNull(input.linkedInUrl);
  if ('companyName' in input && input.companyName !== undefined) {
    data.companyName = input.companyName;
  }
  if ('industry' in input) data.industry = emptyToNull(input.industry);
  if ('location' in input) data.location = emptyToNull(input.location);
  if ('website' in input) data.website = emptyToNull(input.website);
  if ('notes' in input) data.notes = emptyToNull(input.notes);

  const updated = await prisma.node.update({ where: { id: nodeId }, data });
  return serializeNode(updated);
}

export async function deleteNode(userId: string, nodeId: string): Promise<boolean> {
  const existing = await prisma.node.findFirst({ where: { id: nodeId, userId } });
  if (!existing) return false;
  if (existing.type === 'SELF') {
    throw new NodeServiceError('FORBIDDEN', 'Cannot delete the Self node');
  }

  await prisma.node.delete({ where: { id: nodeId } });
  return true;
}

export async function updateNodePosition(
  userId: string,
  nodeId: string,
  x: number,
  y: number,
): Promise<boolean> {
  const existing = await prisma.node.findFirst({ where: { id: nodeId, userId } });
  if (!existing) return false;

  await prisma.node.update({
    where: { id: nodeId },
    data: { posX: x, posY: y },
  });
  return true;
}

export class NodeServiceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'NodeServiceError';
  }
}
