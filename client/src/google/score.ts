import type { CandidateBucket, EmailEvidence, MeetingEvidence, PersonCandidate } from './types';
import { isJunkEmail } from './filters';

export function meetingStrength(meetings: MeetingEvidence[], twoWayThreads: number): number {
  const count = meetings.length;
  let strength = 3;
  if (count >= 3) strength += 1;
  if (twoWayThreads >= 2) strength += 1;
  return Math.min(5, Math.max(1, strength));
}

export function scorePerson(input: {
  email: string;
  fullName: string;
  meetings: MeetingEvidence[];
  emailEvidence: EmailEvidence | null;
}): PersonCandidate {
  const { email, fullName, meetings, emailEvidence } = input;
  const twoWay = emailEvidence?.twoWayThreads ?? 0;
  const hasOneOnOne = meetings.some((meeting) => meeting.otherHumanCount === 1);
  const hasSmallGroup = meetings.some(
    (meeting) => meeting.otherHumanCount >= 2 && meeting.otherHumanCount <= 6,
  );

  let bucket: CandidateBucket = 'drop';
  let reason = 'Not enough signal';

  if (isJunkEmail(email)) {
    bucket = 'drop';
    reason = 'Automated or resource address';
  } else if (hasOneOnOne) {
    bucket = 'auto';
    reason = '1:1 meeting';
  } else if (hasSmallGroup && twoWay >= 1) {
    bucket = 'auto';
    reason = 'Small meeting and 2-way email';
  } else if (hasSmallGroup) {
    bucket = 'review';
    reason = 'Small meeting, no 2-way email';
  } else if (meetings.length === 0 && twoWay >= 3 && !emailEvidence?.hasListUnsubscribe) {
    bucket = 'review';
    reason = 'Repeated 2-way email, no meeting';
  } else if (emailEvidence?.hasListUnsubscribe) {
    bucket = 'drop';
    reason = 'Newsletter';
  }

  return {
    email,
    fullName,
    meetings,
    emailEvidence,
    bucket,
    reason,
  };
}

export function importNotes(candidate: PersonCandidate): string {
  const meetingCount = candidate.meetings.length;
  const threads = candidate.emailEvidence?.twoWayThreads ?? 0;
  const last = candidate.meetings[0];
  const lastBit = last ? ` Last: ${last.title} (${last.date.slice(0, 10)}).` : '';
  return `Imported from Google: ${meetingCount} meeting${meetingCount === 1 ? '' : 's'}, ${threads} email thread${threads === 1 ? '' : 's'}.${lastBit}`;
}
