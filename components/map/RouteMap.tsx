"use client";

import { useEffect, useRef } from "react";
import type { RidePoint, BrakingEvent, SignalStop } from "@/types";
import { buildRouteSegments } from "@/lib/analytics/engine";

interface Props {
  points: RidePoint[];
  layer: "route" | "speed";
  braking?: BrakingEvent[];
  signals?: SignalStop[];
}

const SPEED_COLORS: Record<string, string> = {
  slow: "#1EE8A0",
  urban: "#00C9FF",
  highway: "#FF6B2B",
  fast: "#FF3B5C",
};

export function RouteMap({ points, layer, braking = [], signals = [] }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || points.length < 2) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      const latlngs = points.map((p) => [p.latitude, p.longitude] as [number, number]);

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "map-tiles",
      }).addTo(map);

      if (layer === "route") {
        // Simple orange route
        L.polyline(latlngs, {
          color: "#FF6B2B",
          weight: 4,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      } else {
        // Speed heatmap — colored segments
        const segments = buildRouteSegments(points);
        for (const seg of segments) {
          const segLatLngs = seg.points.map((p) => [p.lat, p.lng] as [number, number]);
          L.polyline(segLatLngs, {
            color: SPEED_COLORS[seg.speedCategory],
            weight: 5,
            opacity: 0.85,
          }).addTo(map);
        }
      }

      // Start marker
      const startIcon = L.divIcon({
        html: `<div style="width:10px;height:10px;background:#1EE8A0;border:2px solid white;border-radius:50%;"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        className: "",
      });
      L.marker(latlngs[0], { icon: startIcon }).addTo(map);

      // End marker
      const endIcon = L.divIcon({
        html: `<div style="width:10px;height:10px;background:#FF3B5C;border:2px solid white;border-radius:50%;"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        className: "",
      });
      L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map);

      // Hard braking events
      for (const b of braking) {
        if (b.severity === "hard") {
          const bIcon = L.divIcon({
            html: `<div style="width:8px;height:8px;background:#FF3B5C;border:2px solid #FFB800;border-radius:50%;"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
            className: "",
          });
          L.marker([b.latitude, b.longitude], { icon: bIcon }).addTo(map);
        }
      }

      // Signal stops
      for (const s of signals) {
        const sIcon = L.divIcon({
          html: `<div style="width:8px;height:8px;background:#FFB800;border:2px solid white;border-radius:2px;"></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4],
          className: "",
        });
        L.marker([s.latitude, s.longitude], { icon: sIcon }).addTo(map);
      }

      // Fit bounds
      map.fitBounds(L.latLngBounds(latlngs), { padding: [20, 20] });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points, layer, braking, signals]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full leaflet-map-dark"
      style={{ background: "#111118" }}
    />
  );
}
