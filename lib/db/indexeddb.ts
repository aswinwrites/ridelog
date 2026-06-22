/**
 * RideLog IndexedDB Layer
 * Uses the `idb` library for promise-based IndexedDB access.
 * Stores: rides, ridePoints, bikes, maintenance, settings
 */

import { openDB, type IDBPDatabase } from "idb";
import type {
  Ride,
  RidePoint,
  Bike,
  MaintenanceRecord,
  AppSettings,
  MonthlyStats,
  DayStats,
} from "@/types";
import { toDateString, toMonthString } from "@/lib/utils/format";

// ─── DB Schema ───────────────────────────────────────────────

const DB_NAME = "ridelog";
const DB_VERSION = 2;

type RideLogDB = {
  rides: {
    key: string;
    value: Ride;
    indexes: { "by-startTime": string; "by-status": string };
  };
  ridePoints: {
    key: [string, number]; // [rideId, timestamp]
    value: RidePoint & { rideId: string };
    indexes: { "by-rideId": string };
  };
  bikes: {
    key: string;
    value: Bike;
  };
  maintenance: {
    key: string;
    value: MaintenanceRecord;
    indexes: { "by-bikeId": string; "by-date": string };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
};

// ─── Singleton DB Connection ─────────────────────────────────

let dbPromise: Promise<IDBPDatabase<RideLogDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<RideLogDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RideLogDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Rides store
        if (!db.objectStoreNames.contains("rides")) {
          const rideStore = db.createObjectStore("rides", { keyPath: "id" });
          rideStore.createIndex("by-startTime", "startTime");
          rideStore.createIndex("by-status", "status");
        }

        // GPS points — separate store for performance
        if (!db.objectStoreNames.contains("ridePoints")) {
          const pointsStore = db.createObjectStore("ridePoints", {
            keyPath: ["rideId", "timestamp"],
          });
          pointsStore.createIndex("by-rideId", "rideId");
        }

        // Bikes
        if (!db.objectStoreNames.contains("bikes")) {
          db.createObjectStore("bikes", { keyPath: "id" });
        }

        // Maintenance records
        if (!db.objectStoreNames.contains("maintenance")) {
          const mStore = db.createObjectStore("maintenance", { keyPath: "id" });
          mStore.createIndex("by-bikeId", "bikeId");
          mStore.createIndex("by-date", "date");
        }

        // Settings key-value store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

// ─── Rides CRUD ──────────────────────────────────────────────

export async function saveRide(ride: Ride): Promise<void> {
  const db = await getDB();
  await db.put("rides", ride);
}

export async function getRide(id: string): Promise<Ride | undefined> {
  const db = await getDB();
  return db.get("rides", id);
}

export async function getAllRides(): Promise<Ride[]> {
  const db = await getDB();
  const rides = await db.getAllFromIndex("rides", "by-startTime");
  return rides.reverse(); // newest first
}

export async function getRidesByMonth(month: string): Promise<Ride[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("rides", "by-startTime");
  return all
    .filter((r) => r.startTime.startsWith(month) && r.status === "completed")
    .reverse();
}

export async function deleteRide(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["rides", "ridePoints"], "readwrite");
  await tx.objectStore("rides").delete(id);
  // Delete all GPS points for this ride
  const pointsStore = tx.objectStore("ridePoints");
  const points = await pointsStore.index("by-rideId").getAllKeys(id);
  for (const key of points) {
    await pointsStore.delete(key);
  }
  await tx.done;
}

export async function updateRide(id: string, updates: Partial<Ride>): Promise<void> {
  const db = await getDB();
  const ride = await db.get("rides", id);
  if (!ride) throw new Error(`Ride ${id} not found`);
  await db.put("rides", { ...ride, ...updates, updatedAt: new Date().toISOString() });
}

// ─── GPS Points ──────────────────────────────────────────────

