/*
 * Approximate EUR/USD beside published FCFA prices.
 *
 * Standalone so it can run on pages served the lite bundle (/pricing/, /fr/tarifs/)
 * as well as those served the full script.js. It shares the rate cache written by
 * script.js (azael_fx_rates_v1), so whichever loads first pays for the fetch.
 *
 * Opt in per element: <td data-fcfa="15000">15,000 FCFA / page</td>
 * Degrades silently to FCFA-only when the rate APIs are unreachable.
 */
(function () {
  var CACHE_KEY = 'azael_fx_rates_v1';
  var CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  var EUR_PEG = 655.957; // XOF is pegged to the euro

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.fcfaPerUnit || !(parsed.fcfaPerUnit.USD > 0)) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function fromEurRates(rates, date) {
    var units = { EUR: EUR_PEG };
    if (rates.USD > 0) units.USD = EUR_PEG / rates.USD;
    if (rates.GBP > 0) units.GBP = EUR_PEG / rates.GBP;
    return { fetchedAt: Date.now(), date: date || '', fcfaPerUnit: units };
  }

  function fetchRates() {
    return fetch('https://api.frankfurter.dev/v1/latest?from=EUR&to=USD,GBP')
      .then(function (res) { if (!res.ok) throw new Error('frankfurter'); return res.json(); })
      .then(function (json) { return fromEurRates(json.rates || {}, json.date || ''); })
      .catch(function () {
        return fetch('https://open.er-api.com/v6/latest/EUR')
          .then(function (res) { if (!res.ok) throw new Error('er-api'); return res.json(); })
          .then(function (json) {
            if (json.result !== 'success' || !json.rates) throw new Error('er-api');
            return fromEurRates({ USD: json.rates.USD, GBP: json.rates.GBP },
              String(json.time_last_update_utc || '').slice(0, 10));
          });
      });
  }

  function ready() {
    var cached = readCache();
    if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) return Promise.resolve(cached);
    return fetchRates().then(function (data) { writeCache(data); return data; })
      .catch(function () { return cached; });
  }

  function render() {
    var nodes = document.querySelectorAll('[data-fcfa]');
    if (!nodes.length) return;
    ready().then(function (snap) {
      if (!snap || !snap.fcfaPerUnit) return;
      var eurUnit = snap.fcfaPerUnit.EUR;
      var usdUnit = snap.fcfaPerUnit.USD;
      if (!(eurUnit > 0) || !(usdUnit > 0)) return;
      var isFr = document.documentElement.lang === 'fr';
      var locale = isFr ? 'fr-FR' : 'en-US';
      // Per-word rates convert to well under a unit, so round to cents there
      // rather than showing a useless "0".
      function money(value) {
        var dp = value < 10 ? 2 : 0;
        return value.toLocaleString(locale, { minimumFractionDigits: dp, maximumFractionDigits: dp });
      }

      Array.prototype.forEach.call(nodes, function (el) {
        if (el.querySelector('.fx-approx')) return;
        var fcfa = parseFloat(el.getAttribute('data-fcfa'));
        if (!(fcfa > 0)) return;
        var eur = money(fcfa / eurUnit);
        var usd = money(fcfa / usdUnit);
        var span = document.createElement('span');
        span.className = 'fx-approx';
        span.textContent = isFr
          ? ('≈ ' + eur + ' € · ' + usd + ' $')
          : ('≈ €' + eur + ' · $' + usd);
        el.appendChild(span);
      });
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
