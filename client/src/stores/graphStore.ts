import type { Edge, Node } from '@netweave/shared';

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface GraphStore {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  transform: Transform;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  isPanelOpen: boolean;
  modal: 'addPerson' | 'addCompany' | 'addEdge' | null;
  addEdgeSourceId: string | null;
  saveStatus: 'saved' | 'saving' | 'error';
  isSearchOpen: boolean;
  focusTarget: { x: number; y: number; scale: number; nodeId: string } | null;
  hoveredEdgeId: string | null;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  updateEdge: (id: string, updates: Partial<Edge>) => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  focusNode: (id: string) => void;
  setHoveredNode: (id: string | null) => void;
  setTransform: (t: Partial<Transform>) => void;
  openModal: (modal: GraphStore['modal'], opts?: { sourceId?: string }) => void;
  closeModal: () => void;
  closePanel: () => void;
  setSaveStatus: (status: GraphStore['saveStatus']) => void;
  openSearch: () => void;
  closeSearch: () => void;
  setFocusTarget: (target: GraphStore['focusTarget']) => void;
  setHoveredEdge: (id: string | null) => void;
}

import { create } from 'zustand';

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: new Map(),
  edges: new Map(),
  transform: { x: 0, y: 0, scale: 1 },
  selectedNodeId: null,
  hoveredNodeId: null,
  isPanelOpen: false,
  modal: null,
  addEdgeSourceId: null,
  saveStatus: 'saved',
  isSearchOpen: false,
  focusTarget: null,
  hoveredEdgeId: null,

  setNodes: (nodes) => set({ nodes: new Map(nodes.map((n) => [n.id, n])) }),

  setEdges: (edges) => set({ edges: new Map(edges.map((e) => [e.id, e])) }),

  addNode: (node) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.set(node.id, node);
      return { nodes };
    }),

  updateNode: (id, updates) =>
    set((state) => {
      const existing = state.nodes.get(id);
      if (!existing) return state;
      const nodes = new Map(state.nodes);
      nodes.set(id, { ...existing, ...updates });
      return { nodes };
    }),

  deleteNode: (id) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.delete(id);
      const edges = new Map(state.edges);
      for (const [edgeId, edge] of edges) {
        if (edge.sourceId === id || edge.targetId === id) {
          edges.delete(edgeId);
        }
      }
      return {
        nodes,
        edges,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        isPanelOpen: state.selectedNodeId === id ? false : state.isPanelOpen,
      };
    }),

  addEdge: (edge) =>
    set((state) => {
      const edges = new Map(state.edges);
      edges.set(edge.id, edge);
      return { edges };
    }),

  updateEdge: (id, updates) =>
    set((state) => {
      const existing = state.edges.get(id);
      if (!existing) return state;
      const edges = new Map(state.edges);
      edges.set(id, { ...existing, ...updates });
      return { edges };
    }),

  deleteEdge: (id) =>
    set((state) => {
      const edges = new Map(state.edges);
      edges.delete(id);
      return { edges };
    }),

  selectNode: (id) =>
    set({
      selectedNodeId: id,
      isPanelOpen: id !== null,
    }),

  focusNode: (id) => {
    const node = get().nodes.get(id);
    if (!node) return;

    const x = node.posX ?? 0;
    const y = node.posY ?? 0;
    const scale = 1.5;
    const panelWidth = window.innerWidth < 768 ? 0 : 400;
    const canvasWidth = window.innerWidth - (get().isPanelOpen || id ? panelWidth : 0);
    const canvasHeight = window.innerHeight - 56;

    set({
      focusTarget: {
        nodeId: id,
        x: canvasWidth / 2 - x * scale,
        y: canvasHeight / 2 - y * scale,
        scale,
      },
      selectedNodeId: id,
      isPanelOpen: true,
    });
  },

  setHoveredNode: (id) => set({ hoveredNodeId: id, hoveredEdgeId: null }),

  setHoveredEdge: (id) => set({ hoveredEdgeId: id }),

  setTransform: (t) =>
    set((state) => ({
      transform: { ...state.transform, ...t },
    })),

  openModal: (modal, opts) =>
    set({
      modal,
      addEdgeSourceId: opts?.sourceId ?? null,
    }),

  closeModal: () => set({ modal: null, addEdgeSourceId: null }),

  closePanel: () => set({ isPanelOpen: false, selectedNodeId: null }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  openSearch: () => set({ isSearchOpen: true }),

  closeSearch: () => set({ isSearchOpen: false }),

  setFocusTarget: (focusTarget) => set({ focusTarget }),
}));
