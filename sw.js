// ===== Service Worker for 施工日報表 PWA - v5 =====
const CACHE_NAME = 'daily-report-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pwa/icon-192.png',
  './pwa/icon-512.png',
];

// 安裝：預先快取所有資源
self.addEventListener('install', event => {
  console.log('[SW] Installing v5...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
  self.skipWaiting(); // 立即啟動新版本
});

// 啟動：清除所有舊快取
self.addEventListener('activate', event => {
  console.log('[SW] Activating v5, clearing old caches...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 攔截請求：網路優先，快取備用（確保拿到最新版）
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // sw.js 本身不快取，讓瀏覽器永遠拿最新版
  if (event.request.url.includes('sw.js')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 拿到新版後更新快取
        if (response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => {
        // 離線時用快取
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
