import { useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Node } from '@netweave/shared';
import { getNodeDisplayName } from '@netweave/shared';
import { useGraphStore } from '../stores/graphStore';

export interface SearchResult {
  id: string;
  name: string;
  subtitle: string;
  type: Node['type'];
}

function getSearchSubtitle(node: Node): string {
  if (node.type === 'PERSON') return node.jobTitle ?? 'Person';
  if (node.type === 'COMPANY') return node.industry ?? 'Company';
  return 'You';
}

export function useSearch(query: string): SearchResult[] {
  const nodes = useGraphStore((s) => s.nodes);

  const fuse = useMemo(() => {
    const items = Array.from(nodes.values()).map((node) => ({
      id: node.id,
      name: getNodeDisplayName(node),
      subtitle: getSearchSubtitle(node),
      type: node.type,
      jobTitle: node.jobTitle ?? '',
      companyName: node.companyName ?? '',
      industry: node.industry ?? '',
    }));

    return new Fuse(items, {
      keys: ['name', 'subtitle', 'jobTitle', 'companyName', 'industry'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [nodes]);

  return useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query.trim(), { limit: 8 }).map((r) => ({
      id: r.item.id,
      name: r.item.name,
      subtitle: r.item.subtitle,
      type: r.item.type,
    }));
  }, [fuse, query]);
}
