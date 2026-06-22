"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Zap } from "lucide-react";
import { useRideStore } from "@/store/useRideStore";
import { MonthStatsBar } from "./MonthStatsBar";
import { RidingCalendar } from "./RidingCalendar";
import { RecentRides } from "./RecentRides";
import { MilestoneCard } from "./MilestoneCard";
import { formatDistance, formatDurationLong, computeStreak, toDateString, toMonthString } from "@/lib/utils/format";

export function HomeScreen() {
  const { rides } = useRideStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const completed = useMemo(
    () => rides.filter((r) => r.status === "completed" && r.analytics),
    [rides]
  );

  const currentMonth = toMonthString(currentTime);

  const monthRides = useMemo(
    () => completed.filter((r) => r.startTime.startsWith(currentMonth)),
    [completed, currentMonth]
  );

  const monthDist = monthRides.reduce((s, r) => s + (r.analytics?.distanceKm ?? 0), 0);
  const monthHours = monthRides.reduce((s, r) => s + (r.analytics?.durationSeconds ?? 0), 0);
  const monthDays = new Set(monthRides.map((r) => toDateString(new Date(r.startTime)))).size;

  const rideDates = useMemo(
    () => completed.map((r) => toDateString(new Date(r.startTime))),
    [completed]
  );
  const { current: streakDays } = useMemo(() => computeStreak(rideDates), [rideDates]);

  const totalDist = completed.reduce((s, r) => s + (r.analytics?.distanceKm ?? 0), 0);

  const greeting = useMemo(() => {
    const h = currentTime.getHours();
    if (h < 5) return "Night owl";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Night rider";
  }, [currentTime]);

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-muted-foreground text-sm font-medium mb-1">{greeting}</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Your Rides
          </h1>
        </motion.div>
      </div>

      {/* Month Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="px-5 mb-5"
      >
        <MonthStatsBar
          distanceKm={monthDist}
          durationSeconds={monthHours}
          rideDays={monthDays}
          streakDays={streakDays}
          month={currentTime.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        />
      </motion.div>

      {/* Start Ride CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <Link href="/ride/active">
          <button className="w-full relative overflow-hidden rounded-2xl bg-primary py-5 flex items-center justify-center gap-3 shadow-glow-md active:scale-[0.98] transition-transform">
            {/* Animated background pulse */}
            <motion.div
              className="absolute inset-0 bg-white/10 rounded-2xl"
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <Play size={22} className="fill-white text-white" />
            <span className="text-white font-bold text-lg tracking-wide">Start Ride</span>
            <Zap size={16} className="text-white/60 absolute right-5" />
          </button>
        </Link>
      </motion.div>

      {/* Riding Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <div className="px-5 mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Activity</h2>
          <span className="text-xs text-muted-foreground">
            {totalDist > 0 ? formatDistance(totalDist) + " total" : "No rides yet"}
          </span>
        </div>
        <div className="px-5">
          <RidingCalendar rides={completed} />
        </div>
      </motion.div>

      {/* Milestone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <MilestoneCard totalDistanceKm={totalDist} />
      </motion.div>

      {/* Recent Rides */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="px-5 mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Rides</h2>
          <Link href="/rides" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
        <RecentRides rides={completed.slice(0, 5)} />
      </motion.div>
    </div>
  );
}
