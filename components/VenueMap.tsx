"use client";

import type { Venue } from "@/lib/venue";
import type { RouteResult } from "@/lib/pathfinding";
import { CATEGORY_META, getPoiCode } from "@/lib/categories";
import { wrapLabel } from "@/lib/textWrap";

interface VenueMapProps {
  venue: Venue;
  selectedId: string | null;
  route: RouteResult | null;
  onSelectPoi: (id: string) => void;
}

export default function VenueMap({
  venue,
  selectedId,
  route,
  onSelectPoi,
}: VenueMapProps) {
  const nodesById = new Map(venue.nodes.map((n) => [n.id, n]));
  const startId = venue.startNodeId;

  return (
    <svg
      viewBox={`0 0 ${venue.viewBox.w} ${venue.viewBox.h}`}
      className="map-svg"
      role="img"
      aria-label={`Floor map of ${venue.name}`}
    >
      {/* walkable floor */}
      {venue.walkways.map((room, i) => (
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

      {/* every edge in the routing graph, drawn as a thin connector path */}
      {venue.edges.map((edge, i) => {
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
            stroke="var(--line)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}

      {/* rooms */}
      {venue.pois
        .filter((p) => p.room)
        .map((poi) => {
          const meta = CATEGORY_META[poi.category];
          const room = poi.room!;
          const cx = room.x + room.w / 2;
          const cy = room.y + room.h / 2;
          const lines = wrapLabel(poi.name, room.w - 12);
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
              <text x={cx} y={cy} textAnchor="middle" className="room-label">
                {lines.map((line, i) => (
                  <tspan
                    key={i}
                    x={cx}
                    dy={i === 0 ? `${-(lines.length - 1) * 0.55}em` : "1.15em"}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

      {/* route */}
      {route && route.points.length > 1 && (
        <polyline
          points={route.points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="route-line"
        />
      )}

      {/* start marker */}
      {(() => {
        const start = nodesById.get(startId);
        if (!start) return null;
        return (
          <g>
            <circle cx={start.x} cy={start.y} r={9} fill="var(--ink)" />
            <circle
              cx={start.x}
              cy={start.y}
              r={16}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={2}
              opacity={0.35}
            />
          </g>
        );
      })()}

      {/* poi pins */}
      {venue.pois
        .filter((p) => p.nodeId !== startId)
        .map((poi) => {
          const node = nodesById.get(poi.nodeId);
          if (!node) return null;
          const meta = CATEGORY_META[poi.category];
          const isSelected = poi.id === selectedId;
          return (
            <g
              key={`pin-${poi.id}`}
              onClick={() => onSelectPoi(poi.id)}
              className="poi-pin"
              tabIndex={0}
              role="button"
              aria-label={`Route to ${poi.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelectPoi(poi.id);
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? 17 : 14}
                fill={`var(${meta.colorVar})`}
                stroke="var(--paper-raised)"
                strokeWidth={3}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                className="pin-code"
              >
                {getPoiCode(poi)}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
