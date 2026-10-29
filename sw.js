// Primero la red (así siempre llega la última versión) y, si no hay
// conexión, lo guardado. Solo guarda archivos de la propia app: lo de
// Supabase pasa directo.
const CACHE = 'recetario-v1';

// Lo necesario para arrancar sin conexión desde la primera visita; el resto
// (fuentes, íconos) se guarda a medida que se usa.
const BASICO = [
  './', 'index.html', 'flutter_bootstrap.js', 'flutter.js', 'main.dart.js',
  'manifest.json', 'icons/Icon-192.png', 'canvaskit/canvaskit.js',
  'canvaskit/canvaskit.wasm', 'assets/AssetManifest.bin.json',
  'assets/FontManifest.json', 'assets/fonts/MaterialIcons-Regular.otf',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((cache) =>
    Promise.all(BASICO.map((url) => cache.add(url).catch(() => {})))));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const pedido = e.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const respuesta = await fetch(pedido, { cache: 'no-cache' });
      if (respuesta.ok) cache.put(pedido, respuesta.clone());
      return respuesta;
    } catch (_) {
      const guardada = await cache.match(pedido, { ignoreSearch: true });
      if (guardada) return guardada;
      if (pedido.mode === 'navigate') return (await cache.match('./')) || (await cache.match('index.html'));
      throw _;
    }
  })());
});
