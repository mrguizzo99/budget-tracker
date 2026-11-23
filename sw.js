const CACHE_NAME = "budget-pwa-v3";
const APP_SHELL_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=3",
  "./app.js?v=3",
  "./manifest.json",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL_ASSETS.map((asset) =>
          fetch(asset, { cache: "no-cache" })
            .then((response) => {
              if (response && response.ok) {
                return cache.put(asset, response);
              }
            })
            .catch(() => cache.add(asset))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept non-GET requests (e.g. POST to Google Apps Script)
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Bypass Service Worker for cross-origin API calls (Google Apps Script, redirects, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Icons: cache-first
  if (url.pathname.includes("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.ok && response.type === "basic") {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Navigation requests: network-first (bypassing HTTP cache) with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Core static files (CSS, JS, manifest): network-first so iPhone reloads always pick up updates immediately
  event.respondWith(
    fetch(request, { cache: "no-cache" })
      .then((response) => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
