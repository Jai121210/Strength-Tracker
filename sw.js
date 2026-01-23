const CACHE_NAME = "strength-cache-v4";

const ASSETS = [
  "/Strength-Tracker/",
  "/Strength-Tracker/index.html",
  "/Strength-Tracker/styles.css",
  "/Strength-Tracker/app.js",
  "/Strength-Tracker/manifest.webmanifest",
  "/Strength-Tracker/icons/icon-192.png",
  "/Strength-Tracker/icons/icon-512.png"
];

// INSTALL — cache core files
self.addEventListener("install", (event) => {
  console.log("SW installing NEW version");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE — delete old caches
self.addEventListener("activate", (event) => {
  console.log("SW activated");
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
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
