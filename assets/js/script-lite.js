/**
 * Lightweight chrome for pages that don't need reviews/funnel/forms.
 * Loaded by privacy.html, fr/privacy.html, and 404.html instead of script.js.
 */
(function () {
  function getBackToTopThreshold() {
    return 500;
  }

  window.addEventListener(
    'scroll',
    function () {
      var nav = document.getElementById('navbar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
      var btt = document.getElementById('backToTop');
      if (btt) btt.classList.toggle('visible', window.scrollY > getBackToTopThreshold());
    },
    { passive: true }
  );

  function initCookieConsent() {
    var KEY = 'azael_analytics_consent';
    if (document.getElementById('cookieConsent') || location.protocol === 'file:') return;
    var stored = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch (e) {}
    if (stored === 'granted' || stored === 'denied') {
      if (stored === 'granted' && typeof window.grantAnalyticsConsent === 'function') {
        window.grantAnalyticsConsent();
      }
      return;
    }
    /* Same deferral as script.js: the banner is fixed to the bottom and 123px
       tall, so at 390x844 it sat on the hero — on /contact/ it covered the
       phone number. Hold it until the visitor is past the first screen. */
    var shown = false;
    var maybeShow = function () {
      if (shown || window.pageYOffset < 400) return;
      shown = true;
      window.removeEventListener('scroll', maybeShow);
      buildCookieConsent(KEY);
    };
    window.addEventListener('scroll', maybeShow, { passive: true });
    maybeShow();
    // A page too short to scroll would never offer consent; test after layout.
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (shown) return;
        if (document.documentElement.scrollHeight - window.innerHeight > 400) return;
        shown = true;
        window.removeEventListener('scroll', maybeShow);
        buildCookieConsent(KEY);
      }, 300);
    });
  }

  function buildCookieConsent(KEY) {
    if (document.getElementById('cookieConsent')) return;
    var isFr = document.body.classList.contains('lang-fr');
    var bar = document.createElement('div');
    bar.id = 'cookieConsent';
    bar.className = 'cookie-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', isFr ? 'Consentement aux cookies' : 'Cookie consent');
    bar.innerHTML =
      (isFr
        ? "<p>Ce site utilise Google Analytics pour mesurer l’audience. Acceptez-vous les cookies analytiques&nbsp;?</p>"
        : '<p>This site uses Google Analytics for audience measurement. Do you accept analytics cookies?</p>') +
      '<div class="cookie-consent__actions">' +
      '<button type="button" class="cookie-consent__accept">' +
      (isFr ? 'Accepter' : 'Accept') +
      '</button>' +
      '<button type="button" class="cookie-consent__decline">' +
      (isFr ? 'Refuser' : 'Decline') +
      '</button>' +
      '</div>';
    document.body.appendChild(bar);
    // Mirrors buildCookieConsent in script.js: the bar is position:fixed at the
    // bottom, so on a phone it sits over whatever is at the foot of the viewport
    // - including the quote form's fields on a #quote-intake landing. Reserve its
    // height so no control ends up permanently underneath it.
    // Mirrors script.js: the reserved height lives in a CSS class, not an inline
    // style, because other code rewrites document.body.style. Static value, not
    // calc() - the minifier strips the whitespace calc() needs around "+".
    function clearConsentOffset() {
      document.body.classList.remove('has-cookie-consent');
    }
    document.body.classList.add('has-cookie-consent');
    bar.querySelector('.cookie-consent__accept').addEventListener('click', function () {
      try {
        localStorage.setItem(KEY, 'granted');
      } catch (e) {}
      if (typeof window.grantAnalyticsConsent === 'function') window.grantAnalyticsConsent();
      clearConsentOffset();
      bar.remove();
    });
    bar.querySelector('.cookie-consent__decline').addEventListener('click', function () {
      try {
        localStorage.setItem(KEY, 'denied');
      } catch (e) {}
      clearConsentOffset();
      bar.remove();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCookieConsent();
    var btt = document.getElementById('backToTop');
    if (btt) {
      btt.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
