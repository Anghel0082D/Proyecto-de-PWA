
const STATIC_CACHE = "static-v4";
const DYNAMIC_CACHE = "dynamic-v2";
const IMAGE_CACHE = "images-v1";
const CACHE_NAME = "mi-pwa-cache-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/image.png",
  "/icons/image.png",
  "/offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(
          () => new Response("Offline", { status: 503, statusText: "Offline" })
        )
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Network-first para recursos dinámicos (APIs)
  if (req.url.includes("/api/")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Stale-while-revalidate para imágenes
  if (req.destination === "image") {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Cache-first para lo demás
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  return (
    cached ||
    fetch(req).catch(() => caches.match("/offline.html"))
  );
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || caches.match("/offline.html");
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const network = fetch(req).then((res) => {
    cache.put(req, res.clone());
    return res;
  });
  return cached || network;
}

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-entries") {
    event.waitUntil(sendPendingData());
  }
});

async function sendPendingData() {
  console.log("Sincronizando datos almacenados...");
  
}

self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "Notificación", body: "Tienes una alerta" };
  const options = {
    body: data.body,
    icon: "/icons/icons.png",
    badge: "/icons/icons.png"
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
