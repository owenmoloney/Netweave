import type { GraphResponse, Node } from '@netweave/shared';
import { fetchGraph } from '../api/client';
import { throwIfError } from '../api/errors';
import { mapNode, type NodeRow } from '../api/mappers';
import { supabase } from '../lib/supabase';
import { organizeGraph } from '../api/organizeGraph';
import { companyNameFromEmail } from './filters';
import { findHomeCompany, isHomeCompanyName } from './homeCompany';
import { importNotes, meetingStrength } from './score';
import type { PersonCandidate } from './types';

function latestMeeting(candidate: PersonCandidate) {
  return candidate.meetings[0] ?? null;
}

function findPersonByEmail(graph: GraphResponse, email: string): Node | undefined {
  return graph.nodes.find(
    (node) => node.type === 'PERSON' && node.email?.toLowerCase() === email,
  );
}

function findCompanyByName(graph: GraphResponse, name: string): Node | undefined {
  return graph.nodes.find(
    (node) => node.type === 'COMPANY' && node.companyName?.toLowerCase() === name.toLowerCase(),
  );
}

function findSelf(graph: GraphResponse): Node | undefined {
  return graph.nodes.find((node) => node.type === 'SELF');
}

function findEdge(graph: GraphResponse, a: string, b: string) {
  return graph.edges.find(
    (edge) =>
      (edge.sourceId === a && edge.targetId === b) || (edge.sourceId === b && edge.targetId === a),
  );
}

async function insertNode(row: Record<string, unknown>): Promise<Node> {
  const result = await supabase.from('nodes').insert(row).select('*').single();
  throwIfError(result.error);
  return mapNode(result.data as NodeRow);
}

async function ensureCompany(graph: GraphResponse, candidate: PersonCandidate): Promise<string | null> {
  const name = companyNameFromEmail(candidate.email);
  if (!name) return null;
  if (isHomeCompanyName(name)) {
    const home = findHomeCompany(graph.nodes);
    if (home) return home.id;
  }
  const existing = findCompanyByName(graph, name);
  if (existing) return existing.id;

  const self = findSelf(graph);
  const node = await insertNode({
    type: 'COMPANY',
    company_name: name,
    pos_x: (self?.posX ?? 0) + 160,
    pos_y: (self?.posY ?? 0) - 40,
  });
  graph.nodes.push(node);
  return node.id;
}

async function upsertSelfEdge(
  graph: GraphResponse,
  selfId: string,
  personId: string,
  candidate: PersonCandidate,
): Promise<void> {
  const last = latestMeeting(candidate);
  const strength = meetingStrength(candidate.meetings, candidate.emailEvidence?.twoWayThreads ?? 0);
  const existing = findEdge(graph, selfId, personId);
  const payload = {
    relationship_type: 'met_at_event',
    how_met: last?.title ?? 'Google import',
    where_met: last ? 'Google Calendar' : 'Gmail',
    date_of_interaction: last?.date ?? null,
    strength,
  };

  if (existing) {
    const result = await supabase.from('edges').update(payload).eq('id', existing.id);
    throwIfError(result.error);
    return;
  }

  const result = await supabase.from('edges').insert({
    source_id: selfId,
    target_id: personId,
    ...payload,
  });
  if (result.error && result.error.code !== '23505') {
    throwIfError(result.error);
  }
}

export async function commitCandidates(candidates: PersonCandidate[]): Promise<{
  added: number;
  merged: number;
  graph: GraphResponse;
}> {
  let graph = await fetchGraph();
  const self = findSelf(graph);
  if (!self) throw new Error('Self node is missing');

  let added = 0;
  let merged = 0;

  for (const candidate of candidates) {
    const companyId = await ensureCompany(graph, candidate);
    const existing = findPersonByEmail(graph, candidate.email);
    const notes = importNotes(candidate);

    if (existing) {
      const result = await supabase
        .from('nodes')
        .update({
          notes: existing.notes?.includes('Imported from Google')
            ? notes
            : (existing.notes ?? notes),
          company_id: existing.companyId ?? companyId,
        })
        .eq('id', existing.id);
      throwIfError(result.error);
      await upsertSelfEdge(graph, self.id, existing.id, candidate);
      merged += 1;
      continue;
    }

    const person = await insertNode({
      type: 'PERSON',
      full_name: candidate.fullName,
      email: candidate.email,
      company_id: companyId,
      notes,
      pos_x: (self.posX ?? 0) + (Math.random() * 120 - 20) + 80,
      pos_y: (self.posY ?? 0) + (Math.random() * 120 - 60),
    });
    graph.nodes.push(person);

    if (companyId) {
      const colleague = await supabase.from('edges').insert({
        source_id: person.id,
        target_id: companyId,
        relationship_type: 'colleague',
        strength: 3,
      });
      if (colleague.error && colleague.error.code !== '23505') {
        throwIfError(colleague.error);
      }
    }

    await upsertSelfEdge(graph, self.id, person.id, candidate);
    added += 1;
  }

  graph = await organizeGraph();
  return { added, merged, graph };
}
