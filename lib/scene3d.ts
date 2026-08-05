import * as THREE from "three";
import type { Venue, PointOfInterest, Category } from "./venue";
import {
  ECO_PARK_POSITIONS,
  ECO_PARK_LAKE,
  ECO_PARK_ISLAND,
  ECO_PARK_GREEN_ZONE,
} from "./ecoParkLayout";

/** Venue coordinate units -> 3D scene units. */
export const SCALE = 0.05;
export const ROOM_HEIGHT = 3;

export const CATEGORY_HEX: Record<Category, number> = {
  entrance: 0x4a5d70,
  ticket: 0xe2572b,
  exit: 0x1e8e3e,
  food: 0xb97a16,
  shop: 0x1f8a82,
  restroom: 0x7c8fa1,
  entertainment: 0x1f8a82,
  nature: 0x4d7c3e,
};

/**
 * Builds a THREE.Group for a full venue: ground, walkway strips, path
 * network, extruded room blocks by category color, a start marker, and
 * an optional highlighted route tube. Reused by the 3D map view, the
 * per-place preview, and the .glb export — same geometry everywhere.
 */
export function buildVenueGroup(
  venue: Venue,
  opts?: { routeNodeIds?: string[] }
): THREE.Group {
  const group = new THREE.Group();
  const nodesById = new Map(venue.nodes.map((n) => [n.id, n]));

  const groundW = venue.viewBox.w * SCALE;
  const groundD = venue.viewBox.h * SCALE;
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(groundW, 0.2, groundD),
    new THREE.MeshStandardMaterial({ color: 0xdfe5ea, roughness: 0.95 })
  );
  ground.position.set(groundW / 2, -0.1, groundD / 2);
  ground.receiveShadow = true;
  group.add(ground);

  for (const w of venue.walkways) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w.w * SCALE, 0.05, w.h * SCALE),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    mesh.position.set((w.x + w.w / 2) * SCALE, 0.03, (w.y + w.h / 2) * SCALE);
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  for (const edge of venue.edges) {
    const a = nodesById.get(edge.from);
    const b = nodesById.get(edge.to);
    if (!a || !b) continue;
    const ax = a.x * SCALE;
    const az = a.y * SCALE;
    const bx = b.x * SCALE;
    const bz = b.y * SCALE;
    const length = Math.hypot(bx - ax, bz - az);
    if (length < 0.01) continue;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.06, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xc7d2da })
    );
    mesh.position.set((ax + bx) / 2, 0.04, (az + bz) / 2);
    mesh.rotation.y = -Math.atan2(bz - az, bx - ax);
    group.add(mesh);
  }

  for (const poi of venue.pois) {
    if (!poi.room) continue;
    const color = CATEGORY_HEX[poi.category] ?? 0x888888;
    const geo = new THREE.BoxGeometry(
      poi.room.w * SCALE,
      ROOM_HEIGHT,
      poi.room.h * SCALE
    );
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 })
    );
    mesh.position.set(
      (poi.room.x + poi.room.w / 2) * SCALE,
      ROOM_HEIGHT / 2,
      (poi.room.y + poi.room.h / 2) * SCALE
    );
    mesh.castShadow = true;
    mesh.name = `poi:${poi.id}`;
    group.add(mesh);

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x16283a, transparent: true, opacity: 0.25 })
    );
    outline.position.copy(mesh.position);
    group.add(outline);
  }

  const start = nodesById.get(venue.startNodeId);
  if (start) {
    const marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x16283a })
    );
    marker.position.set(start.x * SCALE, 0.85, start.y * SCALE);
    group.add(marker);
  }

  if (opts?.routeNodeIds && opts.routeNodeIds.length > 1) {
    const points = opts.routeNodeIds
      .map((id) => nodesById.get(id))
      .filter((n): n is NonNullable<typeof n> => Boolean(n))
      .map((n) => new THREE.Vector3(n.x * SCALE, 0.3, n.y * SCALE));
    if (points.length > 1) {
      const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.1);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(8, points.length * 6), 0.22, 8, false),
        new THREE.MeshStandardMaterial({
          color: 0xe2572b,
          emissive: 0xe2572b,
          emissiveIntensity: 0.35,
        })
      );
      group.add(tube);
    }
  }

  return group;
}

