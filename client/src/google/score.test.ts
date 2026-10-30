import { describe, expect, it } from 'vitest';
import { scorePerson } from './score';
import type { EmailEvidence, MeetingEvidence } from './types';

const oneOnOne: MeetingEvidence = {
  title: 'Coffee',
  date: '2026-01-15T15:00:00.000Z',
  otherHumanCount: 1,
};

const smallGroup: MeetingEvidence = {
  title: 'Project sync',
  date: '2026-01-16T15:00:00.000Z',
  otherHumanCount: 4,
};

const twoWay: EmailEvidence = {
  sentCount: 3,
  receivedCount: 2,
  twoWayThreads: 2,
  hasListUnsubscribe: false,
};

describe('google scoring', () => {
  it('auto-adds 1:1 meetings', () => {
    const result = scorePerson({
      email: 'jane@acme.com',
      fullName: 'Jane',
      meetings: [oneOnOne],
      emailEvidence: null,
    });
    expect(result.bucket).toBe('auto');
  });

  it('auto-adds small meetings when there is a 2-way email', () => {
    const result = scorePerson({
      email: 'jane@acme.com',
      fullName: 'Jane',
      meetings: [smallGroup],
      emailEvidence: twoWay,
    });
    expect(result.bucket).toBe('auto');
  });

  it('reviews small meetings without email', () => {
    const result = scorePerson({
      email: 'jane@acme.com',
      fullName: 'Jane',
      meetings: [smallGroup],
      emailEvidence: null,
    });
    expect(result.bucket).toBe('review');
  });

  it('reviews gmail-only strong 2-way contacts and never auto-adds them', () => {
    const result = scorePerson({
      email: 'jane@acme.com',
      fullName: 'Jane',
      meetings: [],
      emailEvidence: { ...twoWay, twoWayThreads: 4 },
    });
    expect(result.bucket).toBe('review');
  });

  it('drops newsletters and noreply', () => {
    expect(
      scorePerson({
        email: 'noreply@acme.com',
        fullName: 'Acme',
        meetings: [oneOnOne],
        emailEvidence: null,
      }).bucket,
    ).toBe('drop');

    expect(
      scorePerson({
        email: 'digest@news.com',
        fullName: 'News',
        meetings: [],
        emailEvidence: { ...twoWay, twoWayThreads: 8, hasListUnsubscribe: true },
      }).bucket,
    ).toBe('drop');
  });
});
