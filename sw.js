const CACHE_NAME = 'hai-game-world-v1';
const ASSETS = [
    '/HaiGameWorld/',
    '/HaiGameWorld/index.html',
    '/HaiGameWorld/css/hub.css',
    '/HaiGameWorld/js/hub.js',
    '/HaiGameWorld/manifest.json',
    '/HaiGameWorld/favicon.svg'
];

// Install — cache app shell
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch — cache-first for static assets, network-first for pages
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) return;

    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(response => {
                // Cache successful GET responses
                if (e.request.method === 'GET' && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback for navigation requests
                if (e.request.mode === 'navigate') {
                    return caches.match('/HaiGameWorld/index.html');
                }
            });
        })
    );
});
