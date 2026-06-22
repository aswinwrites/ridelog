"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { MILESTONES } from "@/types";
import { formatDistance } from "@/lib/utils/format";

interface Props {
  totalDistanceKm: number;
}

export function MilestoneCard({ totalDistanceKm }: Props) {
  const { achieved, next, progress } = useMemo(() => {
    const achieved = MILESTONES.filter((m) => totalDistanceKm >= m.distanceKm);
    const next = MILESTONES.find((m) => totalDistanceKm < m.distanceKm);
    const prevMilestone = achieved[achieved.length - 1]?.distanceKm ?? 0;
    const progress = next
      ? ((totalDistanceKm - prevMilestone) / (next.distanceKm - prevMilestone)) * 100
      : 100;
    return { achieved, next, progress };
  }, [totalDistanceKm]);

  if (!next) {
    return (
      <div className="bg-bg-card rounded-2xl p-4 border border-warning/30 flex items-center gap-3">
        <div className="bg-warning/10 rounded-xl p-2.5">
          <Trophy size={20} className="text-warning" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">All milestones achieved! 🎉</p>
          <p className="text-xs text-muted-foreground">{formatDistance(totalDistanceKm)} total distance</p>
        </div>
      </div>
    );
  }

  const remaining = next.distanceKm - totalDistanceKm;

  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-warning/10 rounded-lg p-1.5">
            <Trophy size={14} className="text-warning" />
          </div>
          <span className="text-sm font-semibold text-foreground">Next Milestone</span>
        </div>
        <span className="text-sm font-bold text-warning font-numeric">{next.label}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-bg-surface rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full bg-gradient-to-r from-warning/80 to-warning rounded-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-numeric">
          {formatDistance(totalDistanceKm)}
        </span>
        <span className="text-xs text-warning font-medium">
          {formatDistance(remaining)} to go
        </span>
        <span className="text-xs text-muted-foreground font-numeric">
          {formatDistance(next.distanceKm)}
        </span>
      </div>

      {/* Previous milestones chips */}
      {achieved.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {achieved.map((m) => (
            <span
              key={m.id}
              className="text-2xs font-medium text-warning/70 bg-warning/10 rounded-full px-2 py-0.5"
            >
              ✓ {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
