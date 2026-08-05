export type Category =
  | "entrance"
  | "ticket"
  | "exit"
  | "food"
  | "shop"
  | "restroom"
  | "entertainment";

export interface VenueNode {
  id: string;
  x: number;
  y: number;
}

export interface VenueEdge {
  from: string;
  to: string;
}

export interface VenueRoom {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  category: Category;
  nodeId: string;
  room?: VenueRoom;
}

export interface Venue {
  name: string;
  viewBox: { w: number; h: number };
  /** Walkable floor areas, drawn under everything else. */
  walkways: VenueRoom[];
  startNodeId: string;
  nodes: VenueNode[];
  edges: VenueEdge[];
  pois: PointOfInterest[];
}

export const demoVenue: Venue = {
  name: "Sunrise Mall — Ground Floor",
  viewBox: { w: 920, h: 500 },
  walkways: [{ x: 20, y: 230, w: 880, h: 40 }],
  startNodeId: "entrance",
  nodes: [
    { id: "entrance", x: 60, y: 250 },
    { id: "c1", x: 200, y: 250 },
    { id: "c2", x: 350, y: 250 },
    { id: "c3", x: 520, y: 250 },
    { id: "c4", x: 690, y: 250 },
    { id: "c5", x: 840, y: 250 },
    { id: "ticket", x: 200, y: 130 },
    { id: "exitA", x: 200, y: 370 },
    { id: "foodcourt", x: 350, y: 130 },
    { id: "toystore", x: 350, y: 370 },
    { id: "electronics", x: 520, y: 130 },
    { id: "restrooms", x: 520, y: 370 },
    { id: "cinema", x: 690, y: 130 },
    { id: "kidszone", x: 690, y: 370 },
    { id: "exitB", x: 840, y: 130 },
  ],
  edges: [
    { from: "entrance", to: "c1" },
    { from: "c1", to: "c2" },
    { from: "c2", to: "c3" },
    { from: "c3", to: "c4" },
    { from: "c4", to: "c5" },
    { from: "c1", to: "ticket" },
    { from: "c1", to: "exitA" },
    { from: "c2", to: "foodcourt" },
    { from: "c2", to: "toystore" },
    { from: "c3", to: "electronics" },
    { from: "c3", to: "restrooms" },
    { from: "c4", to: "cinema" },
    { from: "c4", to: "kidszone" },
    { from: "c5", to: "exitB" },
  ],
  pois: [
    {
      id: "entrance",
      name: "Main Entrance",
      category: "entrance",
      nodeId: "entrance",
    },
    {
      id: "ticket",
      name: "Ticket Counter",
      category: "ticket",
      nodeId: "ticket",
      room: { x: 150, y: 70, w: 100, h: 60 },
    },
    {
      id: "exitA",
      name: "Emergency Exit A",
      category: "exit",
      nodeId: "exitA",
      room: { x: 150, y: 370, w: 100, h: 60 },
    },
    {
      id: "foodcourt",
      name: "Food Court",
      category: "food",
      nodeId: "foodcourt",
      room: { x: 290, y: 70, w: 120, h: 60 },
    },
    {
      id: "toystore",
      name: "Toy World",
      category: "shop",
      nodeId: "toystore",
      room: { x: 290, y: 370, w: 120, h: 60 },
    },
    {
      id: "electronics",
      name: "TechZone Electronics",
      category: "shop",
      nodeId: "electronics",
      room: { x: 450, y: 70, w: 140, h: 60 },
    },
    {
      id: "restrooms",
      name: "Restrooms",
      category: "restroom",
      nodeId: "restrooms",
      room: { x: 450, y: 370, w: 140, h: 60 },
    },
    {
      id: "cinema",
      name: "Galaxy Cinema",
      category: "entertainment",
      nodeId: "cinema",
      room: { x: 620, y: 70, w: 140, h: 60 },
    },
    {
      id: "kidszone",
      name: "Kids Play Zone",
      category: "entertainment",
      nodeId: "kidszone",
      room: { x: 620, y: 370, w: 140, h: 60 },
    },
    {
      id: "exitB",
      name: "Emergency Exit B",
      category: "exit",
      nodeId: "exitB",
      room: { x: 790, y: 70, w: 100, h: 60 },
    },
  ],
};
