(function () {
var KEY = 'azael_lang_pref';
function stripIndexHtmlFromUrl() {
if (location.protocol === 'file:') return;
if (!/\/index\.html$/i.test(location.pathname)) return;
var clean = location.pathname.replace(/\/index\.html$/i, '/');
history.replaceState(null, '', clean + location.search + location.hash);
}
function normalizePublicPath(path) {
return path.replace(/\\/g, '/').replace(/\/index\.html$/i, '/');
}
function fixFileProtocolHref(href) {
if (!href || href.charAt(0) === '#') return href;
if (/^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)) return href;
if (/\.html(?:[?#]|$)/i.test(href)) return href;
var hashIdx = href.indexOf('#');
var queryIdx = href.indexOf('?');
var cutIdx = hashIdx >= 0 && queryIdx >= 0 ? Math.min(hashIdx, queryIdx)
: hashIdx >= 0 ? hashIdx : queryIdx >= 0 ? queryIdx : -1;
var pathPart = cutIdx >= 0 ? href.slice(0, cutIdx) : href;
var rest = cutIdx >= 0 ? href.slice(cutIdx) : '';
if (pathPart.charAt(0) === '/') {
var info = liveSegments(location.pathname);
var depth = info ? info.afterLive.length : 0;
var ups = depth ? '../'.repeat(depth) : '';
var rel = pathPart.replace(/^\//, '');
if (!rel) return ups + 'index.html' + rest;
if (rel.endsWith('/')) return ups + rel + 'index.html' + rest;
if (rel.indexOf('.') === -1) return ups + rel + '/index.html' + rest;
return ups + rel + rest;
}
if (/^\.\.(\/\.\.)*\/?$/.test(pathPart)) {
var upsPath = pathPart.replace(/\/?$/, '');
return (upsPath ? upsPath + '/' : '') + 'index.html' + rest;
}
var lastSeg = pathPart.split('/').filter(Boolean).pop() || '';
if (pathPart.endsWith('/') || (lastSeg && lastSeg.indexOf('.') === -1)) {
var base = pathPart.endsWith('/') ? pathPart : pathPart + '/';
return base + 'index.html' + rest;
}
return href;
}
function applyFileProtocolLinks() {
if (location.protocol !== 'file:') return;
document.querySelectorAll('a[href]').forEach(function (link) {
if (link.target && link.target !== '_self') return;
var href = link.getAttribute('href');
if (!href) return;
var fixed = fixFileProtocolHref(href);
if (fixed !== href) link.setAttribute('href', fixed);
});
}
stripIndexHtmlFromUrl();
function isFrPath(path) {
return /(?:^|\/)fr(?:\/|$)/.test(path);
}
function suffix() {
return location.search + location.hash;
}
var FR_SLUG_FROM_EN = {
'certified-translation': 'traduction-certifiee',
'west-africa': 'afrique-de-louest',
'tutoring': 'soutien-scolaire',
'guides/visa-documents': 'guides/documents-visa',
'reviews': 'avis-clients',
'content-translation': 'contenu-web',
'law-firms': 'cabinets-juridiques', 'icao-english': 'anglais-aeronautique',
'interpretation': 'interpretation',
'terms': 'conditions',
'pricing': 'tarifs',
'sitemap': 'plan-du-site',
'contact': 'contact'
};
function enSlugFromFr(frSlug) {
for (var en in FR_SLUG_FROM_EN) {
if (FR_SLUG_FROM_EN[en] === frSlug) return en;
}
return frSlug;
}
function translateSlug(slug, targetLang, sourceIsFr) {
if (targetLang === 'fr') {
if (!sourceIsFr && FR_SLUG_FROM_EN[slug]) return FR_SLUG_FROM_EN[slug];
return slug;
}
if (sourceIsFr) return enSlugFromFr(slug);
return slug;
}
function parseLocalePath(path) {
var normalized = path.replace(/\\/g, '/').replace(/\/index\.html$/i, '/');
var onFr = isFrPath(normalized);
var slug = normalized.replace(/^\/fr\//, '/').replace(/^\/fr$/, '/').replace(/^\//, '').replace(/\/$/, '');
return { onFr: onFr, slug: slug };
}
function formatLocalePath(slug, lang) {
if (lang === 'fr') {
if (!slug) return '/fr/';
return '/fr/' + slug + (slug.indexOf('.html') >= 0 ? '' : '/');
}
if (!slug) return '/';
return '/' + slug + (slug.indexOf('.html') >= 0 ? '' : '/');
}
function localeHrefForPath(path, lang) {
var parsed = parseLocalePath(path);
var normalized = path.replace(/\\/g, '/').replace(/\/index\.html$/i, '/');
if ((lang === 'fr' && parsed.onFr) || (lang === 'en' && !parsed.onFr)) {
return normalized + suffix();
}
var newSlug = translateSlug(parsed.slug, lang, parsed.onFr);
return formatLocalePath(newSlug, lang) + suffix();
}
function savePref(lang) {
try { localStorage.setItem(KEY, lang); } catch (e) {}
}
function getPref() {
try { return localStorage.getItem(KEY); } catch (e) { return null; }
}
function liveSegments(path) {
var segments = path.replace(/\\/g, '/').split('/').filter(Boolean);
var liveIdx = -1;
for (var i = 0; i < segments.length; i++) {
var seg = segments[i].toLowerCase();
if (seg === 'live' || seg === 'deploy-ready') {
liveIdx = i;
break;
}
}
if (liveIdx < 0) return null;
var afterLive = segments.slice(liveIdx + 1);
if (afterLive.length && /^index\.html?$/i.test(afterLive[afterLive.length - 1])) {
afterLive.pop();
}
return { segments: segments, liveIdx: liveIdx, afterLive: afterLive };
}
function fileLocaleHref(lang) {
var info = liveSegments(location.pathname);
if (!info) return null;
var after = info.afterLive.slice();
var onFr = after[0] === 'fr';
if (onFr) after.shift();
var slug = after.join('/');
var newSlug = translateSlug(slug, lang, onFr);
var targetSegs = lang === 'fr'
? ['fr'].concat(newSlug ? newSlug.split('/') : [])
: (newSlug ? newSlug.split('/') : []);
var ups = '../'.repeat(info.afterLive.length);
if (!targetSegs.length) return (ups || './') + 'index.html' + suffix();
return ups + targetSegs.join('/') + '/index.html' + suffix();
}
function httpLocaleHref(lang) {
var path = normalizePublicPath(location.pathname);
var info = liveSegments(path);
if (info) {
var after = info.afterLive.slice();
var onFr = after[0] === 'fr';
if (onFr) after.shift();
var slug = after.join('/');
var newSlug = translateSlug(slug, lang, onFr);
var targetSegs = lang === 'fr'
? ['fr'].concat(newSlug ? newSlug.split('/') : [])
: (newSlug ? newSlug.split('/') : []);
var base = info.segments.slice(0, info.liveIdx + 1);
return '/' + base.concat(targetSegs).join('/') + suffix();
}
return localeHrefForPath(path, lang);
}
function navigateToLocale(lang) {
if (location.protocol === 'file:') {
var rel = fileLocaleHref(lang);
if (rel) {
location.href = rel;
return;
}
return;
}
location.href = httpLocaleHref(lang);
}
function scheduleFileProtocolLinks() {
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', applyFileProtocolLinks);
} else {
applyFileProtocolLinks();
}
}
window.setLang = function (lang) {
if (lang !== 'en' && lang !== 'fr') return;
savePref(lang);
var onFr = isFrPath(location.pathname.replace(/\\/g, '/'));
if (lang === 'fr' && !onFr) navigateToLocale('fr');
else if (lang === 'en' && onFr) navigateToLocale('en');
};
function hideInactiveLocaleMarkup() {
var onFr = isFrPath(location.pathname.replace(/\\/g, '/'));
var hideAttr = onFr ? 'data-en' : 'data-fr';
document.querySelectorAll('[' + hideAttr + ']').forEach(function (el) {
el.setAttribute('hidden', '');
el.setAttribute('aria-hidden', 'true');
});
ensureFooterLocaleVisible();
}
function ensureFooterLocaleVisible() {
var footer = document.getElementById('site-footer');
if (!footer) return;
var onFr = isFrPath(location.pathname.replace(/\\/g, '/'));
var hideAttr = onFr ? 'data-en' : 'data-fr';
footer.classList.remove('service-context-hidden');
footer.querySelectorAll('.af__inner, .af__grid, .af__brand, .af__col, .af__contact, .af__divider').forEach(function (el) {
el.classList.remove('service-context-hidden');
});
footer.querySelectorAll('.af__brand, .af__col, .af__contact').forEach(function (el) {
if (!el.hasAttribute(hideAttr)) {
el.removeAttribute('hidden');
el.removeAttribute('aria-hidden');
}
});
}
function syncFooterLangButtons() {
var onFr = isFrPath(location.pathname.replace(/\\/g, '/'));
var active = onFr ? 'fr' : 'en';
document.querySelectorAll('.af__lang button[data-lang], .ah__lang button[data-lang]').forEach(function (btn) {
btn.classList.toggle('is-active', btn.getAttribute('data-lang') === active);
});
document.querySelectorAll('[data-en-label], [data-fr-label]').forEach(function (el) {
var label = onFr ? el.getAttribute('data-fr-label') : el.getAttribute('data-en-label');
if (label) el.setAttribute('aria-label', label);
});
}
window.ensureFooterLocaleVisible = ensureFooterLocaleVisible;
function markCurrentLangLinks() {
var onFr = isFrPath(location.pathname.replace(/\\/g, '/'));
var current = onFr ? 'fr' : 'en';
document.querySelectorAll('.ah__lang a[data-lang], .af__lang a[data-lang]').forEach(function (a) {
if (a.getAttribute('data-lang') === current) a.setAttribute('aria-current', 'true');
else a.removeAttribute('aria-current');
});
}
document.addEventListener('click', function (e) {
var a = e.target && e.target.closest ? e.target.closest('.ah__lang a[data-lang], .af__lang a[data-lang]') : null;
if (!a) return;
savePref(a.getAttribute('data-lang'));
if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
if (location.protocol === 'file:') return;
var base = a.getAttribute('href');
if (!base || base.indexOf('#') !== -1) return;
var carry = location.search + location.hash;
if (!carry) return;
e.preventDefault();
location.href = base + carry;
});
function onDomReadyLocaleUi() {
hideInactiveLocaleMarkup();
syncFooterLangButtons();
markCurrentLangLinks();
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', onDomReadyLocaleUi);
} else {
onDomReadyLocaleUi();
}
scheduleFileProtocolLinks();
})();