export function venueFootprint(venue: Venue) {
  const w = venue.viewBox.w * SCALE;
  const d = venue.viewBox.h * SCALE;
  return { width: w, depth: d, center: new THREE.Vector3(w / 2, 0, d / 2), radius: Math.max(w, d) };
}

/** Bounding size of a single-place block, so the preview camera can frame it regardless of room size. */
export function singlePlaceExtent(poi: PointOfInterest) {
  const w = (poi.room?.w ?? 120) * SCALE;
  const d = (poi.room?.h ?? 120) * SCALE;
  return { w, d, h: ROOM_HEIGHT, radius: Math.max(w, d, ROOM_HEIGHT) };
}

/** A standalone single-room block, used by the place preview modal. */
export function buildSinglePlaceGroup(poi: PointOfInterest): THREE.Group {
  const group = new THREE.Group();
  const color = CATEGORY_HEX[poi.category] ?? 0x888888;
  const w = (poi.room?.w ?? 120) * SCALE;
  const d = (poi.room?.h ?? 120) * SCALE;

  const geo = new THREE.BoxGeometry(w, ROOM_HEIGHT, d);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 })
  );
  mesh.position.set(0, ROOM_HEIGHT / 2, 0);
  mesh.castShadow = true;
  group.add(mesh);

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: 0x16283a, transparent: true, opacity: 0.3 })
  );
  outline.position.copy(mesh.position);
  group.add(outline);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.max(w, d) * 0.85, Math.max(w, d) * 0.85, 0.15, 32),
    new THREE.MeshStandardMaterial({ color: 0xdfe5ea, roughness: 0.9 })
  );
  pad.position.set(0, -0.08, 0);
  pad.receiveShadow = true;
  group.add(pad);

  return group;
}

const REPLICA_W = 46;
const REPLICA_D = 64;

/** True when a venue's places are (mostly) ones this module has real Eco Park geography for. */
export function isEcoParkReplicaEligible(venue: Venue): boolean {
  const ids = venue.pois.map((p) => p.id);
  if (ids.length === 0) return false;
  const matched = ids.filter((id) => id in ECO_PARK_POSITIONS).length;
  return matched / ids.length >= 0.6;
}

function replicaShape(points: Array<[number, number]>): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach(([nx, nz], i) => {
    const x = nx * REPLICA_W;
    const y = -(nz * REPLICA_D); // pre-flipped so rotation.x=-90deg lands z the right way round
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function replicaGround(points: Array<[number, number]>, color: number, elevation: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(replicaShape(points)),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = elevation;
  mesh.receiveShadow = true;
  return mesh;
}

function seededTrees(id: string) {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const count = 2 + Math.floor(rand() * 3);
  const trees: Array<{ dx: number; dz: number; scale: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 0.65 + rand() * 0.5;
    trees.push({ dx: Math.cos(angle) * dist, dz: Math.sin(angle) * dist, scale: 0.8 + rand() * 0.5 });
  }
  return trees;
}

/** A handful of Eco Park's landmarks get distinct shapes; everything else is a colored block. */
function buildLandmark(poi: PointOfInterest): THREE.Group {
  const group = new THREE.Group();
  const color = CATEGORY_HEX[poi.category] ?? 0x888888;
  const tag = `poi:${poi.id}`;

  if (poi.id === "eiffeltower") {
    const tower = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 5.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.5, metalness: 0.4 })
    );
    tower.position.y = 2.75;
    tower.rotation.y = Math.PI / 4;
    tower.name = tag;
    tower.castShadow = true;
    group.add(tower);
  } else if (poi.id === "iceskating") {
    const rink = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.7, 0.25, 32),
      new THREE.MeshStandardMaterial({ color: 0xdcf3fb, roughness: 0.15, metalness: 0.1 })
    );
    rink.position.y = 0.125;
    rink.name = tag;
    group.add(rink);
  } else if (poi.id === "musicalfountain") {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0xbfe4f5, roughness: 0.3 })
    );
    base.position.y = 0.1;
    base.name = tag;
    const spray = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 1.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.75 })
    );
    spray.position.y = 0.85;
    group.add(base, spray);
  } else if (poi.id === "sevenwonders") {
    const shapes: [THREE.BufferGeometry, number][] = [
      [new THREE.ConeGeometry(0.35, 0.9, 4), 0.45],
      [new THREE.CylinderGeometry(0.3, 0.35, 0.6, 16), 0.3],
      [new THREE.ConeGeometry(0.2, 1.1, 4), 0.55],
    ];
    shapes.forEach(([geo, halfHeight], i) => {
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xcaa06a, roughness: 0.6 }));
      mesh.position.set((i - 1) * 0.55, halfHeight, 0);
      mesh.name = tag;
      group.add(mesh);
    });
  } else if (poi.id === "ecoisland") {
    const hut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7 })
    );
    hut.position.y = 0.25;
    hut.name = tag;
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b4a34, roughness: 0.8 })
    );
    roof.position.y = 0.7;
    group.add(hut, roof);
  } else {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.1, 0.9),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 })
    );
    box.position.y = 0.55;
    box.name = tag;
    box.castShadow = true;
    group.add(box);

    if (poi.category === "nature") {
      for (const t of seededTrees(poi.id)) {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.04, 0.18 * t.scale, 6),
          new THREE.MeshStandardMaterial({ color: 0x6b4a34 })
        );
        trunk.position.set(t.dx, 0.09 * t.scale, t.dz);
        const leaves = new THREE.Mesh(
          new THREE.ConeGeometry(0.16 * t.scale, 0.32 * t.scale, 8),
          new THREE.MeshStandardMaterial({ color: 0x3f7d3f })
        );
        leaves.position.set(t.dx, 0.28 * t.scale, t.dz);
        group.add(trunk, leaves);
      }
    }
  }

  return group;
}

