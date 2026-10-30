import { googleFetch, mapPool } from './googleFetch';
import type { EmailEvidence } from './types';

interface ProfileResponse {
  emailAddress?: string;
}

interface MessageListResponse {
  messages?: Array<{ id: string }>;
  resultSizeEstimate?: number;
}

export interface MailboxStats {
  byEmail: Map<string, EmailEvidence>;
}

function quote(email: string): string {
  return `"${email.replace(/"/g, '')}"`;
}

export async function fetchGmailProfile(accessToken: string): Promise<string | null> {
  const profile = await googleFetch<ProfileResponse>(
    accessToken,
    'https://gmail.googleapis.com/gmail/v1/users/me/profile',
  );
  return profile.emailAddress ? profile.emailAddress.toLowerCase() : null;
}

async function listEstimate(accessToken: string, query: string): Promise<number> {
  const params = new URLSearchParams({
    q: query,
    maxResults: '1',
  });
  const page = await googleFetch<MessageListResponse>(
    accessToken,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
  );
  if (typeof page.resultSizeEstimate === 'number') return page.resultSizeEstimate;
  return page.messages?.length ?? 0;
}

async function twoWayForEmail(accessToken: string, email: string): Promise<EmailEvidence> {
  const [sent, received] = await Promise.all([
    listEstimate(accessToken, `in:sent to:${quote(email)} newer_than:365d`),
    listEstimate(accessToken, `from:${quote(email)} newer_than:365d -category:promotions -category:social`),
  ]);
  const twoWayThreads = sent > 0 && received > 0 ? Math.min(sent, received) : 0;
  return {
    sentCount: sent,
    receivedCount: received,
    twoWayThreads,
    hasListUnsubscribe: false,
  };
}

/** Only checks calendar attendees. List queries only — no messages.get. */
export async function fetchTwoWayForEmails(
  accessToken: string,
  emails: string[],
): Promise<MailboxStats> {
  const unique = [...new Set(emails)].slice(0, 40);
  const rows = await mapPool(unique, 2, async (email) => ({
    email,
    evidence: await twoWayForEmail(accessToken, email),
  }));

  const byEmail = new Map<string, EmailEvidence>();
  for (const row of rows) {
    byEmail.set(row.email, row.evidence);
  }
  return { byEmail };
}
