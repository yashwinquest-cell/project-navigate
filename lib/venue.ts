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
  corridor: VenueRoom;
  nodes: VenueNode[];
  edges: VenueEdge[];
  pois: PointOfInterest[];
}

export const demoVenue: Venue = {
  name: "Sunrise Mall — Ground Floor",
  viewBox: { w: 800, h: 500 },
  corridor: { x: 40, y: 230, w: 740, h: 40 },
  nodes: [
    { id: "entrance", x: 60, y: 250 },
    { id: "c1", x: 160, y: 250 },
    { id: "c2", x: 260, y: 250 },
    { id: "c3", x: 360, y: 250 },
    { id: "c4", x: 460, y: 250 },
    { id: "c5", x: 560, y: 250 },
    { id: "c6", x: 660, y: 250 },
    { id: "c7", x: 740, y: 250 },
    { id: "ticket", x: 160, y: 130 },
    { id: "exitA", x: 160, y: 370 },
    { id: "foodcourt", x: 260, y: 130 },
    { id: "toystore", x: 260, y: 370 },
    { id: "electronics", x: 460, y: 130 },
    { id: "restrooms", x: 460, y: 370 },
    { id: "cinema", x: 660, y: 130 },
    { id: "kidszone", x: 660, y: 370 },
    { id: "exitB", x: 740, y: 130 },
  ],
  edges: [
    { from: "entrance", to: "c1" },
    { from: "c1", to: "c2" },
    { from: "c2", to: "c3" },
    { from: "c3", to: "c4" },
    { from: "c4", to: "c5" },
    { from: "c5", to: "c6" },
    { from: "c6", to: "c7" },
    { from: "c1", to: "ticket" },
    { from: "c1", to: "exitA" },
    { from: "c2", to: "foodcourt" },
    { from: "c2", to: "toystore" },
    { from: "c4", to: "electronics" },
    { from: "c4", to: "restrooms" },
    { from: "c6", to: "cinema" },
    { from: "c6", to: "kidszone" },
    { from: "c7", to: "exitB" },
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
      room: { x: 110, y: 70, w: 100, h: 60 },
    },
    {
      id: "exitA",
      name: "Emergency Exit A",
      category: "exit",
      nodeId: "exitA",
      room: { x: 110, y: 370, w: 100, h: 60 },
    },
    {
      id: "foodcourt",
      name: "Food Court",
      category: "food",
      nodeId: "foodcourt",
      room: { x: 200, y: 70, w: 120, h: 60 },
    },
    {
      id: "toystore",
      name: "Toy World",
      category: "shop",
      nodeId: "toystore",
      room: { x: 200, y: 370, w: 120, h: 60 },
    },
    {
      id: "electronics",
      name: "TechZone Electronics",
      category: "shop",
      nodeId: "electronics",
      room: { x: 390, y: 70, w: 140, h: 60 },
    },
    {
      id: "restrooms",
      name: "Restrooms",
      category: "restroom",
      nodeId: "restrooms",
      room: { x: 390, y: 370, w: 140, h: 60 },
    },
    {
      id: "cinema",
      name: "Galaxy Cinema",
      category: "entertainment",
      nodeId: "cinema",
      room: { x: 590, y: 70, w: 140, h: 60 },
    },
    {
      id: "kidszone",
      name: "Kids Play Zone",
      category: "entertainment",
      nodeId: "kidszone",
      room: { x: 590, y: 370, w: 140, h: 60 },
    },
    {
      id: "exitB",
      name: "Emergency Exit B",
      category: "exit",
      nodeId: "exitB",
      room: { x: 690, y: 70, w: 100, h: 60 },
    },
  ],
};
