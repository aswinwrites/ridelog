/**
 * RideLog Analytics Engine
 * Real GPS-based calculations — no fake data.
 * All math is from first principles.
 */

import type {
  RidePoint,
  RideAnalytics,
  SignalAnalytics,
  SignalStop,
  BrakingAnalytics,
  BrakingEvent,
  BrakingSeverity,
  AccelerationAnalytics,
  AccelerationRun,
  SpeedDistribution,
  RouteSegment,
  HeatmapPoint,
  LatLng,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;
const G_FORCE = 9.81; // m/s²

// Signal detection thresholds
const SIGNAL_SPEED_THRESHOLD_KMH = 3;
const SIGNAL_MIN_DURATION_SECONDS = 20;
const SIGNAL_MAX_DURATION_SECONDS = 300; // 5 minutes

// Braking thresholds
const BRAKING_MILD_G = 0.3;

// Moving threshold
const MOVING_SPEED_KMH = 2;

// ─── Core Distance Calculation ───────────────────────────────

/**
 * Haversine formula — calculates great-circle distance between two GPS points
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate total distance from GPS track
 */
export function calculateTotalDistance(points: RidePoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const d = haversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
    if (d < 0.5) total += d;
  }
  return total;
}

// ─── Speed Calculations ───────────────────────────────────────

/**
 * Compute derived speed from consecutive GPS points
 */
export function computeSpeed(p1: RidePoint, p2: RidePoint): number {
  const distKm = haversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  const timeHours = (p2.timestamp - p1.timestamp) / 3_600_000;
  if (timeHours <= 0) return 0;
  const speedKmh = distKm / timeHours;
  return Math.min(speedKmh, 300);
}

// ─── Moving / Idle Time ──────────────────────────────────────

export function calculateMovingAndIdleTime(points: RidePoint[]): {
  movingSeconds: number;
  idleSeconds: number;
} {
  if (points.length < 2) return { movingSeconds: 0, idleSeconds: 0 };

  let movingSeconds = 0;
  let idleSeconds = 0;

  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000;
    const speed = points[i].speed > 0 ? points[i].speed : computeSpeed(points[i - 1], points[i]);
    if (speed > MOVING_SPEED_KMH) {
      movingSeconds += dt;
    } else {
      idleSeconds += dt;
    }
  }

  return { movingSeconds, idleSeconds };
}

// ─── Average Speed ───────────────────────────────────────────

export function calculateAverageSpeed(
  distanceKm: number,
  movingSeconds: number
): number {
  if (movingSeconds === 0) return 0;
  return distanceKm / (movingSeconds / 3600);
}

// ─── Top Speed ───────────────────────────────────────────────

export function calculateTopSpeed(points: RidePoint[]): number {
  if (points.length === 0) return 0;
  let top = 0;
  for (let i = 1; i < points.length; i++) {
    const gpsSpeed = points[i].speed;
    const derived = computeSpeed(points[i - 1], points[i]);
    const speed = gpsSpeed > 0 && Math.abs(gpsSpeed - derived) < 50 ? gpsSpeed : derived;
    if (speed > top && speed < 280) top = speed;
  }
  return Math.round(top * 10) / 10;
}

// ─── Altitude Analytics ──────────────────────────────────────

export function calculateAltitudeStats(points: RidePoint[]): {
  totalAscent: number;
  totalDescent: number;
} {
  if (points.length < 2) return { totalAscent: 0, totalDescent: 0 };

  let ascent = 0;
  let descent = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const alt1 = (points[i - 1].altitude + points[i].altitude) / 2;
    const alt2 = (points[i].altitude + points[i + 1].altitude) / 2;
    const delta = alt2 - alt1;
    if (delta > 1) ascent += delta;
    if (delta < -1) descent += Math.abs(delta);
  }
  return { totalAscent: Math.round(ascent), totalDescent: Math.round(descent) };
}

// ─── Signal Detection ────────────────────────────────────────

