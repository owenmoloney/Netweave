import { useQuery } from '@tanstack/react-query';
import type { GraphResponse } from '@netweave/shared';
import { fetchGraph } from './client';

export function useGraph() {
  return useQuery<GraphResponse>({
    queryKey: ['graph'],
    queryFn: fetchGraph,
    staleTime: Infinity,
    retry: (failureCount, error) => {
      const message = error instanceof Error ? error.message : '';
      if (/jwt|not authenticated|invalid/i.test(message)) return false;
      return failureCount < 2;
    },
  });
}
