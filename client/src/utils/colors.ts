import type { Node } from '@netweave/shared';

export const COLORS = {
  background: '#070B14',
  accent: '#7C6DEB',
  accentSecondary: '#38BDF8',
  careerBoard: '#F59E0B',
  personFill: '#1E293B',
  companyFill: '#0F172A',
  careerBoardFill: '#1C1917',
  textPrimary: '#F1F5F9',
  edgeBase: 'rgba(255,255,255,0.15)',
  edgeHover: 'rgba(255,255,255,0.45)',
} as const;

const PERSON_COMPANY_RADIUS = 56;
const SELF_RADIUS = 74;

export function getNodeRadius(node: Node): number {
  return node.type === 'SELF' ? SELF_RADIUS : PERSON_COMPANY_RADIUS;
}

export function getNodeAccentColor(node: Node): string {
  if (node.type === 'COMPANY') return COLORS.accentSecondary;
  if (node.type === 'CAREER_BOARD') return COLORS.careerBoard;
  return COLORS.accent;
}

export function getNodeInitials(node: Node): string {
  if (node.type === 'SELF') return 'YO';
  if (node.type === 'PERSON' && node.fullName) {
    const parts = node.fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return node.fullName.slice(0, 2).toUpperCase();
  }
  if ((node.type === 'COMPANY' || node.type === 'CAREER_BOARD') && node.companyName) {
    return node.companyName.slice(0, 2).toUpperCase();
  }
  return '?';
}

export function getNodeLabel(node: Node): string {
  if (node.type === 'SELF') return 'You';
  if (node.type === 'PERSON') return node.fullName ?? 'Unknown';
  if (node.type === 'CAREER_BOARD') return node.companyName ?? 'Unknown';
  return node.companyName ?? 'Unknown';
}
