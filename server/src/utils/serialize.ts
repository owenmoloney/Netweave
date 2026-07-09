import type { Node, Edge } from '@netweave/shared';

export function serializeNode(node: {
  id: string;
  userId: string;
  type: string;
  notes: string | null;
  posX: number | null;
  posY: number | null;
  createdAt: Date;
  updatedAt: Date;
  fullName: string | null;
  jobTitle: string | null;
  email: string | null;
  linkedInUrl: string | null;
  companyId: string | null;
  companyName: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
}): Node {
  return {
    id: node.id,
    userId: node.userId,
    type: node.type as Node['type'],
    notes: node.notes,
    posX: node.posX,
    posY: node.posY,
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
    fullName: node.fullName,
    jobTitle: node.jobTitle,
    email: node.email,
    linkedInUrl: node.linkedInUrl,
    companyId: node.companyId,
    companyName: node.companyName,
    industry: node.industry,
    location: node.location,
    website: node.website,
  };
}

export function serializeEdge(edge: {
  id: string;
  userId: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  howMet: string | null;
  whereMet: string | null;
  whyTalked: string | null;
  dateOfInteraction: Date | null;
  strength: number;
  followUpNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Edge {
  return {
    id: edge.id,
    userId: edge.userId,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    relationshipType: edge.relationshipType as Edge['relationshipType'],
    howMet: edge.howMet,
    whereMet: edge.whereMet,
    whyTalked: edge.whyTalked,
    dateOfInteraction: edge.dateOfInteraction?.toISOString() ?? null,
    strength: edge.strength,
    followUpNotes: edge.followUpNotes,
    createdAt: edge.createdAt.toISOString(),
    updatedAt: edge.updatedAt.toISOString(),
  };
}
