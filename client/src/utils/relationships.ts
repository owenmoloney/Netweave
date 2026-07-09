import type { RelationshipType } from '@netweave/shared';
import {
  JOB_BOARD_RELATIONSHIP_LABELS,
} from '@netweave/shared';

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  met_at_event: 'Met at event',
  colleague: 'Colleague',
  intro_by: 'Introduced by',
  client: 'Client',
  mentor: 'Mentor',
  recruiter: 'Recruiter',
  friend: 'Friend',
  applied_via: JOB_BOARD_RELATIONSHIP_LABELS.applied_via,
  found_listing: JOB_BOARD_RELATIONSHIP_LABELS.found_listing,
  board_referral: JOB_BOARD_RELATIONSHIP_LABELS.board_referral,
  board_contact: JOB_BOARD_RELATIONSHIP_LABELS.board_contact,
  other: 'Other',
};

const NETWORKING_RELATIONSHIP_TYPES: RelationshipType[] = [
  'met_at_event',
  'colleague',
  'intro_by',
  'client',
  'mentor',
  'recruiter',
  'friend',
  'other',
];

export const NETWORKING_RELATIONSHIP_OPTIONS = NETWORKING_RELATIONSHIP_TYPES.map((value) => ({
  value,
  label: RELATIONSHIP_LABELS[value],
}));

export const JOB_BOARD_RELATIONSHIP_OPTIONS = (
  Object.entries(JOB_BOARD_RELATIONSHIP_LABELS) as Array<
    [keyof typeof JOB_BOARD_RELATIONSHIP_LABELS, string]
  >
).map(([value, label]) => ({ value: value as RelationshipType, label }));

export const RELATIONSHIP_OPTIONS = Object.entries(RELATIONSHIP_LABELS).map(
  ([value, label]) => ({ value: value as RelationshipType, label }),
);
