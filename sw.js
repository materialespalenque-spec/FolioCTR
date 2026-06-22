// Service Worker — Control de Carga PWA
const CACHE_NAME = 'control-carga-v5';

const APP_SHELL = [
  '/FolioCTR/index.html',
  '/FolioCTR/manifest.json',
  '/FolioCTR/icon-192.png',
  '/FolioCTR/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Firebase y APIs externas: siempre red, nunca caché
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // App shell: Network First — intenta red primero para tener siempre la versión más reciente,
  // si no hay conexión usa el caché guardado
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.status === 200 && url.origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        return cached || caches.match('/FolioCTR/index.html');
      });
    })
  );
});
