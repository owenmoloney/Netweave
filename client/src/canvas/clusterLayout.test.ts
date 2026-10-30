import { describe, expect, it } from 'vitest';
import type { Node } from '@netweave/shared';
import { HOME_COMPANY_NAME } from '../google/homeCompany';
import {
  COMPANY_RING_RADIUS,
  HOME_COMPANY_X,
  MIN_NODE_SPACING,
  layoutClusters,
  PERSON_CLUSTER_RADIUS,
  UNAFFILIATED_RING_RADIUS,
} from './clusterLayout';

function node(partial: Partial<Node> & Pick<Node, 'id' | 'type'>): Node {
  return {
    userId: 'user-1',
    notes: null,
    posX: 0,
    posY: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fullName: null,
    jobTitle: null,
    email: null,
    linkedInUrl: null,
    companyId: null,
    companyName: null,
    industry: null,
    location: null,
    website: null,
    ...partial,
  };
}

describe('layoutClusters', () => {
  it('pins You at the origin and BAH to the left', () => {
    const laidOut = layoutClusters([
      node({ id: 'self', type: 'SELF' }),
      node({ id: 'bah', type: 'COMPANY', companyName: HOME_COMPANY_NAME }),
    ]);
    const self = laidOut.find((item) => item.id === 'self')!;
    const bah = laidOut.find((item) => item.id === 'bah')!;
    expect(self.posX).toBe(0);
    expect(self.posY).toBe(0);
    expect(bah.posX).toBe(HOME_COMPANY_X);
    expect(bah.posY).toBe(0);
  });

  it('places other companies off the origin and not on top of each other', () => {
    const laidOut = layoutClusters([
      node({ id: 'self', type: 'SELF' }),
      node({ id: 'bah', type: 'COMPANY', companyName: HOME_COMPANY_NAME }),
      node({ id: 'acme', type: 'COMPANY', companyName: 'Acme' }),
      node({ id: 'globex', type: 'COMPANY', companyName: 'Globex' }),
    ]);
    const acme = laidOut.find((item) => item.id === 'acme')!;
    const globex = laidOut.find((item) => item.id === 'globex')!;
    expect(Math.hypot(acme.posX ?? 0, acme.posY ?? 0)).toBeCloseTo(COMPANY_RING_RADIUS);
    expect(Math.hypot(globex.posX ?? 0, globex.posY ?? 0)).toBeCloseTo(COMPANY_RING_RADIUS);
    expect(acme.posX).not.toBe(globex.posX);
    expect(acme.posY).not.toBe(globex.posY);
    expect(acme.posX).not.toBe(HOME_COMPANY_X);
    expect(globex.posX).not.toBe(HOME_COMPANY_X);
  });

  it('treats a BAH alias as the home company', () => {
    const laidOut = layoutClusters([
      node({ id: 'self', type: 'SELF' }),
      node({ id: 'bah', type: 'COMPANY', companyName: 'BAH' }),
    ]);
    const bah = laidOut.find((item) => item.id === 'bah')!;
    expect(bah.posX).toBe(HOME_COMPANY_X);
    expect(bah.posY).toBe(0);
  });

  it('clusters people near their company', () => {
    const laidOut = layoutClusters([
      node({ id: 'self', type: 'SELF' }),
      node({ id: 'bah', type: 'COMPANY', companyName: HOME_COMPANY_NAME }),
      node({
        id: 'p1',
        type: 'PERSON',
        fullName: 'Pat',
        companyId: 'bah',
        email: 'pat@boozallen.com',
      }),
    ]);
    const bah = laidOut.find((item) => item.id === 'bah')!;
    const pat = laidOut.find((item) => item.id === 'p1')!;
    const dist = Math.hypot((pat.posX ?? 0) - (bah.posX ?? 0), (pat.posY ?? 0) - (bah.posY ?? 0));
    expect(dist).toBeCloseTo(PERSON_CLUSTER_RADIUS);
  });

  it('puts unaffiliated people on the outer ring', () => {
    const laidOut = layoutClusters([
      node({ id: 'self', type: 'SELF' }),
      node({ id: 'p1', type: 'PERSON', fullName: 'Alex' }),
    ]);
    const alex = laidOut.find((item) => item.id === 'p1')!;
    expect(Math.hypot(alex.posX ?? 0, alex.posY ?? 0)).toBeCloseTo(UNAFFILIATED_RING_RADIUS);
  });

  it('keeps colleagues far enough apart that nodes do not sit on top of each other', () => {
    const people = Array.from({ length: 12 }, (_, index) =>
      node({
        id: `p${index}`,
        type: 'PERSON',
        fullName: `Person ${index}`,
        companyId: 'bah',
      }),
    );
    const laidOut = layoutClusters([
      node({ id: 'self', type: 'SELF' }),
      node({ id: 'bah', type: 'COMPANY', companyName: HOME_COMPANY_NAME }),
      ...people,
    ]);
    const placed = laidOut.filter((item) => item.type === 'PERSON');
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const dist = Math.hypot(
          (placed[i].posX ?? 0) - (placed[j].posX ?? 0),
          (placed[i].posY ?? 0) - (placed[j].posY ?? 0),
        );
        expect(dist).toBeGreaterThan(MIN_NODE_SPACING * 0.85);
      }
    }
  });
});

