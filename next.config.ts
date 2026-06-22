import type { NextConfig } from "next";

// ─── Security Headers ─────────────────────────────────────────
// Applied to every response. Tuned for a PWA + GA4 + Firebase + OSM tiles.
const securityHeaders = [
  {
    // Prevent clickjacking
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Block MIME-type sniffing attacks
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Enables built-in XSS filter in older browsers (belt-and-suspenders)
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    // Referrer policy — don't leak path to third parties
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Limit what browser APIs can be used. Geolocation is required for ride tracking.
    key: "Permissions-Policy",
    value: "geolocation=(self), microphone=(), camera=(), payment=()",
  },
  {
    // Content-Security-Policy
    // — 'unsafe-inline' is required by Next.js inline scripts and gtag
    // — tile.openstreetmap.org is required for the Leaflet map tiles
    // — googletagmanager.com + google-analytics.com for GA4
    // — firebaseapp.com + googleapis.com for Firebase Analytics
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://www.google-analytics.com",
      "font-src 'self'",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://firebaseinstallations.googleapis.com https://firebaselogging-pa.googleapis.com https://region1.google-analytics.com https://*.supabase.co wss://*.supabase.co https://*.tile.openstreetmap.org",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  {
    // HSTS — force HTTPS for 1 year once deployed
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PWA handled via public/sw.js custom service worker
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  webpack: (config) => {
    // Leaflet SSR fix
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