export function detectSignalStops(points: RidePoint[]): SignalAnalytics {
  const stops: SignalStop[] = [];
  let stopStart: number | null = null;
  let stopLat = 0;
  let stopLng = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const speed = p.speed > 0 ? p.speed : (i > 0 ? computeSpeed(points[i - 1], p) : 0);
    const isStopped = speed < SIGNAL_SPEED_THRESHOLD_KMH;

    if (isStopped && stopStart === null) {
      stopStart = p.timestamp;
      stopLat = p.latitude;
      stopLng = p.longitude;
    } else if (!isStopped && stopStart !== null) {
      const duration = (p.timestamp - stopStart) / 1000;
      if (duration >= SIGNAL_MIN_DURATION_SECONDS && duration <= SIGNAL_MAX_DURATION_SECONDS) {
        stops.push({
          startTime: stopStart,
          endTime: p.timestamp,
          duration,
          latitude: stopLat,
          longitude: stopLng,
        });
      }
      stopStart = null;
    }
  }

  const totalWait = stops.reduce((sum, s) => sum + s.duration, 0);
  const totalDuration =
    points.length > 1
      ? (points[points.length - 1].timestamp - points[0].timestamp) / 1000
      : 0;
  const longestWait = stops.reduce((max, s) => Math.max(max, s.duration), 0);

  return {
    count: stops.length,
    totalWaitTime: Math.round(totalWait),
    longestWait: Math.round(longestWait),
    rideTimePercentage: totalDuration > 0 ? (totalWait / totalDuration) * 100 : 0,
    stops,
  };
}

// ─── Braking Analysis ────────────────────────────────────────

export function detectBrakingEvents(points: RidePoint[]): BrakingAnalytics {
  const events: BrakingEvent[] = [];

  for (let i = 2; i < points.length; i++) {
    const p0 = points[i - 2];
    const p1 = points[i - 1];
    const p2 = points[i];

    const v1 = p1.speed > 0 ? p1.speed / 3.6 : computeSpeed(p0, p1) / 3.6;
    const v2 = p2.speed > 0 ? p2.speed / 3.6 : computeSpeed(p1, p2) / 3.6;

    const dt = (p2.timestamp - p1.timestamp) / 1000;
    if (dt <= 0) continue;

    const deceleration = (v1 - v2) / dt;
    const gForce = deceleration / G_FORCE;

    if (gForce >= BRAKING_MILD_G) {
      let severity: BrakingSeverity = "mild";
      if (gForce >= 0.5) severity = "moderate";
      if (gForce >= 0.7) severity = "hard";

      const last = events[events.length - 1];
      if (last && (p1.timestamp - last.timestamp) < 2000) {
        if (deceleration > last.deceleration) {
          events[events.length - 1] = {
            timestamp: p1.timestamp,
            latitude: p1.latitude,
            longitude: p1.longitude,
            deceleration: Math.round(deceleration * 100) / 100,
            severity,
            speedBefore: Math.round(v1 * 3.6),
            speedAfter: Math.round(v2 * 3.6),
          };
        }
        continue;
      }

      events.push({
        timestamp: p1.timestamp,
        latitude: p1.latitude,
        longitude: p1.longitude,
        deceleration: Math.round(deceleration * 100) / 100,
        severity,
        speedBefore: Math.round(v1 * 3.6),
        speedAfter: Math.round(v2 * 3.6),
      });
    }
  }

  return {
    totalEvents: events.length,
    mildEvents: events.filter((e) => e.severity === "mild").length,
    moderateEvents: events.filter((e) => e.severity === "moderate").length,
    hardEvents: events.filter((e) => e.severity === "hard").length,
    events,
  };
}

// ─── Acceleration Analysis ───────────────────────────────────

/**
 * Detects 0–40, 0–60, 0–80, 0–100 km/h acceleration runs.
 */
