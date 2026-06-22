import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AppInit } from "@/components/shared/AppInit";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/gtag";

export const metadata: Metadata = {
  title: "RiderStats — Motorcycle Analytics",
  description: "Your personal motorcycle ride journal, analytics dashboard, and logbook",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RiderStats",
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
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      </head>
      <body className="bg-bg-base text-foreground antialiased">
        {/* Google Analytics 4 — G-47F5N047DK */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
              send_page_view: true
            });
            window.addEventListener('appinstalled', function() {
              gtag('event', 'app_installed', { event_category: 'pwa' });
            });
          `}
        </Script>

        <AppInit />
        {children}
      </body>
    </html>
  );
}