/**
 * A geographically-laid-out replica of Eco Park: real relative positions
 * (traced from the HIDCO master plan), the lake and island as their actual
 * shapes, and a few hand-modeled landmarks. Falls back silently to
 * buildVenueGroup() for anything that isn't recognizably this venue.
 */
export function buildEcoParkReplica(venue: Venue, opts?: { routeNodeIds?: string[] }): THREE.Group {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(REPLICA_W * 1.08, REPLICA_D * 1.08),
    new THREE.MeshStandardMaterial({ color: 0xe3ead9, roughness: 0.95, side: THREE.DoubleSide })
  );
  base.rotation.x = -Math.PI / 2;
  base.position.set(REPLICA_W / 2, -0.02, REPLICA_D / 2);
  base.receiveShadow = true;
  group.add(base);

  group.add(replicaGround(ECO_PARK_GREEN_ZONE, 0x9fc98a, 0.01));
  group.add(replicaGround(ECO_PARK_LAKE, 0x6fb3d9, 0.02));
  group.add(replicaGround(ECO_PARK_ISLAND, 0xcdd98a, 0.05));

  for (const poi of venue.pois) {
    const pos = ECO_PARK_POSITIONS[poi.id];
    if (!pos) continue;
    const landmark = buildLandmark(poi);
    landmark.position.set(pos.x * REPLICA_W, 0, pos.y * REPLICA_D);
    group.add(landmark);
  }

  if (opts?.routeNodeIds && opts.routeNodeIds.length > 1) {
    const geoPoints: THREE.Vector3[] = [];
    for (const nodeId of opts.routeNodeIds) {
      const poi = venue.pois.find((p) => p.nodeId === nodeId);
      const pos = poi ? ECO_PARK_POSITIONS[poi.id] : undefined;
      if (pos) geoPoints.push(new THREE.Vector3(pos.x * REPLICA_W, 0.4, pos.y * REPLICA_D));
    }
    if (geoPoints.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(geoPoints, false, "catmullrom", 0.1);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(8, geoPoints.length * 10), 0.18, 8, false),
        new THREE.MeshStandardMaterial({ color: 0xe2572b, emissive: 0xe2572b, emissiveIntensity: 0.35 })
      );
      group.add(tube);
    }
  }

  return group;
}

export function replicaFootprint() {
  return {
    width: REPLICA_W,
    depth: REPLICA_D,
    center: new THREE.Vector3(REPLICA_W / 2, 0, REPLICA_D / 2),
    radius: Math.max(REPLICA_W, REPLICA_D),
  };
}
