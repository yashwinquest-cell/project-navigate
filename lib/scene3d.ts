import * as THREE from "three";
import type { Venue, PointOfInterest, Category } from "./venue";

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
