import type { NextConfig } from "next";

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
};

export default nextConfig;
