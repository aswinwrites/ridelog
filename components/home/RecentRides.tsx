"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Ride } from "@/types";
import { formatDistance, formatDurationLong, formatDate, formatSpeed } from "@/lib/utils/format";
import { Gauge, MapPin, Clock, Zap } from "lucide-react";

interface Props {
  rides: Ride[];
}

export function RecentRides({ rides }: Props) {
  if (rides.length === 0) {
    return (
      <div className="px-5">
        <div className="bg-bg-card rounded-2xl p-8 border border-border/50 text-center">
          <div className="text-4xl mb-3">🏍️</div>
          <p className="text-foreground-secondary font-medium mb-1">No rides yet</p>
          <p className="text-xs text-muted-foreground">Tap Start Ride to begin tracking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 flex flex-col gap-3">
      {rides.map((ride, i) => (
        <motion.div
          key={ride.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Link href={`/rides/${ride.id}`}>
            <RideCard ride={ride} />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export function RideCard({ ride }: { ride: Ride }) {
  const { analytics } = ride;

  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-border/50 active:border-primary/30 active:bg-bg-elevated transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <p className="font-semibold text-sm text-foreground truncate">{ride.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(ride.startTime, "day")}
          </p>
        </div>
        <span className="text-lg font-bold text-primary font-numeric shrink-0">
          {formatDistance(analytics?.distanceKm ?? 0)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatPill icon={Clock} value={formatDurationLong(analytics?.durationSeconds ?? 0)} label="Duration" />
        <StatPill icon={Gauge} value={formatSpeed(analytics?.avgSpeedKmh ?? 0)} label="Avg speed" />
        <StatPill icon={Zap} value={formatSpeed(analytics?.topSpeedKmh ?? 0)} label="Top speed" color="text-primary" />
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
  color = "text-foreground-secondary",
}: {
  icon: typeof Clock;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="bg-bg-surface rounded-xl px-2.5 py-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon size={11} className="text-muted-foreground" />
        <span className="text-2xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-xs font-semibold font-numeric ${color}`}>{value}</span>
    </div>
  );
}
