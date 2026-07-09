import type { SimulationNodeDatum } from 'd3';
import type { Node } from '@netweave/shared';
import {
  COLORS,
  getNodeAccentColor,
  getNodeInitials,
  getNodeLabel,
  getNodeRadius,
} from '../utils/colors';
import { truncateLabel } from '../utils/geometry';

export interface SimNode extends SimulationNodeDatum, Node {}

export interface RenderNodeOptions {
  selectedId: string | null;
  hoveredId: string | null;
}

function applyGlow(
  ctx: CanvasRenderingContext2D,
  color: string,
  intensity: 'hover' | 'selected',
): void {
  ctx.shadowBlur = intensity === 'selected' ? 28 : 20;
  ctx.shadowColor = color;
}

function clearGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

export function drawSelfNode(
  ctx: CanvasRenderingContext2D,
  node: SimNode,
  options: RenderNodeOptions,
): void {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const radius = getNodeRadius(node);
  const isSelected = options.selectedId === node.id;
  const isHovered = options.hoveredId === node.id;

  if (isSelected || isHovered) {
    applyGlow(ctx, COLORS.accent, isSelected ? 'selected' : 'hover');
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.personFill;
  ctx.fill();
  ctx.lineWidth = isSelected ? 3 : 3;
  ctx.strokeStyle = COLORS.accent;
  ctx.stroke();

  clearGlow(ctx);

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 40px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getNodeInitials(node), x, y);

  drawNodeLabel(ctx, x, y, radius, getNodeLabel(node));
}

export function drawPersonNode(
  ctx: CanvasRenderingContext2D,
  node: SimNode,
  options: RenderNodeOptions,
): void {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const radius = getNodeRadius(node);
  const accent = getNodeAccentColor(node);
  const isSelected = options.selectedId === node.id;
  const isHovered = options.hoveredId === node.id;

  if (isSelected || isHovered) {
    applyGlow(ctx, accent, isSelected ? 'selected' : 'hover');
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.personFill;
  ctx.fill();
  ctx.lineWidth = isSelected ? 3 : 1;
  ctx.strokeStyle = isSelected ? accent : 'rgba(255,255,255,0.1)';
  ctx.stroke();

  clearGlow(ctx);

  ctx.fillStyle = accent;
  ctx.font = '600 28px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getNodeInitials(node), x, y);

  drawNodeLabel(ctx, x, y, radius, getNodeLabel(node));
}

export function drawCompanyNode(
  ctx: CanvasRenderingContext2D,
  node: SimNode,
  options: RenderNodeOptions,
): void {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const size = getNodeRadius(node) * 2;
  const accent = getNodeAccentColor(node);
  const isSelected = options.selectedId === node.id;
  const isHovered = options.hoveredId === node.id;
  const left = x - size / 2;
  const top = y - size / 2;

  if (isSelected || isHovered) {
    applyGlow(ctx, accent, isSelected ? 'selected' : 'hover');
  }

  ctx.beginPath();
  ctx.roundRect(left, top, size, size, 16);
  ctx.fillStyle = COLORS.companyFill;
  ctx.fill();
  ctx.lineWidth = isSelected ? 3 : 1;
  ctx.strokeStyle = isSelected ? accent : accent;
  ctx.stroke();

  clearGlow(ctx);

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = '600 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getNodeInitials(node), x, y);

  drawNodeLabel(ctx, x, y, size / 2, getNodeLabel(node));
}

function drawNodeLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  label: string,
): void {
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = '24px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateLabel(label), x, y + radius + 16);
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: SimNode,
  options: RenderNodeOptions,
): void {
  switch (node.type) {
    case 'SELF':
      drawSelfNode(ctx, node, options);
      break;
    case 'PERSON':
      drawPersonNode(ctx, node, options);
      break;
    case 'COMPANY':
      drawCompanyNode(ctx, node, options);
      break;
  }
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.6,
  );
  gradient.addColorStop(0, 'rgba(124,109,235,0.04)');
  gradient.addColorStop(1, 'rgba(7,11,20,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
