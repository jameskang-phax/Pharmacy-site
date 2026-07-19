/* 麻豆新樓醫院藥劑科工作站 · Service Worker
   負責離線快取「網站本身的檔案」（HTML/CSS/JS/圖片），
   不快取 Google 試算表資料（公告、查看紀錄、儲位查詢都必須即時抓最新資料）。

   *** 之後只要有更新網站檔案，記得把下面 CACHE_VERSION 改一個新的版號，
   *** 否則使用者的瀏覽器可能會因為快取而看到舊版內容。 */

var CACHE_VERSION = 'pharmacy-v1';

var APP_SHELL = [
  './',
  'index.html',
  'education.html',
  'storage.html',
  'abnormal.html',
  'log-consult.html',
  'log-error.html',
  'log-5s.html',
  'log-pbl.html',
  'styles.css',
  'auth.js',
  'log.js',
  'storage.js',
  'manifest.json'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(APP_SHELL).catch(function(err){
        // 個別檔案快取失敗不應該讓整個安裝失敗
        console.warn('部分檔案快取失敗（不影響網站運作）', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_VERSION; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  var req = event.request;

  // 只處理 GET 請求
  if(req.method !== 'GET') return;

  var url = new URL(req.url);

  // Google 試算表 / 表單 / 外部連結一律直接走網路，不快取，確保資料即時
  if(url.origin !== self.location.origin){
    return;
  }

  // 網站自己的檔案：採用「先讀快取、同時背景更新」策略（stale-while-revalidate）
  event.respondWith(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.match(req).then(function(cached){
        var networkFetch = fetch(req).then(function(res){
          if(res && res.status === 200){
            cache.put(req, res.clone());
          }
          return res;
        }).catch(function(){
          return cached;
        });
        return cached || networkFetch;
      });
    })
  );
});
