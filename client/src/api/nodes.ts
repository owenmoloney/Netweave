import { useMutation } from '@tanstack/react-query';
import type { Node, NodeCreateInput, NodeUpdateInput, GraphResponse } from '@netweave/shared';
import { api } from './client';
import { getApiErrorMessage, revertGraph, snapshotGraph, handleMutationError } from './mutationUtils';
import { useGraphStore } from '../stores/graphStore';

export function useCreateNode() {
  const addNode = useGraphStore((s) => s.addNode);
  const setSaveStatus = useGraphStore((s) => s.setSaveStatus);
  const setEdges = useGraphStore((s) => s.setEdges);
  const setNodes = useGraphStore((s) => s.setNodes);

  return useMutation({
    mutationFn: async (input: NodeCreateInput) => {
      const { data } = await api.post<Node>('/nodes', input);
      return data;
    },
    onMutate: async (input) => {
      setSaveStatus('saving');
      const snapshot = snapshotGraph();
      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const optimistic: Node = {
        id: tempId,
        userId: '',
        type: input.type,
        notes: input.notes ?? null,
        posX: input.posX ?? null,
        posY: input.posY ?? null,
        createdAt: now,
        updatedAt: now,
        fullName: input.type === 'PERSON' ? input.fullName : null,
        jobTitle: input.type === 'PERSON' ? (input.jobTitle ?? null) : null,
        email: input.type === 'PERSON' ? (input.email ?? null) : null,
        linkedInUrl: input.type === 'PERSON' ? (input.linkedInUrl ?? null) : null,
        companyId: input.type === 'PERSON' ? (input.companyId ?? null) : null,
        companyName:
          input.type === 'COMPANY' || input.type === 'CAREER_BOARD' ? input.companyName : null,
        industry: input.type === 'COMPANY' ? (input.industry ?? null) : null,
        location: input.type === 'COMPANY' ? (input.location ?? null) : null,
        website:
          input.type === 'COMPANY' || input.type === 'CAREER_BOARD'
            ? (input.website ?? null)
            : null,
      };
      addNode(optimistic);
      return { snapshot, tempId };
    },
    onSuccess: async (node, _input, context) => {
      if (context?.tempId) {
        useGraphStore.getState().deleteNode(context.tempId);
      }
      addNode(node);

      const { data: graph } = await api.get<GraphResponse>('/graph');
      setNodes(graph.nodes);
      setEdges(graph.edges);

      setSaveStatus('saved');
      return node;
    },
    onError: (err, _input, context) => {
      if (context?.snapshot) revertGraph(context.snapshot);
      handleMutationError(err);
    },
  });
}

export function useUpdateNode() {
  const updateNode = useGraphStore((s) => s.updateNode);
  const setSaveStatus = useGraphStore((s) => s.setSaveStatus);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NodeUpdateInput }) => {
      const { data: node } = await api.patch<Node>(`/nodes/${id}`, data);
      return node;
    },
    onMutate: async ({ id, data }) => {
      setSaveStatus('saving');
      const snapshot = snapshotGraph();
      updateNode(id, data as Partial<Node>);
      return { snapshot };
    },
    onSuccess: (node) => {
      updateNode(node.id, node);
      setSaveStatus('saved');
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) revertGraph(context.snapshot);
      handleMutationError(err);
    },
  });
}

export function useDeleteNode() {
  const deleteNode = useGraphStore((s) => s.deleteNode);
  const setSaveStatus = useGraphStore((s) => s.setSaveStatus);

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/nodes/${id}`);
      return id;
    },
    onMutate: async (id) => {
      setSaveStatus('saving');
      const snapshot = snapshotGraph();
      deleteNode(id);
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

export function useUpdateNodePosition() {
  const updateNode = useGraphStore((s) => s.updateNode);
  const setSaveStatus = useGraphStore((s) => s.setSaveStatus);

  return useMutation({
    mutationFn: async ({ id, x, y }: { id: string; x: number; y: number }) => {
      await api.patch(`/nodes/${id}/position`, { x, y });
    },
    onMutate: ({ id, x, y }) => {
      setSaveStatus('saving');
      const snapshot = snapshotGraph();
      updateNode(id, { posX: x, posY: y });
      return { snapshot };
    },
    onSuccess: () => {
      setSaveStatus('saved');
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) revertGraph(context.snapshot);
      handleMutationError(err);
    },
  });
}

export { getApiErrorMessage };
