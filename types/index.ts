// ============================================================
// RIDELOG — Complete TypeScript Data Models
// ============================================================

// ─── GPS & Tracking ─────────────────────────────────────────

export interface RidePoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  latitude: number;
  longitude: number;
  /** Speed in km/h */
  speed: number;
  /** Altitude in meters above sea level */
  altitude: number;
  /** Heading in degrees (0–360) */
  heading: number;
  /** GPS accuracy in meters */
  accuracy?: number;
}

// ─── Signal Stop ────────────────────────────────────────────

export interface SignalStop {
  startTime: number;
  endTime: number;
  /** Duration in seconds */
  duration: number;
  latitude: number;
  longitude: number;
}

// ─── Braking Event ──────────────────────────────────────────

export type BrakingSeverity = "mild" | "moderate" | "hard";

export interface BrakingEvent {
  timestamp: number;
  latitude: number;
  longitude: number;
  /** Deceleration in m/s² (positive value) */
  deceleration: number;
  severity: BrakingSeverity;
  /** Speed before braking (km/h) */
  speedBefore: number;
  /** Speed after braking event (km/h) */
  speedAfter: number;
}

// ─── Acceleration Record ────────────────────────────────────

export interface AccelerationRun {
  timestamp: number;
  latitude: number;
  longitude: number;
  /** Elapsed time in seconds for 0–40 */
  zeroTo40?: number;
  /** Elapsed time in seconds for 0–60 */
  zeroTo60?: number;
  /** Elapsed time in seconds for 0–80 */
  zeroTo80?: number;
  /** Elapsed time in seconds for 0–100 */
  zeroTo100?: number;
}

// ─── Ride Analytics ─────────────────────────────────────────

export interface SignalAnalytics {
  count: number;
  /** Total wait time in seconds */
  totalWaitTime: number;
  /** Longest single signal wait in seconds */
  longestWait: number;
  /** Percentage of total ride time spent at signals */
  rideTimePercentage: number;
  stops: SignalStop[];
}

export interface BrakingAnalytics {
  totalEvents: number;
  mildEvents: number;
  moderateEvents: number;
  hardEvents: number;
  events: BrakingEvent[];
}

export interface AccelerationAnalytics {
  /** Best 0–40 time in seconds */
  best0to40?: number;
  /** Best 0–60 time in seconds */
  best0to60?: number;
  /** Best 0–80 time in seconds */
  best0to80?: number;
  /** Best 0–100 time in seconds */
  best0to100?: number;
  runs: AccelerationRun[];
}

export interface SpeedDistribution {
  /** 0–30 km/h percentage */
  slow: number;
  /** 30–60 km/h percentage */
  urban: number;
  /** 60–100 km/h percentage */
  highway: number;
  /** 100+ km/h percentage */
  fast: number;
}

export interface RideAnalytics {
  /** Total distance in kilometers */
  distanceKm: number;
  /** Total ride duration in seconds (end - start) */
  durationSeconds: number;
  /** Time actually moving (speed > 2 km/h) in seconds */
  movingTimeSeconds: number;
  /** Time spent idle (speed ≤ 2 km/h) in seconds */
  idleTimeSeconds: number;
  /** Average speed while moving (km/h) */
  avgSpeedKmh: number;
  /** Maximum speed recorded (km/h) */
  topSpeedKmh: number;
  /** Total ascent in meters */
  totalAscentMeters: number;
  /** Total descent in meters */
  totalDescentMeters: number;
  signals: SignalAnalytics;
  braking: BrakingAnalytics;
  acceleration: AccelerationAnalytics;
  speedDistribution: SpeedDistribution;
  /** GPS bounding box */
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  /** Center point for map */
  center: { lat: number; lng: number } | null;
}

// ─── Ride ───────────────────────────────────────────────────

export type RideStatus = "recording" | "paused" | "completed";

