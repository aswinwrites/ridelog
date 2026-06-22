"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Ride } from "@/types";
import { toDateString, formatDistance, formatDurationLong } from "@/lib/utils/format";

interface Props {
  rides: Ride[];
}

/** GitHub-style contribution heatmap for ride activity */
export function RidingCalendar({ rides }: Props) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build date → distance map for last 16 weeks
  const { weeks, maxDist } = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ride of rides) {
      const d = toDateString(new Date(ride.startTime));
      map[d] = (map[d] ?? 0) + (ride.analytics?.distanceKm ?? 0);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back to the Sunday 16 weeks ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 16 * 7 - startDate.getDay());

    const weeks: Array<Array<{ date: string; dist: number }>> = [];
    let week: Array<{ date: string; dist: number }> = [];

    const cursor = new Date(startDate);
    while (cursor <= today) {
      const ds = toDateString(cursor);
      week.push({ date: ds, dist: map[ds] ?? 0 });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (week.length) weeks.push(week);

    const maxDist = Math.max(...Object.values(map), 1);

    return { weeks, maxDist };
  }, [rides]);

  // Get rides for selected day
  const selectedRides = useMemo(() => {
    if (!selectedDay) return [];
    return rides.filter((r) => toDateString(new Date(r.startTime)) === selectedDay);
  }, [rides, selectedDay]);

  function getIntensity(dist: number): number {
    if (dist === 0) return 0;
    return Math.min(Math.ceil((dist / maxDist) * 4), 4);
  }

  const intensityColors = [
    "bg-border/50",           // 0 — empty
    "bg-primary/25",          // 1 — low
    "bg-primary/45",          // 2 — medium-low
    "bg-primary/70",          // 3 — medium
    "bg-primary",             // 4 — high
  ];

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const monthLabels = useMemo(() => {
    const labels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = new Date(week[0].date);
      if (firstDay.getMonth() !== lastMonth) {
        lastMonth = firstDay.getMonth();
        labels.push({
          label: firstDay.toLocaleDateString("en-IN", { month: "short" }),
          colIndex: wi,
        });
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-border/50">
      {/* Month labels */}
      <div className="relative mb-1 h-4 ml-6">
        {monthLabels.map(({ label, colIndex }) => (
          <span
            key={`${label}-${colIndex}`}
            className="absolute text-2xs text-muted-foreground"
            style={{ left: colIndex * 16 }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="h-[11px] w-4 flex items-center">
              {i % 2 === 1 && (
                <span className="text-2xs text-muted-foreground leading-none">{d}</span>
              )}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex gap-[3px] overflow-x-auto scrollbar-hide">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map(({ date, dist }) => {
                const intensity = getIntensity(dist);
                const isSelected = selectedDay === date;
                const isFuture = date > toDateString(new Date());

                return (
                  <motion.button
                    key={date}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => !isFuture && setSelectedDay(isSelected ? null : date)}
                    className={`
                      w-[11px] h-[11px] rounded-sm transition-all
                      ${isFuture ? "opacity-20" : ""}
                      ${intensityColors[intensity]}
                      ${isSelected ? "ring-1 ring-primary ring-offset-1 ring-offset-bg-card" : ""}
                    `}
                    title={`${date}: ${formatDistance(dist)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-2xs text-muted-foreground">Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${color}`} />
        ))}
        <span className="text-2xs text-muted-foreground">More</span>
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && selectedRides.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border/50 overflow-hidden"
          >
            <p className="text-xs text-muted-foreground font-medium mb-2">
              {new Date(selectedDay).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            {selectedRides.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between py-1">
                <span className="text-xs text-foreground truncate max-w-[60%]">{ride.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary font-numeric">
                    {formatDistance(ride.analytics?.distanceKm ?? 0)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDurationLong(ride.analytics?.durationSeconds ?? 0)}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
        {selectedDay && selectedRides.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border/50"
          >
            <p className="text-xs text-muted-foreground text-center py-1">No rides on this day</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
