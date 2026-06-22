"use client";

import { formatDistance, formatDuration } from "@/lib/utils/format";

interface Props {
  distanceKm: number;
  elapsedSeconds: number;
  speed: number;
  altitude: number;
}

export function LiveStatBar({ distanceKm, elapsedSeconds, speed, altitude }: Props) {
  const stats = [
    { label: "DIST", value: formatDistance(distanceKm), color: "text-accent" },
    { label: "TIME", value: formatDuration(elapsedSeconds), color: "text-foreground" },
    { label: "ALT", value: `${Math.round(altitude)}m`, color: "text-success" },
  ];

  return (
    <div className="flex items-stretch divide-x divide-border/50 bg-bg-card border-t border-b border-border/50">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="flex-1 flex flex-col items-center py-3 gap-0.5">
          <span className="text-2xs font-semibold text-muted-foreground tracking-widest">{label}</span>
          <span className={`text-sm font-bold font-numeric ${color}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}
