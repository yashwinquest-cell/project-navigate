"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Venue } from "@/lib/venue";
import {
  buildVenueGroup,
  venueFootprint,
  buildEcoParkReplica,
  replicaFootprint,
  isEcoParkReplicaEligible,
} from "@/lib/scene3d";

interface Venue3DViewProps {
  venue: Venue;
  routeNodeIds?: string[];
  onSelectPoi: (id: string) => void;
}

export default function Venue3DView({ venue, routeNodeIds, onSelectPoi }: Venue3DViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const framedVenueRef = useRef<Venue | null>(null);
  const onSelectRef = useRef(onSelectPoi);
  onSelectRef.current = onSelectPoi;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeef1f4);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(20, 40, 10);
    sun.castShadow = true;
    scene.add(sun);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 3;
    controls.maxDistance = 300;
    controlsRef.current = controls;

    function resize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let raf = 0;
    function animate() {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos: { x: number; y: number } | null = null;

    function handlePointerDown(e: PointerEvent) {
      downPos = { x: e.clientX, y: e.clientY };
    }
    function handlePointerUp(e: PointerEvent) {
      if (!downPos) return;
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      downPos = null;
      if (moved > 6) return; // a drag orbits the camera, not a tap
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(groupRef.current?.children ?? [], false);
      for (const hit of hits) {
        if (hit.object.name.startsWith("poi:")) {
          onSelectRef.current(hit.object.name.slice(4));
          break;
        }
      }
    }
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      framedVenueRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    if (groupRef.current) scene.remove(groupRef.current);
    const useReplica = isEcoParkReplicaEligible(venue);
    const group = useReplica
      ? buildEcoParkReplica(venue, { routeNodeIds })
      : buildVenueGroup(venue, { routeNodeIds });
    groupRef.current = group;
    scene.add(group);

    if (framedVenueRef.current !== venue) {
      framedVenueRef.current = venue;
      const { center, radius } = useReplica ? replicaFootprint() : venueFootprint(venue);
      camera.position.set(center.x + radius * 0.55, radius * 0.7, center.z + radius * 0.85);
      controls.target.copy(center);
      controls.update();
    }
  }, [venue, routeNodeIds]);

  return <div ref={containerRef} className="scene3d" />;
}
