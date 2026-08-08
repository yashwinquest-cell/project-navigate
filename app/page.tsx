"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { demoVenue, type Venue } from "@/lib/venue";
import { findRoute } from "@/lib/pathfinding";
import { CATEGORY_META, getPoiCode } from "@/lib/categories";
import { CUSTOM_VENUE_KEY } from "@/lib/editorState";
import { downloadBlob, exportVenueToGLB, slugify } from "@/lib/exportGLB";
import { loadPublishedVenue, subscribeVenue, isSupabaseConfigured } from "@/lib/venueStore";
import VenueMap from "@/components/VenueMap";
import Place3DModal from "@/components/Place3DModal";

const Venue3DView = dynamic(() => import("@/components/Venue3DView"), { ssr: false });

const METERS_PER_UNIT = 0.1;
const WALK_SPEED_MPS = 1.3;

export default function Home() {
  const [venue, setVenue] = useState<Venue>(demoVenue);
  const [isCustom, setIsCustom] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Source of truth priority:
    // 1. Cloud-published venue (shared across all devices, cached for offline).
    // 2. A locally-previewed custom venue (editor "Preview in app").
    // 3. The bundled demo venue.
    async function load() {
      if (isSupabaseConfigured()) {
        const published = await loadPublishedVenue();
        if (!cancelled && published) {
          setVenue(published);
          setIsCustom(true);
          return;
        }
      }
      const raw = window.localStorage.getItem(CUSTOM_VENUE_KEY);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Venue;
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.pois)) {
          if (!cancelled) {
            setVenue(parsed);
            setIsCustom(true);
          }
        }
      } catch {
        // ignore malformed data left over from a previous editor session
      }
    }
    load();

    // Live updates: when an operator publishes, every open app updates itself.
    const unsubscribe = subscribeVenue((next) => {
      if (!cancelled) {
        setVenue(next);
        setIsCustom(true);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const route = useMemo(() => {
    if (!selectedId) return null;
    return findRoute(venue, venue.startNodeId, selectedId);
  }, [venue, selectedId]);

  const selectedPoi = venue.pois.find((p) => p.id === selectedId) ?? null;
  const previewPoi = venue.pois.find((p) => p.id === previewId) ?? null;
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

  async function handleDownload3D() {
    setExporting(true);
    try {
      const blob = await exportVenueToGLB(venue);
      downloadBlob(blob, `${slugify(venue.name)}.glb`);
    } finally {
      setExporting(false);
    }
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
        <div className="view-toolbar">
          <div className="view-toggle">
            <button
              data-active={viewMode === "2D"}
              onClick={() => setViewMode("2D")}
            >
              2D map
            </button>
            <button
              data-active={viewMode === "3D"}
              onClick={() => setViewMode("3D")}
            >
              3D map
            </button>
          </div>
          <button className="header-link" onClick={handleDownload3D} disabled={exporting}>
            {exporting ? "Preparing…" : "Download 3D model"}
          </button>
        </div>
      </header>

      <div className="map-area">
        {viewMode === "2D" ? (
          <VenueMap
            venue={venue}
            selectedId={selectedId}
            route={route}
            onSelectPoi={handleSelect}
          />
        ) : (
          <Venue3DView venue={venue} routeNodeIds={route?.nodeIds} onSelectPoi={handleSelect} />
        )}
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
                <div className="poi-row" key={poi.id} data-selected={poi.id === selectedId}>
                  <button className="poi-row-main" onClick={() => handleSelect(poi.id)}>
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
                  <button
                    className="poi-preview-btn"
                    onClick={() => setPreviewId(poi.id)}
                    aria-label={`3D preview of ${poi.name}`}
                  >
                    3D
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {previewPoi && <Place3DModal poi={previewPoi} onClose={() => setPreviewId(null)} />}
    </div>
  );
}
