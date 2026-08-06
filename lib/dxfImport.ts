import DxfParser from "dxf-parser";
import type { Venue, VenueNode, VenueEdge, PointOfInterest, Category } from "./venue";

interface Pt {
  x: number;
  y: number;
}

interface RoomBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

interface TextCandidate {
  x: number;
  y: number;
  text: string;
  used: boolean;
}

const CATEGORY_RULES: Array<[RegExp, Category]> = [
  [/toilet|restroom|\bwc\b|washroom|lavatory/i, "restroom"],
  [/ticket|box office/i, "ticket"],
  [/exit|fire exit|emergency/i, "exit"],
  [/entrance|entry|lobby|reception|main gate|\bgate\b/i, "entrance"],
  [/food|caf[eé]|restaurant|dining|snack|court(?!yard)/i, "food"],
  [/shop|store|retail|boutique|mart|haat|bazaar/i, "shop"],
  [/garden|forest|meadow|grass|nature|island|aranya|lake|wetland|jungle/i, "nature"],
  [/theme|cinema|theatre|theater|ride|aviary|zoo|museum|amphitheat|fountain|rink|tower|wonder/i, "entertainment"],
];

function inferCategory(name: string): Category {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(name)) return category;
  }
  return "shop";
}

function cleanMText(raw: string): string {
  return raw
    .replace(/\\P/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\\[A-Za-z][^;]*;/g, "")
    .trim();
}

function slugify(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "room";
  let id = base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  taken.add(id);
  return id;
}

export interface DxfImportResult {
  venue: Venue;
  warnings: string[];
}

/**
 * Auto-drafts a venue from a DXF floor plan: closed LWPOLYLINE/POLYLINE
 * shapes become rooms, nearby TEXT/MTEXT becomes their names, categories
 * are guessed from those names by keyword, and every room is connected
 * into one walkable network via a minimum spanning tree over room
 * centers (DXF floor plans don't carry real corridor/wayfinding data,
 * so this is a first-pass sketch — meant to be cleaned up in the editor,
 * not used as-is).
 */
