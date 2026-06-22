"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useRideStore } from "@/store/useRideStore";
import {
  formatDistance,
  formatDurationLong,
  formatSpeed,
  formatAcceleration,
  toMonthString,
} from "@/lib/utils/format";
import { Trophy, Zap, Route, Clock, Calendar, Timer, TrendingUp } from "lucide-react";
import Link from "next/link";

export function AnalyticsScreen() {
  const { rides } = useRideStore();
  const completed = useMemo(
    () => rides.filter((r) => r.status === "completed" && r.analytics),
    [rides]
  );

  // Lifetime stats
  const lifetime = useMemo(() => {
    if (completed.length === 0) return null;
    const totalDist = completed.reduce((s, r) => s + (r.analytics?.distanceKm ?? 0), 0);
    const totalDuration = completed.reduce((s, r) => s + (r.analytics?.durationSeconds ?? 0), 0);
    const totalRideDays = new Set(completed.map((r) => r.startTime.slice(0, 10))).size;
    const topSpeed = Math.max(...completed.map((r) => r.analytics?.topSpeedKmh ?? 0));
    const longestRide = Math.max(...completed.map((r) => r.analytics?.distanceKm ?? 0));
    const longestRideDuration = Math.max(...completed.map((r) => r.analytics?.durationSeconds ?? 0));
    const best0to60 = completed.reduce<number | undefined>((b, r) => {
      const v = r.analytics?.acceleration.best0to60;
      return v !== undefined ? (b === undefined ? v : Math.min(b, v)) : b;
    }, undefined);
    const best0to100 = completed.reduce<number | undefined>((b, r) => {
      const v = r.analytics?.acceleration.best0to100;
      return v !== undefined ? (b === undefined ? v : Math.min(b, v)) : b;
    }, undefined);
    const dayMap: Record<string, number> = {};
    for (const r of completed) {
      const d = r.startTime.slice(0, 10);
      dayMap[d] = (dayMap[d] ?? 0) + (r.analytics?.distanceKm ?? 0);
    }
    const maxDay = Object.values(dayMap).reduce((max, v) => Math.max(max, v), 0);
    const totalSignalWait = completed.reduce((s, r) => s + (r.analytics?.signals.totalWaitTime ?? 0), 0);

    return {
      totalDist,
      totalDuration,
      totalRideDays,
      topSpeed,
      longestRide,
      longestRideDuration,
      best0to60,
      best0to100,
      mostDistInOneDay: maxDay,
      totalSignalWait,
      rideCount: completed.length,
    };
  }, [completed]);

  // Monthly chart data (last 12 months)
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; dist: number; hours: number; days: number; avgSpeed: number }> = {};

    for (const ride of completed) {
      const m = toMonthString(new Date(ride.startTime));
      if (!map[m]) {
        map[m] = { month: m, dist: 0, hours: 0, days: 0, avgSpeed: 0 };
      }
      map[m].dist += ride.analytics?.distanceKm ?? 0;
      map[m].hours += (ride.analytics?.durationSeconds ?? 0) / 3600;
    }

    // Compute per-month avg speed
    for (const entry of Object.values(map)) {
      const monthRides = completed.filter((r) => toMonthString(new Date(r.startTime)) === entry.month);
      const totalDist = monthRides.reduce((s, r) => s + (r.analytics?.distanceKm ?? 0), 0);
      const totalMoving = monthRides.reduce((s, r) => s + (r.analytics?.movingTimeSeconds ?? 0), 0);
      entry.avgSpeed = totalMoving > 0 ? totalDist / (totalMoving / 3600) : 0;
      entry.days = new Set(monthRides.map((r) => r.startTime.slice(0, 10))).size;
    }

    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map((d) => ({
        ...d,
        label: new Date(d.month + "-01").toLocaleDateString("en-IN", { month: "short" }),
        dist: Math.round(d.dist),
        hours: Math.round(d.hours * 10) / 10,
        avgSpeed: Math.round(d.avgSpeed),
      }));
  }, [completed]);

  if (completed.length === 0) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 px-8 pb-24">
        <Route size={48} className="text-muted-foreground" />
        <p className="text-foreground-secondary font-medium text-center">
          No rides yet
        </p>
        <p className="text-muted-foreground text-sm text-center">
          Complete some rides to see your analytics
        </p>
        <Link href="/ride/active">
          <button className="bg-primary text-white font-semibold px-6 py-3 rounded-2xl">
            Start First Ride
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{lifetime?.rideCount} rides</p>
      </div>

      {/* Lifetime stats grid */}
      {lifetime && (
        <div className="px-5 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            All Time
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Route} color="text-primary" label="Total Distance" value={formatDistance(lifetime.totalDist)} />
            <StatCard icon={Clock} color="text-accent" label="Total Time" value={formatDurationLong(lifetime.totalDuration)} />
            <StatCard icon={Calendar} color="text-success" label="Ride Days" value={`${lifetime.totalRideDays}`} />
            <StatCard icon={Zap} color="text-danger" label="Top Speed" value={formatSpeed(lifetime.topSpeed)} />
            <StatCard icon={Trophy} color="text-warning" label="Longest Ride" value={formatDistance(lifetime.longestRide)} />
            <StatCard icon={Timer} color="text-primary" label="Signal Wait" value={formatDurationLong(lifetime.totalSignalWait)} />
            {lifetime.best0to60 && (
              <StatCard icon={TrendingUp} color="text-primary" label="Best 0-60" value={formatAcceleration(lifetime.best0to60)} />
            )}
            {lifetime.best0to100 && (
              <StatCard icon={TrendingUp} color="text-danger" label="Best 0-100" value={formatAcceleration(lifetime.best0to100)} />
            )}
          </div>
        </div>
      )}

      {/* Monthly charts */}
      {monthlyData.length > 1 && (
        <>
          <ChartSection title="Distance by Month" unit="km">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D42" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6B6B8A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B6B8A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1C1C28", border: "1px solid #2D2D42", borderRadius: 12 }}
                labelStyle={{ color: "#CCCCDD" }}
                itemStyle={{ color: "#FF6B2B" }}
              />
              <Bar dataKey="dist" fill="#FF6B2B" radius={[4, 4, 0, 0]} name="km" />
            </BarChart>
          </ChartSection>

          <ChartSection title="Ride Hours by Month" unit="h">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D42" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6B6B8A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B6B8A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1C1C28", border: "1px solid #2D2D42", borderRadius: 12 }}
                labelStyle={{ color: "#CCCCDD" }}
                itemStyle={{ color: "#00C9FF" }}
              />
              <Bar dataKey="hours" fill="#00C9FF" radius={[4, 4, 0, 0]} name="hours" />
            </BarChart>
          </ChartSection>

          <ChartSection title="Ride Days by Month" unit="days">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D42" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6B6B8A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B6B8A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1C1C28", border: "1px solid #2D2D42", borderRadius: 12 }}
                labelStyle={{ color: "#CCCCDD" }}
                itemStyle={{ color: "#1EE8A0" }}
              />
              <Bar dataKey="days" fill="#1EE8A0" radius={[4, 4, 0, 0]} name="days" />
            </BarChart>
          </ChartSection>

          <ChartSection title="Avg Speed by Month" unit="km/h">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D42" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6B6B8A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B6B8A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1C1C28", border: "1px solid #2D2D42", borderRadius: 12 }}
                labelStyle={{ color: "#CCCCDD" }}
                itemStyle={{ color: "#FFB800" }}
              />
              <Line
                type="monotone"
                dataKey="avgSpeed"
                stroke="#FFB800"
                strokeWidth={2.5}
                dot={{ fill: "#FFB800", r: 3 }}
                name="km/h"
              />
            </LineChart>
          </ChartSection>
        </>
      )}

      {/* Wrapped CTA */}
      <div className="px-5 mt-2">
        <Link href={`/wrapped/${new Date().getFullYear()}`}>
          <div className="bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">{new Date().getFullYear()} Wrapped</p>
              <p className="text-xs text-muted-foreground">Your year in rides</p>
            </div>
            <span className="text-2xl">🏍️</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Route;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-bg-card rounded-2xl p-4 border border-border/50"
    >
      <Icon size={14} className={`${color} mb-2`} />
      <p className={`text-xl font-black font-numeric ${color}`}>{value}</p>
      <p className="text-2xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

function ChartSection({ title, unit, children }: { title: string; unit: string; children: React.ReactNode }) {
  return (
    <div className="px-5 mb-6">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-2xs text-muted-foreground">{unit}</span>
      </div>
      <div className="bg-bg-card rounded-2xl p-4 border border-border/50">
        <ResponsiveContainer width="100%" height={180}>
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
