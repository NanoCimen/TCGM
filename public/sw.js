const CACHE_NAME = "tcgrd-v3";
const PRECACHE_URLS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;

  // Never serve cached HTML — stale pages reference old chunk hashes
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  // Next.js App Router client-side transitions (clicking a nav link, or the
  // automatic prefetch that fires when a <Link> scrolls into view) are also
  // same-origin GETs to page paths like /wishlist — they just carry an RSC
  // header instead of being a "navigate"-mode request, so the checks above
  // don't catch them. Left uncovered, this handler served those pages'
  // stale cached RSC payloads on soft navigation (a black screen on routes
  // like /wishlist that render nothing rather than valid old data), even
  // though app pages already opt out of Next's own router cache via
  // staleTimes in next.config.mjs — that setting has no effect on this
  // separate Cache Storage layer. Always go to the network for these.
  if (event.request.headers.has("RSC") || url.searchParams.has("_rsc")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetched;
    })
  );
});
