/**
 * RideLog Formatting Utilities
 */

/** Format seconds to HH:MM:SS or MM:SS */
export function formatDuration(seconds: number, compact = false): string {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (compact) {
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Format seconds to "Xh Ym" for display */
export function formatDurationLong(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Format km with 1–2 decimal places */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(2)} km`;
  return `${km.toFixed(1)} km`;
}

/** Format speed */
export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

/** Format acceleration time */
export function formatAcceleration(seconds: number | undefined): string {
  if (seconds === undefined) return "—";
  return `${seconds.toFixed(2)}s`;
}

/** Format date to display string */
export function formatDate(date: string | Date, format: "short" | "long" | "day" = "long"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (format === "short") {
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  if (format === "day") {
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format time from date */
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/** Format currency */
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

/** Format percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Abbreviate large numbers */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

/** Generate ride name from timestamp */
export function generateRideName(startTime: string): string {
  const d = new Date(startTime);
  const hour = d.getHours();
  let period = "Morning";
  if (hour >= 12 && hour < 17) period = "Afternoon";
  else if (hour >= 17 && hour < 21) period = "Evening";
  else if (hour >= 21 || hour < 5) period = "Night";

  const day = d.toLocaleDateString("en-IN", { weekday: "long" });
  return `${day} ${period} Ride`;
}

/** YYYY-MM-DD from date */
export function toDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/** YYYY-MM from date */
export function toMonthString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 7);
}

/** Generate UUID v4 */
export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** cn utility — merge Tailwind classes */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Compute riding streak from a set of ride dates */
export function computeStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...new Set(dates)].sort().reverse();
  const today = toDateString(new Date());

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevDate: string | null = null;

  for (const date of sorted) {
    if (prevDate === null) {
      if (date === today || date === toDateString(new Date(Date.now() - 86_400_000))) {
        streak = 1;
        current = 1;
      } else {
        current = 0;
        streak = 1;
      }
    } else {
      const prev = new Date(prevDate);
      const curr = new Date(date);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
      if (diffDays === 1) {
        streak++;
        if (current > 0) current = streak;
      } else {
        streak = 1;
      }
    }
    longest = Math.max(longest, streak);
    prevDate = date;
  }

  return { current, longest };
}
