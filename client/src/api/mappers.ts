import type { Edge, Node, NodeType, RelationshipType } from '@netweave/shared';

export interface NodeRow {
  id: string;
  user_id: string;
  type: NodeType;
  notes: string | null;
  pos_x: number | null;
  pos_y: number | null;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  job_title: string | null;
  email: string | null;
  linkedin_url: string | null;
  company_id: string | null;
  company_name: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
}

export interface EdgeRow {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  how_met: string | null;
  where_met: string | null;
  why_talked: string | null;
  date_of_interaction: string | null;
  strength: number;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function mapNode(row: NodeRow): Node {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    notes: row.notes,
    posX: row.pos_x,
    posY: row.pos_y,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fullName: row.full_name,
    jobTitle: row.job_title,
    email: row.email,
    linkedInUrl: row.linkedin_url,
    companyId: row.company_id,
    companyName: row.company_name,
    industry: row.industry,
    location: row.location,
    website: row.website,
  };
}

export function mapEdge(row: EdgeRow): Edge {
  return {
    id: row.id,
    userId: row.user_id,
    sourceId: row.source_id,
    targetId: row.target_id,
    relationshipType: row.relationship_type,
    howMet: row.how_met,
    whereMet: row.where_met,
    whyTalked: row.why_talked,
    dateOfInteraction: row.date_of_interaction,
    strength: row.strength,
    followUpNotes: row.follow_up_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  return value;
}