export function parseDxfToVenue(dxfText: string, venueName: string): DxfImportResult {
  const parser = new DxfParser();
  let dxf;
  try {
    dxf = parser.parseSync(dxfText);
  } catch (err) {
    throw new Error(`Couldn't parse this DXF file: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!dxf || !Array.isArray(dxf.entities)) {
    throw new Error("This DXF file has no readable entities.");
  }

  const warnings: string[] = [];

  const roomBounds: RoomBounds[] = [];
  for (const entity of dxf.entities as unknown as Array<Record<string, unknown>>) {
    if (entity.type !== "LWPOLYLINE" && entity.type !== "POLYLINE") continue;
    const rawVertices = (entity.vertices as Array<{ x: number; y: number }> | undefined) ?? [];
    if (rawVertices.length < 3) continue;
    // DXF is Y-up; our screen coordinates are Y-down, so flip once here.
    const vertices: Pt[] = rawVertices.map((v) => ({ x: v.x, y: -v.y }));
    const xs = vertices.map((v) => v.x);
    const ys = vertices.map((v) => v.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    if (maxX - minX < 1e-6 || maxY - minY < 1e-6) continue;
    roomBounds.push({ minX, minY, maxX, maxY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 });
  }

  if (roomBounds.length === 0) {
    throw new Error(
      "No room outlines found. This importer looks for closed LWPOLYLINE/POLYLINE shapes — lines, blocks, and hatches alone aren't enough yet."
    );
  }

  const texts: TextCandidate[] = [];
  for (const entity of dxf.entities as unknown as Array<Record<string, unknown>>) {
    if (entity.type === "TEXT") {
      const start = entity.startPoint as Pt | undefined;
      const text = entity.text as string | undefined;
      if (start && text) texts.push({ x: start.x, y: -start.y, text: text.trim(), used: false });
    } else if (entity.type === "MTEXT") {
      const pos = entity.position as Pt | undefined;
      const text = entity.text as string | undefined;
      if (pos && text) {
        const cleaned = cleanMText(text);
        if (cleaned) texts.push({ x: pos.x, y: -pos.y, text: cleaned, used: false });
      }
    }
  }

  let unnamedCount = 0;
  const rawRooms = roomBounds.map((room) => {
    const w = room.maxX - room.minX;
    const h = room.maxY - room.minY;
    const maxRadius = Math.max(w, h) * 1.5;
    let best: TextCandidate | null = null;
    let bestDist = Infinity;
    for (const t of texts) {
      if (t.used) continue;
      const inside = t.x >= room.minX && t.x <= room.maxX && t.y >= room.minY && t.y <= room.maxY;
      const dist = Math.hypot(t.x - room.centerX, t.y - room.centerY);
      if ((inside || dist <= maxRadius) && dist < bestDist) {
        best = t;
        bestDist = dist;
      }
    }
    let name: string;
    if (best) {
      best.used = true;
      name = best.text;
    } else {
      unnamedCount += 1;
      name = `Room ${unnamedCount}`;
    }
    return { room, name, category: inferCategory(name) };
  });

  if (unnamedCount > 0) {
    warnings.push(
      `${unnamedCount} room${unnamedCount === 1 ? "" : "s"} had no nearby text label, so ${unnamedCount === 1 ? "it's" : "they're"} named "Room N" — rename in the Places list.`
    );
  }

  const allMinX = Math.min(...rawRooms.map((r) => r.room.minX));
  const allMinY = Math.min(...rawRooms.map((r) => r.room.minY));
  const allMaxX = Math.max(...rawRooms.map((r) => r.room.maxX));
  const allMaxY = Math.max(...rawRooms.map((r) => r.room.maxY));
  const overallW = Math.max(allMaxX - allMinX, 1e-6);
  const overallH = Math.max(allMaxY - allMinY, 1e-6);
  const MARGIN = 40;
  const TARGET = 900;
  const MIN_ROOM = 40;
  const scale = TARGET / Math.max(overallW, overallH);

  const tx = (x: number) => (x - allMinX) * scale + MARGIN;
  const ty = (y: number) => (y - allMinY) * scale + MARGIN;

  const takenIds = new Set<string>();
  const nodes: VenueNode[] = [];
  const pois: PointOfInterest[] = [];

  for (const { room, name, category } of rawRooms) {
    const id = slugify(name, takenIds);
    let x = tx(room.minX);
    let y = ty(room.minY);
    let w = (room.maxX - room.minX) * scale;
    let h = (room.maxY - room.minY) * scale;
    if (w < MIN_ROOM) {
      x -= (MIN_ROOM - w) / 2;
      w = MIN_ROOM;
    }
    if (h < MIN_ROOM) {
      y -= (MIN_ROOM - h) / 2;
      h = MIN_ROOM;
    }
    nodes.push({ id, x: x + w / 2, y: y + h / 2 });
    pois.push({ id, name, category, nodeId: id, room: { x, y, w, h } });
  }

  // No DXF corridor data exists, so connect every room with a minimum
  // spanning tree over room centers — guarantees full reachability.
  const edges: VenueEdge[] = [];
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const inTree = new Set([nodes[0].id]);
  const remaining = nodes.slice(1).map((n) => n.id);
  while (remaining.length > 0) {
    let bestFrom = "";
    let bestTo = "";
    let bestDist = Infinity;
    for (const fromId of inTree) {
      const from = nodesById.get(fromId)!;
      for (const toId of remaining) {
        const to = nodesById.get(toId)!;
        const d = Math.hypot(from.x - to.x, from.y - to.y);
        if (d < bestDist) {
          bestDist = d;
          bestFrom = fromId;
          bestTo = toId;
        }
      }
    }
    edges.push({ from: bestFrom, to: bestTo });
    inTree.add(bestTo);
    remaining.splice(remaining.indexOf(bestTo), 1);
  }

  const entranceRoom = pois.find((p) => p.category === "entrance");
  if (!entranceRoom) {
    warnings.push(
      'No room was recognized as an entrance — using the first room as the start point. Fix "Start node" in Venue settings if that\'s wrong.'
    );
  }
  const startNodeId = entranceRoom ? entranceRoom.nodeId : nodes[0].id;

  const viewBoxW = Math.round(overallW * scale + MARGIN * 2);
  const viewBoxH = Math.round(overallH * scale + MARGIN * 2);

  const venue: Venue = {
    name: venueName || "Imported Venue",
    viewBox: { w: viewBoxW, h: viewBoxH },
    walkways: [{ x: 10, y: 10, w: viewBoxW - 20, h: viewBoxH - 20 }],
    startNodeId,
    nodes,
    edges,
    pois,
  };

  warnings.push(
    `Imported ${pois.length} room${pois.length === 1 ? "" : "s"} with an auto-generated path network (nearest-neighbor between room centers, not real corridors) — check Paths and Places before using this for real.`
  );

  return { venue, warnings };
}
