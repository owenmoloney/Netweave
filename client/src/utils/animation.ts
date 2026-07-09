export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 4-second sine pulse: 0.15 → 0.30 → 0.15 */
export function edgePulseOpacity(strength: number, timeMs: number): number {
  const cycle = (Math.sin((timeMs / 4000) * Math.PI * 2) + 1) / 2;
  const base = 0.15;
  const amplitude = strength >= 4 ? 0.18 : strength >= 3 ? 0.12 : 0.08;
  return base + cycle * amplitude;
}
