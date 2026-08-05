import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { Venue } from "./venue";
import { buildVenueGroup } from "./scene3d";

/** Exports the venue's 3D scene as a binary glTF (.glb), openable in Blender, Unity, etc. */
export function exportVenueToGLB(venue: Venue): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const scene = new THREE.Scene();
    scene.name = venue.name;
    scene.add(buildVenueGroup(venue));

    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(new Blob([result], { type: "model/gltf-binary" }));
        } else {
          resolve(new Blob([JSON.stringify(result)], { type: "application/json" }));
        }
      },
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
      { binary: true }
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "venue"
  );
}
