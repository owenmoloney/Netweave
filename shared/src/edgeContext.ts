import type { Edge, NodeType, RelationshipType } from './types.js';

export function isJobBoardPersonConnection(
  sourceType: NodeType,
  targetType: NodeType,
): boolean {
  return (
    (sourceType === 'PERSON' && targetType === 'CAREER_BOARD') ||
    (sourceType === 'CAREER_BOARD' && targetType === 'PERSON')
  );
}

export function edgeInvolvesJobBoardPersonConnection(
  edge: Pick<Edge, 'sourceId' | 'targetId'>,
  nodes: Map<string, { type: NodeType }> | Array<{ id: string; type: NodeType }>,
): boolean {
  const lookup = Array.isArray(nodes)
    ? new Map(nodes.map((n) => [n.id, n]))
    : nodes;
  const source = lookup.get(edge.sourceId);
  const target = lookup.get(edge.targetId);
  if (!source || !target) return false;
  return isJobBoardPersonConnection(source.type, target.type);
}

export const JOB_BOARD_RELATIONSHIP_LABELS: Record<
  Extract<
    RelationshipType,
    'applied_via' | 'found_listing' | 'board_referral' | 'board_contact' | 'other'
  >,
  string
> = {
  applied_via: 'Applied via board',
  found_listing: 'Found their listing',
  board_referral: 'Referred on board',
  board_contact: 'Recruiter / contact',
  other: 'Other',
};

export const JOB_BOARD_RELATIONSHIP_TYPES = Object.keys(
  JOB_BOARD_RELATIONSHIP_LABELS,
) as Array<keyof typeof JOB_BOARD_RELATIONSHIP_LABELS>;

export const JOB_BOARD_PERSON_EDGE_LABELS = {
  relationshipType: 'Connection type',
  whyTalked: 'Role / job title',
  whereMet: 'Hiring company',
  howMet: 'How connected',
  dateOfInteraction: 'Date applied',
  strength: 'Priority',
  followUpNotes: 'Notes',
} as const;
