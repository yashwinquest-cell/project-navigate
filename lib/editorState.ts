import type {
  Venue,
  VenueRoom,
  PointOfInterest,
} from "./venue";
import { findRoute } from "./pathfinding";

export const CUSTOM_VENUE_KEY = "navigate:customVenue";

export const blankVenue: Venue = {
  name: "New Venue",
  viewBox: { w: 800, h: 500 },
  walkways: [],
  startNodeId: "",
  nodes: [],
  edges: [],
  pois: [],
};

function uniqueId(prefix: string, taken: Set<string>): string {
  let n = 1;
  let id = `${prefix}-${n}`;
  while (taken.has(id)) {
    n += 1;
    id = `${prefix}-${n}`;
  }
  return id;
}

export type EditorAction =
  | { type: "SET_NAME"; name: string }
  | { type: "SET_VIEWBOX"; w: number; h: number }
  | { type: "SET_START"; nodeId: string }
  | { type: "ADD_WALKWAY"; room: VenueRoom }
  | { type: "DELETE_WALKWAY"; index: number }
  | { type: "ADD_NODE"; x: number; y: number }
  | { type: "DELETE_NODE"; id: string }
  | { type: "ADD_EDGE"; from: string; to: string }
  | { type: "DELETE_EDGE"; index: number }
  | { type: "ADD_ROOM"; room: VenueRoom }
  | { type: "UPDATE_POI"; id: string; patch: Partial<PointOfInterest> }
  | { type: "DELETE_POI"; id: string }
  | { type: "LOAD"; venue: Venue }
  | { type: "RESET" };

export function editorReducer(state: Venue, action: EditorAction): Venue {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.name };
    case "SET_VIEWBOX":
      return { ...state, viewBox: { w: action.w, h: action.h } };
    case "SET_START":
      return { ...state, startNodeId: action.nodeId };
    case "ADD_WALKWAY":
      return { ...state, walkways: [...state.walkways, action.room] };
    case "DELETE_WALKWAY":
      return {
        ...state,
        walkways: state.walkways.filter((_, i) => i !== action.index),
      };
    case "ADD_NODE": {
      const id = uniqueId("node", new Set(state.nodes.map((n) => n.id)));
      return {
        ...state,
        nodes: [...state.nodes, { id, x: action.x, y: action.y }],
      };
    }
    case "DELETE_NODE": {
      const nodes = state.nodes.filter((n) => n.id !== action.id);
      const edges = state.edges.filter(
        (e) => e.from !== action.id && e.to !== action.id
      );
      const pois = state.pois.map((p) =>
        p.nodeId === action.id ? { ...p, nodeId: "" } : p
      );
      const startNodeId =
        state.startNodeId === action.id ? "" : state.startNodeId;
      return { ...state, nodes, edges, pois, startNodeId };
    }
    case "ADD_EDGE": {
      if (action.from === action.to) return state;
      const exists = state.edges.some(
        (e) =>
          (e.from === action.from && e.to === action.to) ||
          (e.from === action.to && e.to === action.from)
      );
      if (exists) return state;
      return {
        ...state,
        edges: [...state.edges, { from: action.from, to: action.to }],
      };
    }
    case "DELETE_EDGE":
      return { ...state, edges: state.edges.filter((_, i) => i !== action.index) };
    case "ADD_ROOM": {
      const id = uniqueId("poi", new Set(state.pois.map((p) => p.id)));
      const poi: PointOfInterest = {
        id,
        name: "New place",
        category: "shop",
        nodeId: "",
        room: action.room,
      };
      return { ...state, pois: [...state.pois, poi] };
    }
    case "UPDATE_POI":
      return {
        ...state,
        pois: state.pois.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      };
    case "DELETE_POI":
      return { ...state, pois: state.pois.filter((p) => p.id !== action.id) };
    case "LOAD":
      return action.venue;
    case "RESET":
      return blankVenue;
    default:
      return state;
  }
}

export interface ValidationResult {
  issues: string[];
  reachableCount: number;
  totalRoutablePois: number;
}

export function validateVenue(venue: Venue): ValidationResult {
  const issues: string[] = [];

  if (!venue.name.trim()) issues.push("Give the venue a name.");
  if (!venue.startNodeId)
    issues.push("Pick a start node (the entrance) in Venue settings.");
  if (venue.nodes.length === 0)
    issues.push("Add at least one node to build a walking path.");

  const unassigned = venue.pois.filter((p) => !p.nodeId);
  if (unassigned.length > 0) {
    issues.push(
      `${unassigned.length} place${unassigned.length === 1 ? "" : "s"} not linked to a node yet: ${unassigned
        .map((p) => p.name)
        .join(", ")}.`
    );
  }

  const routablePois = venue.pois.filter(
    (p) => p.nodeId && p.nodeId !== venue.startNodeId
  );
  let reachableCount = 0;
  if (venue.startNodeId) {
    for (const poi of routablePois) {
      if (findRoute(venue, venue.startNodeId, poi.nodeId)) reachableCount += 1;
    }
    const unreachable = routablePois.length - reachableCount;
    if (unreachable > 0) {
      issues.push(
        `${unreachable} place${unreachable === 1 ? "" : "s"} can't be reached from the start node — connect them with edges.`
      );
    }
  }

  return { issues, reachableCount, totalRoutablePois: routablePois.length };
}
