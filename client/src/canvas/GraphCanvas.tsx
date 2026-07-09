import { useCallback, useEffect, useRef, useState } from 'react';
import { useGraphStore } from '../stores/graphStore';
import { useUpdateNodePosition } from '../api/nodes';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { easeOutCubic, lerp } from '../utils/animation';
import { RELATIONSHIP_LABELS } from '../utils/relationships';
import { drawBackground, drawNode, type SimNode } from './renderNodes';
import { buildNodeMap, drawAllEdges, getEdgeMidpoint, simNodesFromStore } from './renderEdges';
import { useForceSimulation } from './useForceSimulation';
import { useCanvasInteraction } from './useCanvasInteraction';

const FOCUS_DURATION_MS = 500;

export function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const simNodesRef = useRef<SimNode[]>([]);
  const animationTimeRef = useRef(0);
  const pulseRafRef = useRef<number>();
  const transformRef = useRef(useGraphStore.getState().transform);

  const nodesMap = useGraphStore((s) => s.nodes);
  const edgesMap = useGraphStore((s) => s.edges);
  const transform = useGraphStore((s) => s.transform);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const hoveredNodeId = useGraphStore((s) => s.hoveredNodeId);
  const hoveredEdgeId = useGraphStore((s) => s.hoveredEdgeId);
  const focusTarget = useGraphStore((s) => s.focusTarget);
  const setTransform = useGraphStore((s) => s.setTransform);
  const setFocusTarget = useGraphStore((s) => s.setFocusTarget);
  const selectNode = useGraphStore((s) => s.selectNode);
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);
  const updatePosition = useUpdateNodePosition();

  const [edgeTooltip, setEdgeTooltip] = useState<{
    screenX: number;
    screenY: number;
    label: string;
  } | null>(null);

  transformRef.current = transform;

  const savePosition = useDebouncedCallback((nodeId: string, x: number, y: number) => {
    updatePosition.mutate({ id: nodeId, x, y });
  }, 500);

  const handleNodeDragEnd = useCallback(
    (nodeId: string, x: number, y: number) => {
      savePosition(nodeId, x, y);
    },
    [savePosition],
  );

  const storeNodes = Array.from(nodesMap.values());
  const storeEdges = Array.from(edgesMap.values());
  const initialSimNodes = simNodesFromStore(storeNodes);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    const t = transformRef.current;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawBackground(ctx, width, height);

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(t.scale, t.scale);

    const nodeMap = buildNodeMap(simNodesRef.current);
    drawAllEdges(ctx, storeEdges, nodeMap, {
      hoveredNodeId,
      hoveredEdgeId,
      animationTime: animationTimeRef.current,
    });

    const renderOptions = { selectedId: selectedNodeId, hoveredId: hoveredNodeId };
    for (const node of simNodesRef.current) {
      drawNode(ctx, node, renderOptions);
    }

    ctx.restore();

    if (hoveredEdgeId) {
      const edge = storeEdges.find((e) => e.id === hoveredEdgeId);
      if (edge) {
        const mid = getEdgeMidpoint(edge, nodeMap);
        if (mid) {
          setEdgeTooltip({
            screenX: mid.x * t.scale + t.x,
            screenY: mid.y * t.scale + t.y,
            label: RELATIONSHIP_LABELS[edge.relationshipType],
          });
          return;
        }
      }
    }
    setEdgeTooltip(null);
  }, [dimensions, storeEdges, selectedNodeId, hoveredNodeId, hoveredEdgeId]);

  const handleTick = useCallback(
    (nodes: SimNode[]) => {
      simNodesRef.current = nodes;
      draw();
    },
    [draw],
  );

  const simulationRef = useForceSimulation(
    initialSimNodes,
    storeEdges,
    dimensions.width,
    dimensions.height,
    handleTick,
  );

  const getNodes = useCallback(() => simNodesRef.current, []);

  const { handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleClick } =
    useCanvasInteraction({
      transform,
      setTransform,
      selectNode,
      setHoveredNode,
      onNodeDragEnd: handleNodeDragEnd,
      simulation: simulationRef,
      getNodes,
      edges: storeEdges,
    });

  // Edge pulse animation loop
  useEffect(() => {
    const tick = (now: number) => {
      animationTimeRef.current = now;
      draw();
      pulseRafRef.current = requestAnimationFrame(tick);
    };
    pulseRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (pulseRafRef.current) cancelAnimationFrame(pulseRafRef.current);
    };
  }, [draw]);

  // Smooth focus animation
  useEffect(() => {
    if (!focusTarget) return;

    const start = { ...transformRef.current };
    const startTime = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const t = easeOutCubic(Math.min((now - startTime) / FOCUS_DURATION_MS, 1));
      const next = {
        x: lerp(start.x, focusTarget.x, t),
        y: lerp(start.y, focusTarget.y, t),
        scale: lerp(start.scale, focusTarget.scale, t),
      };
      transformRef.current = next;
      setTransform(next);
      draw();

      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setFocusTarget(null);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [focusTarget, setTransform, setFocusTarget, draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    simNodesRef.current = simNodesFromStore(storeNodes);
    draw();
  }, [storeNodes, draw]);

  useEffect(() => {
    draw();
  }, [transform, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => handleWheel(e, canvas);
    const onMouseDown = (e: MouseEvent) => handleMouseDown(e, canvas);
    const onMouseMove = (e: MouseEvent) => handleMouseMove(e, canvas);
    const onMouseUp = () => handleMouseUp();
    const onClick = (e: MouseEvent) => handleClick(e, canvas);

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);

    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleClick]);

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && transform.x === 0 && transform.y === 0) {
      setTransform({
        x: dimensions.width / 2,
        y: dimensions.height / 2,
        scale: 1,
      });
    }
  }, [dimensions, transform.x, transform.y, setTransform]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full cursor-grab" />
      {edgeTooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-white/10 bg-surface-elevated px-2 py-1 text-xs text-text-primary shadow-lg"
          style={{ left: edgeTooltip.screenX, top: edgeTooltip.screenY - 8 }}
        >
          {edgeTooltip.label}
        </div>
      )}
    </div>
  );
}
