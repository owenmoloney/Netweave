import type { Node, Edge } from '@netweave/shared';
import { useGraphStore } from '../stores/graphStore';
import { useToastStore } from '../stores/toastStore';

export function snapshotGraph() {
  const state = useGraphStore.getState();
  return {
    nodes: new Map(state.nodes),
    edges: new Map(state.edges),
  };
}

export function revertGraph(snapshot: { nodes: Map<string, Node>; edges: Map<string, Edge> }) {
  useGraphStore.setState({
    nodes: snapshot.nodes,
    edges: snapshot.edges,
  });
}

export function getApiErrorMessage(err: unknown): string {
  const axiosErr = err as {
    response?: { data?: { error?: { message?: string } } };
  };
  return axiosErr.response?.data?.error?.message ?? 'Something went wrong';
}

export function handleMutationError(err: unknown): void {
  useGraphStore.getState().setSaveStatus('error');
  useToastStore.getState().showToast(getApiErrorMessage(err), 'error');
}
