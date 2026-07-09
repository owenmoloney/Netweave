import type { RelationshipType } from '@netweave/shared';

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  met_at_event: 'Met at event',
  colleague: 'Colleague',
  intro_by: 'Introduced by',
  client: 'Client',
  mentor: 'Mentor',
  recruiter: 'Recruiter',
  friend: 'Friend',
  other: 'Other',
};

export const RELATIONSHIP_OPTIONS = Object.entries(RELATIONSHIP_LABELS).map(
  ([value, label]) => ({ value: value as RelationshipType, label }),
);
