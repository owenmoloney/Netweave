import type { EdgeCreateInput, EdgeUpdateInput } from '@netweave/shared';
import type { Node } from '@netweave/shared';
import { isValidNodeConnection } from '@netweave/shared';
import { prisma } from '../prisma.js';
import { serializeEdge } from '../utils/serialize.js';

function emptyToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  return value;
}

function isValidConnection(source: Node, target: Node): boolean {
  return isValidNodeConnection(source, target);
}

export async function getEdgesForUser(userId: string) {
  const edges = await prisma.edge.findMany({ where: { userId } });
  return edges.map(serializeEdge);
}

export async function getEdgeById(userId: string, edgeId: string) {
  const edge = await prisma.edge.findFirst({ where: { id: edgeId, userId } });
  if (!edge) return null;
  return serializeEdge(edge);
}

export async function createEdge(userId: string, input: EdgeCreateInput) {
  if (input.sourceId === input.targetId) {
    throw new EdgeServiceError('VALIDATION_ERROR', 'Cannot connect a node to itself');
  }

  const [source, target] = await Promise.all([
    prisma.node.findFirst({ where: { id: input.sourceId, userId } }),
    prisma.node.findFirst({ where: { id: input.targetId, userId } }),
  ]);

  if (!source || !target) {
    throw new EdgeServiceError('NOT_FOUND', 'Source or target node not found');
  }

  const sourceNode = {
    id: source.id,
    type: source.type,
  } as Node;
  const targetNode = {
    id: target.id,
    type: target.type,
  } as Node;

  if (!isValidConnection(sourceNode, targetNode)) {
    throw new EdgeServiceError(
      'VALIDATION_ERROR',
      'Invalid connection between these node types',
    );
  }

  const existing = await prisma.edge.findFirst({
    where: {
      userId,
      OR: [
        { sourceId: input.sourceId, targetId: input.targetId },
        { sourceId: input.targetId, targetId: input.sourceId },
      ],
    },
  });

  if (existing) {
    throw new EdgeServiceError('CONFLICT', 'Connection already exists between these nodes');
  }

  const edge = await prisma.edge.create({
    data: {
      userId,
      sourceId: input.sourceId,
      targetId: input.targetId,
      relationshipType: input.relationshipType,
      howMet: emptyToNull(input.howMet),
      whereMet: emptyToNull(input.whereMet),
      whyTalked: emptyToNull(input.whyTalked),
      dateOfInteraction: input.dateOfInteraction
        ? new Date(input.dateOfInteraction)
        : null,
      strength: input.strength,
      followUpNotes: emptyToNull(input.followUpNotes),
    },
  });

  return serializeEdge(edge);
}

export async function updateEdge(userId: string, edgeId: string, input: EdgeUpdateInput) {
  const existing = await prisma.edge.findFirst({ where: { id: edgeId, userId } });
  if (!existing) return null;

  const data: Record<string, unknown> = {};
  if (input.relationshipType !== undefined) data.relationshipType = input.relationshipType;
  if ('howMet' in input) data.howMet = emptyToNull(input.howMet);
  if ('whereMet' in input) data.whereMet = emptyToNull(input.whereMet);
  if ('whyTalked' in input) data.whyTalked = emptyToNull(input.whyTalked);
  if ('dateOfInteraction' in input) {
    data.dateOfInteraction = input.dateOfInteraction
      ? new Date(input.dateOfInteraction)
      : null;
  }
  if (input.strength !== undefined) data.strength = input.strength;
  if ('followUpNotes' in input) data.followUpNotes = emptyToNull(input.followUpNotes);

  const updated = await prisma.edge.update({ where: { id: edgeId }, data });
  return serializeEdge(updated);
}

export async function deleteEdge(userId: string, edgeId: string): Promise<boolean> {
  const existing = await prisma.edge.findFirst({ where: { id: edgeId, userId } });
  if (!existing) return false;
  await prisma.edge.delete({ where: { id: edgeId } });
  return true;
}

export class EdgeServiceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'EdgeServiceError';
  }
}
