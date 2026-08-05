import type { Venue, VenueNode } from "./venue";

function distance(a: VenueNode, b: VenueNode): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface RouteResult {
  nodeIds: string[];
  points: { x: number; y: number }[];
  distance: number;
}

/**
 * Dijkstra's algorithm over the venue's undirected corridor graph.
 * The graph is small enough that a plain array-based priority queue is fine.
 */
export function findRoute(
  venue: Venue,
  startId: string,
  endId: string
): RouteResult | null {
  const nodesById = new Map(venue.nodes.map((n) => [n.id, n]));
  if (!nodesById.has(startId) || !nodesById.has(endId)) return null;

  const neighbors = new Map<string, string[]>();
  for (const node of venue.nodes) neighbors.set(node.id, []);
  for (const edge of venue.edges) {
    neighbors.get(edge.from)?.push(edge.to);
    neighbors.get(edge.to)?.push(edge.from);
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  for (const node of venue.nodes) dist.set(node.id, Infinity);
  dist.set(startId, 0);

  while (visited.size < venue.nodes.length) {
    let current: string | null = null;
    let currentDist = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < currentDist) {
        current = id;
        currentDist = d;
      }
    }
    if (current === null) break;
    if (current === endId) break;
    visited.add(current);

    const currentNode = nodesById.get(current)!;
    for (const neighborId of neighbors.get(current) ?? []) {
      if (visited.has(neighborId)) continue;
      const neighborNode = nodesById.get(neighborId)!;
      const candidate = currentDist + distance(currentNode, neighborNode);
      if (candidate < (dist.get(neighborId) ?? Infinity)) {
        dist.set(neighborId, candidate);
        prev.set(neighborId, current);
      }
    }
  }

  if (dist.get(endId) === Infinity || dist.get(endId) === undefined) {
    return null;
  }

  const nodeIds: string[] = [];
  let step: string | undefined = endId;
  while (step !== undefined) {
    nodeIds.unshift(step);
    if (step === startId) break;
    step = prev.get(step);
  }

  return {
    nodeIds,
    points: nodeIds.map((id) => {
      const n = nodesById.get(id)!;
      return { x: n.x, y: n.y };
    }),
    distance: dist.get(endId) ?? 0,
  };
}
