"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Download } from "lucide-react";
import { useRideStore } from "@/store/useRideStore";
import {
  formatDistance,
  formatDurationLong,
  formatSpeed,
  formatAcceleration,
} from "@/lib/utils/format";

interface Props {
  year: number;
}

export function WrappedScreen({ year }: Props) {
  const router = useRouter();
  const { rides } = useRideStore();
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const yearRides = rides.filter(
      (r) =>
        r.status === "completed" &&
        r.analytics &&
        new Date(r.startTime).getFullYear() === year
    );

    if (yearRides.length === 0) return null;

    const totalDist = yearRides.reduce((s, r) => s + (r.analytics?.distanceKm ?? 0), 0);
    const totalDuration = yearRides.reduce((s, r) => s + (r.analytics?.durationSeconds ?? 0), 0);
    const rideDays = new Set(yearRides.map((r) => r.startTime.slice(0, 10))).size;
    const topSpeed = Math.max(...yearRides.map((r) => r.analytics?.topSpeedKmh ?? 0));
    const longestRide = yearRides.reduce<typeof yearRides[0] | null>(
      (max, r) => (!max || (r.analytics?.distanceKm ?? 0) > (max.analytics?.distanceKm ?? 0) ? r : max),
      null
    );
    const totalSignalWait = yearRides.reduce((s, r) => s + (r.analytics?.signals.totalWaitTime ?? 0), 0);
    const best0to60 = yearRides.reduce<number | undefined>((b, r) => {
      const v = r.analytics?.acceleration.best0to60;
      return v !== undefined ? (b === undefined ? v : Math.min(b, v)) : b;
    }, undefined);

    // Most popular month
    const monthCounts: Record<string, number> = {};
    for (const r of yearRides) {
      const m = r.startTime.slice(0, 7);
      monthCounts[m] = (monthCounts[m] ?? 0) + (r.analytics?.distanceKm ?? 0);
    }
    const bestMonth = Object.entries(monthCounts).sort(([, a], [, b]) => b - a)[0];
    const bestMonthLabel = bestMonth
      ? new Date(bestMonth[0] + "-01").toLocaleDateString("en-IN", { month: "long" })
      : null;

    return {
      rideCount: yearRides.length,
      totalDist,
      totalDuration,
      rideDays,
      topSpeed,
      longestRide: longestRide?.analytics?.distanceKm ?? 0,
      longestRideName: longestRide?.name ?? "",
      totalSignalWait,
      best0to60,
      bestMonth: bestMonthLabel,
    };
  }, [rides, year]);

  const shareCard = async () => {
    if (!cardRef.current) return;
    try {
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `My ${year} RideLog Wrapped`,
          text: `I rode ${formatDistance(stats?.totalDist ?? 0)} in ${year}! 🏍️ #RideLog`,
        });
      }
    } catch {
      // Silent fail
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-bg-base pb-8">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">{year} Wrapped</h1>
        {stats && (
          <button onClick={shareCard} className="ml-auto text-muted-foreground">
            <Share2 size={20} />
          </button>
        )}
      </div>

      {!stats ? (
        <div className="px-5 py-16 text-center">
          <p className="text-4xl mb-4">🏍️</p>
          <p className="text-foreground-secondary font-medium">No rides in {year}</p>
          <p className="text-xs text-muted-foreground mt-1">Start riding to build your Wrapped!</p>
        </div>
      ) : (
        <div className="px-5" ref={cardRef}>
          {/* Hero card */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl mb-4"
            style={{
              background: "linear-gradient(135deg, #FF6B2B 0%, #FF3B5C 50%, #9333EA 100%)",
              padding: "2px",
            }}
          >
            <div
              className="rounded-3xl p-6"
              style={{ background: "linear-gradient(135deg, #1C1C28 0%, #0A0A1A 100%)" }}
            >
              <div className="text-4xl mb-3">🏍️</div>
              <p className="text-muted-foreground text-sm font-medium mb-1">{year}</p>
              <h2 className="text-4xl font-black mb-1 text-gradient-orange">
                {formatDistance(stats.totalDist)}
              </h2>
              <p className="text-foreground-secondary">total distance ridden</p>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-black text-accent font-numeric">{stats.rideCount}</p>
                  <p className="text-2xs text-muted-foreground">rides</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-success font-numeric">{stats.rideDays}</p>
                  <p className="text-2xs text-muted-foreground">days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-warning font-numeric">
                    {formatDurationLong(stats.totalDuration)}
                  </p>
                  <p className="text-2xs text-muted-foreground">on the road</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <WrappedCard
              emoji="⚡"
              title="Top Speed"
              value={formatSpeed(stats.topSpeed)}
              delay={0.1}
              gradient="from-danger/20 to-primary/10"
              border="border-danger/20"
            />
            <WrappedCard
              emoji="🛣️"
              title="Longest Ride"
              value={formatDistance(stats.longestRide)}
              subtitle={stats.longestRideName}
              delay={0.15}
              gradient="from-primary/20 to-accent/10"
              border="border-primary/20"
            />
            <WrappedCard
              emoji="🚦"
              title="Signal Wait"
              value={formatDurationLong(stats.totalSignalWait)}
              subtitle="time lost at signals"
              delay={0.2}
              gradient="from-warning/20 to-danger/10"
              border="border-warning/20"
            />
            {stats.bestMonth && (
              <WrappedCard
                emoji="📅"
                title="Busiest Month"
                value={stats.bestMonth}
                delay={0.25}
                gradient="from-success/20 to-accent/10"
                border="border-success/20"
              />
            )}
            {stats.best0to60 !== undefined && (
              <WrappedCard
                emoji="🏁"
                title="Best 0-60"
                value={formatAcceleration(stats.best0to60)}
                delay={0.3}
                gradient="from-primary/20 to-warning/10"
                border="border-primary/20"
              />
            )}
          </div>

          {/* Share button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={shareCard}
            className="w-full flex items-center justify-center gap-2 bg-primary/15 border border-primary/30 text-primary font-semibold py-4 rounded-2xl"
          >
            <Share2 size={18} />
            Share my {year} Wrapped
          </motion.button>
        </div>
      )}
    </div>
  );
}

function WrappedCard({
  emoji,
  title,
  value,
  subtitle,
  delay,
  gradient,
  border,
}: {
  emoji: string;
  title: string;
  value: string;
  subtitle?: string;
  delay: number;
  gradient: string;
  border: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 border ${border}`}
    >
      <span className="text-2xl block mb-2">{emoji}</span>
      <p className="text-2xs text-muted-foreground mb-1">{title}</p>
      <p className="text-base font-black font-numeric text-foreground leading-tight">{value}</p>
      {subtitle && <p className="text-2xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
    </motion.div>
  );
}
