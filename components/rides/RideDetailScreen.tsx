"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ArrowLeft, Trash2, MapPin, Clock, Gauge, Zap, TrendingUp, TrendingDown, AlertTriangle, Timer } from "lucide-react";
import type { Ride, RidePoint } from "@/types";
import { useRideStore } from "@/store/useRideStore";
import {
  formatDistance,
  formatDurationLong,
  formatSpeed,
  formatDate,
  formatTime,
  formatAcceleration,
} from "@/lib/utils/format";

const RouteMap = dynamic(() => import("@/components/map/RouteMap").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-bg-surface rounded-2xl flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading map…</span>
    </div>
  ),
});

interface Props {
  rideId: string;
}

export function RideDetailScreen({ rideId }: Props) {
  const router = useRouter();
  const { getRideWithPoints, deleteRide } = useRideStore();
  const [ride, setRide] = useState<Ride | null>(null);
  const [points, setPoints] = useState<RidePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mapLayer, setMapLayer] = useState<"route" | "speed">("route");

  useEffect(() => {
    getRideWithPoints(rideId).then((result) => {
      if (result) {
        setRide(result.ride);
        setPoints(result.points);
      }
      setIsLoading(false);
    });
  }, [rideId, getRideWithPoints]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading ride…</div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Ride not found</p>
        <button onClick={() => router.back()} className="text-primary text-sm">
          Go back
        </button>
      </div>
    );
  }

  const { analytics } = ride;

  const handleDelete = async () => {
    await deleteRide(rideId);
    router.replace("/rides");
  };

  return (
    <div className="min-h-screen bg-bg-base pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 glass px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground active:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-semibold text-foreground truncate max-w-[60%]">
            {ride.name}
          </h1>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-danger/60 active:text-danger transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="px-5 pt-4">
        {/* Date & time */}
        <p className="text-xs text-muted-foreground mb-4">
          {formatDate(ride.startTime)} · {formatTime(ride.startTime)}
          {ride.endTime && ` → ${formatTime(ride.endTime)}`}
        </p>

        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <HeroStat
            icon={MapPin}
            label="Distance"
            value={formatDistance(analytics?.distanceKm ?? 0)}
            color="text-primary"
            iconBg="bg-primary/10"
          />
          <HeroStat
            icon={Clock}
            label="Duration"
            value={formatDurationLong(analytics?.durationSeconds ?? 0)}
            color="text-accent"
            iconBg="bg-accent/10"
          />
          <HeroStat
            icon={Gauge}
            label="Avg Speed"
            value={formatSpeed(analytics?.avgSpeedKmh ?? 0)}
            color="text-success"
            iconBg="bg-success/10"
          />
          <HeroStat
            icon={Zap}
            label="Top Speed"
            value={formatSpeed(analytics?.topSpeedKmh ?? 0)}
            color="text-danger"
            iconBg="bg-danger/10"
          />
        </div>

        {/* Map */}
        {points.length > 1 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">Route</span>
              <div className="flex gap-1 ml-auto">
                {(["route", "speed"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setMapLayer(l)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      mapLayer === l ? "bg-primary text-white" : "bg-bg-card text-muted-foreground"
                    }`}
                  >
                    {l === "route" ? "Route" : "Speed"}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 rounded-2xl overflow-hidden border border-border/50">
              <RouteMap
                points={points}
                layer={mapLayer}
                braking={analytics?.braking.events ?? []}
                signals={analytics?.signals.stops ?? []}
              />
            </div>
          </div>
        )}

        {/* Moving vs Idle time */}
        <div className="bg-bg-card rounded-2xl p-4 border border-border/50 mb-4">
          <h3 className="text-sm font-semibold mb-3">Time Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/10 rounded-xl p-3">
              <p className="text-2xs text-success mb-1">Moving</p>
              <p className="text-base font-bold text-success font-numeric">
                {formatDurationLong(analytics?.movingTimeSeconds ?? 0)}
              </p>
            </div>
            <div className="bg-warning/10 rounded-xl p-3">
              <p className="text-2xs text-warning mb-1">Idle</p>
              <p className="text-base font-bold text-warning font-numeric">
                {formatDurationLong(analytics?.idleTimeSeconds ?? 0)}
              </p>
            </div>
          </div>
          {/* Speed distribution bar */}
          {analytics && (
            <div className="mt-3">
              <p className="text-2xs text-muted-foreground mb-1.5">Speed distribution</p>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {analytics.speedDistribution.slow > 0 && (
                  <div
                    className="bg-success/60"
                    style={{ width: `${analytics.speedDistribution.slow}%` }}
                  />
                )}
                {analytics.speedDistribution.urban > 0 && (
                  <div
                    className="bg-accent/60"
                    style={{ width: `${analytics.speedDistribution.urban}%` }}
                  />
                )}
                {analytics.speedDistribution.highway > 0 && (
                  <div
                    className="bg-primary/80"
                    style={{ width: `${analytics.speedDistribution.highway}%` }}
                  />
                )}
                {analytics.speedDistribution.fast > 0 && (
                  <div
                    className="bg-danger"
                    style={{ width: `${analytics.speedDistribution.fast}%` }}
                  />
                )}
              </div>
              <div className="flex gap-3 mt-1.5 flex-wrap">
                <Legend color="bg-success/60" label={`Slow ${analytics.speedDistribution.slow}%`} />
                <Legend color="bg-accent/60" label={`Urban ${analytics.speedDistribution.urban}%`} />
                <Legend color="bg-primary/80" label={`Highway ${analytics.speedDistribution.highway}%`} />
                <Legend color="bg-danger" label={`Fast ${analytics.speedDistribution.fast}%`} />
              </div>
            </div>
          )}
        </div>

        {/* Signal analytics */}
        {analytics && analytics.signals.count > 0 && (
          <div className="bg-bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Timer size={15} className="text-warning" />
              Signal Stops
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatRow label="Stops" value={String(analytics.signals.count)} />
              <StatRow label="Total wait" value={formatDurationLong(analytics.signals.totalWaitTime)} />
              <StatRow label="Longest wait" value={formatDurationLong(analytics.signals.longestWait)} />
              <StatRow label="Ride time %" value={`${analytics.signals.rideTimePercentage.toFixed(1)}%`} />
            </div>
          </div>
        )}

        {/* Braking analytics */}
        {analytics && analytics.braking.totalEvents > 0 && (
          <div className="bg-bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle size={15} className="text-danger" />
              Braking Events
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-success/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-success">{analytics.braking.mildEvents}</p>
                <p className="text-2xs text-muted-foreground">Mild</p>
              </div>
              <div className="bg-warning/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-warning">{analytics.braking.moderateEvents}</p>
                <p className="text-2xs text-muted-foreground">Moderate</p>
              </div>
              <div className="bg-danger/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-danger">{analytics.braking.hardEvents}</p>
                <p className="text-2xs text-muted-foreground">Hard</p>
              </div>
            </div>
          </div>
        )}

        {/* Acceleration records */}
        {analytics && (analytics.acceleration.best0to60 || analytics.acceleration.best0to100) && (
          <div className="bg-bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={15} className="text-primary" />
              Acceleration Records
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {analytics.acceleration.best0to40 !== undefined && (
                <AccelStat label="0→40 km/h" value={formatAcceleration(analytics.acceleration.best0to40)} />
              )}
              {analytics.acceleration.best0to60 !== undefined && (
                <AccelStat label="0→60 km/h" value={formatAcceleration(analytics.acceleration.best0to60)} />
              )}
              {analytics.acceleration.best0to80 !== undefined && (
                <AccelStat label="0→80 km/h" value={formatAcceleration(analytics.acceleration.best0to80)} />
              )}
              {analytics.acceleration.best0to100 !== undefined && (
                <AccelStat label="0→100 km/h" value={formatAcceleration(analytics.acceleration.best0to100)} />
              )}
            </div>
          </div>
        )}

        {/* Altitude */}
        {analytics && (analytics.totalAscentMeters > 10 || analytics.totalDescentMeters > 10) && (
          <div className="bg-bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <h3 className="text-sm font-semibold mb-3">Elevation</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-success" />
                <div>
                  <p className="text-2xs text-muted-foreground">Ascent</p>
                  <p className="text-sm font-bold text-success">{analytics.totalAscentMeters}m</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-danger" />
                <div>
                  <p className="text-2xs text-muted-foreground">Descent</p>
                  <p className="text-sm font-bold text-danger">{analytics.totalDescentMeters}m</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-30"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card rounded-t-3xl p-6 safe-pb"
          >
            <h3 className="text-lg font-bold text-center mb-2">Delete this ride?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 rounded-2xl bg-bg-surface font-semibold text-foreground-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-4 rounded-2xl bg-danger font-bold text-white"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, color, iconBg }: {
  icon: typeof MapPin;
  label: string;
  value: string;
  color: string;
  iconBg: string;
}) {
  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-border/50">
      <div className={`${iconBg} w-8 h-8 rounded-xl flex items-center justify-center mb-2`}>
        <Icon size={15} className={color} />
      </div>
      <p className={`text-xl font-bold font-numeric ${color}`}>{value}</p>
      <p className="text-2xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold font-numeric text-foreground">{value}</p>
    </div>
  );
}

function AccelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-primary/10 rounded-xl p-3">
      <p className="text-2xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-black font-numeric text-primary">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-2xs text-muted-foreground">{label}</span>
    </div>
  );
}