export interface Ride {
  id: string;
  /** ISO 8601 timestamp */
  startTime: string;
  /** ISO 8601 timestamp (null if still recording) */
  endTime: string | null;
  status: RideStatus;
  /** Human-readable name (auto-generated or user-set) */
  name: string;
  /** Optional notes */
  notes?: string;
  /** Bike ID linked to this ride */
  bikeId?: string;
  /** Whether GPS points are stored (always true for local rides) */
  hasGpsTrack: boolean;
  /** Summary analytics (null until ride ends) */
  analytics: RideAnalytics | null;
  /** Supabase sync timestamp */
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Bike Profile ───────────────────────────────────────────

export type BikeType = "sport" | "cruiser" | "adventure" | "naked" | "scooter" | "other";

export interface Bike {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  type?: BikeType;
  color?: string;
  /** Purchase date as ISO date string */
  purchaseDate?: string;
  /** Current odometer reading in kilometers */
  currentOdometer?: number;
  /** Fuel efficiency in km/L */
  fuelEfficiencyKmL?: number;
  /** Odometer at start of tracking */
  initialOdometer?: number;
  /** Registration number */
  regNumber?: string;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Maintenance Record ─────────────────────────────────────

export type MaintenanceType =
  | "service"
  | "tyre_change"
  | "chain_service"
  | "insurance_renewal"
  | "oil_change"
  | "brake_service"
  | "battery_change"
  | "wash"
  | "other";

export interface MaintenanceRecord {
  id: string;
  bikeId: string;
  type: MaintenanceType;
  /** ISO date string */
  date: string;
  /** Odometer reading at time of service (km) */
  odometer?: number;
  /** Cost in local currency */
  cost?: number;
  /** Service provider / shop name */
  serviceProvider?: string;
  notes?: string;
  /** Next due date (ISO date string) */
  nextDueDate?: string;
  /** Next due odometer (km) */
  nextDueOdometer?: number;
  createdAt: string;
}

// ─── Stats ──────────────────────────────────────────────────

export interface DayStats {
  /** YYYY-MM-DD */
  date: string;
  rideCount: number;
  distanceKm: number;
  durationSeconds: number;
  avgSpeedKmh: number;
  topSpeedKmh: number;
}

export interface MonthlyStats {
  /** YYYY-MM */
  month: string;
  rideCount: number;
  rideDays: number;
  distanceKm: number;
  durationSeconds: number;
  movingTimeSeconds: number;
  avgSpeedKmh: number;
  topSpeedKmh: number;
  longestRideKm: number;
  longestRideDuration: number;
  totalSignalStops: number;
  totalSignalWaitSeconds: number;
  hardBrakingEvents: number;
  days: Record<string, DayStats>;
}

export interface YearlyStats {
  year: number;
  rideCount: number;
  rideDays: number;
  distanceKm: number;
  durationSeconds: number;
  avgSpeedKmh: number;
  topSpeedKmh: number;
  longestRideKm: number;
  longestRideDuration: number;
  best0to60?: number;
  best0to100?: number;
  totalSignalWaitSeconds: number;
  hardBrakingEvents: number;
  mostDistanceInOneDay: number;
  mostDistanceInOneDayDate?: string;
  months: MonthlyStats[];
}

// ─── Milestone ──────────────────────────────────────────────

export interface Milestone {
  id: string;
  distanceKm: number;
  label: string;
  achievedAt?: string;
  isAchieved: boolean;
}

export const MILESTONES: Omit<Milestone, "achievedAt" | "isAchieved">[] = [
  { id: "1k", distanceKm: 1000, label: "1,000 km" },
  { id: "5k", distanceKm: 5000, label: "5,000 km" },
  { id: "10k", distanceKm: 10000, label: "10,000 km" },
  { id: "20k", distanceKm: 20000, label: "20,000 km" },
  { id: "50k", distanceKm: 50000, label: "50,000 km" },
];

// ─── App State ──────────────────────────────────────────────

export type StorageMode = "guest" | "cloud";
export type AppTheme = "dark" | "system";

export interface AppSettings {
  storageMode: StorageMode;
  distanceUnit: "km" | "miles";
  speedUnit: "kmh" | "mph";
  defaultBikeId?: string;
  theme: AppTheme;
  gpsInterval: number; // milliseconds between GPS samples
  keepScreenOn: boolean;
  notifications: boolean;
}

// ─── Active Ride State ──────────────────────────────────────

export interface ActiveRideState {
  rideId: string | null;
  isRecording: boolean;
  isPaused: boolean;
  points: RidePoint[];
  currentSpeed: number;
  currentHeading: number;
  currentAltitude: number;
  distanceKm: number;
  startTime: number | null;
  elapsedSeconds: number;
  /** Live signal detection state */
  currentSignalStartTime: number | null;
  isAtSignal: boolean;
}

// ─── User / Auth ────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

// ─── Utility Types ──────────────────────────────────────────

export type LatLng = { lat: number; lng: number };

export interface HeatmapPoint extends LatLng {
  intensity: number;
}

export interface RouteSegment {
  points: LatLng[];
  avgSpeed: number;
  /** For color coding on speed heatmap */
  speedCategory: "slow" | "urban" | "highway" | "fast";
}