export function detectAccelerationRuns(points: RidePoint[]): AccelerationAnalytics {
  const runs: AccelerationRun[] = [];
  const targets = [40, 60, 80, 100];

  let runStartTime: number | null = null;
  let runStartIdx: number | null = null;
  let wasAtLow = false;

  const getSpeed = (idx: number): number => {
    const p = points[idx];
    if (p.speed > 0) return p.speed;
    if (idx > 0) return computeSpeed(points[idx - 1], p);
    return 0;
  };

  for (let i = 0; i < points.length; i++) {
    const speed = getSpeed(i);

    if (!wasAtLow && speed < 5) {
      wasAtLow = true;
      continue;
    }

    if (wasAtLow && speed >= 5 && runStartTime === null) {
      runStartTime = points[i].timestamp;
      runStartIdx = i;
    }

    if (runStartTime !== null && runStartIdx !== null) {
      const elapsed = (points[i].timestamp - runStartTime) / 1000;

      // Abort if too long or speed drops before reaching target
      if (elapsed > 30 || (speed < 10 && elapsed > 3)) {
        runStartTime = null;
        runStartIdx = null;
        wasAtLow = false;
        continue;
      }

      if (speed >= targets[targets.length - 1]) {
        const run: AccelerationRun = {
          timestamp: runStartTime,
          latitude: points[runStartIdx].latitude,
          longitude: points[runStartIdx].longitude,
        };

        // Find crossing time for each target by linear interpolation
        for (const target of targets) {
          for (let j = runStartIdx + 1; j <= i; j++) {
            const s1 = getSpeed(j - 1);
            const s2 = getSpeed(j);
            if (s1 < target && s2 >= target) {
              const frac = s2 > s1 ? (target - s1) / (s2 - s1) : 0;
              const crossTime =
                points[j - 1].timestamp + frac * (points[j].timestamp - points[j - 1].timestamp);
              const runTime = (crossTime - runStartTime) / 1000;

              if (target === 40) run.zeroTo40 = Math.round(runTime * 100) / 100;
              if (target === 60) run.zeroTo60 = Math.round(runTime * 100) / 100;
              if (target === 80) run.zeroTo80 = Math.round(runTime * 100) / 100;
              if (target === 100) run.zeroTo100 = Math.round(runTime * 100) / 100;
              break;
            }
          }
        }

        if (run.zeroTo60 || run.zeroTo40) {
          runs.push(run);
        }

        runStartTime = null;
        runStartIdx = null;
        wasAtLow = false;
      }
    } else if (speed < 5) {
      wasAtLow = true;
    }
  }

  return {
    best0to40: runs.reduce<number | undefined>(
      (b, r) => (r.zeroTo40 !== undefined ? (b === undefined ? r.zeroTo40 : Math.min(b, r.zeroTo40)) : b),
      undefined
    ),
    best0to60: runs.reduce<number | undefined>(
      (b, r) => (r.zeroTo60 !== undefined ? (b === undefined ? r.zeroTo60 : Math.min(b, r.zeroTo60)) : b),
      undefined
    ),
    best0to80: runs.reduce<number | undefined>(
      (b, r) => (r.zeroTo80 !== undefined ? (b === undefined ? r.zeroTo80 : Math.min(b, r.zeroTo80)) : b),
      undefined
    ),
    best0to100: runs.reduce<number | undefined>(
      (b, r) => (r.zeroTo100 !== undefined ? (b === undefined ? r.zeroTo100 : Math.min(b, r.zeroTo100)) : b),
      undefined
    ),
    runs,
  };
}

// ─── Speed Distribution ──────────────────────────────────────

export function calculateSpeedDistribution(points: RidePoint[]): SpeedDistribution {
  if (points.length === 0) return { slow: 0, urban: 0, highway: 0, fast: 0 };

  let slow = 0, urban = 0, highway = 0, fast = 0;

  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000;
    const speed = points[i].speed > 0 ? points[i].speed : computeSpeed(points[i - 1], points[i]);

    if (speed < 30) slow += dt;
    else if (speed < 60) urban += dt;
    else if (speed < 100) highway += dt;
    else fast += dt;
  }

  const total = slow + urban + highway + fast;
  if (total === 0) return { slow: 0, urban: 0, highway: 0, fast: 0 };

  return {
    slow: Math.round((slow / total) * 100),
    urban: Math.round((urban / total) * 100),
    highway: Math.round((highway / total) * 100),
    fast: Math.round((fast / total) * 100),
  };
}

// ─── Bounds & Center ─────────────────────────────────────────

export function calculateBounds(points: RidePoint[]) {
  if (points.length === 0) return null;

  let north = -90, south = 90, east = -180, west = 180;

  for (const p of points) {
    if (p.latitude > north) north = p.latitude;
    if (p.latitude < south) south = p.latitude;
    if (p.longitude > east) east = p.longitude;
    if (p.longitude < west) west = p.longitude;
  }

  return { north, south, east, west };
}

