export type CandidateBucket = 'auto' | 'review' | 'drop';

export interface MeetingEvidence {
  title: string;
  date: string;
  otherHumanCount: number;
}

export interface EmailEvidence {
  sentCount: number;
  receivedCount: number;
  twoWayThreads: number;
  hasListUnsubscribe: boolean;
}

export interface PersonCandidate {
  email: string;
  fullName: string;
  meetings: MeetingEvidence[];
  emailEvidence: EmailEvidence | null;
  bucket: CandidateBucket;
  reason: string;
}

export interface ImportProgress {
  phase: 'auth' | 'calendar' | 'gmail' | 'scoring' | 'writing' | 'done';
  message: string;
}

export interface ImportResult {
  added: PersonCandidate[];
  review: PersonCandidate[];
  droppedCount: number;
  mergedCount: number;
}
