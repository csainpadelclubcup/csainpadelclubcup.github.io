/* App CSAIN Padel Club Cup: il sito installabile sul telefono.
   Pagine sempre prese dalla rete (così si vede sempre l'ultima versione);
   la copia salvata serve solo quando manca la connessione. */
const CACHE = 'csain-app-v2';
const OFFLINE = ['index.html', 'app.html', 'app/icona-192.png', 'img/logo-csain-padel.png', 'fonts/fonts.css'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return; // servizi esterni (invio moduli): non toccati
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && (r.mode === 'navigate' || /\.(css|js|woff2)$/.test(new URL(r.url).pathname))) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
