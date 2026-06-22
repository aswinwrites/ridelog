/**
 * RideLog Ride Store (Zustand)
 * Manages active ride state, ride history, and GPS tracking
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Ride, RidePoint, ActiveRideState } from "@/types";
import {
  saveRide,
  getAllRides,
  getRide,
  appendRidePoints,
  getRidePoints,
  deleteRide as dbDeleteRide,
  updateRide,
} from "@/lib/db/indexeddb";
import { computeRideAnalytics, incrementalDistance } from "@/lib/analytics/engine";
import { generateRideName, uuid, toDateString } from "@/lib/utils/format";

// ─── Types ───────────────────────────────────────────────────

interface RideStore {
  // History
  rides: Ride[];
  isLoading: boolean;

  // Active ride
  active: ActiveRideState;
  watchId: number | null;
  tickerId: ReturnType<typeof setInterval> | null;

  // Actions
  loadRides: () => Promise<void>;
  startRide: (bikeId?: string) => Promise<string>;
  pauseRide: () => void;
  resumeRide: () => void;
  endRide: () => Promise<Ride | null>;
  deleteRide: (id: string) => Promise<void>;
  updateRideName: (id: string, name: string) => Promise<void>;
  updateRideNotes: (id: string, notes: string) => Promise<void>;
  getRideWithPoints: (id: string) => Promise<{ ride: Ride; points: RidePoint[] } | null>;

  // GPS
  _onGPSUpdate: (position: GeolocationPosition) => void;
  _onGPSError: (error: GeolocationPositionError) => void;
  _addPoint: (point: RidePoint) => void;
  _tick: () => void;
}

// ─── Default Active State ─────────────────────────────────────

const defaultActive: ActiveRideState = {
  rideId: null,
  isRecording: false,
  isPaused: false,
  points: [],
  currentSpeed: 0,
  currentHeading: 0,
  currentAltitude: 0,
  distanceKm: 0,
  startTime: null,
  elapsedSeconds: 0,
  currentSignalStartTime: null,
  isAtSignal: false,
};

// ─── Store ───────────────────────────────────────────────────

export const useRideStore = create<RideStore>()(
  subscribeWithSelector((set, get) => ({
    rides: [],
    isLoading: false,
    active: { ...defaultActive },
    watchId: null,
    tickerId: null,

    // ── Load all rides from IndexedDB ──
    loadRides: async () => {
      set({ isLoading: true });
      try {
        const rides = await getAllRides();
        set({ rides, isLoading: false });
      } catch (e) {
        console.error("Failed to load rides:", e);
        set({ isLoading: false });
      }
    },

    // ── Start a new ride ──
    startRide: async (bikeId?: string) => {
      const { active } = get();
      if (active.isRecording) return active.rideId!;

      const rideId = uuid();
      const now = new Date().toISOString();

      const ride: Ride = {
        id: rideId,
        startTime: now,
        endTime: null,
        status: "recording",
        name: generateRideName(now),
        bikeId,
        hasGpsTrack: true,
        analytics: null,
        syncedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await saveRide(ride);

      // Request wake lock to keep screen on
      if ("wakeLock" in navigator) {
        try {
          await (navigator as unknown as { wakeLock: { request: (t: string) => Promise<unknown> } }).wakeLock.request("screen");
        } catch {
          // Not critical
        }
      }

      // Start GPS watching
      let watchId: number | null = null;
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          get()._onGPSUpdate,
          get()._onGPSError,
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000,
          }
        );
      }

      // Start elapsed time ticker
      const tickerId = setInterval(() => get()._tick(), 1000);

      set({
        watchId,
        tickerId,
        active: {
          ...defaultActive,
          rideId,
          isRecording: true,
          isPaused: false,
          startTime: Date.now(),
          points: [],
        },
      });

      // Add to rides list
      set((state) => ({ rides: [ride, ...state.rides] }));

      return rideId;
    },

    // ── Pause recording ──
    pauseRide: () => {
      const { watchId, tickerId } = get();
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (tickerId !== null) clearInterval(tickerId);
      set((s) => ({
        watchId: null,
        tickerId: null,
        active: { ...s.active, isPaused: true, isRecording: false },
      }));
    },

    // ── Resume recording ──
    resumeRide: () => {
      const watchId = navigator.geolocation.watchPosition(
        get()._onGPSUpdate,
        get()._onGPSError,
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
      const tickerId = setInterval(() => get()._tick(), 1000);
      set((s) => ({
        watchId,
        tickerId,
        active: { ...s.active, isPaused: false, isRecording: true },
      }));
    },

    // ── End ride and compute analytics ──
    endRide: async () => {
      const { active, watchId, tickerId } = get();
      if (!active.rideId) return null;

      // Stop GPS
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (tickerId !== null) clearInterval(tickerId);

      // Save any buffered points
      const pendingPoints = active.points;
      if (pendingPoints.length > 0) {
        await appendRidePoints(active.rideId, pendingPoints);
      }

      // Load all points and compute analytics
      const allPoints = await getRidePoints(active.rideId);
      const analytics = computeRideAnalytics(allPoints);
      const now = new Date().toISOString();

      const ride = await getRide(active.rideId);
      if (!ride) return null;

      const updatedRide: Ride = {
        ...ride,
        endTime: now,
        status: "completed",
        analytics,
        updatedAt: now,
      };

      await saveRide(updatedRide);

      set((s) => ({
        watchId: null,
        tickerId: null,
        active: { ...defaultActive },
        rides: s.rides.map((r) => (r.id === updatedRide.id ? updatedRide : r)),
      }));

      return updatedRide;
    },

    // ── Delete a ride ──
    deleteRide: async (id: string) => {
      await dbDeleteRide(id);
      set((s) => ({ rides: s.rides.filter((r) => r.id !== id) }));
    },

    // ── Update ride name ──
    updateRideName: async (id: string, name: string) => {
      await updateRide(id, { name });
      set((s) => ({
        rides: s.rides.map((r) => (r.id === id ? { ...r, name } : r)),
      }));
    },

    // ── Update ride notes ──
    updateRideNotes: async (id: string, notes: string) => {
      await updateRide(id, { notes });
      set((s) => ({
        rides: s.rides.map((r) => (r.id === id ? { ...r, notes } : r)),
      }));
    },

    // ── Get ride with GPS points ──
    getRideWithPoints: async (id: string) => {
      const ride = await getRide(id);
      if (!ride) return null;
      const points = await getRidePoints(id);
      return { ride, points };
    },

    // ── Internal: GPS position update ──
    _onGPSUpdate: (position: GeolocationPosition) => {
      const { active } = get();
      if (!active.isRecording || !active.rideId) return;

      const point: RidePoint = {
        timestamp: position.timestamp,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // m/s → km/h
        altitude: position.coords.altitude ?? 0,
        heading: position.coords.heading ?? 0,
        accuracy: position.coords.accuracy,
      };

      get()._addPoint(point);
    },

    // ── Internal: GPS error ──
    _onGPSError: (error: GeolocationPositionError) => {
      console.warn("GPS error:", error.message);
    },

    // ── Internal: add GPS point ──
    _addPoint: (point: RidePoint) => {
      set((s) => {
        const prevPoints = s.active.points;
        const lastPoint = prevPoints[prevPoints.length - 1] ?? null;
        const newDistanceKm = incrementalDistance(s.active.distanceKm, lastPoint, point);

        // Signal detection
        const isSlow = point.speed < 3;
        let { currentSignalStartTime, isAtSignal } = s.active;

        if (isSlow && !currentSignalStartTime) {
          currentSignalStartTime = point.timestamp;
        } else if (!isSlow && currentSignalStartTime) {
          currentSignalStartTime = null;
          isAtSignal = false;
        }

        if (currentSignalStartTime) {
          const waitSecs = (point.timestamp - currentSignalStartTime) / 1000;
          isAtSignal = waitSecs >= 20;
        }

        const newPoints = [...prevPoints, point];

        // Batch-write points every 30 to avoid hammering IndexedDB
        if (newPoints.length % 30 === 0 && s.active.rideId) {
          const batch = newPoints.slice(-30);
          appendRidePoints(s.active.rideId, batch).catch(console.error);
        }

        return {
          active: {
            ...s.active,
            points: newPoints,
            currentSpeed: point.speed,
            currentHeading: point.heading,
            currentAltitude: point.altitude,
            distanceKm: newDistanceKm,
            currentSignalStartTime,
            isAtSignal,
          },
        };
      });
    },

    // ── Internal: elapsed time tick ──
    _tick: () => {
      set((s) => {
        if (!s.active.isRecording || !s.active.startTime) return s;
        return {
          active: {
            ...s.active,
            elapsedSeconds: Math.floor((Date.now() - s.active.startTime) / 1000),
          },
        };
      });
    },
  }))
);
