/* App CSAIN Padel Club Cup
   - registra il service worker (serve per installare l'app sul telefono)
   L'app installata apre il sito (index.html); le tre voci sono nel menu che compare tenendo premuta l'icona. */
(function () {
  var me = document.currentScript && document.currentScript.src;
  var base = me ? new URL('../', me) : new URL('./', location.href);
  if ('serviceWorker' in navigator) {
    addEventListener('load', function () { navigator.serviceWorker.register(new URL('sw.js', base).href); });
  }
})();
