(function () {
  var ID = 'G-VG679828LT';
  var CONSENT_KEY = 'azael_analytics_consent';
  var FALLBACK_MS = 10000;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    wait_for_update: 500
  });
  gtag('config', ID, { send_page_view: false });

  function hasConsent() {
    try { return localStorage.getItem(CONSENT_KEY) === 'granted'; } catch (e) { return false; }
  }

  function loadGA() {
    if (window.__gaLoaded || !hasConsent()) return;
    window.__gaLoaded = true;
    removeListeners();
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
  }

  window.grantAnalyticsConsent = function () {
    try { localStorage.setItem(CONSENT_KEY, 'granted'); } catch (e) {}
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGA();
  };

  function onInteraction() { loadGA(); }

  function removeListeners() {
    var opts = { capture: true };
    ['scroll', 'click', 'keydown', 'touchstart', 'pointerdown'].forEach(function (ev) {
      document.removeEventListener(ev, onInteraction, opts);
    });
  }

  function bindInteractionLoad() {
    if (!hasConsent()) return;
    var opts = { capture: true, passive: true, once: true };
    ['scroll', 'click', 'keydown', 'touchstart', 'pointerdown'].forEach(function (ev) {
      document.addEventListener(ev, onInteraction, opts);
    });
  }

  function scheduleFallback() {
    if (!hasConsent()) return;
    setTimeout(loadGA, FALLBACK_MS);
  }

  if (hasConsent()) {
    bindInteractionLoad();
    if (document.readyState === 'complete') scheduleFallback();
    else window.addEventListener('load', scheduleFallback);
  }
})();
