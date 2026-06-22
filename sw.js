// Service Worker — Control de Carga PWA v4
// Este SW limpia todos los cachés anteriores y no cachea nada nuevo
// para garantizar que siempre se cargue la versión más reciente.
const CACHE_NAME = 'control-carga-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Sin caché: siempre va a la red
  event.respondWith(fetch(event.request));
});
