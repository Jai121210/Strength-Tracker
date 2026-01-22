const CACHE_NAME = "strength-cache-v2";
const ASSETS = [ "/Strength-Tracker/", "/Strength-Tracker/index.html", "/Strength-Tracker/styles.css", "/Strength-Tracker/app.js", "/Strength-Tracker/manifest.webmanifest", "/Strength-Tracker/icons/icon-192.png", "/Strength-Tracker/icons/icon-512.png" ];

// INSTALL — cache core files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE — delete old caches
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

// FETCH — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh version
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("install", () => { console.log("SW installing NEW version"); self.skipWaiting(); }); self.addEventListener("activate", () => { console.log("SW activated"); clients.claim(); });
