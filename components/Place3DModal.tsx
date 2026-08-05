"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { PointOfInterest } from "@/lib/venue";
import { CATEGORY_META } from "@/lib/categories";
import { buildSinglePlaceGroup, singlePlaceExtent } from "@/lib/scene3d";

interface Place3DModalProps {
  poi: PointOfInterest;
  onClose: () => void;
}

export default function Place3DModal({ poi, onClose }: Place3DModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeef1f4);

    const extent = singlePlaceExtent(poi);
    const dist = extent.radius * 2.4;
    const targetY = extent.h / 2;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
    camera.position.set(dist * 0.65, dist * 0.6, dist * 0.65);
    camera.lookAt(0, targetY, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(extent.radius * 2, extent.radius * 3, extent.radius * 1.4);
    scene.add(sun);

    scene.add(buildSinglePlaceGroup(poi));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, targetY, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = extent.radius * 1.1;
    controls.maxDistance = extent.radius * 6;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 1.4;
    controls.update();

    function resize() {
      if (!container) return;
      const size = container.clientWidth;
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      renderer.setSize(size, size);
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

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi.id]);

  const meta = CATEGORY_META[poi.category];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`3D preview of ${poi.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close preview">
          ×
        </button>
        <div ref={containerRef} className="scene3d modal-scene" />
        <div className="modal-info">
          <span className="poi-swatch" style={{ background: `var(${meta.colorVar})` }} />
          <div>
            <p className="modal-name">{poi.name}</p>
            <p className="modal-category">{meta.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
