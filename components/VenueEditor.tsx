"use client";

import { useReducer, useRef, useState } from "react";
import { demoVenue, type Venue, type VenueRoom } from "@/lib/venue";
import {
  editorReducer,
  blankVenue,
  validateVenue,
  CUSTOM_VENUE_KEY,
} from "@/lib/editorState";
import { CATEGORY_META, CATEGORY_OPTIONS } from "@/lib/categories";

type Mode = "walkway" | "room" | "node" | "edge";

const MODE_LABELS: Record<Mode, string> = {
  walkway: "Walkway",
  room: "Room",
  node: "Point",
  edge: "Path",
};

const MODE_HINTS: Record<Mode, string> = {
  walkway: "Drag on the canvas to draw a walkable floor area.",
  room: "Drag on the canvas to draw a room, then set its name, category, and door point below.",
  node: "Click anywhere on the canvas to drop a routing point (e.g. at a doorway).",
  edge: "Click one point, then another, to connect them with a walkable path.",
};

function clonedDemoVenue(): Venue {
  return JSON.parse(JSON.stringify(demoVenue)) as Venue;
}

export default function VenueEditor() {
  const [state, dispatch] = useReducer(editorReducer, blankVenue);
  const [mode, setMode] = useState<Mode>("walkway");
  const [draft, setDraft] = useState<VenueRoom | null>(null);
  const [pendingEdgeFrom, setPendingEdgeFrom] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const nodesById = new Map(state.nodes.map((n) => [n.id, n]));
  const validation = validateVenue(state);
  const json = JSON.stringify(state, null, 2);

  function getPoint(e: { clientX: number; clientY: number }) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = state.viewBox.w / rect.width;
    const scaleY = state.viewBox.h / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const p = getPoint(e);
    if (mode === "walkway" || mode === "room") {
      dragStart.current = p;
      setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
    } else if (mode === "node") {
      dispatch({ type: "ADD_NODE", x: Math.round(p.x), y: Math.round(p.y) });
    } else if (mode === "edge") {
      setPendingEdgeFrom(null);
    }
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragStart.current) return;
    const p = getPoint(e);
    setDraft({
      x: Math.min(dragStart.current.x, p.x),
      y: Math.min(dragStart.current.y, p.y),
      w: Math.abs(p.x - dragStart.current.x),
      h: Math.abs(p.y - dragStart.current.y),
    });
  }

  function handlePointerUp() {
    if (dragStart.current && draft && draft.w > 8 && draft.h > 8) {
      const room: VenueRoom = {
        x: Math.round(draft.x),
        y: Math.round(draft.y),
        w: Math.round(draft.w),
        h: Math.round(draft.h),
      };
      if (mode === "walkway") dispatch({ type: "ADD_WALKWAY", room });
      if (mode === "room") dispatch({ type: "ADD_ROOM", room });
    }
    dragStart.current = null;
    setDraft(null);
  }

  function handleNodeClick(nodeId: string) {
    if (mode !== "edge") return;
    setPendingEdgeFrom((current) => {
      if (!current) return nodeId;
      if (current === nodeId) return null;
      dispatch({ type: "ADD_EDGE", from: current, to: nodeId });
      return null;
    });
  }

  function loadTemplate() {
    dispatch({ type: "LOAD", venue: clonedDemoVenue() });
    setPendingEdgeFrom(null);
  }

  function clearAll() {
    if (window.confirm("Clear everything and start a blank venue?")) {
      dispatch({ type: "RESET" });
      setPendingEdgeFrom(null);
    }
  }

  function loadImport() {
    try {
      const parsed = JSON.parse(importText) as Venue;
      if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.pois)) {
        throw new Error("Missing nodes or pois array");
      }
      dispatch({ type: "LOAD", venue: parsed });
      setImportError("");
      setShowImport(false);
      setImportText("");
    } catch (err) {
      setImportError(
        err instanceof Error ? `Couldn't load that: ${err.message}` : "Couldn't load that JSON."
      );
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function previewInApp() {
    window.localStorage.setItem(CUSTOM_VENUE_KEY, json);
    window.location.href = "/";
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <div>
          <p className="app-eyebrow">Venue editor</p>
          <h1 className="app-title">Build a real venue</h1>
        </div>
        <a className="header-link" href="/">
          Back to map
        </a>
      </header>

      <div className="editor-body">
        <div className="editor-main">
          <div className="toolbar">
            {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
              <button
                key={m}
                className="mode-btn"
                data-active={mode === m}
                onClick={() => {
                  setMode(m);
                  setPendingEdgeFrom(null);
                }}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <p className="mode-hint">{MODE_HINTS[mode]}</p>

          <div className="canvas-wrap">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${state.viewBox.w} ${state.viewBox.h}`}
              className="map-svg editor-svg"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {state.walkways.map((room, i) => (
                <rect
                  key={`walkway-${i}`}
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={4}
                  fill="var(--paper-raised)"
                  stroke="var(--line)"
                  strokeWidth={2}
                />
              ))}

              {state.edges.map((edge, i) => {
                const from = nodesById.get(edge.from);
                const to = nodesById.get(edge.to);
                if (!from || !to) return null;
                return (
                  <line
                    key={`edge-${i}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="var(--route)"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                );
              })}

              {state.pois
                .filter((p) => p.room)
                .map((poi) => {
                  const meta = CATEGORY_META[poi.category];
                  const room = poi.room!;
                  return (
                    <g key={`room-${poi.id}`}>
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.w}
                        height={room.h}
                        rx={4}
                        fill="var(--paper-raised)"
                        stroke={`var(${meta.colorVar})`}
                        strokeWidth={2}
                      />
                      <text
                        x={room.x + room.w / 2}
                        y={room.y + room.h / 2 + 4}
                        textAnchor="middle"
                        className="room-label"
                      >
                        {poi.name}
                      </text>
                    </g>
                  );
                })}

              {draft && (
                <rect
                  x={draft.x}
                  y={draft.y}
                  width={draft.w}
                  height={draft.h}
                  fill="var(--accent)"
                  fillOpacity={0.12}
                  stroke="var(--accent)"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                />
              )}

              {state.nodes.map((node) => {
                const isStart = node.id === state.startNodeId;
                const isPending = node.id === pendingEdgeFrom;
                return (
                  <g
                    key={node.id}
                    onPointerDown={(e) => {
                      if (mode === "edge") e.stopPropagation();
                    }}
                    onClick={() => handleNodeClick(node.id)}
                    className={mode === "edge" ? "poi-pin" : undefined}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isPending ? 10 : 7}
                      fill={isStart ? "var(--ink)" : "var(--accent)"}
                      stroke="var(--paper-raised)"
                      strokeWidth={2}
                    />
                    <text
                      x={node.x}
                      y={node.y - 12}
                      textAnchor="middle"
                      className="node-label"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <aside className="editor-side">
          <section className="editor-panel">
            <h2 className="panel-title">Venue settings</h2>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                value={state.name}
                onChange={(e) =>
                  dispatch({ type: "SET_NAME", name: e.target.value })
                }
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Width</span>
                <input
                  type="number"
                  value={state.viewBox.w}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_VIEWBOX",
                      w: Number(e.target.value) || 0,
                      h: state.viewBox.h,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Height</span>
                <input
                  type="number"
                  value={state.viewBox.h}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_VIEWBOX",
                      w: state.viewBox.w,
                      h: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
            </div>
            <label className="field">
              <span>Start node (entrance)</span>
              <select
                value={state.startNodeId}
                onChange={(e) =>
                  dispatch({ type: "SET_START", nodeId: e.target.value })
                }
              >
                <option value="">— none —</option>
                {state.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} ({n.x}, {n.y})
                  </option>
                ))}
              </select>
            </label>
            <div className="field-row">
              <button className="ghost-btn" onClick={loadTemplate}>
                Load demo template
              </button>
              <button className="ghost-btn" onClick={() => setShowImport((v) => !v)}>
                Import JSON
              </button>
              <button className="ghost-btn danger" onClick={clearAll}>
                Clear all
              </button>
            </div>
            {showImport && (
              <div className="import-box">
                <textarea
                  className="json-input"
                  rows={6}
                  placeholder="Paste venue JSON here"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
                {importError && <p className="error-text">{importError}</p>}
                <button className="ghost-btn" onClick={loadImport}>
                  Load
                </button>
              </div>
            )}
          </section>

          <section className="editor-panel">
            <h2 className="panel-title">Points ({state.nodes.length})</h2>
            <div className="scroll-list">
              {state.nodes.length === 0 && (
                <p className="empty-hint">No points yet — switch to Point mode and click the canvas.</p>
              )}
              {state.nodes.map((n) => (
                <div className="list-row" key={n.id}>
                  <span className="mono-tag">{n.id}</span>
                  <span className="row-sub">
                    {n.x}, {n.y}
                    {n.id === state.startNodeId ? " · start" : ""}
                  </span>
                  <button
                    className="row-delete"
                    aria-label={`Delete point ${n.id}`}
                    onClick={() => dispatch({ type: "DELETE_NODE", id: n.id })}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="editor-panel">
            <h2 className="panel-title">Paths ({state.edges.length})</h2>
            <div className="scroll-list">
              {state.edges.length === 0 && (
                <p className="empty-hint">No paths yet — switch to Path mode and click two points.</p>
              )}
              {state.edges.map((edge, i) => (
                <div className="list-row" key={`${edge.from}-${edge.to}-${i}`}>
                  <span className="row-sub">
                    {edge.from} → {edge.to}
                  </span>
                  <button
                    className="row-delete"
                    aria-label={`Delete path ${edge.from} to ${edge.to}`}
                    onClick={() => dispatch({ type: "DELETE_EDGE", index: i })}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="editor-panel">
            <h2 className="panel-title">Places ({state.pois.length})</h2>
            <div className="scroll-list">
              {state.pois.length === 0 && (
                <p className="empty-hint">No places yet — switch to Room mode and drag on the canvas.</p>
              )}
              {state.pois.map((poi) => (
                <div className="poi-editor-row" key={poi.id}>
                  <input
                    type="text"
                    className="poi-name-input"
                    value={poi.name}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_POI",
                        id: poi.id,
                        patch: { name: e.target.value },
                      })
                    }
                  />
                  <div className="field-row">
                    <select
                      value={poi.category}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_POI",
                          id: poi.id,
                          patch: { category: e.target.value as typeof poi.category },
                        })
                      }
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_META[c].label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={poi.nodeId}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_POI",
                          id: poi.id,
                          patch: { nodeId: e.target.value },
                        })
                      }
                    >
                      <option value="">No door point</option>
                      {state.nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.id}
                        </option>
                      ))}
                    </select>
                    <button
                      className="row-delete"
                      aria-label={`Delete ${poi.name}`}
                      onClick={() => dispatch({ type: "DELETE_POI", id: poi.id })}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="editor-panel">
            <h2 className="panel-title">Export</h2>
            {validation.issues.length > 0 ? (
              <ul className="issue-list">
                {validation.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="ok-text">
                Looks good — all {validation.totalRoutablePois} places are reachable from the start.
              </p>
            )}
            <div className="field-row">
              <button className="ghost-btn" onClick={copyJson}>
                {copied ? "Copied" : "Copy JSON"}
              </button>
              <button
                className="primary-btn"
                onClick={previewInApp}
                disabled={validation.issues.length > 0}
              >
                Preview in app
              </button>
            </div>
            <textarea className="json-input" rows={8} readOnly value={json} />
          </section>
        </aside>
      </div>
    </div>
  );
}
