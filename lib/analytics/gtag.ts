/**
 * RiderStats — GA4 Analytics (gtag.js wrapper)
 * Measurement ID: G-47F5N047DK
 *
 * All event calls are safe to use in SSR — they no-op when window is unavailable.
 *
 * KEY EVENTS ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────
 * RIDE LIFECYCLE
 *   ride_started       — user taps "Start Ride"
 *   ride_ended         — ride saved with full analytics
 *   ride_paused        — user pauses mid-ride
 *   ride_resumed       — user resumes after pause
 *   ride_deleted       — user deletes a logged ride
 *   ride_viewed        — user opens a past ride detail
 *   ride_renamed       — user edits a ride name
 *   ride_notes_saved   — user adds/edits ride notes
 *
 * GARAGE
 *   bike_added         — new bike profile saved
 *   bike_deleted       — bike profile removed
 *   bike_set_default   — user changes default bike
 *   maintenance_logged — new service/maintenance record
 *
 * ANALYTICS & WRAPPED
 *   analytics_viewed   — user opens Analytics tab
 *   wrapped_viewed     — user views Ride Wrapped summary
 *
 * PWA INSTALL
 *   pwa_install_shown     — install banner appeared
 *   pwa_install_accepted  — user tapped "Install"
 *   pwa_install_dismissed — user dismissed the banner
 *   app_installed         — appinstalled event fired (confirmed)
 *
 * NAVIGATION
 *   nav_tab_clicked    — bottom nav tab tap (not the same as page_view)
 * ─────────────────────────────────────────────────────────────
 */

export const GA_MEASUREMENT_ID = "G-47F5N047DK";

// ─── Type Declarations ────────────────────────────────────────

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config?: Record<string, any>
    ) => void;
    dataLayer: unknown[];
  }
}

function gtag(...args: Parameters<Window["gtag"]>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag(...args);
}

// ─── Page View ────────────────────────────────────────────────

export function trackPageView(url: string) {
  gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

// ─── Ride Lifecycle Events ────────────────────────────────────

export function trackRideStarted(params: {
  bike_id?: string;
  has_gps: boolean;
}) {
  gtag("event", "ride_started", {
    ...params,
    event_category: "ride",
  });
}

export function trackRideEnded(params: {
  distance_km: number;
  duration_min: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  signal_stops: number;
  hard_braking_count: number;
  bike_id?: string;
}) {
  gtag("event", "ride_ended", {
    ...params,
    event_category: "ride",
    // GA4 recommended e-commerce-style value for engagement scoring
    value: Math.round(params.distance_km),
  });
}

export function trackRidePaused(params: {
  elapsed_seconds: number;
  distance_km: number;
}) {
  gtag("event", "ride_paused", { ...params, event_category: "ride" });
}

export function trackRideResumed() {
  gtag("event", "ride_resumed", { event_category: "ride" });
}

export function trackRideDeleted(params: { distance_km?: number }) {
  gtag("event", "ride_deleted", { ...params, event_category: "ride" });
}

export function trackRideViewed(params: {
  distance_km: number;
  duration_min: number;
}) {
  gtag("event", "ride_viewed", { ...params, event_category: "ride" });
}

export function trackRideRenamed() {
  gtag("event", "ride_renamed", { event_category: "ride" });
}

export function trackRideNotesSaved() {
  gtag("event", "ride_notes_saved", { event_category: "ride" });
}

// ─── Garage Events ────────────────────────────────────────────

export function trackBikeAdded(params: {
  has_make: boolean;
  has_model: boolean;
  has_year: boolean;
  has_odometer: boolean;
}) {
  gtag("event", "bike_added", { ...params, event_category: "garage" });
}

export function trackBikeDeleted() {
  gtag("event", "bike_deleted", { event_category: "garage" });
}

export function trackBikeSetDefault() {
  gtag("event", "bike_set_default", { event_category: "garage" });
}

export function trackMaintenanceLogged(params: {
  type: string;
  has_cost: boolean;
  has_provider: boolean;
}) {
  gtag("event", "maintenance_logged", { ...params, event_category: "garage" });
}

// ─── Analytics & Wrapped Events ──────────────────────────────

export function trackAnalyticsViewed() {
  gtag("event", "analytics_viewed", { event_category: "engagement" });
}

export function trackWrappedViewed(params: {
  year: number;
  total_rides: number;
  total_km: number;
}) {
  gtag("event", "wrapped_viewed", { ...params, event_category: "engagement" });
}

// ─── PWA Install Events ───────────────────────────────────────

export function trackInstallShown(params: { platform: "android" | "ios" }) {
  gtag("event", "pwa_install_shown", { ...params, event_category: "pwa" });
}

export function trackInstallAccepted() {
  gtag("event", "pwa_install_accepted", { event_category: "pwa" });
}

export function trackInstallDismissed() {
  gtag("event", "pwa_install_dismissed", { event_category: "pwa" });
}

export function trackAppInstalled() {
  gtag("event", "app_installed", { event_category: "pwa" });
}

// ─── Navigation Events ────────────────────────────────────────

export function trackNavClick(params: { tab: string }) {
  gtag("event", "nav_tab_clicked", { ...params, event_category: "navigation" });
}
