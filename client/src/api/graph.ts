import { useQuery } from '@tanstack/react-query';
import type { GraphResponse } from '@netweave/shared';
import { fetchGraph } from './client';
import { useAuth } from '../auth/authContext';

export function useGraph() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery<GraphResponse>({
    queryKey: ['graph', userId],
    queryFn: fetchGraph,
    enabled: Boolean(userId),
    staleTime: Infinity,
    retry: (failureCount, error) => {
      const message = error instanceof Error ? error.message : '';
      if (/invalid.*jwt|jwt expired/i.test(message)) return false;
      return failureCount < 2;
    },
  });
}
