"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  trackInstallShown,
  trackInstallAccepted,
  trackInstallDismissed,
} from "@/lib/analytics/gtag";

const DISMISS_KEY = "riderstats_install_dismissed";
const SHOW_DELAY_MS = 10_000; // show after 10s of engagement

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallBanner() {
  const { isInstallPromptAvailable, triggerInstall } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    // Never show if already installed
    if (isInStandaloneMode()) return;
    // Never show if dismissed this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const ios = isIOS();
    const android = isInstallPromptAvailable;

    if (!ios && !android) return;

    const timer = setTimeout(() => {
      const p = ios ? "ios" : "android";
      setPlatform(p);
      setVisible(true);
      trackInstallShown({ platform: p });
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isInstallPromptAvailable]);

  // Also show Android banner when prompt becomes available mid-session
  useEffect(() => {
    if (!isInstallPromptAvailable || isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    if (platform === "ios") return; // already showing iOS variant

    const timer = setTimeout(() => {
      setPlatform("android");
      setVisible(true);
      trackInstallShown({ platform: "android" });
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isInstallPromptAvailable, platform]);

  const handleInstall = async () => {
    trackInstallAccepted();
    setVisible(false);
    await triggerInstall();
  };

  const handleDismiss = () => {
    trackInstallDismissed();
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && platform && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="fixed bottom-20 left-4 right-4 z-[60] pointer-events-auto"
        >
          <div className="bg-bg-card border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-black/40">
            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-xl">🏍️</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight mb-0.5">
                  Add RiderStats to Home Screen
                </p>
                <p className="text-xs text-muted-foreground leading-snug">
                  {platform === "android"
                    ? "Install the app for faster access, offline tracking, and a full-screen ride experience."
                    : "Tap the Share button below, then \"Add to Home Screen\" for the best ride experience."}
                </p>
              </div>
            </div>

            {platform === "android" ? (
              <button
                onClick={handleInstall}
                className="mt-3 w-full bg-primary text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Install App
              </button>
            ) : (
              /* iOS — manual guide */
              <div className="mt-3 flex items-center gap-2 bg-bg-surface rounded-xl px-3 py-2.5">
                <Share size={15} className="text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Tap <span className="text-foreground font-medium">Share</span> in Safari →{" "}
                  <span className="text-foreground font-medium">Add to Home Screen</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
