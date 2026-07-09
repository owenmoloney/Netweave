import { useQuery } from '@tanstack/react-query';
import type { GraphResponse } from '@netweave/shared';
import { api } from './client';

export function useGraph() {
  return useQuery<GraphResponse>({
    queryKey: ['graph'],
    queryFn: async () => {
      const { data } = await api.get<GraphResponse>('/graph');
      return data;
    },
    staleTime: Infinity,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}
