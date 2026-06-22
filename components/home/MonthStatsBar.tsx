"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, Calendar, Flame } from "lucide-react";
import { formatDistance, formatDurationLong } from "@/lib/utils/format";

interface Props {
  distanceKm: number;
  durationSeconds: number;
  rideDays: number;
  streakDays: number;
  month: string;
}

export function MonthStatsBar({ distanceKm, durationSeconds, rideDays, streakDays, month }: Props) {
  const stats = [
    {
      icon: MapPin,
      label: "Distance",
      value: formatDistance(distanceKm),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Clock,
      label: "Ride Time",
      value: formatDurationLong(durationSeconds),
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Calendar,
      label: "Ride Days",
      value: `${rideDays}d`,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${streakDays}d`,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-border/50">
      <p className="text-xs text-muted-foreground font-medium mb-3">{month}</p>
      <div className="grid grid-cols-4 gap-2">
        {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`${bg} rounded-xl p-2`}>
              <Icon size={16} className={color} />
            </div>
            <span className={`text-sm font-bold font-numeric ${color}`}>{value}</span>
            <span className="text-2xs text-muted-foreground text-center">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
