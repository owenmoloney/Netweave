export type NodeType = 'SELF' | 'PERSON' | 'COMPANY' | 'CAREER_BOARD';

export type RelationshipType =
  | 'met_at_event'
  | 'colleague'
  | 'intro_by'
  | 'client'
  | 'mentor'
  | 'recruiter'
  | 'friend'
  | 'applied_via'
  | 'found_listing'
  | 'board_referral'
  | 'board_contact'
  | 'other';

export interface Node {
  id: string;
  userId: string;
  type: NodeType;
  notes: string | null;
  posX: number | null;
  posY: number | null;
  createdAt: string;
  updatedAt: string;
  fullName: string | null;
  jobTitle: string | null;
  email: string | null;
  linkedInUrl: string | null;
  companyId: string | null;
  companyName: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
}

export interface Edge {
  id: string;
  userId: string;
  sourceId: string;
  targetId: string;
  relationshipType: RelationshipType;
  howMet: string | null;
  whereMet: string | null;
  whyTalked: string | null;
  dateOfInteraction: string | null;
  strength: number;
  followUpNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GraphResponse {
  nodes: Node[];
  edges: Edge[];
}

export interface AuthResponse {
  token: string;
  userId: string;
}

export interface User {
  id: string;
  email: string;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getNodeDisplayName(node: Node): string {
  if (node.type === 'SELF') return 'You';
  if (node.type === 'PERSON') return node.fullName ?? 'Unknown';
  if (node.type === 'CAREER_BOARD') return node.companyName ?? 'Unknown';
  return node.companyName ?? 'Unknown';
}

/** Returns whether an edge is allowed between two node types. */
export function isValidNodeConnection(
  source: Pick<Node, 'id' | 'type'>,
  target: Pick<Node, 'id' | 'type'>,
): boolean {
  if (source.id === target.id) return false;
  if (source.type === 'COMPANY' && target.type === 'COMPANY') return false;
  if (source.type === 'CAREER_BOARD' && target.type === 'CAREER_BOARD') return false;
  return true;
}
