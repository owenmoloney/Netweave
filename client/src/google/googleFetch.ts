export async function googleFetch<T>(
  accessToken: string,
  url: string,
  retries = 3,
): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 403 && retries > 0) {
    const body = await response.text();
    if (/quota|rateLimitExceeded|userRateLimitExceeded/i.test(body)) {
      await sleep(2000 * (4 - retries));
      return googleFetch<T>(accessToken, url, retries - 1);
    }
    throw new Error(`Google API 403: ${body.slice(0, 240)}`);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google API ${response.status}: ${body.slice(0, 240)}`);
  }
  return response.json() as Promise<T>;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
