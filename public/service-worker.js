// Cache names
const CACHE_NAME = 'prompter-pwa-cache-v2';
const ASSETS_CACHE = 'prompter-pwa-assets-v2';
const STATIC_CACHE = 'prompter-pwa-static-v2';
const DYNAMIC_CACHE = 'prompter-pwa-dynamic-v2';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/screenshot1.png',
  '/apple-touch-icon.png',
  '/vite.svg'
];

// Static assets to cache (CSS, JS, etc.)
const STATIC_ASSETS = [
  '/assets/index-*.css',
  '/assets/index-*.js'
];

// Install event: precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(PRECACHE_ASSETS)),
      caches.open(STATIC_CACHE)
        .then((cache) => {
          // Use a more flexible way to cache static assets with pattern matching
          return fetch('/').then(response => response.text())
            .then(html => {
              const matches = html.match(/\/assets\/[^"]+/g) || [];
              return cache.addAll([...new Set(matches)]);
            });
        })
    ])
    .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, ASSETS_CACHE, STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        console.log('Deleting outdated cache:', cacheToDelete);
        return caches.delete(cacheToDelete);
      }));
    }).then(() => {
      console.log('Service Worker activated and controlling the page');
      return self.clients.claim();
    })
  );
});

// Fetch event: optimized caching strategies based on request type
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For GET requests only
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/assets/')) {
    // Cache-first for static assets (CSS, JS)
    event.respondWith(cacheFirstStrategy(event.request));
  } else if (
    url.pathname.includes('.png') ||
    url.pathname.includes('.jpg') ||
    url.pathname.includes('.svg') ||
    url.pathname.includes('.ico')
  ) {
    // Cache-first for images
    event.respondWith(cacheFirstStrategy(event.request));
  } else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    // Network-first for HTML pages
    event.respondWith(networkFirstStrategy(event.request));
  } else {
    // Stale-while-revalidate for everything else
    event.respondWith(staleWhileRevalidateStrategy(event.request));
  }
});

// Cache-first strategy
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    await updateCache(STATIC_CACHE, request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // If it's an HTML request, return offline page
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
  }
}

// Network-first strategy
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    await updateCache(CACHE_NAME, request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return caches.match('/offline.html');
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    updateCache(DYNAMIC_CACHE, request, networkResponse.clone());
    return networkResponse;
  }).catch(() => {
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    return new Response('Network error occurred', { status: 408 });
  });
  
  return cachedResponse || fetchPromise;
}

// Helper function to update cache
async function updateCache(cacheName, request, response) {
  if (!response || response.status !== 200) {
    return;
  }
  
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

// Push event handler for notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});