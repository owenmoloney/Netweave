import type { GraphResponse, Node } from '@netweave/shared';
import { HOME_COMPANY_X, layoutClusters } from '../canvas/clusterLayout';
import { HOME_COMPANY_NAME, findHomeCompany, isHomeCompanyEmail } from '../google/homeCompany';
import { supabase } from '../lib/supabase';
import { fetchGraph } from './client';
import { throwIfError } from './errors';
import { mapNode, type NodeRow } from './mappers';

function findSelf(graph: GraphResponse): Node | undefined {
  return graph.nodes.find((node) => node.type === 'SELF');
}

function findEdge(graph: GraphResponse, a: string, b: string) {
  return graph.edges.find(
    (edge) =>
      (edge.sourceId === a && edge.targetId === b) || (edge.sourceId === b && edge.targetId === a),
  );
}

async function insertCompany(name: string): Promise<Node> {
  const result = await supabase
    .from('nodes')
    .insert({
      type: 'COMPANY',
      company_name: name,
      pos_x: HOME_COMPANY_X,
      pos_y: 0,
    })
    .select('*')
    .single();
  throwIfError(result.error);
  return mapNode(result.data as NodeRow);
}

async function ensureColleagueEdge(sourceId: string, targetId: string): Promise<void> {
  const result = await supabase.from('edges').insert({
    source_id: sourceId,
    target_id: targetId,
    relationship_type: 'colleague',
    strength: 4,
  });
  if (result.error && result.error.code !== '23505') {
    throwIfError(result.error);
  }
}

export async function ensureHomeCompany(graph: GraphResponse): Promise<GraphResponse> {
  const self = findSelf(graph);
  let home = findHomeCompany(graph.nodes);
  if (!home) {
    home = await insertCompany(HOME_COMPANY_NAME);
    graph.nodes.push(home);
  } else if (home.companyName !== HOME_COMPANY_NAME) {
    const result = await supabase
      .from('nodes')
      .update({ company_name: HOME_COMPANY_NAME })
      .eq('id', home.id);
    throwIfError(result.error);
    home.companyName = HOME_COMPANY_NAME;
  }
  if (self && !findEdge(graph, self.id, home.id)) {
    await ensureColleagueEdge(self.id, home.id);
  }
  return graph;
}

export async function attachHomeCompanyPeople(graph: GraphResponse): Promise<void> {
  const home = findHomeCompany(graph.nodes);
  if (!home) return;

  for (const person of graph.nodes) {
    if (person.type !== 'PERSON' || !person.email || !isHomeCompanyEmail(person.email)) continue;
    if (!person.companyId) {
      const result = await supabase.from('nodes').update({ company_id: home.id }).eq('id', person.id);
      throwIfError(result.error);
      person.companyId = home.id;
    }
    if (person.companyId === home.id) {
      await ensureColleagueEdge(person.id, home.id);
    }
  }
}

async function persistPositions(nodes: Node[]): Promise<void> {
  await Promise.all(
    nodes.map(async (node) => {
      const result = await supabase
        .from('nodes')
        .update({ pos_x: node.posX, pos_y: node.posY })
        .eq('id', node.id);
      throwIfError(result.error);
    }),
  );
}

export async function organizeGraph(): Promise<GraphResponse> {
  let graph = await fetchGraph();
  graph = await ensureHomeCompany(graph);
  await attachHomeCompanyPeople(graph);
  graph = await fetchGraph();
  const laidOut = layoutClusters(graph.nodes);
  await persistPositions(laidOut);
  return fetchGraph();
}
