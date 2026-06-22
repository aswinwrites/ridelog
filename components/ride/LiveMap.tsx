"use client";

import { useEffect, useRef, useMemo } from "react";
import type { RidePoint } from "@/types";

interface Props {
  points: RidePoint[];
  currentSpeed: number;
  heading: number;
}

export function LiveMap({ points, currentSpeed, heading }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const lastPoint = points[points.length - 1];

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,      // Lock to auto-follow on mobile
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      });

      // OpenStreetMap tile layer with dark mode filter
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "map-tiles",
      }).addTo(map);

      // Route polyline
      const polyline = L.polyline([], {
        color: "#FF6B2B",
        weight: 4,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Current position marker (motorcycle icon)
      const icon = L.divIcon({
        html: `
          <div style="
            width: 20px; height: 20px;
            background: #FF6B2B;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(255,107,43,0.8);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: "",
      });

      const marker = L.marker([0, 0], { icon }).addTo(map);

      mapInstanceRef.current = map;
      polylineRef.current = polyline;
      markerRef.current = marker;

      // Set initial view if we have points
      if (points.length > 0) {
        const p = points[points.length - 1];
        map.setView([p.latitude, p.longitude], 16);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        polylineRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update route and position
  useEffect(() => {
    if (!mapInstanceRef.current || !lastPoint) return;

    const latlngs = points.map((p) => [p.latitude, p.longitude] as [number, number]);

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latlngs);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lastPoint.latitude, lastPoint.longitude]);
    }

    // Auto-follow: pan to current position
    mapInstanceRef.current.panTo([lastPoint.latitude, lastPoint.longitude], {
      animate: true,
      duration: 0.5,
    });
  }, [points, lastPoint]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full leaflet-map-dark"
        style={{ background: "#111118" }}
      />
      {/* Speed overlay */}
      {currentSpeed > 2 && (
        <div className="absolute top-3 right-3 bg-bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 z-[1000]">
          <span className="text-lg font-black font-numeric text-primary">
            {Math.round(currentSpeed)}
          </span>
          <span className="text-xs text-muted-foreground ml-1">km/h</span>
        </div>
      )}
      {/* OSM attribution */}
      <div className="absolute bottom-1 right-1 text-2xs text-muted-foreground/50 z-[1000]">
        © OpenStreetMap
      </div>
    </div>
  );
}
