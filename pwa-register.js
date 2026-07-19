/* 註冊 Service Worker，讓網站可以被「加到主畫面」並支援離線快取 */
if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').catch(function(err){
      console.warn('Service Worker 註冊失敗（不影響網站基本使用）', err);
    });
  });
}
