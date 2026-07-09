/** Strip HTML tags and trim whitespace from user-provided strings. */
export function sanitizeString(value: string): string {
  const cleaned = value.replace(/<[^>]*>/g, '');
  let result = '';
  for (const char of cleaned) {
    const code = char.charCodeAt(0);
    if (code <= 0x1f && code !== 0x09 && code !== 0x0a && code !== 0x0d) continue;
    if (code === 0x7f) continue;
    result += char;
  }
  return result.trim();
}

export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)]),
    );
  }
  return value;
}
