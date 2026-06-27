// ===== Service Worker for 施工日報表 PWA =====
const CACHE_NAME = 'daily-report-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pwa/icon-192.png',
  './pwa/icon-512.png',
];

// 安裝：預先快取所有資源
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// 啟動：清除舊快取
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 攔截請求：優先使用快取，失敗再去網路
self.addEventListener('fetch', event => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      
      return fetch(event.request).then(response => {
        // 快取新資源
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => {
        // 離線時回傳主頁
        return caches.match('./index.html');
      });
    })
  );
});