"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoVenue, type Venue } from "@/lib/venue";
import { findRoute } from "@/lib/pathfinding";
import { CATEGORY_META, getPoiCode } from "@/lib/categories";
import { CUSTOM_VENUE_KEY } from "@/lib/editorState";
import VenueMap from "@/components/VenueMap";

const METERS_PER_UNIT = 0.1;
const WALK_SPEED_MPS = 1.3;

export default function Home() {
  const [venue, setVenue] = useState<Venue>(demoVenue);
  const [isCustom, setIsCustom] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(CUSTOM_VENUE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Venue;
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.pois)) {
        setVenue(parsed);
        setIsCustom(true);
      }
    } catch {
      // ignore malformed data left over from a previous editor session
    }
  }, []);

  const route = useMemo(() => {
    if (!selectedId) return null;
    return findRoute(venue, venue.startNodeId, selectedId);
  }, [venue, selectedId]);

  const selectedPoi = venue.pois.find((p) => p.id === selectedId) ?? null;
  const startPoi = venue.pois.find((p) => p.nodeId === venue.startNodeId) ?? null;

  const meters = route ? Math.round(route.distance * METERS_PER_UNIT) : 0;
  const walkSeconds = route ? (route.distance * METERS_PER_UNIT) / WALK_SPEED_MPS : 0;
  const walkMinutes = Math.max(1, Math.round(walkSeconds / 60));

  function handleSelect(id: string) {
    setSelectedId((current) => (current === id ? null : id));
  }

  function resetToDemo() {
    window.localStorage.removeItem(CUSTOM_VENUE_KEY);
    setVenue(demoVenue);
    setIsCustom(false);
    setSelectedId(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-row">
          <div>
            <p className="app-eyebrow">{isCustom ? "Custom venue" : "Live demo"}</p>
            <h1 className="app-title">{venue.name}</h1>
          </div>
          {isCustom ? (
            <button className="header-link" onClick={resetToDemo}>
              Reset to demo
            </button>
          ) : (
            <Link className="header-link" href="/editor">
              Build your own venue
            </Link>
          )}
        </div>
      </header>

      <div className="map-area">
        <VenueMap
          venue={venue}
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
              <div className="route-summary-sub">
                ~{walkMinutes} min walk from {startPoi?.name ?? "the entrance"}
              </div>
            </div>
            <button className="clear-btn" onClick={() => setSelectedId(null)}>
              Clear
            </button>
          </div>
        )}

        <div className="poi-list">
          {venue.pois
            .filter((p) => p.nodeId !== venue.startNodeId)
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
                    {getPoiCode(poi)}
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
