import { useEffect, useRef } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
} from 'd3';
import type { Edge } from '@netweave/shared';
import { getNodeRadius } from '../utils/colors';
import type { SimNode } from './renderNodes';

interface LinkDatum extends SimulationLinkDatum<SimNode> {
  id: string;
}

function pinNode(node: SimNode, x?: number, y?: number): void {
  const px = x ?? node.x ?? 0;
  const py = y ?? node.y ?? 0;
  node.x = px;
  node.y = py;
  node.fx = px;
  node.fy = py;
  node.vx = 0;
  node.vy = 0;
}

function pinAllNodes(nodes: SimNode[]): void {
  for (const node of nodes) {
    if (node.type === 'SELF') {
      pinNode(node, 0, 0);
    } else if (node.x != null && node.y != null) {
      pinNode(node);
    }
  }
}

function companyGravityForce(nodes: SimNode[], strength = 0.15) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  let alpha = 1;

  function force() {
    for (const node of nodes) {
      if (node.type !== 'PERSON' || !node.companyId) continue;
      if (node.fx != null && node.fy != null) continue;
      const company = nodeById.get(node.companyId);
      if (!company || company.x == null || company.y == null) continue;
      if (node.x == null || node.y == null) continue;

      const dx = company.x - node.x;
      const dy = company.y - node.y;
      node.vx = (node.vx ?? 0) + dx * strength * alpha;
      node.vy = (node.vy ?? 0) + dy * strength * alpha;
    }
  }

  force.initialize = () => {
    alpha = 1;
  };

  force.alpha = (a: number) => {
    alpha = a;
    return force;
  };

  return force;
}

export function useForceSimulation(
  nodes: SimNode[],
  edges: Edge[],
  width: number,
  height: number,
  onTick: (nodes: SimNode[]) => void,
) {
  const simulationRef = useRef<Simulation<SimNode, LinkDatum> | null>(null);
  const nodesRef = useRef<SimNode[]>(nodes);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    nodesRef.current = nodes.map((n) => ({ ...n }));

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    if (nodesRef.current.length === 0 || width === 0 || height === 0) return;

    for (const node of nodesRef.current) {
      if (node.type === 'SELF') {
        pinNode(node, 0, 0);
      } else if (node.posX != null && node.posY != null) {
        pinNode(node, node.posX, node.posY);
      }
    }

    const needsLayout = nodesRef.current.some(
      (n) => n.type !== 'SELF' && n.fx == null,
    );

    const links: LinkDatum[] = edges.map((edge) => ({
      source: edge.sourceId,
      target: edge.targetId,
      id: edge.id,
    }));

    const simulation = forceSimulation<SimNode>(nodesRef.current)
      .force(
        'link',
        forceLink<SimNode, LinkDatum>(links)
          .id((d) => d.id)
          .distance(120)
          .strength(0.4),
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(0, 0))
      .force(
        'collision',
        forceCollide<SimNode>().radius((d) => getNodeRadius(d) + 20),
      )
      .force('company-gravity', companyGravityForce(nodesRef.current, 0.15))
      .alphaDecay(0.05)
      .velocityDecay(0.6)
      .on('tick', () => {
        onTickRef.current([...nodesRef.current]);
      })
      .on('end', () => {
        pinAllNodes(nodesRef.current);
        onTickRef.current([...nodesRef.current]);
      });

    if (needsLayout) {
      simulation.alpha(0.6).restart();
    } else {
      simulation.stop();
      onTickRef.current([...nodesRef.current]);
    }

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height]);

  return simulationRef;
}

export function updateNodePosition(
  simulation: Simulation<SimNode, LinkDatum> | null,
  nodeId: string,
  x: number,
  y: number,
): void {
  if (!simulation) return;
  const node = simulation.nodes().find((n) => n.id === nodeId);
  if (!node || node.type === 'SELF') return;
  pinNode(node, x, y);
  simulation.stop();
  simulation.alpha(0);
}

export function pinNodeAtCurrentPosition(
  simulation: Simulation<SimNode, LinkDatum> | null,
  nodeId: string,
): void {
  if (!simulation) return;
  const node = simulation.nodes().find((n) => n.id === nodeId);
  if (!node || node.type === 'SELF') return;
  if (node.x != null && node.y != null) {
    pinNode(node);
  }
  simulation.stop();
  simulation.alpha(0);
}
