/* App CSAIN Padel Club Cup
   - registra il service worker (serve per installare l'app sul telefono)
   - dentro l'app installata, nelle pagine del sito e nei moduli mostra il pulsante "Menu app" per tornare alle tre voci */
(function () {
  var me = document.currentScript && document.currentScript.src;
  var base = me ? new URL('../', me) : new URL('./', location.href);
  if ('serviceWorker' in navigator) {
    addEventListener('load', function () { navigator.serviceWorker.register(new URL('sw.js', base).href); });
  }
  var inApp = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (!inApp || /\/app\.html$/.test(location.pathname)) return;
  function add() {
    if (document.getElementById('csain-menu-app')) return;
    // Moduli: il pulsante "Torna al sito" in alto diventa "Menu app"
    var back = document.querySelector('a.back');
    if (back) { back.href = new URL('app.html', base).href; back.textContent = 'Menu app'; back.id = 'csain-menu-app'; return; }
    var st = document.createElement('style');
    st.textContent = '#csain-menu-app{position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:9999;display:inline-flex;align-items:center;gap:8px;' +
      'min-height:48px;padding:0 20px 0 16px;border-radius:999px;background:#0B2545;color:#fff !important;text-decoration:none;' +
      "font:600 16px/1 'Barlow',system-ui,sans-serif;box-shadow:0 8px 24px rgba(11,37,69,.3)}" +
      '#csain-menu-app svg{flex:none}body.capturing #csain-menu-app{display:none}@media print{#csain-menu-app{display:none}}';
    document.head.appendChild(st);
    var a = document.createElement('a');
    a.id = 'csain-menu-app';
    a.href = new URL('app.html', base).href;
    a.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4F04A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Menu app';
    document.body.appendChild(a);
  }
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
})();
