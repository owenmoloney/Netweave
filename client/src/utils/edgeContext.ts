import type { Edge, NodeType } from '@netweave/shared';
import {
  edgeInvolvesJobBoardPersonConnection,
  isJobBoardPersonConnection,
  JOB_BOARD_PERSON_EDGE_LABELS,
} from '@netweave/shared';
import { format } from 'date-fns';
import { RELATIONSHIP_LABELS } from './relationships';

export function getAddEdgeModalTitle(
  sourceName: string,
  sourceType: NodeType,
  targetType: NodeType | null,
  targetName: string | null,
): string {
  if (targetType && isJobBoardPersonConnection(sourceType, targetType)) {
    const personName =
      sourceType === 'PERSON' ? sourceName : (targetName ?? 'contact');
    const boardName =
      sourceType === 'CAREER_BOARD' ? sourceName : (targetName ?? 'career board');
    return `Link ${personName} to ${boardName}`;
  }
  return `Connect ${sourceName} to…`;
}

export function formatEdgeSummary(
  edge: Edge,
  nodes: Map<string, { type: NodeType }>,
): { headline: string; details: string[]; notes: string | null } {
  const source = nodes.get(edge.sourceId);
  const target = nodes.get(edge.targetId);
  const isJobBoardLink =
    source && target && isJobBoardPersonConnection(source.type, target.type);

  const headline = isJobBoardLink
    ? `${RELATIONSHIP_LABELS[edge.relationshipType]} · Priority ${edge.strength}/5`
    : `${RELATIONSHIP_LABELS[edge.relationshipType]} · Strength ${edge.strength}/5`;

  const details: string[] = [];

  if (isJobBoardLink) {
    if (edge.whyTalked) details.push(`${JOB_BOARD_PERSON_EDGE_LABELS.whyTalked}: ${edge.whyTalked}`);
    if (edge.whereMet) details.push(`${JOB_BOARD_PERSON_EDGE_LABELS.whereMet}: ${edge.whereMet}`);
    if (edge.howMet) details.push(`${JOB_BOARD_PERSON_EDGE_LABELS.howMet}: ${edge.howMet}`);
    if (edge.dateOfInteraction) {
      details.push(
        `${JOB_BOARD_PERSON_EDGE_LABELS.dateOfInteraction}: ${format(new Date(edge.dateOfInteraction), 'MMM d, yyyy')}`,
      );
    }
  } else {
    if (edge.whyTalked) details.push(edge.whyTalked);
    if (edge.howMet) details.push(`Met: ${edge.howMet}`);
    if (edge.whereMet) details.push(`Where: ${edge.whereMet}`);
    if (edge.dateOfInteraction) {
      details.push(`Date: ${format(new Date(edge.dateOfInteraction), 'MMM d, yyyy')}`);
    }
  }

  return { headline, details, notes: edge.followUpNotes };
}

export { edgeInvolvesJobBoardPersonConnection, isJobBoardPersonConnection, JOB_BOARD_PERSON_EDGE_LABELS };
