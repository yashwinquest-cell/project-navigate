"use client";

import { useEffect, useRef } from "react";
import { Map as LibreMap, Marker, Popup, NavigationControl, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Venue } from "@/lib/venue";

/**
 * Real-world street map showing where the venue is, with a marker and a
 * get-directions link. Rendered with MapLibre GL over OpenStreetMap raster
 * tiles — free, no account or API key required. Tiles need a connection;
 * the indoor venue map remains the offline-capable core of the app.
 */

// Inline style definition (no external style URL to fetch — one less
// dependency at runtime; only the tiles themselves load over the network).
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export default function LocationMap({ venue }: { venue: Venue }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);

  const geo = venue.geo;

  useEffect(() => {
    if (!geo || !containerRef.current) return;

    const map = new LibreMap({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [geo.lng, geo.lat],
      zoom: geo.zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: false }));

    // Brand accent orange (same as --accent in globals.css; MapLibre needs a
    // literal color here, not a CSS variable).
    new Marker({ color: "#e2572b" })
      .setLngLat([geo.lng, geo.lat])
      .setPopup(
        new Popup({ offset: 24, closeButton: false }).setText(
          venue.name
        )
      )
      .addTo(map)
      .togglePopup();

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, [geo, venue.name]);

  if (!geo) {
    return (
      <div className="location-empty">
        <p>
          This venue doesn&apos;t have a real-world location set yet. Operators
          can add one when publishing the venue.
        </p>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${geo.lat},${geo.lng}`;

  return (
    <div className="location-view">
      <div ref={containerRef} className="location-canvas" />
      <div className="location-bar">
        <span className="location-hint">
          Street map is live and needs internet — the 2D/3D venue maps work
          offline.
        </span>
        <a
          className="location-directions"
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Get directions
        </a>
      </div>
    </div>
  );
}
