export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function screenToGraph(
  screenX: number,
  screenY: number,
  transform: { x: number; y: number; scale: number },
): { x: number; y: number } {
  return {
    x: (screenX - transform.x) / transform.scale,
    y: (screenY - transform.y) / transform.scale,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const STRENGTH_STROKE_WIDTHS = [1, 1.5, 2, 3, 4] as const;

export function strengthToStrokeWidth(strength: number): number {
  const index = Math.max(0, Math.min(4, strength - 1));
  return STRENGTH_STROKE_WIDTHS[index];
}

export function truncateLabel(label: string, maxLength = 20): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

export function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(px, py, x1, y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return distance(px, py, projX, projY);
}
