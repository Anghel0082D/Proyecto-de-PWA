const STATIC_CACHE = "static-v2";
const DYNAMIC_CACHE = "dynamic-v1";
const OFFLINE_FALLBACK_URL = "/offline.html";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/image.png",
  OFFLINE_FALLBACK_URL
];

// Instalar y precachear App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activar y limpiar caches viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== STATIC_CACHE && key !== DYNAMIC_CACHE ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
});

// Interceptar requests (cache-first)
// Routing
// - HTML/navigation requests: Network-first with offline fallback
// - Images and non-critical: Stale-while-revalidate
// - Static assets: Cache-first
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    // Network-first for HTML
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_FALLBACK_URL);
        })
    );
    return;
  }

  if (request.destination === "image") {
    // Stale-while-revalidate for images
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // Cache-first for static assets from origin
  if (url.origin === self.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        return response;
      }))
    );
    return;
  }
});

// Background Sync: enviar entradas cuando vuelva la conexión
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-entries") {
    event.waitUntil(handleSyncEntries());
  }
});

async function handleSyncEntries() {
  const db = await openIndexedDB();
  const tx = db.transaction("outbox", "readwrite");
  const store = tx.objectStore("outbox");
  const all = await store.getAll();
  if (!all.length) return;
  const okIds = [];
  for (const item of all) {
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) okIds.push(item.id);
    } catch (e) {
      // se reintenta en el siguiente sync
    }
  }
  await Promise.all(okIds.map((id) => store.delete(id)));
  await tx.done;
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("week4-db", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("entries")) {
        db.createObjectStore("entries", { keyPath: "id", autoIncrement: true }).createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true }).createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Push event handler
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {}
  const title = data.title || 'Notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/icons/image.png',
    badge: '/icons/image.png',
    data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
