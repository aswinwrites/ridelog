/**
 * RiderStats — Firebase Analytics
 * Project: riderstats-53269
 *
 * Firebase Analytics and GA4 (G-47F5N047DK) point at the same data stream.
 * Firebase SDK provides automatic events (session_start, first_open, etc.)
 * that gtag.js alone doesn't capture for PWAs.
 *
 * REQUIRED ENV VARS (add to Vercel → Environment Variables):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *
 * Get these from:
 *   Firebase Console → riderstats-53269 → Project Settings → Your apps → Web app → SDK config
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "riderstats-53269.firebaseapp.com",
  projectId: "riderstats-53269",
  storageBucket: "riderstats-53269.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-47F5N047DK",
};

let app: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;

/**
 * Initialize Firebase Analytics once on the client.
 * Call this from a useEffect in layout or AppInit.
 */
export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;

  // Skip if env vars aren't configured yet
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[RiderStats] Firebase env vars not set. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_APP_ID to Vercel."
      );
    }
    return null;
  }

  try {
    // Avoid re-initializing on hot reload
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    const supported = await isSupported();
    if (!supported) return null;

    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (err) {
    console.warn("[RiderStats] Firebase Analytics init failed:", err);
    return null;
  }
}

export function getFirebaseAnalytics(): Analytics | null {
  return analyticsInstance;
}
