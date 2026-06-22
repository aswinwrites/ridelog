"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useRideStore } from "@/store/useRideStore";
import { useBikeStore } from "@/store/useBikeStore";
import { initFirebaseAnalytics } from "@/lib/firebase/analytics";

/**
 * Invisible client component that bootstraps the app on mount.
 * Loads settings, rides, and bikes from IndexedDB.
 * Registers PWA service worker and install prompt.
 * Initialises Firebase Analytics.
 */
export function AppInit() {
  const { initSettings, setInstallPrompt } = useAppStore();
  const { loadRides } = useRideStore();
  const { loadBikes } = useBikeStore();

  useEffect(() => {
    // Boot sequence
    initSettings();
    loadRides();
    loadBikes();

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration failed:", err));
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Boot Firebase Analytics (non-blocking)
    initFirebaseAnalytics().catch(() => {});

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [initSettings, loadRides, loadBikes, setInstallPrompt]);

  return null;
}
