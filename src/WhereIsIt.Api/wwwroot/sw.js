// WHERE IS IT — Service Worker v2.2
const CACHE_NAME = 'where-is-it-v2.2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-512.png',
    '/css/tokens.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/modals.css',
    '/css/voice.css',
    '/css/pwa.css',
    '/css/mobile.css',
    '/css/profile.css'
];

// Install Event - Pre-cache essential app shell
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker & Pre-caching App Shell');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up stale old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Only cache GET static assets, NEVER intercept or cache POST/PUT/DELETE
self.addEventListener('fetch', (event) => {
    // 1. Never intercept non-GET requests (POST, PUT, DELETE, etc.)
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    // 2. Never cache dynamic backend API requests in Cache Storage
    if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
        return;
    }

    // 3. Static Assets: Stale-While-Revalidate Strategy
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If offline and navigate request, return index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});
