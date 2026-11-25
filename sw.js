/* Service Worker — Lectura Pro
 *
 * Hace que la app funcione sin conexión una vez abierta con internet.
 * Todo el HTML/CSS/JS está en index.html. Las librerías que se bajan la primera vez
 * (lector de PDF y lector de texto) se guardan solas al usarlas, gracias al "network-first".
 *
 * IMPORTANTE: cada vez que actualices index.html, sube también el número de
 * versión de CACHE (v1 -> v2 ...) para que los usuarios reciban la versión
 * nueva en vez de la vieja cacheada.
 */
const CACHE = "lectura-pro-web-v11";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sello.webp",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./icon-maskable-512.png"
];

// Instalación: guardar los archivos base en el caché.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

// Activación: borrar cachés viejos de versiones anteriores.
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: "network-first" (ves la versión más nueva si hay internet),
// con respaldo en el caché cuando estás sin conexión.
self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  // las páginas y archivos de la app se piden siempre al servidor (sin la copia de 10 minutos
  // del navegador), así la versión nueva llega apenas se publica
  const propio = new URL(req.url).origin === self.location.origin;
  evento.respondWith(
    fetch(req, propio ? { cache: "no-cache" } : undefined)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copia));
        return respuesta;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
  );
});
