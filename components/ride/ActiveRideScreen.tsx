"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Square, Play, Navigation, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { useRideStore } from "@/store/useRideStore";
import { useBikeStore } from "@/store/useBikeStore";
import { formatDuration, formatDistance, formatSpeed } from "@/lib/utils/format";
import { Speedometer } from "./Speedometer";
import { LiveStatBar } from "./LiveStatBar";
import { SignalIndicator } from "./SignalIndicator";

// Leaflet must be loaded client-side
const LiveMap = dynamic(() => import("./LiveMap").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-bg-surface flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading map…</div>
    </div>
  ),
});

export function ActiveRideScreen() {
  const router = useRouter();
  const { active, startRide, pauseRide, resumeRide, endRide } = useRideStore();
  const { getDefaultBike } = useBikeStore();
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const bike = getDefaultBike();

  // Auto-start on mount if not already recording
  useEffect(() => {
    if (!active.isRecording && !active.isPaused && !active.rideId) {
      // Check GPS permission first
      if (!("geolocation" in navigator)) {
        setGpsError("GPS not available on this device");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => {
          startRide(bike?.id).catch(console.error);
        },
        (err) => {
          setGpsError(
            err.code === 1
              ? "GPS permission denied. Enable location access."
              : "GPS unavailable. Check your settings."
          );
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnd = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      const ride = await endRide();
      if (ride) {
        router.replace(`/rides/${ride.id}`);
      } else {
        router.replace("/");
      }
    } catch (e) {
      console.error(e);
      setIsEnding(false);
    }
  }, [endRide, router, isEnding]);

  const handlePauseResume = useCallback(() => {
    if (active.isPaused) resumeRide();
    else pauseRide();
  }, [active.isPaused, pauseRide, resumeRide]);

  if (gpsError) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 px-8">
        <AlertTriangle size={48} className="text-danger" />
        <p className="text-center text-foreground-secondary text-sm">{gpsError}</p>
        <button
          onClick={() => router.back()}
          className="text-primary text-sm font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-base flex flex-col overflow-hidden">
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-10 pb-3 px-5 bg-gradient-to-b from-bg-base via-bg-base/90 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Recording indicator */}
            {active.isRecording && (
              <motion.div
                className="w-2 h-2 rounded-full bg-danger"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
            {active.isPaused && (
              <div className="w-2 h-2 rounded-full bg-warning" />
            )}
            <span className="text-xs text-muted-foreground font-medium">
              {active.isPaused ? "PAUSED" : active.isRecording ? "RECORDING" : "STARTING…"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-numeric">
              {formatDuration(active.elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Main content — split layout */}
      <div className="flex-1 flex flex-col">

        {/* Speedometer — top half */}
        <div className="relative flex flex-col items-center justify-center pt-16 pb-4 px-5 bg-bg-base z-10">
          <Speedometer speed={active.currentSpeed} />
          <SignalIndicator
            isAtSignal={active.isAtSignal}
            waitStart={active.currentSignalStartTime}
          />
        </div>

        {/* Live stats row */}
        <LiveStatBar
          distanceKm={active.distanceKm}
          elapsedSeconds={active.elapsedSeconds}
          speed={active.currentSpeed}
          altitude={active.currentAltitude}
        />

        {/* Map — fills remaining space */}
        <div className="flex-1 relative min-h-0">
          {active.points.length > 0 ? (
            <LiveMap
              points={active.points}
              currentSpeed={active.currentSpeed}
              heading={active.currentHeading}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-surface">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Navigation size={28} className="text-muted-foreground" />
                </motion.div>
                <p className="text-xs text-muted-foreground">Acquiring GPS…</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-4 bg-bg-base border-t border-border/30 safe-pb">
          <div className="flex items-center gap-4">
            {/* Pause / Resume */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handlePauseResume}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-bg-card border border-border/50 py-4"
            >
              {active.isPaused ? (
                <>
                  <Play size={18} className="text-success fill-success" />
                  <span className="font-semibold text-success">Resume</span>
                </>
              ) : (
                <>
                  <Pause size={18} className="text-muted-foreground" />
                  <span className="font-semibold text-muted-foreground">Pause</span>
                </>
              )}
            </motion.button>

            {/* End Ride */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowEndConfirm(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-danger/15 border border-danger/30 py-4"
            >
              <Square size={18} className="text-danger fill-danger" />
              <span className="font-semibold text-danger">End Ride</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* End Confirm Sheet */}
      <AnimatePresence>
        {showEndConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-30"
              onClick={() => setShowEndConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card rounded-t-3xl p-6 safe-pb"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold text-center mb-2">End this ride?</h3>
              <p className="text-sm text-muted-foreground text-center mb-1">
                {formatDistance(active.distanceKm)} · {formatDuration(active.elapsedSeconds, true)}
              </p>
              <p className="text-xs text-muted-foreground text-center mb-6">
                Analytics will be computed and saved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-bg-surface font-semibold text-foreground-secondary"
                >
                  Keep riding
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowEndConfirm(false); handleEnd(); }}
                  disabled={isEnding}
                  className="flex-1 py-4 rounded-2xl bg-danger font-bold text-white disabled:opacity-60"
                >
                  {isEnding ? "Saving…" : "End Ride"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
