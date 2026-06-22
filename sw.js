// Service Worker — Control de Carga PWA
// Versión: incrementar este número cada vez que se actualice el archivo
const CACHE_NAME = 'control-carga-v1';

// Archivos de la app que se guardan en caché para funcionar sin internet
const APP_SHELL = [
  '/FolioCTR/index.html',
  '/FolioCTR/manifest.json',
  '/FolioCTR/icon-192.png',
  '/FolioCTR/icon-512.png',
  // Fuentes y librerías externas
  'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-app-compat.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-auth-compat.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-firestore-compat.min.js'
];

// Instalación: guarda en caché los archivos principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Se intenta guardar cada recurso; si falla uno externo (CDN), no bloquea la instalación
      return Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activación: limpia cachés antiguos
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

// Fetch: estrategia "Network First" para Firebase (datos siempre frescos),
// "Cache First" para la app shell (carga rápida sin internet)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Firebase y APIs externas: siempre intentar red primero, sin cachear
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // App shell y recursos estáticos: Cache First (si no está en caché, va a la red)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Solo cachear respuestas válidas de nuestro propio dominio
        if (response && response.status === 200 && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
