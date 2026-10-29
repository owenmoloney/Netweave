import type { GraphResponse, Node, NodeCreateInput, NodeUpdateInput } from '@netweave/shared';
import { supabase } from '../lib/supabase';
import { useGraphStore } from '../stores/graphStore';
import { emptyToNull, mapEdge, mapNode, type EdgeRow, type NodeRow } from './mappers';
import { throwIfError } from './errors';

export async function fetchGraph(): Promise<GraphResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const [nodesResult, edgesResult] = await Promise.all([
    supabase.from('nodes').select('*'),
    supabase.from('edges').select('*'),
  ]);

  throwIfError(nodesResult.error);
  throwIfError(edgesResult.error);

  let nodes = (nodesResult.data as NodeRow[]).map(mapNode);
  const edges = (edgesResult.data as EdgeRow[]).map(mapEdge);

  if (!nodes.some((node) => node.type === 'SELF')) {
    nodes = [...nodes, await createSelfNode()];
  }

  return { nodes, edges };
}

async function createSelfNode(): Promise<Node> {
  const { data, error } = await supabase
    .from('nodes')
    .insert({
      type: 'SELF',
      full_name: 'You',
      pos_x: 0,
      pos_y: 0,
    })
    .select('*')
    .single();

  if (error) {
    const retry = await supabase.from('nodes').select('*').eq('type', 'SELF').maybeSingle();
    throwIfError(retry.error);
    if (!retry.data) throwIfError(error);
    return mapNode(retry.data as NodeRow);
  }

  return mapNode(data as NodeRow);
}

function defaultPosition(
  nodes: Node[],
  input: NodeCreateInput,
): { posX: number; posY: number } {
  if (input.posX !== undefined && input.posY !== undefined) {
    return { posX: input.posX, posY: input.posY };
  }

  if (input.type === 'PERSON' && input.companyId) {
    const company = nodes.find((node) => node.id === input.companyId);
    if (company) {
      return {
        posX: (company.posX ?? 0) + (Math.random() * 80 - 40),
        posY: (company.posY ?? 0) + (Math.random() * 80 - 40),
      };
    }
  }

  const self = nodes.find((node) => node.type === 'SELF');
  return {
    posX: (self?.posX ?? 0) + (Math.random() * 120 - 60) + 100,
    posY: (self?.posY ?? 0) + (Math.random() * 120 - 60),
  };
}

export async function createNode(input: NodeCreateInput): Promise<{ node: Node; graph: GraphResponse }> {
  const nodes = Array.from(useGraphStore.getState().nodes.values());

  if (input.type === 'PERSON' && input.companyId) {
    const company = nodes.find((node) => node.id === input.companyId && node.type === 'COMPANY');
    if (!company) {
      throw new Error('Company not found');
    }
  }

  const position = defaultPosition(nodes, input);

  const { data, error } = await supabase
    .from('nodes')
    .insert({
      type: input.type,
      full_name: input.type === 'PERSON' ? input.fullName : null,
      job_title: input.type === 'PERSON' ? emptyToNull(input.jobTitle) : null,
      company_id: input.type === 'PERSON' ? (input.companyId ?? null) : null,
      email: input.type === 'PERSON' ? emptyToNull(input.email) : null,
      linkedin_url: input.type === 'PERSON' ? emptyToNull(input.linkedInUrl) : null,
      company_name:
        input.type === 'COMPANY' || input.type === 'CAREER_BOARD' ? input.companyName : null,
      industry: input.type === 'COMPANY' ? emptyToNull(input.industry) : null,
      location: input.type === 'COMPANY' ? emptyToNull(input.location) : null,
      website:
        input.type === 'COMPANY' || input.type === 'CAREER_BOARD'
          ? emptyToNull(input.website)
          : null,
      notes: emptyToNull(input.notes),
      pos_x: position.posX,
      pos_y: position.posY,
    })
    .select('*')
    .single();

  throwIfError(error);
  const node = mapNode(data as NodeRow);

  if (input.type === 'PERSON' && input.companyId) {
    const edgeResult = await supabase.from('edges').insert({
      source_id: node.id,
      target_id: input.companyId,
      relationship_type: 'colleague',
      strength: 3,
    });
    throwIfError(edgeResult.error);
  }

  return { node, graph: await fetchGraph() };
}

export async function updateNode(id: string, input: NodeUpdateInput): Promise<Node> {
  const data: Record<string, unknown> = {};

  if ('fullName' in input && input.fullName !== undefined) data.full_name = input.fullName;
  if ('jobTitle' in input) data.job_title = emptyToNull(input.jobTitle);
  if ('companyId' in input) data.company_id = input.companyId ?? null;
  if ('email' in input) data.email = emptyToNull(input.email);
  if ('linkedInUrl' in input) data.linkedin_url = emptyToNull(input.linkedInUrl);
  if ('companyName' in input && input.companyName !== undefined) {
    data.company_name = input.companyName;
  }
  if ('industry' in input) data.industry = emptyToNull(input.industry);
  if ('location' in input) data.location = emptyToNull(input.location);
  if ('website' in input) data.website = emptyToNull(input.website);
  if ('notes' in input) data.notes = emptyToNull(input.notes);

  if ('companyId' in input && input.companyId) {
    const { data: company, error } = await supabase
      .from('nodes')
      .select('id, type')
      .eq('id', input.companyId)
      .maybeSingle();
    throwIfError(error);
    if (!company || company.type !== 'COMPANY') {
      throw new Error('Company not found');
    }
  }

  const result = await supabase.from('nodes').update(data).eq('id', id).select('*').single();
  throwIfError(result.error);
  return mapNode(result.data as NodeRow);
}

export async function deleteNode(id: string): Promise<void> {
  const result = await supabase.from('nodes').delete().eq('id', id);
  throwIfError(result.error);
}

export async function updateNodePosition(id: string, x: number, y: number): Promise<void> {
  const result = await supabase.from('nodes').update({ pos_x: x, pos_y: y }).eq('id', id);
  throwIfError(result.error);
}
