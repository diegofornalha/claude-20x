/**
 * Service Worker - SPARC Enhanced PWA
 * Implementa cache inteligente, offline-first e background sync
 */

const CACHE_NAME = 'turma-gestores-v1.2.0';
const STATIC_CACHE = 'static-v1.2.0';
const DYNAMIC_CACHE = 'dynamic-v1.2.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json'
];

// Assets to cache on first use
const DYNAMIC_ASSETS = [
    '/api/',
    'https://bit.ly/',
    'https://fonts.googleapis.com/',
    'https://fonts.gstatic.com/'
];

// =============================================
// INSTALL EVENT
// =============================================

self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: Installation failed', error);
            })
    );
});

// =============================================
// ACTIVATE EVENT
// =============================================

self.addEventListener('activate', (event) => {
    console.log('🎯 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// =============================================
// FETCH EVENT - CACHE STRATEGIES
// =============================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
            // Cache First Strategy for static assets
            event.respondWith(cacheFirstStrategy(request));
        } else if (url.pathname.startsWith('/api/')) {
            // Network First Strategy for API calls
            event.respondWith(networkFirstStrategy(request));
        } else if (request.destination === 'image') {
            // Cache First Strategy for images
            event.respondWith(cacheFirstStrategy(request));
        } else if (url.origin === location.origin) {
            // Stale While Revalidate for same-origin requests
            event.respondWith(staleWhileRevalidateStrategy(request));
        } else {
            // Cache First for external resources
            event.respondWith(cacheFirstStrategy(request));
        }
    }
});

// =============================================
// CACHE STRATEGIES
// =============================================

async function cacheFirstStrategy(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🔄 Service Worker: Cache first fallback for', request.url);
        return getOfflineFallback(request);
    }
}

async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 Service Worker: Network first fallback for', request.url);
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        return cachedResponse || getOfflineFallback(request);
    }
}

async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then(networkResponse => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

function getOfflineFallback(request) {
    if (request.destination === 'document') {
        return caches.match('/index.html');
    }
    
    if (request.destination === 'image') {
        return new Response(`
            <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="150" fill="#ff8c00" opacity="0.1"/>
                <text x="100" y="75" text-anchor="middle" fill="#ff8c00" font-family="Arial" font-size="12">
                    Imagem offline
                </text>
            </svg>
        `, {
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
    
    return new Response('Conteúdo indisponível offline', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// =============================================
// BACKGROUND SYNC
// =============================================

self.addEventListener('sync', (event) => {
    if (event.tag === 'background-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncAnalytics() {
    try {
        // Get pending analytics data from IndexedDB
        const pendingData = await getPendingAnalytics();
        
        for (const data of pendingData) {
            try {
                await fetch('/analytics', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' }
                });
                
                // Remove from pending queue
                await removePendingAnalytics(data.id);
                console.log('📊 Analytics synced:', data.type);
            } catch (error) {
                console.log('📊 Analytics sync failed for:', data.type);
            }
        }
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// =============================================
// PUSH NOTIFICATIONS
// =============================================

self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nova atualização disponível!',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'turma-gestores-update',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'Ver Agora',
                icon: '/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Depois',
                icon: '/action-dismiss.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Formação Agentes Integrados', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// =============================================
// UTILITY FUNCTIONS
// =============================================

async function getPendingAnalytics() {
    // Simulate IndexedDB access
    // In real implementation, use IndexedDB to store pending analytics
    return [];
}

async function removePendingAnalytics(id) {
    // Simulate removing from IndexedDB
    console.log('Removed analytics item:', id);
}

// =============================================
// PERFORMANCE MONITORING
// =============================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PERFORMANCE_MEASURE') {
        console.log('📈 Performance measure:', event.data.data);
        
        // Store performance data for later analysis
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => {
                    const performanceKey = `performance-${Date.now()}`;
                    const response = new Response(JSON.stringify(event.data.data));
                    return cache.put(performanceKey, response);
                })
        );
    }
});

// Log service worker lifecycle
console.log('🚀 Service Worker: Script loaded');