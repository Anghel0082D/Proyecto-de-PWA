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
  console.log("[Service Worker] Instalando y precacheando...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});


// ACTIVACIÓN (limpieza)
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activado");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(key)) {
            console.log("[Service Worker] Borrando cache vieja:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

//FUNCIONES DE CACHE
async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    if (req.mode === "navigate") {
      return caches.match("/offline.html");
    }
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(req) {
  const cache = await caches.open(DYNAMIC_CACHE);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(req);
    return cached || caches.match("/offline.html");
  }
}

async function staleWhileRevalidate(req, cacheName = IMAGE_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  });
  return cached || network;
}

// FETCH EVENT (ruteo de estrategias)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  //Recursos de API → Network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req));
    return;
  }
  //Imágenes → Stale-while-revalidate
  if (req.destination === "image") {
    event.respondWith(staleWhileRevalidate(req, IMAGE_CACHE));
    return;
  }

  //Navegación o HTML → Cache-first con fallback offline
  if (req.mode === "navigate") {
    event.respondWith(cacheFirst(req));
    return;
  }

  //CSS/JS → Cache-first
  event.respondWith(cacheFirst(req));
});


// BACKGROUND SYNC (simulación sin backend)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-entries") {
    console.log("[Service Worker] Background Sync detectado...");
    event.waitUntil(simularEnvio());
  }
});

async function simularEnvio() {
  console.log("[Service Worker] Simulando envío de datos pendientes...");
  // Aquí podrías abrir IndexedDB y enviar datos reales
  await new Promise((res) => setTimeout(res, 2000));
  console.log("[Service Worker] Datos sincronizados correctamente (simulado)");
  return true;
}

//  NOTIFICACIONES PUSH
self.addEventListener("push", (event) => {
  let data = { title: "Notificación", body: "Tienes una alerta" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }
  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-512.png",
    data: { url: "/" }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      const hadWindow = clientsArr.some((w) => {
        if (w.url === "/" && "focus" in w) {
          w.focus();
          return true;
        }
        return false;
      });
      if (!hadWindow && self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});