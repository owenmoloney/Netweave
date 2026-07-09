import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Node, Edge } from '@netweave/shared';
import { useGraphStore } from './graphStore';

const makeNode = (overrides: Partial<Node> & Pick<Node, 'id' | 'type'>): Node => ({
  userId: 'user-1',
  notes: null,
  posX: 0,
  posY: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  fullName: null,
  jobTitle: null,
  email: null,
  linkedInUrl: null,
  companyId: null,
  companyName: null,
  industry: null,
  location: null,
  website: null,
  ...overrides,
});

const makeEdge = (overrides: Partial<Edge> & Pick<Edge, 'id' | 'sourceId' | 'targetId'>): Edge => ({
  userId: 'user-1',
  relationshipType: 'colleague',
  howMet: null,
  whereMet: null,
  whyTalked: null,
  dateOfInteraction: null,
  strength: 3,
  followUpNotes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  useGraphStore.setState({
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
  });
  vi.stubGlobal('innerWidth', 1200);
  vi.stubGlobal('innerHeight', 800);
});

describe('graphStore', () => {
  it('adds and retrieves nodes', () => {
    const node = makeNode({ id: 'n1', type: 'PERSON', fullName: 'Alice' });
    useGraphStore.getState().addNode(node);
    expect(useGraphStore.getState().nodes.get('n1')?.fullName).toBe('Alice');
  });

  it('deleteNode removes connected edges', () => {
    const person = makeNode({ id: 'p1', type: 'PERSON', fullName: 'Bob' });
    const company = makeNode({ id: 'c1', type: 'COMPANY', companyName: 'Acme' });
    const edge = makeEdge({ id: 'e1', sourceId: 'p1', targetId: 'c1' });

    const store = useGraphStore.getState();
    store.addNode(person);
    store.addNode(company);
    store.addEdge(edge);

    store.deleteNode('p1');

    expect(useGraphStore.getState().nodes.has('p1')).toBe(false);
    expect(useGraphStore.getState().edges.has('e1')).toBe(false);
  });

  it('focusNode sets focusTarget and opens panel', () => {
    const node = makeNode({ id: 'n1', type: 'PERSON', fullName: 'Carol', posX: 100, posY: 50 });
    useGraphStore.getState().addNode(node);
    useGraphStore.getState().focusNode('n1');

    const state = useGraphStore.getState();
    expect(state.selectedNodeId).toBe('n1');
    expect(state.isPanelOpen).toBe(true);
    expect(state.focusTarget).toMatchObject({
      nodeId: 'n1',
      scale: 1.5,
    });
    expect(state.focusTarget?.x).toBe(800 / 2 - 100 * 1.5);
    expect(state.focusTarget?.y).toBe((800 - 56) / 2 - 50 * 1.5);
  });

  it('selectNode opens panel', () => {
    useGraphStore.getState().selectNode('abc');
    expect(useGraphStore.getState().isPanelOpen).toBe(true);
    useGraphStore.getState().selectNode(null);
    expect(useGraphStore.getState().isPanelOpen).toBe(false);
  });

  it('openModal sets modal state', () => {
    useGraphStore.getState().openModal('addEdge', { sourceId: 'src-1' });
    const state = useGraphStore.getState();
    expect(state.modal).toBe('addEdge');
    expect(state.addEdgeSourceId).toBe('src-1');
  });
});
