import { fetchCalendarPeople } from './calendar';
import { displayNameFromParts } from './filters';
import { fetchGmailProfile, fetchTwoWayForEmails } from './gmail';
import { requestGoogleAccessToken } from './oauth';
import { scorePerson } from './score';
import type { ImportProgress, PersonCandidate } from './types';

export interface ScoredImport {
  auto: PersonCandidate[];
  review: PersonCandidate[];
  droppedCount: number;
}

export async function runGoogleImport(
  onProgress?: (progress: ImportProgress) => void,
): Promise<ScoredImport> {
  onProgress?.({ phase: 'auth', message: 'Connecting to Google…' });
  const accessToken = await requestGoogleAccessToken();

  onProgress?.({ phase: 'gmail', message: 'Reading your Gmail address…' });
  const profileEmail = await fetchGmailProfile(accessToken);
  const selfEmails = new Set<string>();
  if (profileEmail) selfEmails.add(profileEmail);

  onProgress?.({ phase: 'calendar', message: 'Reading the last 12 months of meetings…' });
  const calendarPeople = await fetchCalendarPeople(accessToken, selfEmails);

  const needsEmailCheck = [...calendarPeople.values()]
    .filter((person) => person.meetings.some((meeting) => meeting.otherHumanCount >= 2))
    .map((person) => person.email);

  onProgress?.({
    phase: 'gmail',
    message: `Checking 2-way email for ${needsEmailCheck.length} small-meeting contacts…`,
  });
  const mailbox = await fetchTwoWayForEmails(accessToken, needsEmailCheck);

  onProgress?.({ phase: 'scoring', message: 'Scoring people…' });

  const emails = new Set<string>(calendarPeople.keys());
  const auto: PersonCandidate[] = [];
  const review: PersonCandidate[] = [];
  let droppedCount = 0;

  for (const email of emails) {
    const calendar = calendarPeople.get(email);
    const meetings = [...(calendar?.meetings ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    const candidate = scorePerson({
      email,
      fullName: displayNameFromParts(calendar?.displayName, email),
      meetings,
      emailEvidence: mailbox.byEmail.get(email) ?? null,
    });

    if (candidate.bucket === 'auto') auto.push(candidate);
    else if (candidate.bucket === 'review') review.push(candidate);
    else droppedCount += 1;
  }

  auto.sort((a, b) => b.meetings.length - a.meetings.length);
  review.sort((a, b) => b.meetings.length - a.meetings.length || (b.emailEvidence?.twoWayThreads ?? 0) - (a.emailEvidence?.twoWayThreads ?? 0));

  onProgress?.({ phase: 'done', message: 'Ready' });
  return { auto, review, droppedCount };
}
