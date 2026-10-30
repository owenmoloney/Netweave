import { googleFetch } from './googleFetch';
import { isJunkEmail, isOwnEmail, normalizeEmail, parseEmail } from './filters';
import type { MeetingEvidence } from './types';

interface CalendarAttendee {
  email?: string;
  displayName?: string;
  self?: boolean;
  resource?: boolean;
  responseStatus?: string;
}

interface CalendarEvent {
  status?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  attendees?: CalendarAttendee[];
}

interface EventsListResponse {
  items?: CalendarEvent[];
  nextPageToken?: string;
}

export interface CalendarPerson {
  email: string;
  displayName?: string;
  meetings: MeetingEvidence[];
}

const MAX_OTHER_HUMANS = 6;
const MAX_EVENTS = 500;
const LOOKBACK_MS = 365 * 24 * 60 * 60 * 1000;

function eventStartIso(event: CalendarEvent): string | null {
  return event.start?.dateTime ?? (event.start?.date ? `${event.start.date}T00:00:00.000Z` : null);
}

export async function fetchCalendarPeople(
  accessToken: string,
  selfEmails: Set<string>,
): Promise<Map<string, CalendarPerson>> {
  const now = Date.now();
  const timeMin = new Date(now - LOOKBACK_MS).toISOString();
  const timeMax = new Date(now).toISOString();
  const people = new Map<string, CalendarPerson>();
  let pageToken: string | undefined;
  let fetched = 0;

  do {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin,
      timeMax,
      maxResults: '250',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const page = await googleFetch<EventsListResponse>(
      accessToken,
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    );

    for (const event of page.items ?? []) {
      ingestEvent(event, selfEmails, people, now);
      fetched += 1;
      if (fetched >= MAX_EVENTS) break;
    }

    pageToken = fetched >= MAX_EVENTS ? undefined : page.nextPageToken;
  } while (pageToken);

  return people;
}

function ingestEvent(
  event: CalendarEvent,
  selfEmails: Set<string>,
  people: Map<string, CalendarPerson>,
  now: number,
): void {
  if (event.status === 'cancelled') return;
  const start = eventStartIso(event);
  if (!start || Date.parse(start) > now) return;

  const attendees = event.attendees ?? [];
  if (attendees.length === 0) return;

  const selfAttendee = attendees.find((attendee) => attendee.self);
  if (selfAttendee?.responseStatus === 'declined') return;
  if (selfAttendee?.email) selfEmails.add(normalizeEmail(selfAttendee.email));

  const humans = attendees.filter((attendee) => {
    if (attendee.self || attendee.resource) return false;
    if (attendee.responseStatus === 'declined') return false;
    const email = attendee.email ? parseEmail(attendee.email) : null;
    if (!email) return false;
    if (isOwnEmail(email, selfEmails) || isJunkEmail(email)) return false;
    return true;
  });

  if (humans.length === 0 || humans.length > MAX_OTHER_HUMANS) return;

  const evidence: MeetingEvidence = {
    title: event.summary?.trim() || 'Meeting',
    date: start,
    otherHumanCount: humans.length,
  };

  for (const human of humans) {
    const email = parseEmail(human.email ?? '');
    if (!email) continue;
    const existing = people.get(email);
    if (existing) {
      existing.meetings.push(evidence);
      if (!existing.displayName && human.displayName) existing.displayName = human.displayName;
    } else {
      people.set(email, {
        email,
        displayName: human.displayName,
        meetings: [evidence],
      });
    }
  }
}
