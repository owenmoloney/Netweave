import { useMutation } from '@tanstack/react-query';
import type { Edge, EdgeCreateInput, EdgeUpdateInput } from '@netweave/shared';
import { api } from './client';
import { revertGraph, snapshotGraph, handleMutationError } from './mutationUtils';
import { useGraphStore } from '../stores/graphStore';

export function useCreateEdge() {
  const addEdge = useGraphStore((s) => s.addEdge);
  const setSaveStatus = useGraphStore((s) => s.setSaveStatus);

  return useMutation({
    mutationFn: async (input: EdgeCreateInput) => {
      const { data } = await api.post<Edge>('/edges', input);
      return data;
    },
    onMutate: async (input) => {
      setSaveStatus('saving');
      const snapshot = snapshotGraph();
      const tempId = `temp-edge-${Date.now()}`;
      const now = new Date().toISOString();
      addEdge({
        id: tempId,
        userId: '',
        sourceId: input.sourceId,
        targetId: input.targetId,
        relationshipType: input.relationshipType ?? 'other',
        howMet: input.howMet ?? null,
        whereMet: input.whereMet ?? null,
        whyTalked: input.whyTalked ?? null,
        dateOfInteraction: input.dateOfInteraction ?? null,
        strength: input.strength ?? 3,
        followUpNotes: input.followUpNotes ?? null,
        createdAt: now,
        updatedAt: now,
      });
      return { snapshot, tempId };
    },
    onSuccess: (edge, _input, context) => {
      if (context?.tempId) {
        useGraphStore.getState().deleteEdge(context.tempId);
      }
      addEdge(edge);
      setSaveStatus('saved');
    },
    onError: (err, _input, context) => {
      if (context?.snapshot) revertGraph(context.snapshot);
      handleMutationError(err);
    },
  });
}

export function useUpdateEdge() {
  const updateEdge = useGraphStore((s) => s.updateEdge);
  const setSaveStatus = useGraphStore((s) => s.setSaveStatus);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EdgeUpdateInput }) => {
      const { data: edge } = await api.patch<Edge>(`/edges/${id}`, data);
      return edge;
    },
    onMutate: async ({ id, data }) => {
      setSaveStatus('saving');
      const snapshot = snapshotGraph();
      updateEdge(id, data as Partial<Edge>);
      return { snapshot };
    },
    onSuccess: (edge) => {
      updateEdge(edge.id, edge);
      setSaveStatus('saved');
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) revertGraph(context.snapshot);
      handleMutationError(err);
    },
  });
}

export function useDeleteEdge() {
  const deleteEdge = useGraphStore((s) => s.deleteEdge);
  const setSaveStatus = useGraphStore((s) => s.setSaveStatus);

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/edges/${id}`);
      return id;
    },
    onMutate: async (id) => {
      setSaveStatus('saving');
      const snapshot = snapshotGraph();
      deleteEdge(id);
      return { snapshot };
    },
    onSuccess: () => {
      setSaveStatus('saved');
    },
    onError: (err, _id, context) => {
      if (context?.snapshot) revertGraph(context.snapshot);
      handleMutationError(err);
    },
  });
}
