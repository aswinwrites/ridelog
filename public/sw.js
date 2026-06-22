/**
 * RideLog Service Worker
 * Offline-first caching strategy with stale-while-revalidate for OSM tiles
 */

const CACHE_NAME = "ridelog-v1";
const TILE_CACHE = "ridelog-tiles-v1";

// App shell files to precache
const PRECACHE_URLS = [
  "/",
  "/rides",
  "/analytics",
  "/bike",
  "/manifest.json",
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Precache failed:", err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== TILE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // OSM tiles — cache-first with long TTL
  if (url.hostname.includes("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response("", { status: 503 });
        }
      })
    );
    return;
  }

  // Navigation requests — network-first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r ?? caches.match("/")))
    );
    return;
  }

  // Static assets — stale-while-revalidate
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached ?? fetchPromise;
      })
    );
  }
});

// ── Background sync for ride data ────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-rides") {
    event.waitUntil(syncRides());
  }
});

async function syncRides() {
  // Notify the app to trigger sync
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: "SYNC_RIDES" });
  }
}
