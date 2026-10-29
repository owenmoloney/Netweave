import type { Edge, EdgeCreateInput, EdgeUpdateInput } from '@netweave/shared';
import { isValidNodeConnection } from '@netweave/shared';
import { supabase } from '../lib/supabase';
import { emptyToNull, mapEdge, type EdgeRow } from './mappers';
import { throwIfError } from './errors';
import { useGraphStore } from '../stores/graphStore';

export async function createEdge(input: EdgeCreateInput): Promise<Edge> {
  if (input.sourceId === input.targetId) {
    throw new Error('Cannot connect a node to itself');
  }

  const nodes = Array.from(useGraphStore.getState().nodes.values());
  const source = nodes.find((node) => node.id === input.sourceId);
  const target = nodes.find((node) => node.id === input.targetId);

  if (!source || !target) {
    throw new Error('Source or target node not found');
  }

  if (!isValidNodeConnection(source, target)) {
    throw new Error('Invalid connection between these node types');
  }

  const { data, error } = await supabase
    .from('edges')
    .insert({
      source_id: input.sourceId,
      target_id: input.targetId,
      relationship_type: input.relationshipType ?? 'other',
      how_met: emptyToNull(input.howMet),
      where_met: emptyToNull(input.whereMet),
      why_talked: emptyToNull(input.whyTalked),
      date_of_interaction: input.dateOfInteraction ?? null,
      strength: input.strength ?? 3,
      follow_up_notes: emptyToNull(input.followUpNotes),
    })
    .select('*')
    .single();

  throwIfError(error);
  return mapEdge(data as EdgeRow);
}

export async function updateEdge(id: string, input: EdgeUpdateInput): Promise<Edge> {
  const data: Record<string, unknown> = {};

  if (input.relationshipType !== undefined) data.relationship_type = input.relationshipType;
  if ('howMet' in input) data.how_met = emptyToNull(input.howMet);
  if ('whereMet' in input) data.where_met = emptyToNull(input.whereMet);
  if ('whyTalked' in input) data.why_talked = emptyToNull(input.whyTalked);
  if ('dateOfInteraction' in input) {
    data.date_of_interaction = input.dateOfInteraction ?? null;
  }
  if (input.strength !== undefined) data.strength = input.strength;
  if ('followUpNotes' in input) data.follow_up_notes = emptyToNull(input.followUpNotes);

  const result = await supabase.from('edges').update(data).eq('id', id).select('*').single();
  throwIfError(result.error);
  return mapEdge(result.data as EdgeRow);
}

export async function deleteEdge(id: string): Promise<void> {
  const result = await supabase.from('edges').delete().eq('id', id);
  throwIfError(result.error);
}
