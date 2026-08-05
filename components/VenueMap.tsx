"use client";

import type { Venue } from "@/lib/venue";
import type { RouteResult } from "@/lib/pathfinding";
import { CATEGORY_META, POI_CODES } from "@/lib/categories";

interface VenueMapProps {
  venue: Venue;
  startId: string;
  selectedId: string | null;
  route: RouteResult | null;
  onSelectPoi: (id: string) => void;
}

export default function VenueMap({
  venue,
  startId,
  selectedId,
  route,
  onSelectPoi,
}: VenueMapProps) {
  const nodesById = new Map(venue.nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`0 0 ${venue.viewBox.w} ${venue.viewBox.h}`}
      className="map-svg"
      role="img"
      aria-label={`Floor map of ${venue.name}`}
    >
      {/* corridor floor */}
      <rect
        x={venue.corridor.x}
        y={venue.corridor.y}
        width={venue.corridor.w}
        height={venue.corridor.h}
        rx={4}
        fill="var(--paper-raised)"
        stroke="var(--line)"
        strokeWidth={2}
      />

      {/* doorway connectors between corridor and rooms */}
      {venue.pois
        .filter((p) => p.room)
        .map((poi) => {
          const node = nodesById.get(poi.nodeId)!;
          const isTop = node.y < venue.corridor.y;
          const y1 = isTop ? node.y : venue.corridor.y + venue.corridor.h;
          const y2 = isTop ? venue.corridor.y : node.y;
          return (
            <rect
              key={`door-${poi.id}`}
              x={node.x - 9}
              y={y1}
              width={18}
              height={y2 - y1}
              fill="var(--paper-raised)"
              stroke="var(--line)"
              strokeWidth={2}
            />
          );
        })}

      {/* rooms */}
      {venue.pois
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
        const start = nodesById.get(startId)!;
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
        .filter((p) => p.id !== startId)
        .map((poi) => {
          const node = nodesById.get(poi.nodeId)!;
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
                {POI_CODES[poi.id] ?? "?"}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