export function calculateCenter(points: RidePoint[]): LatLng | null {
  if (points.length === 0) return null;
  const lat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
  return { lat, lng };
}

// ─── Route Segments for Speed Heatmap ────────────────────────

export function buildRouteSegments(points: RidePoint[]): RouteSegment[] {
  if (points.length < 2) return [];

  const segments: RouteSegment[] = [];
  const SEGMENT_SIZE = 5;

  for (let i = 0; i < points.length - SEGMENT_SIZE; i += SEGMENT_SIZE) {
    const chunk = points.slice(i, i + SEGMENT_SIZE + 1);
    const avgSpeed =
      chunk.reduce((sum, p) => sum + (p.speed > 0 ? p.speed : 0), 0) / chunk.length;

    let speedCategory: RouteSegment["speedCategory"] = "slow";
    if (avgSpeed >= 100) speedCategory = "fast";
    else if (avgSpeed >= 60) speedCategory = "highway";
    else if (avgSpeed >= 30) speedCategory = "urban";

    segments.push({
      points: chunk.map((p) => ({ lat: p.latitude, lng: p.longitude })),
      avgSpeed: Math.round(avgSpeed),
      speedCategory,
    });
  }

  return segments;
}

// ─── Heatmap Points ──────────────────────────────────────────

export function buildSpeedHeatmap(points: RidePoint[]): HeatmapPoint[] {
  return points.map((p) => ({
    lat: p.latitude,
    lng: p.longitude,
    intensity: Math.min(p.speed / 100, 1),
  }));
}

// ─── Main Analytics Computer ─────────────────────────────────

/**
 * Full analytics computation from raw GPS points.
 */
export function computeRideAnalytics(points: RidePoint[]): RideAnalytics {
  if (points.length === 0) {
    return emptyAnalytics();
  }

  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);

  const distanceKm = calculateTotalDistance(sorted);
  const { movingSeconds, idleSeconds } = calculateMovingAndIdleTime(sorted);
  const durationSeconds =
    sorted.length > 1
      ? (sorted[sorted.length - 1].timestamp - sorted[0].timestamp) / 1000
      : 0;
  const avgSpeedKmh = calculateAverageSpeed(distanceKm, movingSeconds);
  const topSpeedKmh = calculateTopSpeed(sorted);
  const { totalAscent, totalDescent } = calculateAltitudeStats(sorted);
  const signals = detectSignalStops(sorted);
  const braking = detectBrakingEvents(sorted);
  const acceleration = detectAccelerationRuns(sorted);
  const speedDistribution = calculateSpeedDistribution(sorted);
  const bounds = calculateBounds(sorted);
  const center = calculateCenter(sorted);

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationSeconds: Math.round(durationSeconds),
    movingTimeSeconds: Math.round(movingSeconds),
    idleTimeSeconds: Math.round(idleSeconds),
    avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
    topSpeedKmh,
    totalAscentMeters: totalAscent,
    totalDescentMeters: totalDescent,
    signals,
    braking,
    acceleration,
    speedDistribution,
    bounds,
    center,
  };
}

function emptyAnalytics(): RideAnalytics {
  return {
    distanceKm: 0,
    durationSeconds: 0,
    movingTimeSeconds: 0,
    idleTimeSeconds: 0,
    avgSpeedKmh: 0,
    topSpeedKmh: 0,
    totalAscentMeters: 0,
    totalDescentMeters: 0,
    signals: { count: 0, totalWaitTime: 0, longestWait: 0, rideTimePercentage: 0, stops: [] },
    braking: { totalEvents: 0, mildEvents: 0, moderateEvents: 0, hardEvents: 0, events: [] },
    acceleration: { runs: [] },
    speedDistribution: { slow: 0, urban: 0, highway: 0, fast: 0 },
    bounds: null,
    center: null,
  };
}

// ─── Live Distance Calculation ───────────────────────────────

/** Incrementally calculate distance as points arrive */
export function incrementalDistance(
  previousDistanceKm: number,
  prevPoint: RidePoint | null,
  newPoint: RidePoint
): number {
  if (!prevPoint) return previousDistanceKm;
  const d = haversineDistance(prevPoint.latitude, prevPoint.longitude, newPoint.latitude, newPoint.longitude);
  if (d > 0.5) return previousDistanceKm;
  return previousDistanceKm + d;
}