export async function appendRidePoints(rideId: string, points: RidePoint[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("ridePoints", "readwrite");
  const store = tx.objectStore("ridePoints");
  for (const point of points) {
    await store.put({ ...point, rideId });
  }
  await tx.done;
}

export async function getRidePoints(rideId: string): Promise<RidePoint[]> {
  const db = await getDB();
  const withId = await db.getAllFromIndex("ridePoints", "by-rideId", rideId);
  return withId
    .map(({ rideId: _, ...p }) => p)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function clearRidePoints(rideId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("ridePoints", "readwrite");
  const store = tx.objectStore("ridePoints");
  const keys = await store.index("by-rideId").getAllKeys(rideId);
  for (const key of keys) await store.delete(key);
  await tx.done;
}

// ─── Bikes CRUD ──────────────────────────────────────────────

export async function saveBike(bike: Bike): Promise<void> {
  const db = await getDB();
  await db.put("bikes", bike);
}

export async function getBike(id: string): Promise<Bike | undefined> {
  const db = await getDB();
  return db.get("bikes", id);
}

export async function getAllBikes(): Promise<Bike[]> {
  const db = await getDB();
  return db.getAll("bikes");
}

export async function deleteBike(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("bikes", id);
}

// ─── Maintenance CRUD ────────────────────────────────────────

export async function saveMaintenanceRecord(record: MaintenanceRecord): Promise<void> {
  const db = await getDB();
  await db.put("maintenance", record);
}

export async function getMaintenanceByBike(bikeId: string): Promise<MaintenanceRecord[]> {
  const db = await getDB();
  const records = await db.getAllFromIndex("maintenance", "by-bikeId", bikeId);
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("maintenance", id);
}

// ─── Settings ────────────────────────────────────────────────

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const record = await db.get("settings", key);
  return record ? (record.value as T) : defaultValue;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("settings", { key, value });
}

export async function loadSettings(): Promise<AppSettings> {
  const defaults: AppSettings = {
    storageMode: "guest",
    distanceUnit: "km",
    speedUnit: "kmh",
    theme: "dark",
    gpsInterval: 1000,
    keepScreenOn: true,
    notifications: false,
  };

  const db = await getDB();
  const all = await db.getAll("settings");
  const map: Record<string, unknown> = {};
  for (const { key, value } of all) map[key] = value;

  return { ...defaults, ...map } as AppSettings;
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("settings", "readwrite");
  for (const [key, value] of Object.entries(settings)) {
    await tx.store.put({ key, value });
  }
  await tx.done;
}

// ─── Aggregated Stats ────────────────────────────────────────

export async function getLifetimeStats() {
  const rides = await getAllRides();
  const completed = rides.filter((r) => r.status === "completed" && r.analytics);

  const totalDistanceKm = completed.reduce((sum, r) => sum + (r.analytics?.distanceKm ?? 0), 0);
  const totalDurationSeconds = completed.reduce((sum, r) => sum + (r.analytics?.durationSeconds ?? 0), 0);
  const totalRideDays = new Set(completed.map((r) => toDateString(new Date(r.startTime)))).size;
  const topSpeed = Math.max(...completed.map((r) => r.analytics?.topSpeedKmh ?? 0), 0);
  const longestRide = Math.max(...completed.map((r) => r.analytics?.distanceKm ?? 0), 0);
  const longestRideDuration = Math.max(...completed.map((r) => r.analytics?.durationSeconds ?? 0), 0);

  // Best acceleration
  const best0to60 = completed.reduce<number | undefined>((best, r) => {
    const v = r.analytics?.acceleration.best0to60;
    if (v === undefined) return best;
    return best === undefined ? v : Math.min(best, v);
  }, undefined);

  const best0to100 = completed.reduce<number | undefined>((best, r) => {
    const v = r.analytics?.acceleration.best0to100;
    if (v === undefined) return best;
    return best === undefined ? v : Math.min(best, v);
  }, undefined);

  // Most distance in one day
  const dayMap: Record<string, number> = {};
  for (const r of completed) {
    const day = toDateString(new Date(r.startTime));
    dayMap[day] = (dayMap[day] ?? 0) + (r.analytics?.distanceKm ?? 0);
  }
  const maxDayEntry = Object.entries(dayMap).reduce(
    (max, [d, dist]) => (dist > max.dist ? { date: d, dist } : max),
    { date: "", dist: 0 }
  );

  return {
    rideCount: completed.length,
    totalDistanceKm,
    totalDurationSeconds,
    totalRideDays,
    topSpeed,
    longestRide,
    longestRideDuration,
    best0to60,
    best0to100,
    mostDistanceInOneDay: maxDayEntry.dist,
    mostDistanceInOneDayDate: maxDayEntry.date,
    totalSignalWaitSeconds: completed.reduce(
      (sum, r) => sum + (r.analytics?.signals.totalWaitTime ?? 0),
      0
    ),
  };
}

export async function getMonthlyStats(month: string): Promise<MonthlyStats> {
  const rides = await getRidesByMonth(month);
  const days: Record<string, DayStats> = {};

  for (const ride of rides) {
    if (!ride.analytics) continue;
    const day = toDateString(new Date(ride.startTime));
    if (!days[day]) {
      days[day] = {
        date: day,
        rideCount: 0,
        distanceKm: 0,
        durationSeconds: 0,
        avgSpeedKmh: 0,
        topSpeedKmh: 0,
      };
    }
    days[day].rideCount++;
    days[day].distanceKm += ride.analytics.distanceKm;
    days[day].durationSeconds += ride.analytics.durationSeconds;
    days[day].topSpeedKmh = Math.max(days[day].topSpeedKmh, ride.analytics.topSpeedKmh);
  }

  // Compute per-day avg speed
  for (const day of Object.values(days)) {
    const dayRides = rides.filter((r) => toDateString(new Date(r.startTime)) === day.date);
    const totalDist = dayRides.reduce((s, r) => s + (r.analytics?.distanceKm ?? 0), 0);
    const totalMoving = dayRides.reduce((s, r) => s + (r.analytics?.movingTimeSeconds ?? 0), 0);
    day.avgSpeedKmh = totalMoving > 0 ? totalDist / (totalMoving / 3600) : 0;
  }

  const totalDist = rides.reduce((s, r) => s + (r.analytics?.distanceKm ?? 0), 0);
  const totalMoving = rides.reduce((s, r) => s + (r.analytics?.movingTimeSeconds ?? 0), 0);

  return {
    month,
    rideCount: rides.length,
    rideDays: Object.keys(days).length,
    distanceKm: totalDist,
    durationSeconds: rides.reduce((s, r) => s + (r.analytics?.durationSeconds ?? 0), 0),
    movingTimeSeconds: totalMoving,
    avgSpeedKmh: totalMoving > 0 ? totalDist / (totalMoving / 3600) : 0,
    topSpeedKmh: Math.max(...rides.map((r) => r.analytics?.topSpeedKmh ?? 0), 0),
    longestRideKm: Math.max(...rides.map((r) => r.analytics?.distanceKm ?? 0), 0),
    longestRideDuration: Math.max(...rides.map((r) => r.analytics?.durationSeconds ?? 0), 0),
    totalSignalStops: rides.reduce((s, r) => s + (r.analytics?.signals.count ?? 0), 0),
    totalSignalWaitSeconds: rides.reduce((s, r) => s + (r.analytics?.signals.totalWaitTime ?? 0), 0),
    hardBrakingEvents: rides.reduce((s, r) => s + (r.analytics?.braking.hardEvents ?? 0), 0),
    days,
  };
}

/** Get all ride dates for calendar heatmap */
export async function getRideDateMap(): Promise<Record<string, number>> {
  const rides = await getAllRides();
  const map: Record<string, number> = {};
  for (const r of rides) {
    if (r.status !== "completed" || !r.analytics) continue;
    const day = toDateString(new Date(r.startTime));
    map[day] = (map[day] ?? 0) + r.analytics.distanceKm;
  }
  return map;
}

/** Get all ride dates as strings for streak computation */
export async function getRideDates(): Promise<string[]> {
  const rides = await getAllRides();
  return [
    ...new Set(
      rides
        .filter((r) => r.status === "completed")
        .map((r) => toDateString(new Date(r.startTime)))
    ),
  ].sort();
}
