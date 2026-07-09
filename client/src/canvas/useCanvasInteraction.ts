import { useCallback, useRef } from 'react';
import type { Simulation, SimulationLinkDatum } from 'd3';
import type { Edge } from '@netweave/shared';
import { distance, distanceToSegment, screenToGraph, clamp } from '../utils/geometry';
import { getNodeRadius } from '../utils/colors';
import { useGraphStore } from '../stores/graphStore';
import type { SimNode } from './renderNodes';
import { pinNodeAtCurrentPosition, updateNodePosition } from './useForceSimulation';

interface UseCanvasInteractionOptions {
  transform: { x: number; y: number; scale: number };
  setTransform: (t: Partial<{ x: number; y: number; scale: number }>) => void;
  selectNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  onNodeDragEnd: (nodeId: string, x: number, y: number) => void;
  simulation: React.MutableRefObject<Simulation<SimNode, SimulationLinkDatum<SimNode>> | null>;
  getNodes: () => SimNode[];
  edges: Edge[];
}

type DragMode = 'pan' | 'node' | null;

export function useCanvasInteraction({
  transform,
  setTransform,
  selectNode,
  setHoveredNode,
  onNodeDragEnd,
  simulation,
  getNodes,
  edges,
}: UseCanvasInteractionOptions) {
  const setHoveredEdge = useGraphStore((s) => s.setHoveredEdge);
  const dragModeRef = useRef<DragMode>(null);
  const draggedNodeIdRef = useRef<string | null>(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const findNodeAt = useCallback(
    (graphX: number, graphY: number): SimNode | null => {
      const nodes = getNodes();
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const nx = node.x ?? 0;
        const ny = node.y ?? 0;
        const radius = getNodeRadius(node) + 4;
        if (distance(graphX, graphY, nx, ny) <= radius) {
          return node;
        }
      }
      return null;
    },
    [getNodes],
  );

  const findEdgeAt = useCallback(
    (graphX: number, graphY: number, nodeId: string | null): string | null => {
      const nodes = getNodes();
      const nodeById = new Map(nodes.map((n) => [n.id, n]));
      const threshold = 10 / transform.scale;

      let closest: { id: string; dist: number } | null = null;
      for (const edge of edges) {
        if (nodeId && edge.sourceId !== nodeId && edge.targetId !== nodeId) continue;
        const source = nodeById.get(edge.sourceId);
        const target = nodeById.get(edge.targetId);
        if (!source || !target) continue;

        const dist = distanceToSegment(
          graphX,
          graphY,
          source.x ?? 0,
          source.y ?? 0,
          target.x ?? 0,
          target.y ?? 0,
        );
        if (dist <= threshold && (!closest || dist < closest.dist)) {
          closest = { id: edge.id, dist };
        }
      }
      return closest?.id ?? null;
    },
    [edges, getNodes, transform.scale],
  );

  const handleWheel = useCallback(
    (e: WheelEvent, canvas: HTMLCanvasElement) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newScale = clamp(transform.scale * zoomFactor, 0.1, 3.0);

      const graphX = (mouseX - transform.x) / transform.scale;
      const graphY = (mouseY - transform.y) / transform.scale;

      setTransform({
        scale: newScale,
        x: mouseX - graphX * newScale,
        y: mouseY - graphY * newScale,
      });
    },
    [transform, setTransform],
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const graph = screenToGraph(screenX, screenY, transform);

      const hit = findNodeAt(graph.x, graph.y);
      if (hit && hit.type !== 'SELF') {
        dragModeRef.current = 'node';
        draggedNodeIdRef.current = hit.id;
        updateNodePosition(simulation.current, hit.id, graph.x, graph.y);
      } else {
        dragModeRef.current = 'pan';
        draggedNodeIdRef.current = null;
      }

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    },
    [transform, findNodeAt, simulation],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const graph = screenToGraph(screenX, screenY, transform);

      if (dragModeRef.current === 'node' && draggedNodeIdRef.current) {
        updateNodePosition(simulation.current, draggedNodeIdRef.current, graph.x, graph.y);
        return;
      }

      if (dragModeRef.current === 'pan') {
        const dx = e.clientX - lastPointerRef.current.x;
        const dy = e.clientY - lastPointerRef.current.y;
        setTransform({
          x: transform.x + dx,
          y: transform.y + dy,
        });
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const hit = findNodeAt(graph.x, graph.y);
      setHoveredNode(hit?.id ?? null);
      const edgeId = findEdgeAt(graph.x, graph.y, hit?.id ?? null);
      setHoveredEdge(edgeId);
      canvas.style.cursor = hit || edgeId ? 'pointer' : 'grab';
    },
    [transform, setTransform, findNodeAt, findEdgeAt, setHoveredNode, setHoveredEdge, simulation],
  );

  const handleMouseUp = useCallback(() => {
    if (draggedNodeIdRef.current) {
      const nodeId = draggedNodeIdRef.current;
      const node = simulation.current?.nodes().find((n) => n.id === nodeId);
      if (node && node.x != null && node.y != null) {
        onNodeDragEnd(nodeId, node.x, node.y);
      }
      pinNodeAtCurrentPosition(simulation.current, nodeId);
    }
    dragModeRef.current = null;
    draggedNodeIdRef.current = null;
  }, [simulation, onNodeDragEnd]);

  const handleClick = useCallback(
    (e: MouseEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const graph = screenToGraph(screenX, screenY, transform);
      const hit = findNodeAt(graph.x, graph.y);
      selectNode(hit?.id ?? null);
    },
    [transform, findNodeAt, selectNode],
  );

  return {
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
  };
}
