// Service worker mínimo: cachea el shell para que la PWA abra offline.
// Las credenciales/datos siempre vienen de Firebase (red), así que NO cacheamos esas requests.
const CACHE = 'turnos-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg',
  './js/main.js', './js/firebase.js', './js/state.js', './js/utils.js', './js/prefs.js',
  './js/modal.js', './js/nav.js', './js/auth.js', './js/data.js', './js/agenda.js',
  './js/patients.js', './js/waitlist.js', './js/requests.js', './js/stats.js',
  './js/config.js', './js/public.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Solo manejamos GET de nuestro propio origen; Firebase/Google pasan directo a la red.
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  const isDoc = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/';
  if (isDoc) {
    // Network-first para el HTML: siempre la última versión deployada; caché solo si no hay red.
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }
  // Cache-first para assets estáticos (manifest, icono).
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }))
  );
});
