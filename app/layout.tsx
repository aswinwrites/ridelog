import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppInit } from "@/components/shared/AppInit";

export const metadata: Metadata = {
  title: "RideLog — Motorcycle Analytics",
  description: "Your personal motorcycle ride journal, analytics dashboard, and logbook",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RideLog",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#08080F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
      </head>
      <body className="bg-bg-base text-foreground antialiased">
        <AppInit />
        {children}
      </body>
    </html>
  );
}
