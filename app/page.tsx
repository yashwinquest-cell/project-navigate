"use client";

import { useMemo, useState } from "react";
import { demoVenue } from "@/lib/venue";
import { findRoute } from "@/lib/pathfinding";
import { CATEGORY_META, POI_CODES } from "@/lib/categories";
import VenueMap from "@/components/VenueMap";

const START_ID = "entrance";
const METERS_PER_UNIT = 0.1;
const WALK_SPEED_MPS = 1.3;

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const route = useMemo(() => {
    if (!selectedId) return null;
    return findRoute(demoVenue, START_ID, selectedId);
  }, [selectedId]);

  const selectedPoi = demoVenue.pois.find((p) => p.id === selectedId) ?? null;

  const meters = route ? Math.round(route.distance * METERS_PER_UNIT) : 0;
  const walkSeconds = route ? (route.distance * METERS_PER_UNIT) / WALK_SPEED_MPS : 0;
  const walkMinutes = Math.max(1, Math.round(walkSeconds / 60));

  function handleSelect(id: string) {
    setSelectedId((current) => (current === id ? null : id));
  }

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-eyebrow">Live demo · Sample venue</p>
        <h1 className="app-title">{demoVenue.name}</h1>
      </header>

      <div className="map-area">
        <VenueMap
          venue={demoVenue}
          startId={START_ID}
          selectedId={selectedId}
          route={route}
          onSelectPoi={handleSelect}
        />
      </div>

      <div className="sheet">
        <div className="sheet-handle" />

        {selectedPoi && route && (
          <div className="route-summary">
            <div>
              <div className="route-summary-text">
                To {selectedPoi.name} — {meters} m
              </div>
              <div className="route-summary-sub">~{walkMinutes} min walk from Main Entrance</div>
            </div>
            <button className="clear-btn" onClick={() => setSelectedId(null)}>
              Clear
            </button>
          </div>
        )}

        <div className="poi-list">
          {demoVenue.pois
            .filter((p) => p.id !== START_ID)
            .map((poi) => {
              const meta = CATEGORY_META[poi.category];
              return (
                <button
                  key={poi.id}
                  className="poi-row"
                  data-selected={poi.id === selectedId}
                  onClick={() => handleSelect(poi.id)}
                >
                  <span
                    className="poi-swatch"
                    style={{ background: `var(${meta.colorVar})` }}
                  >
                    {POI_CODES[poi.id] ?? "?"}
                  </span>
                  <span className="poi-info">
                    <span className="poi-name">{poi.name}</span>
                    <span className="poi-category">{meta.label}</span>
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
