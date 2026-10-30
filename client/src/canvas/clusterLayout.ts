import type { Node } from '@netweave/shared';
import { findHomeCompany } from '../google/homeCompany';

export const HOME_COMPANY_X = -300;
export const HOME_COMPANY_Y = 0;
export const COMPANY_RING_RADIUS = 360;
export const PERSON_CLUSTER_RADIUS = 150;
export const UNAFFILIATED_RING_RADIUS = 320;
export const MIN_NODE_SPACING = 150;
const HOME_WEDGE = (2 * Math.PI) / 3;
const CLUSTER_ARC = Math.PI * 1.4;

function cloneNode(node: Node, posX: number, posY: number): Node {
  return { ...node, posX, posY };
}

function ringPoint(cx: number, cy: number, radius: number, index: number, count: number, extraAngle = 0) {
  const angle = extraAngle + (count === 0 ? 0 : (2 * Math.PI * index) / count);
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function placeOnArcs(
  cx: number,
  cy: number,
  count: number,
  firstRadius: number,
  centerAngle: number,
  span: number,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  let placed = 0;
  let ring = 0;
  while (placed < count) {
    const radius = firstRadius + ring * MIN_NODE_SPACING;
    const cap = Math.max(1, Math.floor((span * radius) / MIN_NODE_SPACING));
    const take = Math.min(count - placed, cap);
    for (let i = 0; i < take; i++) {
      const t = take === 1 ? 0.5 : i / (take - 1);
      const angle = centerAngle - span / 2 + t * span;
      points.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    }
    placed += take;
    ring += 1;
  }
  return points;
}

function outermostRadius(count: number, firstRadius: number, span: number): number {
  if (count <= 0) return 0;
  let remaining = count;
  let ring = 0;
  let radius = firstRadius;
  while (remaining > 0) {
    radius = firstRadius + ring * MIN_NODE_SPACING;
    remaining -= Math.max(1, Math.floor((span * radius) / MIN_NODE_SPACING));
    ring += 1;
  }
  return radius;
}

function memberCount(nodes: Node[], orgId: string): number {
  return nodes.filter((node) => node.type === 'PERSON' && node.companyId === orgId).length;
}

export function layoutClusters(nodes: Node[]): Node[] {
  const result = new Map<string, Node>();
  const self = nodes.find((node) => node.type === 'SELF');
  if (self) {
    result.set(self.id, cloneNode(self, 0, 0));
  }

  const home = findHomeCompany(nodes);
  const homeMembers = home ? memberCount(nodes, home.id) : 0;
  const homeFootprint = outermostRadius(homeMembers, PERSON_CLUSTER_RADIUS, CLUSTER_ARC);
  const homeX = -Math.max(Math.abs(HOME_COMPANY_X), homeFootprint + 70);
  if (home) {
    result.set(home.id, cloneNode(home, homeX, HOME_COMPANY_Y));
  }

  const orgs = nodes.filter(
    (node) =>
      (node.type === 'COMPANY' || node.type === 'CAREER_BOARD') && node.id !== home?.id,
  );
  const orgFootprints = orgs.map((org) =>
    Math.max(
      MIN_NODE_SPACING / 2,
      outermostRadius(memberCount(nodes, org.id), PERSON_CLUSTER_RADIUS, CLUSTER_ARC),
    ),
  );
  const neededCompanyRing =
    orgs.length === 0
      ? 0
      : (orgs.length * (2 * Math.max(0, ...orgFootprints) + MIN_NODE_SPACING)) / (2 * Math.PI);
  let companyRing = orgs.length === 0 ? 0 : Math.max(COMPANY_RING_RADIUS, neededCompanyRing);
  if (home && orgs.length > 0) {
    for (let guard = 0; guard < 8; guard++) {
      const tooClose = orgs.some((_, index) => {
        const point = ringPoint(0, 0, companyRing, index, orgs.length, Math.PI / 2);
        const dist = Math.hypot(point.x - homeX, point.y - HOME_COMPANY_Y);
        return dist < homeFootprint + orgFootprints[index] + MIN_NODE_SPACING;
      });
      if (!tooClose) break;
      companyRing += MIN_NODE_SPACING;
    }
  }

  orgs.forEach((org, index) => {
    const point = ringPoint(0, 0, companyRing, index, Math.max(orgs.length, 1), Math.PI / 2);
    result.set(org.id, cloneNode(org, point.x, point.y));
  });

  const positionedOrgs = nodes.filter(
    (node) => node.type === 'COMPANY' || node.type === 'CAREER_BOARD',
  );

  for (const org of positionedOrgs) {
    const placed = result.get(org.id);
    if (!placed) continue;
    const members = nodes.filter((node) => node.type === 'PERSON' && node.companyId === org.id);
    const away = Math.atan2(placed.posY ?? 0, placed.posX ?? 0);
    const points = placeOnArcs(
      placed.posX ?? 0,
      placed.posY ?? 0,
      members.length,
      PERSON_CLUSTER_RADIUS,
      away,
      CLUSTER_ARC,
    );
    members.forEach((person, index) => {
      const point = points[index];
      result.set(person.id, cloneNode(person, point.x, point.y));
    });
  }

  const unaffiliated = nodes.filter((node) => node.type === 'PERSON' && !node.companyId);
  const unaffiliatedSpan = home ? 2 * Math.PI - HOME_WEDGE : 2 * Math.PI;
  const unaffiliatedCenter = home ? 0 : Math.PI / 2;
  const points = placeOnArcs(
    0,
    0,
    unaffiliated.length,
    UNAFFILIATED_RING_RADIUS,
    unaffiliatedCenter,
    unaffiliatedSpan,
  );
  unaffiliated.forEach((person, index) => {
    const point = points[index];
    result.set(person.id, cloneNode(person, point.x, point.y));
  });

  return nodes.map((node) => result.get(node.id) ?? node);
}
