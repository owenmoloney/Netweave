import type { Edge } from '@netweave/shared';
import { edgePulseOpacity } from '../utils/animation';
import { strengthToStrokeWidth } from '../utils/geometry';
import type { SimNode } from './renderNodes';

export interface EdgeRenderOptions {
  hoveredNodeId: string | null;
  hoveredEdgeId: string | null;
  animationTime: number;
}

function getEdgeColor(strength: number, animationTime: number, isHighlighted: boolean): string {
  const opacity = edgePulseOpacity(strength, animationTime);
  if (isHighlighted) {
    return `rgba(255,255,255,${Math.min(opacity + 0.3, 0.9)})`;
  }
  return `rgba(255,255,255,${opacity})`;
}

export function drawEdge(
  ctx: CanvasRenderingContext2D,
  edge: Edge,
  nodeById: Map<string, SimNode>,
  options: EdgeRenderOptions,
): void {
  const source = nodeById.get(edge.sourceId);
  const target = nodeById.get(edge.targetId);
  if (!source || !target) return;

  const sx = source.x ?? 0;
  const sy = source.y ?? 0;
  const tx = target.x ?? 0;
  const ty = target.y ?? 0;

  const isConnectedToHover =
    options.hoveredNodeId !== null &&
    (edge.sourceId === options.hoveredNodeId || edge.targetId === options.hoveredNodeId);
  const isEdgeHovered = options.hoveredEdgeId === edge.id;
  const isHighlighted = isConnectedToHover || isEdgeHovered;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = getEdgeColor(edge.strength, options.animationTime, isHighlighted);
  ctx.lineWidth = strengthToStrokeWidth(edge.strength);
  ctx.stroke();
}

export function drawAllEdges(
  ctx: CanvasRenderingContext2D,
  edges: Edge[],
  nodeById: Map<string, SimNode>,
  options: EdgeRenderOptions,
): void {
  for (const edge of edges) {
    drawEdge(ctx, edge, nodeById, options);
  }
}

export function getEdgeMidpoint(
  edge: Edge,
  nodeById: Map<string, SimNode>,
): { x: number; y: number } | null {
  const source = nodeById.get(edge.sourceId);
  const target = nodeById.get(edge.targetId);
  if (!source || !target) return null;
  return {
    x: ((source.x ?? 0) + (target.x ?? 0)) / 2,
    y: ((source.y ?? 0) + (target.y ?? 0)) / 2,
  };
}

export function buildNodeMap(nodes: SimNode[]): Map<string, SimNode> {
  return new Map(nodes.map((n) => [n.id, n]));
}

export function simNodesFromStore(nodes: import('@netweave/shared').Node[]): SimNode[] {
  return nodes.map((node) => ({
    ...node,
    x: node.posX ?? undefined,
    y: node.posY ?? undefined,
  }));
}
