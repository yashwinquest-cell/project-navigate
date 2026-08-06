export type Category =
  | "entrance"
  | "ticket"
  | "exit"
  | "food"
  | "shop"
  | "restroom"
  | "entertainment"
  | "nature";

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

/**
 * Eco Park (New Town, Kolkata) — digitized from the HIDCO master plan.
 * A schematic single winding path down the park's real visitor route,
 * with each zone's actual name/category from the plan's legend branching
 * off it. Coordinates are schematic (like a transit map), not to scale.
 */
interface BranchSpec {
  id: string;
  name: string;
  category: Category;
}
interface BranchRow {
  left: BranchSpec;
  right: BranchSpec;
}

const SPINE_X = 330;
const START_Y = 40;
const SPINE_SPACING = 100;
const BRANCH_GAP = 150;
const ROOM_W = 140;
const ROOM_H = 60;

const branchRows: BranchRow[] = [
  { left: { id: "visitorcenter", name: "Visitors Center", category: "entertainment" }, right: { id: "toilet1", name: "Toilet", category: "restroom" } },
  { left: { id: "sevenwonders", name: "7-Wonders", category: "entertainment" }, right: { id: "childrenpark", name: "Children Park", category: "entertainment" } },
  { left: { id: "foodcourt", name: "Food Court", category: "food" }, right: { id: "butterflygarden", name: "Butterfly Garden", category: "nature" } },
  { left: { id: "helliconiagarden", name: "Helliconia Garden", category: "nature" }, right: { id: "aviary", name: "Aviary", category: "entertainment" } },
  { left: { id: "snowtheme", name: "Snow Theme Park", category: "entertainment" }, right: { id: "deerpark", name: "Deer Park", category: "nature" } },
  { left: { id: "amphitheater", name: "Amphitheater", category: "entertainment" }, right: { id: "sculpturegarden", name: "Sculpture Garden", category: "nature" } },
  { left: { id: "rosegarden", name: "Rose Garden", category: "nature" }, right: { id: "fruitgarden", name: "Fruit Garden", category: "nature" } },
  { left: { id: "bamboogarden", name: "Bamboo Garden", category: "nature" }, right: { id: "musicalfountain", name: "Musical Fountain", category: "entertainment" } },
  { left: { id: "ecoisland", name: "Eco-Island", category: "nature" }, right: { id: "toytrain", name: "Toy Train Station", category: "entertainment" } },
  { left: { id: "wildflowermeadow", name: "Wild Flower Meadow", category: "nature" }, right: { id: "rabiaranya", name: "Rabi Aranya", category: "nature" } },
  { left: { id: "japaneseforest", name: "Japanese Forest", category: "nature" }, right: { id: "ecoresort", name: "Eco-Resort", category: "entertainment" } },
  { left: { id: "eiffeltower", name: "Eiffel Tower", category: "entertainment" }, right: { id: "iceskating", name: "Ice Skating Rink", category: "entertainment" } },
  { left: { id: "ticketcounter", name: "Ticket Counter", category: "ticket" }, right: { id: "toilet2", name: "Toilet", category: "restroom" } },
];

function buildEcoPark(): Venue {
  const nodes: VenueNode[] = [{ id: "entrance", x: SPINE_X, y: START_Y }];
  const edges: VenueEdge[] = [];
  const pois: PointOfInterest[] = [
    { id: "entrance", name: "Entrance Plaza", category: "entrance", nodeId: "entrance" },
  ];

  let prevSpineId = "entrance";
  branchRows.forEach((row, i) => {
    const y = START_Y + (i + 1) * SPINE_SPACING;
    const spineId = `s${i + 1}`;
    nodes.push({ id: spineId, x: SPINE_X, y });
    edges.push({ from: prevSpineId, to: spineId });
    prevSpineId = spineId;

    const leftX = SPINE_X - BRANCH_GAP;
    const rightX = SPINE_X + BRANCH_GAP;
    nodes.push({ id: row.left.id, x: leftX, y });
    nodes.push({ id: row.right.id, x: rightX, y });
    edges.push({ from: spineId, to: row.left.id });
    edges.push({ from: spineId, to: row.right.id });

    pois.push({
      id: row.left.id,
      name: row.left.name,
      category: row.left.category,
      nodeId: row.left.id,
      room: { x: leftX - ROOM_W, y: y - ROOM_H / 2, w: ROOM_W, h: ROOM_H },
    });
    pois.push({
      id: row.right.id,
      name: row.right.name,
      category: row.right.category,
      nodeId: row.right.id,
      room: { x: rightX, y: y - ROOM_H / 2, w: ROOM_W, h: ROOM_H },
    });
  });

  const lastY = START_Y + branchRows.length * SPINE_SPACING;

  return {
    name: "Eco Park — New Town, Kolkata",
    viewBox: { w: SPINE_X + BRANCH_GAP + ROOM_W + 40, h: lastY + ROOM_H / 2 + 40 },
    walkways: [{ x: SPINE_X - 20, y: 20, w: 40, h: lastY - 20 }],
    startNodeId: "entrance",
    nodes,
    edges,
    pois,
  };
}

export const demoVenue: Venue = buildEcoPark();
