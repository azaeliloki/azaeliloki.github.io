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
        ? '<p>Mesure d’audience (Google Analytics)&nbsp;: accepter les cookies&nbsp;?</p>'
        : '<p>Allow Google Analytics cookies?</p>') +
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
document.body.style.removeProperty('--cookie-consent-h');
    }
    document.body.classList.add('has-cookie-consent');
/* reserve exactly the banner's height at the end of the page, so it never sits on the last button */
document.body.style.setProperty('--cookie-consent-h', Math.ceil(bar.getBoundingClientRect().height + 24) + 'px');
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

  function initFaq() {
    var all = document.querySelectorAll('.faq-q');
    Array.prototype.forEach.call(all, function (btn, i) {
      var answer = btn.nextElementSibling;
      if (answer && answer.classList.contains('faq-a')) {
        if (!btn.id) btn.id = 'faq-q-' + (i + 1);
        if (!answer.id) answer.id = 'faq-a-' + (i + 1);
        btn.setAttribute('aria-controls', answer.id);
        answer.setAttribute('aria-labelledby', btn.id);
      }
      btn.addEventListener('click', function () {
        var isOpen = btn.classList.contains('open');
        Array.prototype.forEach.call(document.querySelectorAll('.faq-q.open'), function (q) {
          q.classList.remove('open');
          q.setAttribute('aria-expanded', 'false');
          if (q.nextElementSibling) q.nextElementSibling.classList.remove('open');
        });
        if (!isOpen) {
          btn.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          if (answer) answer.classList.add('open');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCookieConsent();
    initFaq();
    var btt = document.getElementById('backToTop');
    if (btt) {
      btt.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
