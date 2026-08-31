function sanitize(str) {
var d = document.createElement('div');
d.textContent = str || '';
return d.innerHTML;
}
function getLang() {
if (document.body.classList.contains('lang-fr')) return 'fr';
if (document.body.classList.contains('lang-en')) return 'en';
var path = location.pathname.replace(/\\/g, '/');
if (/(?:^|\/)fr(?:\/|$)/.test(path)) return 'fr';
var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
if (htmlLang.indexOf('fr') === 0) return 'fr';
return 'en';
}
function syncBilingualSelectOptions(root, serviceFilter) {
var lang = getLang();
var allowed = serviceFilter && FORM_OPTIONS_FOR[serviceFilter];
(root || document).querySelectorAll('select').forEach(function(select) {
var opts = Array.prototype.slice.call(select.options);
opts.forEach(function(opt) {
if (!opt.hasAttribute('data-en') && !opt.hasAttribute('data-fr')) return;
var optLang = opt.hasAttribute('data-fr') ? 'fr' : 'en';
var langHide = optLang !== lang;
var scopeHide = allowed && opt.value && allowed.indexOf(opt.value) === -1
&& (select.id === 'cf-service' || select.id === 'wr-service' || select.id === 'wr-service-fr');
opt.hidden = langHide || scopeHide;
opt.disabled = langHide || scopeHide;
});
var selected = select.options[select.selectedIndex];
if (selected && !selected.hidden && !selected.disabled) return;
var value = select.value;
var ctx = CF_SERVICE_TO_CTX[value];
if (ctx && REVIEW_SERVICE_FOR[ctx]) {
select.value = REVIEW_SERVICE_FOR[ctx][lang];
return;
}
if (value) {
var fromEn = opts.findIndex(function(o) { return o.value === value && o.hasAttribute('data-en'); });
if (fromEn >= 0) {
for (var j = fromEn + 1; j < opts.length; j++) {
if (opts[j].hasAttribute('data-fr') && lang === 'fr') {
select.value = opts[j].value;
return;
}
}
}
var fromFr = opts.findIndex(function(o) { return o.value === value && o.hasAttribute('data-fr'); });
if (fromFr >= 0) {
for (var k = fromFr - 1; k >= 0; k--) {
if (opts[k].hasAttribute('data-en') && lang === 'en') {
select.value = opts[k].value;
return;
}
}
}
}
for (var i = 0; i < select.options.length; i++) {
var opt = select.options[i];
if (!opt.hidden && !opt.disabled) {
select.selectedIndex = i;
break;
}
}
});
(root || document).querySelectorAll('[data-placeholder-en], [data-placeholder-fr]').forEach(function(input) {
input.placeholder = lang === 'fr'
? (input.getAttribute('data-placeholder-fr') || '')
: (input.getAttribute('data-placeholder-en') || '');
});
}
function prefillContactServiceForContext(service) {
var map = REVIEW_SERVICE_FOR[service];
if (!map) return;
prefillContactService(map[getLang()]);
}
function getBackToTopThreshold() {
return /\/(business|courses)(\/|$)/.test(window.location.pathname) ? 320 : 500;
}
window.addEventListener('scroll', function() {
var nav = document.getElementById('navbar');
if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
var btt = document.getElementById('backToTop');
if (btt) btt.classList.toggle('visible', window.scrollY > getBackToTopThreshold());
}, { passive: true });
function showProcess(service) {
document.querySelectorAll('.proc-tab').forEach(function(tab) {
tab.classList.remove('active');
});
document.querySelectorAll('.proc-panel').forEach(function(panel) {
panel.classList.remove('active');
});
document.querySelectorAll('.proc-tab').forEach(function(tab) {
if (tab.getAttribute('data-service') === service) {
tab.classList.add('active');
}
});
var panel = document.getElementById('proc-' + service);
if (panel) panel.classList.add('active');
}
function toggleFaq(btn) {
var answer = btn.nextElementSibling;
var isOpen = btn.classList.contains('open');
document.querySelectorAll('.faq-q.open').forEach(function(q) {
q.classList.remove('open');
q.setAttribute('aria-expanded', 'false');
if (q.nextElementSibling) q.nextElementSibling.classList.remove('open');
});
if (!isOpen) {
btn.classList.add('open');
btn.setAttribute('aria-expanded', 'true');
if (answer) answer.classList.add('open');
}
}
function togglePayAccordion(btn) {
var body = null;
var block = btn.closest('.payment-block');
if (block) body = block.querySelector('.pay-accordion-body');
if (!body) {
var controlsId = btn.getAttribute('aria-controls');
if (controlsId) body = document.getElementById(controlsId);
}
if (!body) {
body = btn.nextElementSibling;
while (body && !body.classList.contains('pay-accordion-body')) {
body = body.nextElementSibling;
}
}
if (!body) {
var payment = btn.closest('#payment');
if (payment) body = payment.querySelector('.pay-accordion-body');
}
if (!body) return;
var open = btn.classList.toggle('open');
body.classList.toggle('open', open);
btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function initPayAccordions() {
if (document.documentElement.dataset.payAccInit) return;
document.documentElement.dataset.payAccInit = '1';
document.addEventListener('click', function(e) {
var btn = e.target.closest('.pay-accordion-btn');
if (!btn) return;
togglePayAccordion(btn);
});
}
var COURSE_PRICES = {
general: { Online: { 4: 35000, 8: 68000 }, 'In-person': { 4: 45000, 8: 85000 } },
specialized: { Online: { 4: 45000, 8: 85000 }, 'In-person': { 4: 55000, 8: 105000 } }
};
var coursePricingFmt = 'Online';
var coursePricingSess = '4';
var selectedCourseId = 'fle';
var COURSE_FMT_LABEL = { en: { Online: 'Online', 'In-person': 'In person' }, fr: { Online: 'En ligne', 'In-person': 'En présentiel' } };
var COURSE_CATALOG = {
fle: { tier: 'general', en: 'FLE', fr: 'FLE' },
fos: { tier: 'specialized', en: 'FOS', fr: 'FOS' },
'en-general': { tier: 'general', en: 'General English', fr: 'Anglais général' },
'en-business': { tier: 'specialized', en: 'Business English', fr: 'Anglais des affaires' },
esp: { tier: 'specialized', en: 'ESP', fr: 'Anglais de spécialité (ESP)' },
eap: { tier: 'specialized', en: 'EAP', fr: 'Anglais académique (EAP)' }
};
function formatCoursePrice(amount) {
var lang = document.body.classList.contains('lang-fr') ? 'fr' : 'en';
return amount.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US') + ' FCFA';
}
function setSelectedCourseId(id) {
if (!COURSE_CATALOG[id]) return;
selectedCourseId = id;
document.querySelectorAll('.course-card[data-course-id]').forEach(function(card) {
var on = card.getAttribute('data-course-id') === id;
card.classList.toggle('is-selected', on);
if (on) card.setAttribute('aria-current', 'true');
else card.removeAttribute('aria-current');
});
}
function buildCourseAdultPackage() {
var meta = COURSE_CATALOG[selectedCourseId];
if (!meta) return '';
var amount = COURSE_PRICES[meta.tier][coursePricingFmt][coursePricingSess];
var lang = document.body.classList.contains('lang-fr') ? 'fr' : 'en';
var fmtLabel = COURSE_FMT_LABEL[lang][coursePricingFmt] || coursePricingFmt;
var name = meta[lang] || meta.en;
var sessPart = lang === 'fr'
? (coursePricingSess + ' séances/mois')
: (coursePricingSess + ' sessions/mo');
return name + ' · ' + fmtLabel + ' · ' + sessPart + ' · ' + formatCoursePrice(amount) + (lang === 'fr' ? '/mois' : '/mo');
}
function renderCoursePricingCards() {
var hub = document.querySelector('.course-pricing-hub');
if (!hub) return;
var lang = document.body.classList.contains('lang-fr') ? 'fr' : 'en';
var fmtLabel = COURSE_FMT_LABEL[lang][coursePricingFmt] || coursePricingFmt;
hub.querySelectorAll('.course-card').forEach(function(card) {
var tier = card.getAttribute('data-tier');
var priceEl = card.querySelector('.price');
var permoEl = card.querySelector('.permo');
if (!tier || !priceEl || !COURSE_PRICES[tier]) return;
var amount = COURSE_PRICES[tier][coursePricingFmt][coursePricingSess];
priceEl.textContent = formatCoursePrice(amount);
if (permoEl) {
permoEl.textContent = lang === 'fr'
? ('par mois · ' + fmtLabel + ' · ' + coursePricingSess + ' séances')
: ('per month · ' + fmtLabel + ' · ' + coursePricingSess + ' sessions');
}
});
}
function setCoursePricingFmt(fmt, btn) {
coursePricingFmt = fmt;
document.querySelectorAll('[data-course-fmt]').forEach(function(b) {
var on = b.getAttribute('data-course-fmt') === fmt;
b.classList.toggle('active', on);
b.setAttribute('aria-pressed', on ? 'true' : 'false');
});
renderCoursePricingCards();
}
function setCoursePricingSess(sess, btn) {
coursePricingSess = sess;
document.querySelectorAll('[data-course-sess]').forEach(function(b) {
var on = b.getAttribute('data-course-sess') === sess;
b.classList.toggle('active', on);
b.setAttribute('aria-pressed', on ? 'true' : 'false');
});
renderCoursePricingCards();
}
function initCoursePricingHub() {
var hub = document.querySelector('.course-pricing-hub');
if (!hub) return;
document.querySelectorAll('[data-course-fmt]').forEach(function(btn) {
btn.addEventListener('click', function(e) {
setCoursePricingFmt(btn.getAttribute('data-course-fmt'), btn);
});








});
document.querySelectorAll('[data-course-sess]').forEach(function(btn) {
btn.addEventListener('click', function(e) {
setCoursePricingSess(btn.getAttribute('data-course-sess'), btn);
});
});
hub.querySelectorAll('.course-card[data-course-id]').forEach(function(card) {
card.addEventListener('click', function(e) {
if (e.target.closest('.course-card-enrol')) return;
var id = card.getAttribute('data-course-id');
if (id) setSelectedCourseId(id);
});
});
setSelectedCourseId(selectedCourseId);
renderCoursePricingCards();
}
var retainerPricingFmt = 'Online';
var RETAINER_PRICES = { Online: 135000, 'In-person': 165000 };
function setRetainerPricingFmt(fmt) {
retainerPricingFmt = fmt;
document.querySelectorAll('#svc-retainer [data-retainer-fmt]').forEach(function(b) {
var on = b.getAttribute('data-retainer-fmt') === fmt;
b.classList.toggle('active', on);
b.setAttribute('aria-pressed', on ? 'true' : 'false');
});
renderRetainerPrice();
}
function renderRetainerPrice() {
var card = document.getElementById('svc-retainer');
if (!card) return;
var amount = RETAINER_PRICES[retainerPricingFmt];
var amountEl = card.querySelector('.retainer-price-amount');
if (amountEl) amountEl.textContent = formatCoursePrice(amount);
}
function buildRetainerPackage() {
var lang = document.body.classList.contains('lang-fr') ? 'fr' : 'en';
var name = lang === 'fr' ? 'Forfait professionnel' : 'Professional Retainer';
var fmtLabel = COURSE_FMT_LABEL[lang][retainerPricingFmt] || retainerPricingFmt;
var amount = RETAINER_PRICES[retainerPricingFmt];
var sessPart = lang === 'fr' ? '8 séances/mois' : '8 sessions/mo';
return name + ' · ' + fmtLabel + ' · ' + sessPart + ' · ' + formatCoursePrice(amount) + (lang === 'fr' ? '/mois' : '/mo');
}
function initRetainerPricing() {
var card = document.getElementById('svc-retainer');
if (!card) return;
card.querySelectorAll('[data-retainer-fmt]').forEach(function(btn) {
btn.addEventListener('click', function(e) {
setRetainerPricingFmt(btn.getAttribute('data-retainer-fmt'));
});
});
renderRetainerPrice();
}
function setFreq(freq) {
document.querySelectorAll('.freq-btn').forEach(function(b) {
b.classList.toggle('active', b.getAttribute('data-freq') === String(freq));
});
document.querySelectorAll('.ct-price').forEach(function(p) {
p.classList.toggle('active', p.getAttribute('data-freq') === String(freq));
});
document.querySelectorAll('.matrix-price').forEach(function(p) {
p.classList.toggle('active', p.getAttribute('data-freq') === String(freq));
});
document.querySelectorAll('.matrix-freq-label').forEach(function(l) {
l.classList.toggle('active', l.getAttribute('data-freq') === String(freq));
});
}
function togglePolicy(btn) {
var body = btn.nextElementSibling;
var isOpen = btn.classList.contains('open');
document.querySelectorAll('.policy-btn.open').forEach(function(b) {
b.classList.remove('open');
if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
});
if (!isOpen) {
btn.classList.add('open');
if (body) body.classList.add('open');
}
}
function starsHTML(n) {
var stars = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}
var REVIEWS_TEASER_HOME = 0;
var REVIEWS_TEASER_SERVICE = 3;
var REVIEWS_BROWSE_PAGE_SIZE = 12;
var browseReviewsSource = [];
var browseReviewsAll = [];
var browseReviewsShown = 0;
var browseActiveFilter = 'all';
var browseSortMode = 'recent';
function compareReviewsForDisplay(a, b, preferFeatured) {
if (preferFeatured) {
var af = a && a.featured ? 1 : 0;
var bf = b && b.featured ? 1 : 0;
if (bf !== af) return bf - af;
}
var as = Number(a && a.stars) || 0;
var bs = Number(b && b.stars) || 0;
if (bs !== as) return bs - as;
var ad = (a && (a.review_date || a.created_at)) || '';
var bd = (b && (b.review_date || b.created_at)) || '';
return String(bd).localeCompare(String(ad));
}
var SERVICE_LABEL_FR = {
'Certified Translation': 'Traduction certifiée',
'General Translation': 'Traduction générale',
'Web Content & SEO': 'Contenu web & SEO',
'Language Courses': 'Cours de langues',
'Academic Tutoring': 'Soutien scolaire',
'Corporate Training': 'Formation entreprise',
'Interpretation': 'Interprétation',
'Law Firms': 'Cabinets juridiques',
'Professional Retainer': 'Forfait professionnel',
'Transcription': 'Transcription',
'Aviation English (ICAO)': 'Anglais aéronautique (OACI)'
};
var SERVICE_LABEL_EN = {};
for (var k in SERVICE_LABEL_FR) { SERVICE_LABEL_EN[SERVICE_LABEL_FR[k]] = k; }
function localiseService(name) {
if (!name) return '';
var fr = document.body.classList.contains('lang-fr');
if (fr) return SERVICE_LABEL_FR[name] || name;
return SERVICE_LABEL_EN[name] || name;
}
function buildReviewCardHTML(r, showService) {
var svc = showService && r.service
? '<span class="rv-service">' + sanitize(localiseService(r.service)) + '</span>'
: '';
var sourceBadge = r.source === 'google'
? '<a class="rv-source" href="https://maps.app.goo.gl/rxfDgnqqEwygiFPv6" target="_blank" rel="noopener noreferrer">Google</a>'
: '';
var isFr = document.body.classList.contains('lang-fr');
var open = isFr ? '« ' : '“';
var close = isFr ? ' »' : '”';
return '<div class="review-card">'
+ '<div class="rv-stars">' + starsHTML(r.stars) + svc + sourceBadge + '</div>'
+ '<p class="rv-text">' + open + sanitize(r.text) + close + '</p>'
+ '<p class="rv-author">— ' + sanitize(r.author) + '</p>'
+ '</div>';
}
function getReviewsBrowseBaseHref() {
return document.body.classList.contains('lang-fr') ? '/fr/avis-clients/' : '/reviews/';
}
function getReviewsSeeAllHref(serviceContexts) {
var href = getReviewsBrowseBaseHref();
if (!serviceContexts || !serviceContexts.length) return href;
if (serviceContexts.length === 1) return href + '?service=' + encodeURIComponent(serviceContexts[0]);
if (serviceContexts.length === 2
&& serviceContexts.indexOf('general') !== -1
&& serviceContexts.indexOf('training') !== -1) {
return href + '?service=business';
}
return href;
}
function updateSeeAllReviewsLink(totalCount, teaserLimit, serviceContexts) {
var section = getReviewsSection();
if (!section) return;
var wrap = section.querySelector('#reviewsSeeAll');
if (!wrap) {
wrap = document.createElement('p');
wrap.id = 'reviewsSeeAll';
wrap.className = 'reviews-see-all';
wrap.innerHTML = '<a class="reviews-see-all-link" href="#" data-en></a><a class="reviews-see-all-link" href="#" data-fr></a>';
var grid = section.querySelector('#reviewsGrid');
if (grid && grid.parentNode) grid.parentNode.insertBefore(wrap, grid.nextSibling);
}
if (!wrap || totalCount <= teaserLimit) {
if (wrap) wrap.setAttribute('hidden', '');
return;
}
var href = getReviewsSeeAllHref(serviceContexts);
wrap.querySelectorAll('.reviews-see-all-link').forEach(function(a) {
a.setAttribute('href', href);
});
var en = wrap.querySelector('[data-en]');
var fr = wrap.querySelector('[data-fr]');
if (en) en.textContent = 'See all ' + totalCount + ' reviews →';
if (fr) fr.textContent = 'Voir les ' + totalCount + ' avis →';
wrap.removeAttribute('hidden');
}
function getBrowseFilterContexts(filter) {
if (!filter || filter === 'all') return null;
if (filter === 'business') return ['general', 'training'];
var valid = ['sworn', 'tutoring', 'courses', 'content', 'interpretation'];
if (valid.indexOf(filter) !== -1) return [filter];
return null;
}

function pruneEmptyBrowseFilters() {
var group = document.getElementById('reviewsBrowseFilters');
if (!group) return;
group.querySelectorAll('.reviews-filter-btn').forEach(function (btn) {
var filter = btn.getAttribute('data-filter');
if (!filter || filter === 'all') return;
var contexts = getBrowseFilterContexts(filter);
var has = contexts && browseReviewsSource.some(function (r) {
return reviewMatchesAnyServiceContext(r, contexts);
});
if (has) { btn.removeAttribute('hidden'); return; }
btn.setAttribute('hidden', '');
if (browseActiveFilter === filter) browseActiveFilter = 'all';
});
}
function getBrowseFilterFromQuery() {
try {
var param = new URLSearchParams(location.search).get('service');
if (!param) return 'all';
if (param === 'business') return 'business';
if (param === 'general' || param === 'training') return 'business';
var valid = ['sworn', 'tutoring', 'courses', 'content', 'interpretation', 'all'];
if (valid.indexOf(param) !== -1) return param;
} catch (e) {}
return 'all';
}
function getReviewServiceContextsFromQuery() {
return getBrowseFilterContexts(getBrowseFilterFromQuery());
}
function sortReviewsList(reviews, sortMode) {
var list = reviews.slice();
list.sort(function(a, b) {
if (sortMode === 'rating') {
var bs = Number(b && b.stars) || 0;
var as = Number(a && a.stars) || 0;
if (bs !== as) return bs - as;
}
var ad = (a && (a.review_date || a.created_at)) || '';
var bd = (b && (b.review_date || b.created_at)) || '';
return String(bd).localeCompare(String(ad));
});
return list;
}
function syncBrowseFilterUrl(filter) {
try {
var url = new URL(location.href);
if (!filter || filter === 'all') url.searchParams.delete('service');
else url.searchParams.set('service', filter);
history.replaceState(null, '', url.pathname + url.search + url.hash);
} catch (e) {}
}
function updateBrowseAggregateSchema(reviews) {

}
async function fetchAllReviews() {
if (cachedReviewsData) return cachedReviewsData;
var client = typeof getSupabaseClient === 'function' ? await getSupabaseClient() : null;
if (!client) return [];
const { data: reviews, error } = await client
.from('Reviews')
.select('*')
.eq('approved', true)
.order('created_at', { ascending: false })
.limit(100);
if (error) throw error;
cachedReviewsData = reviews || [];
return cachedReviewsData;
}
function invalidateReviewsCache() {
cachedReviewsData = null;
}
function getReviewServiceContexts() {
if (isHomePage()) return null;
if (document.body.classList.contains('page-certified')) return ['sworn'];
if (document.body.classList.contains('page-tutoring')) return ['tutoring'];
if (document.body.classList.contains('page-transcription')) return ['transcription'];
if (document.body.classList.contains('page-icao')) return ['icao'];
if (document.body.classList.contains('page-law-firms') || document.body.classList.contains('page-cabinets-juridiques')) return ['lawfirms'];
if (document.body.classList.contains('page-content-translation') || document.body.classList.contains('page-contenu-web')) return ['content'];
if (document.body.classList.contains('page-interpretation')) return ['interpretation'];
var pageKind = getPageKind();
if (!pageKind) return [];
var active = resolveActiveService();
if (active && PAGE_SERVICES[pageKind].indexOf(active) !== -1) return [active];
return PAGE_SERVICES[pageKind].slice();
}
function reviewMatchesAnyServiceContext(review, contexts) {
if (!contexts || !contexts.length) return false;
for (var i = 0; i < contexts.length; i++) {
if (reviewMatchesServiceContext(review, contexts[i])) return true;
}
return false;
}
function reviewMatchesServiceContext(review, serviceCtx) {
if (!serviceCtx) return true;
if (!review || !review.service) return false;
var allowed = FORM_OPTIONS_FOR[serviceCtx];
if (!allowed) return false;
return allowed.indexOf(review.service) !== -1;
}
var homeSiteReviewsReady = false;
function getReviewsSection() {
return document.getElementById('reviews');
}
function setReviewsModuleVisible(visible) {
var section = getReviewsSection();
if (!section) return;
if (!visible && section.querySelector('.review-card')) return;
section.classList.toggle('reviews--has-reviews', visible);
section.classList.remove('reviews--placeholder');
if (visible) section.removeAttribute('hidden');
else section.setAttribute('hidden', '');
}
function updateHomeReviewsVisibility() {
setReviewsModuleVisible(homeSiteReviewsReady);
}
function observeReviewsSection(onVisible) {
var section = getReviewsSection();
var observeTarget = section;
if (isHomePage()) {
observeTarget = document.querySelector('.home-about') || section;
}
if (!observeTarget) return;
if (!('IntersectionObserver' in window)) {
onVisible();
return;
}
var io = new IntersectionObserver(function(entries) {
if (entries.some(function(e) { return e.isIntersecting; })) {
io.disconnect();
onVisible();
}
}, { rootMargin: '300px' });
io.observe(observeTarget);
}
var supabaseClientScriptPromise = null;
function ensureSupabaseClientScript() {
if (typeof getSupabaseClient === 'function') return Promise.resolve();
if (supabaseClientScriptPromise) return supabaseClientScriptPromise;
supabaseClientScriptPromise = new Promise(function(resolve, reject) {
var existing = document.querySelector('script[src*="supabase-client.js"]');
if (existing) {
if (existing.dataset.loaded === '1') { resolve(); return; }
existing.addEventListener('load', function() { existing.dataset.loaded = '1'; resolve(); }, { once: true });
existing.addEventListener('error', reject, { once: true });
return;
}
var script = document.createElement('script');
script.src = '/assets/js/supabase-client.js';
script.defer = true;
script.addEventListener('load', function() { script.dataset.loaded = '1'; resolve(); }, { once: true });
script.addEventListener('error', reject, { once: true });
document.body.appendChild(script);
});
return supabaseClientScriptPromise;
}
window.setReviewsModuleVisible = setReviewsModuleVisible;
var renderReviewsPending = false;
var reviewsSupabaseRequested = false;
var reviewsObserveBound = false;
function shouldDeferReviewsLoad() {
return isHomePage();
}
function bindReviewsDeferredLoad() {
if (reviewsSupabaseRequested || reviewsObserveBound) return;
reviewsObserveBound = true;
observeReviewsSection(startReviewsSupabaseLoad);
}
function queueRenderReviews() {
if (!document.getElementById('reviewsGrid')) return;
if (renderReviewsPending) return;
renderReviewsPending = true;
ensureSupabaseClientScript().then(function () {
if (typeof preloadSupabase === 'function') preloadSupabase();
return renderReviews();
}).catch(function () {
reviewsSupabaseRequested = false;
}).finally(function () { renderReviewsPending = false; });
}
function requestReviewsRender() {
if (!document.getElementById('reviewsGrid')) return;
var section = getReviewsSection();
if (section && section.classList.contains('service-context-hidden')) return;
if (shouldDeferReviewsLoad()) {
bindReviewsDeferredLoad();
return;
}
startReviewsSupabaseLoad();
}
function initAnalyticsClickTracking() {
document.addEventListener('click', function(e) {
var cal = e.target.closest('a[href*="calendly.com"]');
if (cal) trackEvent('calendly_click', (cal.getAttribute('href') || '').split('/').pop || 'consultation');
var review = e.target.closest('.google-review-btn, .review-site-btn');
if (review) trackEvent('google_review_click', review.classList.contains('google-review-btn--lead') ? 'lead_cta' : 'footer_cta');
}, true);
}
function initCookieConsent() {
var KEY = 'azael_analytics_consent';
if (document.getElementById('cookieConsent') || location.protocol === 'file:') return;
var stored = null;
try { stored = localStorage.getItem(KEY); } catch (e) {}
if (stored === 'granted' || stored === 'denied') {
if (stored === 'granted' && typeof window.grantAnalyticsConsent === 'function') window.grantAnalyticsConsent();
return;
}

var shown = false;
var maybeShow = function () {
if (shown || window.pageYOffset < 400) return;
shown = true;
window.removeEventListener('scroll', maybeShow);
buildCookieConsent(KEY);
};
window.addEventListener('scroll', maybeShow, { passive: true });
maybeShow();

window.addEventListener('load', function () {
setTimeout(function () {
if (shown) return;
if ((document.documentElement.scrollHeight - window.innerHeight) > 400) return;
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
bar.innerHTML = (isFr
? '<p>Ce site utilise Google Analytics pour mesurer l’audience. Acceptez-vous les cookies analytiques&nbsp;?</p>'
: '<p>This site uses Google Analytics for audience measurement. Do you accept analytics cookies?</p>')
+ '<div class="cookie-consent__actions">'
+ '<button type="button" class="cookie-consent__accept">' + (isFr ? 'Accepter' : 'Accept') + '</button>'
+ '<button type="button" class="cookie-consent__decline">' + (isFr ? 'Refuser' : 'Decline') + '</button>'
+ '</div>';
document.body.appendChild(bar);
function clearConsentOffset() {
document.body.classList.remove('has-cookie-consent');
}
document.body.classList.add('has-cookie-consent');
bar.querySelector('.cookie-consent__accept').addEventListener('click', function() {
try { localStorage.setItem(KEY, 'granted'); } catch (e) {}
if (typeof window.grantAnalyticsConsent === 'function') window.grantAnalyticsConsent();
clearConsentOffset();
bar.remove();
});
bar.querySelector('.cookie-consent__decline').addEventListener('click', function() {
try { localStorage.setItem(KEY, 'denied'); } catch (e) {}
clearConsentOffset();
bar.remove();
});
}
function syncModalAriaLabels() {
var isFr = document.body.classList.contains('lang-fr');
document.querySelectorAll('[data-en-aria][data-fr-aria]').forEach(function(el) {
el.setAttribute('aria-label', isFr ? el.getAttribute('data-fr-aria') : el.getAttribute('data-en-aria'));
});
}
function startReviewsSupabaseLoad() {
if (reviewsSupabaseRequested) return;
reviewsSupabaseRequested = true;

var grid = document.getElementById('reviewsGrid');
var hasPrerendered = !!(grid && grid.querySelector('.review-card'));
if (isHomePage()) {
homeSiteReviewsReady = hasPrerendered;
updateHomeReviewsVisibility();
} else {
setReviewsModuleVisible(hasPrerendered);
}
}
function initReviewsLazyLoad() {
var grid = document.getElementById('reviewsGrid');
if (!grid) return;
homeSiteReviewsReady = false;
if (isHomePage()) setReviewsModuleVisible(false);
document.querySelectorAll('.review-form-wrap input, .review-form-wrap textarea, .review-form-wrap select, .wr-submit').forEach(function (el) {
el.addEventListener('focus', function () {
startReviewsSupabaseLoad();
}, { once: true, passive: true });
});
if (shouldDeferReviewsLoad()) bindReviewsDeferredLoad();
else {
var section = getReviewsSection();
if (!section || !section.classList.contains('service-context-hidden')) startReviewsSupabaseLoad();
}
}
function updateBrowseStats(count) {
var el = document.getElementById('reviewsBrowseStats');
if (!el) return;
if (!count) {
el.setAttribute('hidden', '');
el.textContent = '';
return;
}
var sum = browseReviewsAll.reduce(function(s, r) { return s + (Number(r.stars) || 0); }, 0);
var avg = (sum / count).toFixed(1);
el.innerHTML = '<span data-en>' + avg + ' ★ · ' + count + ' reviews</span><span data-fr>' + avg.replace('.', ',') + ' ★ · ' + count + ' avis</span>';
el.removeAttribute('hidden');
}
function setBrowseFilterActive(filter) {
browseActiveFilter = filter || 'all';
document.querySelectorAll('.reviews-filter-btn').forEach(function(btn) {
btn.classList.toggle('active', btn.getAttribute('data-filter') === browseActiveFilter);
});
syncBrowseFilterUrl(browseActiveFilter);
}
function applyBrowseView() {
var grid = document.getElementById('reviewsBrowseGrid');
var empty = document.getElementById('reviewsBrowseEmpty');
var contexts = getBrowseFilterContexts(browseActiveFilter);
var reviews = browseReviewsSource.slice();
if (contexts && contexts.length) {
reviews = reviews.filter(function(r) { return reviewMatchesAnyServiceContext(r, contexts); });
}
browseReviewsAll = sortReviewsList(reviews, browseSortMode);
browseReviewsShown = 0;
if (grid) grid.innerHTML = '';
updateBrowseStats(browseReviewsAll.length);
if (empty) {
if (browseReviewsAll.length) empty.setAttribute('hidden', '');
else empty.removeAttribute('hidden');
}
if (!browseReviewsAll.length) {
var btn = document.getElementById('reviewsBrowseMore');
if (btn) btn.setAttribute('hidden', '');
return;
}
renderBrowseChunk();
}
function renderBrowseChunk() {
var grid = document.getElementById('reviewsBrowseGrid');
if (!grid) return;
var next = browseReviewsAll.slice(browseReviewsShown, browseReviewsShown + REVIEWS_BROWSE_PAGE_SIZE);
browseReviewsShown += next.length;
var html = '';
next.forEach(function(r) {
html += buildReviewCardHTML(r, true);
});
grid.insertAdjacentHTML('beforeend', html);
var btn = document.getElementById('reviewsBrowseMore');
if (!btn) return;
if (browseReviewsShown < browseReviewsAll.length) btn.removeAttribute('hidden');
else btn.setAttribute('hidden', '');
}
function wireBrowseLoadMore() {
var btn = document.getElementById('reviewsBrowseMore');
if (!btn || btn.dataset.wired === '1') return;
btn.dataset.wired = '1';
btn.addEventListener('click', function(e) {
renderBrowseChunk();
});
}
function wireBrowseFilters() {
var group = document.getElementById('reviewsBrowseFilters');
if (!group || group.dataset.wired === '1') return;
group.dataset.wired = '1';
var isFr = document.body.classList.contains('lang-fr');
if (group.hasAttribute('data-en-aria')) {
group.setAttribute('aria-label', isFr ? group.getAttribute('data-fr-aria') : group.getAttribute('data-en-aria'));
}
group.querySelectorAll('.reviews-filter-btn').forEach(function(btn) {
btn.addEventListener('click', function(e) {
setBrowseFilterActive(btn.getAttribute('data-filter'));
applyBrowseView();
});
});
var sort = document.getElementById('reviewsBrowseSort');
if (sort && sort.dataset.wired !== '1') {
sort.dataset.wired = '1';
syncBilingualSelectOptions(document);
var visible = Array.prototype.slice.call(sort.options).filter(function(opt) {
return !opt.hidden && !opt.disabled;
});
if (visible.length) sort.value = visible[0].value;
browseSortMode = sort.value || 'recent';
sort.addEventListener('change', function() {
browseSortMode = sort.value || 'recent';
applyBrowseView();
});
}
}
async function initReviewsBrowsePage() {
var grid = document.getElementById('reviewsBrowseGrid');
if (!grid) return;
await ensureSupabaseClientScript();
if (typeof preloadSupabase === 'function') preloadSupabase();
var client = typeof getSupabaseClient === 'function' ? await getSupabaseClient() : null;
if (!client) return;
try {
browseActiveFilter = getBrowseFilterFromQuery();
browseSortMode = 'recent';
var allReviews = await fetchAllReviews();
browseReviewsSource = allReviews.slice();
updateBrowseAggregateSchema(browseReviewsSource);
pruneEmptyBrowseFilters();
setBrowseFilterActive(browseActiveFilter);
wireBrowseFilters();
applyBrowseView();
wireBrowseLoadMore();
} catch (e) {
console.error('Supabase browse load error:', e);
}
}
async function renderReviews() {
var grid = document.getElementById('reviewsGrid');
if (!grid) return;
var onHome = isHomePage();
var client = typeof getSupabaseClient === 'function' ? await getSupabaseClient() : null;
if (!client) {
var kept = !!grid.querySelector('.review-card');
if (onHome) {
homeSiteReviewsReady = kept;
updateHomeReviewsVisibility();
} else {
setReviewsModuleVisible(kept);
}
return;
}
try {
var serviceContexts = onHome ? null : getReviewServiceContexts();
var allReviews = await fetchAllReviews();
var reviews;
if (onHome) {
reviews = allReviews.slice();
} else if (serviceContexts && serviceContexts.length) {
reviews = allReviews.filter(function(r) { return reviewMatchesAnyServiceContext(r, serviceContexts); });
} else {
reviews = [];
}
if (!reviews.length) {
grid.innerHTML = '';
updateSeeAllReviewsLink(0, 0, serviceContexts);
if (onHome) {
homeSiteReviewsReady = false;
updateHomeReviewsVisibility();
} else {
setReviewsModuleVisible(false);
}
return;
}
reviews.sort(function(a, b) { return compareReviewsForDisplay(a, b, onHome); });
var totalCount = reviews.length;
var teaserLimit = onHome ? REVIEWS_TEASER_HOME : REVIEWS_TEASER_SERVICE;
var displayReviews = teaserLimit > 0 ? reviews.slice(0, teaserLimit) : reviews.slice();
if (onHome) {
homeSiteReviewsReady = true;
updateHomeReviewsVisibility();
} else {
setReviewsModuleVisible(true);
}
document.querySelectorAll('.reviews-subtitle').forEach(function(el) {
el.style.display = '';
});
var html = '';
displayReviews.forEach(function(r) {
html += buildReviewCardHTML(r, onHome);
});
grid.innerHTML = html;
updateSeeAllReviewsLink(totalCount, displayReviews.length, serviceContexts);
} catch(e) {
console.error("Supabase load error:", e);
if (onHome) {
homeSiteReviewsReady = false;
updateHomeReviewsVisibility();
} else {
setReviewsModuleVisible(false);
}
}
}
var cachedReviewsData = null;
var selectedStars = 0;
function initStarA11y() {
var fr = document.body.classList.contains('lang-fr');
document.querySelectorAll('.star-btn').forEach(function(btn, i) {
var n = i + 1;
btn.setAttribute('aria-label', fr ? ('Noter ' + n + ' sur 5') : ('Rate ' + n + ' out of 5 stars'));
if (!btn.querySelector('[aria-hidden="true"]')) {
var glyph = (btn.textContent || '★').trim();
btn.textContent = '';
var span = document.createElement('span');
span.setAttribute('aria-hidden', 'true');
span.textContent = glyph || '★';
btn.appendChild(span);
}
});
}
function setStars(n) {
selectedStars = n;
document.querySelectorAll('.star-btn').forEach(function(btn, i) {
btn.classList.toggle('active', i < n);
});
}
var modalFocusReturn = null;
var modalFocusTrapHandler = null;
function getModalFocusables(modal) {
if (!modal) return [];
return Array.prototype.slice.call(
modal.querySelectorAll('a[href], button:not([disabled]), textarea, input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
).filter(function(el) {
return el.offsetParent !== null || el === document.activeElement;
});
}
function trapModalFocus(modal) {
if (!modal || modalFocusTrapHandler) return;
modalFocusTrapHandler = function(e) {
if (!modal.classList.contains('open')) return;
if (e.key === 'Escape') {
if (modal.id === 'enrolTermsModal') closeEnrolTermsModal();
else if (modal.id === 'thankYouModal') closeReviewModal();
else if (modal.id === 'estimateResultModal') closeEstimateResultModal();
return;
}
if (e.key !== 'Tab') return;
var focusables = getModalFocusables(modal);
if (!focusables.length) return;
var first = focusables[0];
var last = focusables[focusables.length - 1];
if (e.shiftKey && document.activeElement === first) {
e.preventDefault();
last.focus();
} else if (!e.shiftKey && document.activeElement === last) {
e.preventDefault();
first.focus();
}
};
modal.addEventListener('keydown', modalFocusTrapHandler);
}
function releaseModalFocusTrap(modal) {
if (!modal || !modalFocusTrapHandler) return;
modal.removeEventListener('keydown', modalFocusTrapHandler);
modalFocusTrapHandler = null;
}
function openAccessibleModal(modal, trigger) {
if (!modal) return;
modalFocusReturn = trigger || document.activeElement;
modal.removeAttribute('hidden');
modal.classList.add('open');
document.body.style.overflow = 'hidden';
var focusables = getModalFocusables(modal);
var initial = modal.querySelector('[data-modal-initial-focus]') || focusables[0];
if (initial) initial.focus();
trapModalFocus(modal);
}
function closeAccessibleModal(modal) {
if (!modal) return;
modal.classList.remove('open');
modal.setAttribute('hidden', '');
releaseModalFocusTrap(modal);
document.body.style.overflow = '';
if (modalFocusReturn && typeof modalFocusReturn.focus === 'function') {
modalFocusReturn.focus();
}
modalFocusReturn = null;
}
function wireThankYouModal(modal) {
if (!modal || modal.getAttribute('data-wired') === 'true') return;
modal.setAttribute('data-wired', 'true');
var closeX = modal.querySelector('#modalClose');
var closeBtn = modal.querySelector('#modalCloseBtn');
if (closeX) closeX.addEventListener('click', closeReviewModal);
if (closeBtn) {
closeBtn.addEventListener('click', function() {
var reviewPage = /\/review(\/|$)/.test(window.location.pathname);
closeReviewModal();
if (reviewPage) window.location.href = '../';
});
}
modal.addEventListener('click', function(e) {
if (e.target === modal) closeReviewModal();
});
}
function createThankYouModal() {
var existing = document.getElementById('thankYouModal');
if (existing) return existing;
var reviewPage = /\/review(\/|$)/.test(window.location.pathname);
var modal = document.createElement('div');
modal.className = 'modal-overlay';
modal.id = 'thankYouModal';
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-labelledby', 'thankYouModalTitle');
modal.setAttribute('data-dynamic', 'true');
modal.setAttribute('hidden', '');
modal.innerHTML = '<div class="modal-box">'
+ '<button type="button" class="modal-x" id="modalClose" data-modal-initial-focus data-en-aria="Close" data-fr-aria="Fermer" aria-label="Close">&times;</button>'
+ '<div class="modal-icon" aria-hidden="true">★</div>'
+ '<div class="modal-stars" aria-hidden="true">★★★★★</div>'
+ '<h2 class="modal-title" id="thankYouModalTitle">'
+ '<span data-en>Thank You!</span><span data-fr>Merci&nbsp;!</span></h2>'
+ '<p class="modal-body" data-en>Your review has been received and will appear after approval. Thank you for helping others find a trusted language expert.</p>'
+ '<p class="modal-body" data-fr>Votre avis a bien été reçu et sera publié après validation. Merci d’aider d’autres personnes à trouver un expert linguistique de confiance.</p>'
+ '<button type="button" class="modal-close" id="modalCloseBtn">'
+ (reviewPage
? '<span data-en>Back to Homepage →</span><span data-fr>Retour à l’accueil →</span>'
: '<span data-en>Close →</span><span data-fr>Fermer →</span>')
+ '</button></div>';
document.body.appendChild(modal);
wireThankYouModal(modal);
return modal;
}
function openThankYouModal(trigger) {
var modal = createThankYouModal();
openAccessibleModal(modal, trigger || document.activeElement);
}
function closeReviewModal() {
var modal = document.getElementById('thankYouModal');
if (!modal) return;
closeAccessibleModal(modal);
if (modal.getAttribute('data-dynamic') === 'true') modal.remove();
}
window.openThankYouModal = openThankYouModal;
window.closeThankYouModal = closeReviewModal;
async function submitReview() {
var lang = getLang();
var authorEl = lang === 'fr' ? document.getElementById('wr-author-fr') : document.getElementById('wr-author');
var serviceEl = lang === 'fr' ? document.getElementById('wr-service-fr') : document.getElementById('wr-service');
var textEl = lang === 'fr' ? document.getElementById('wr-text-fr') : document.getElementById('wr-text');
if (!authorEl || !textEl) return;
var author = authorEl.value.trim();
var service = serviceEl ? serviceEl.value.trim() : '';
var text = textEl.value.trim();
if (!author || !text || !selectedStars) {
alert(lang === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please fill in all fields.');
return;
}
var client = typeof getSupabaseClient === 'function' ? await getSupabaseClient() : null;
if (!client) {
alert(lang === 'fr' ? 'Service indisponible.' : 'Review service unavailable.');
return;
}
try {
var row = { author: author, text: text, stars: selectedStars, approved: false, source: 'site' };
if (service) row.service = service;
const { error } = await client
.from('Reviews')
.insert([row]);
if (error) throw error;
notifyAdminNewReview({ author: author, text: text, stars: selectedStars, service: service });
authorEl.value = '';
if (serviceEl) serviceEl.value = '';
textEl.value = '';
selectedStars = 0;
document.querySelectorAll('.star-btn').forEach(function(b) { b.classList.remove('active'); });
openThankYouModal(document.activeElement);
} catch(e) {
console.error("Supabase save error:", e);
alert(lang === 'fr' ? "Erreur lors de l'enregistrement de l'avis." : "Error saving your review.");
}
}
var WEB3FORMS_ACCESS_KEY = '39964717-2125-43c0-8e1c-96cb1fb0fd83';
async function notifyAdminNewReview(review) {
if (!review) return;
var serviceLine = review.service ? 'Service: ' + review.service : '';
var message = [
'A new review is waiting for approval.',
'',
'Author: ' + (review.author || '(unknown)'),
'Rating: ' + (review.stars || 0) + '/5',
serviceLine,
'',
'Review:',
'"' + (review.text || '') + '"',
'',
'Approve in Supabase → Table Editor → Reviews → set approved = true'
].filter(function(line) { return line !== ''; }).join('\n');
try {
var res = await fetch('https://api.web3forms.com/submit', {
method: 'POST',
headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
body: JSON.stringify({
access_key: WEB3FORMS_ACCESS_KEY,
subject: 'New review pending approval — Azaël Iloki Website',
name: review.author || 'Website reviewer',
email: 'no-reply@azaeliloki.com',
message: message,
from_name: 'Review Notification',
page: window.location.pathname
})
});
var data = await res.json();
if (!data.success) throw new Error(data.message || 'Notification failed');
} catch (e) {
console.error('Review notification email error:', e);
}
}
function showContactError(msg) {
var lang = getLang();
var el = lang === 'fr' ? document.getElementById('cf-error-fr') : document.getElementById('cf-error');
if (!el) { alert(msg); return; }
el.textContent = msg;
el.style.display = 'block';
}
function hideContactError() {
['cf-error', 'cf-error-fr'].forEach(function(id) {
var el = document.getElementById(id);
if (el) { el.style.display = 'none'; el.textContent = ''; }
});
}
function showContactSuccess() {
hideContactError();
var lang = getLang();
var ok = lang === 'fr' ? document.getElementById('cf-success-fr') : document.getElementById('cf-success');
if (ok) {
ok.style.display = 'block';
} else {
alert(lang === 'fr'
? 'Message envoyé. Vous recevez votre devis sous 2\u00A0h ouvrées.'
: "Message sent. You'll have your quote within 2 working hours — 24h at the latest.");
}
}
async function submitContactToWeb3Forms(isBusiness) {
if (isHoneypotTripped()) return;
var nameEl = document.getElementById('cf-name');
var contactEl = document.getElementById('cf-contact');
var serviceEl = document.getElementById('cf-service');
var messageEl = document.getElementById('cf-message');
if (!nameEl || !contactEl || !serviceEl || !messageEl) return;
var lang = getLang();
if (!nameEl.value.trim() || !contactEl.value.trim()) {
alert(lang === 'fr' ? 'Veuillez remplir nom et contact.' : 'Please fill in name and contact.');
return;
}
var contactVal = contactEl.value.trim();
var docTypeEl = document.getElementById('cf-doc-type');
var deadlineEl = document.getElementById('cf-deadline');
var volumeEl = document.getElementById('cf-volume');
var docType = docTypeEl ? docTypeEl.value.trim() : '';
var deadline = deadlineEl ? deadlineEl.value.trim() : '';
var volume = volumeEl ? volumeEl.value.trim() : '';
var serviceVal = serviceEl.value.trim();
var needsPrequal = isTranslationService(serviceVal);
if (!messageEl.value.trim()) {
if (needsPrequal && !deadline && !docType) {
alert(lang === 'fr' ? 'Veuillez compléter les précisions ou ajouter un message.' : 'Please complete pre-qualification or add a message.');
return;
}
if (!needsPrequal) {
alert(lang === 'fr' ? 'Veuillez ajouter un message.' : 'Please add a message.');
return;
}
}
if (needsPrequal && deadlineEl && !deadline) {
alert(lang === 'fr' ? 'Veuillez sélectionner un délai.' : 'Please select a deadline.');
return;
}
if (docTypeEl && needsPrequal && !docType) {
alert(lang === 'fr' ? 'Veuillez sélectionner le type de document.' : 'Please select a document type.');
return;
}
var extraLines = [];
if (docType) extraLines.push('Document: ' + docType);
if (deadline) extraLines.push('Deadline: ' + deadline);
if (volume) extraLines.push('Volume: ' + volume);
var fullMessage = messageEl.value.trim();
if (extraLines.length) {
fullMessage = extraLines.join('\n') + (fullMessage ? '\n\n' + fullMessage : '');
}
if (isQuoteEstimatorActive()) {
var estRoot = document.getElementById('quote-estimator');
if (estRoot && estRoot._lastEstimate) {
var estSummary = buildQuoteEstimateSummary(estRoot._lastEstimate, lang);
if (estSummary) {
fullMessage = estSummary + (fullMessage ? '\n\n' + fullMessage : '');
}
}
}
var payload = {
access_key: WEB3FORMS_ACCESS_KEY,
subject: isBusiness ? 'Business Enquiry — Azaël Iloki Website' : 'Website Enquiry — Azaël Iloki Website',
name: nameEl.value.trim(),
email: contactVal.indexOf('@') > -1 ? contactVal : 'no-reply@azaeliloki.com',
phone: contactVal.indexOf('@') > -1 ? '' : contactVal,
service: serviceEl.value.trim() || '(not selected)',
document_type: docType || '(not specified)',
deadline: deadline || '(not specified)',
volume: volume || '(not specified)',
message: fullMessage,
from_name: isBusiness ? 'Business Contact Form' : 'Website Contact Form',
page: window.location.pathname
};
var buttons = document.querySelectorAll('.cf-submit');
buttons.forEach(function(b) { b.disabled = true; });
try {
var res = await fetch('https://api.web3forms.com/submit', {
method: 'POST',
headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
body: JSON.stringify(payload)
});
var data = await res.json();
if (!data.success) throw new Error(data.message || 'Submit failed');
nameEl.value = '';
contactEl.value = '';
serviceEl.value = '';
if (docTypeEl) docTypeEl.value = '';
if (deadlineEl) deadlineEl.value = '';
if (volumeEl) volumeEl.value = '';
messageEl.value = '';
updatePrequalVisibility();
showContactSuccess();
trackEvent('contact_form_submit', isBusiness ? 'business' : 'website');
} catch (e) {
console.error('Web3Forms error:', e);
showContactError(lang === 'fr'
? "L’envoi a échoué. Réessayez, ou écrivez-moi sur WhatsApp — votre message n’est pas perdu."
: "Sending failed. Try again, or message me on WhatsApp — your message is not lost.");
} finally {
buttons.forEach(function(b) { b.disabled = false; });
}
}
function submitContactForm() {
submitContactToWeb3Forms(false);
}
function submitContactEmail() {
submitContactToWeb3Forms(true);
}
function setContactServiceSelect(serviceValue) {
var sel = document.getElementById('cf-service');
if (!sel || !serviceValue) return false;
for (var i = 0; i < sel.options.length; i++) {
if (sel.options[i].value === serviceValue) {
sel.value = serviceValue;
syncBilingualSelectOptions(sel.closest('form') || document, readPersistedServiceContext);
updatePrequalVisibility();
applyContactSectionCopyFromService(sel.value);
return true;
}
}
return false;
}
function prefillContactService(serviceValue) {
if (!serviceValue) return;
if (setContactServiceSelect(serviceValue)) return;
var ctx = CF_SERVICE_TO_CTX[serviceValue];
if (ctx && REVIEW_SERVICE_FOR[ctx]) setContactServiceSelect(REVIEW_SERVICE_FOR[ctx][getLang()]);
}
function applyContactDeepLink() {
if (window.location.hash !== '#contact' && window.location.hash !== '#quote-intake') return;
var svc = new URLSearchParams(window.location.search).get('service');
if (svc) {
var ctx = CF_SERVICE_TO_CTX[svc];
if (ctx) persistServiceContext(ctx);
prefillContactService(decodeURIComponent(svc));
return;
}
var ctx = readPersistedServiceContext();
if (ctx) prefillContactServiceForContext(ctx);
}
var WA_PHONE = '22879716258';
function isTranslationService(value) {
if (!value) return false;
var v = value.toLowerCase();
return v.indexOf('translation') >= 0 || v.indexOf('traduction') >= 0
|| v.indexOf('web content') >= 0 || v.indexOf('contenu web') >= 0;
}
function isTrainingService(value) {
if (!value) return false;
var v = value.toLowerCase();
return v.indexOf('training') >= 0 || v.indexOf('formation') >= 0;
}
function resolveDocTypeContext(serviceValueOrCtx) {
if (serviceValueOrCtx === 'sworn' || serviceValueOrCtx === 'general') return serviceValueOrCtx;
if (serviceValueOrCtx && CF_SERVICE_TO_CTX[serviceValueOrCtx]) {
var fromVal = CF_SERVICE_TO_CTX[serviceValueOrCtx];
if (fromVal === 'sworn' || fromVal === 'general') return fromVal;
}
if (typeof readPersistedServiceContext() === 'function') {
var persisted = readPersistedServiceContext();
if (persisted === 'sworn' || persisted === 'general') return persisted;
}
var serviceEl = document.getElementById('cf-service');
if (serviceEl && serviceEl.value && CF_SERVICE_TO_CTX[serviceEl.value]) {
var fromSel = CF_SERVICE_TO_CTX[serviceEl.value];
if (fromSel === 'sworn' || fromSel === 'general') return fromSel;
}
return 'general';
}
function buildDocTypeSelectHtml(ctx) {
var items = DOC_TYPE_OPTIONS[ctx] || DOC_TYPE_OPTIONS.general;
var html = '<option value="" data-en>Select document type</option><option value="" data-fr>Sélectionner le type…</option>';
items.forEach(function(item) {
html += '<option value="' + item.en.v + '" data-en>' + item.en.l + '</option>';
html += '<option value="' + item.fr.v + '" data-fr>' + item.fr.l + '</option>';
});
return html;
}
function updateDocTypeOptions(serviceValueOrCtx) {
var select = document.getElementById('cf-doc-type');
if (!select) return;
var ctx = resolveDocTypeContext(serviceValueOrCtx);
if (select.dataset.docContext !== ctx) {
select.innerHTML = buildDocTypeSelectHtml(ctx);
select.dataset.docContext = ctx;
syncBilingualSelectOptions(select.closest('.cf-form') || select.closest('form') || document);
}
}
function buildDeadlineSelectHtml(ctx) {
var items = DEADLINE_OPTIONS[ctx] || DEADLINE_OPTIONS.general;
var html = '<option value="" data-en>Select deadline</option><option value="" data-fr>Sélectionner le délai…</option>';
items.forEach(function(item) {
html += '<option value="' + item.en.v + '" data-en>' + item.en.l + '</option>';
html += '<option value="' + item.fr.v + '" data-fr>' + item.fr.l + '</option>';
});
return html;
}
function updateDeadlineOptions(serviceValueOrCtx) {
var select = document.getElementById('cf-deadline');
if (!select) return;
var ctx = resolveDocTypeContext(serviceValueOrCtx);
if (ctx !== 'sworn' && ctx !== 'general') ctx = 'general';
if (select.dataset.deadlineContext !== ctx) {
select.innerHTML = buildDeadlineSelectHtml(ctx);
select.dataset.deadlineContext = ctx;
syncBilingualSelectOptions(select.closest('.cf-form') || select.closest('form') || document);
}
}
function injectQuotePrequal() {
document.querySelectorAll('.cf-form').forEach(function(form) {
if (form.dataset.prequalInit) return;
var messageField = form.querySelector('#cf-message');
if (!messageField) return;
var messageWrap = messageField.closest('.cf-field');
if (!messageWrap) return;
var prequal = document.createElement('div');
prequal.className = 'cf-prequal';
prequal.innerHTML =
'<p class="cf-prequal-lead" data-en><strong>Pre-qualify your request</strong> — select your details below so your quote is accurate on the first reply.</p>' +
'<p class="cf-prequal-lead" data-fr><strong>Précisez votre demande</strong> — sélectionnez les détails ci-dessous pour un devis précis dès la première réponse.</p>' +
'<div class="cf-field" data-prequal-trans>' +
'<label class="cf-label" for="cf-doc-type" data-en>Document type</label>' +
'<label class="cf-label" for="cf-doc-type" data-fr>Type de document</label>' +
'<select class="cf-select" id="cf-doc-type"></select></div>' +
'<div class="cf-field">' +
'<label class="cf-label" for="cf-deadline" data-en>Deadline</label>' +
'<label class="cf-label" for="cf-deadline" data-fr>Délai souhaité</label>' +
'<select class="cf-select" id="cf-deadline"></select></div>' +
'<div class="cf-field" data-prequal-trans>' +
'<label class="cf-label" for="cf-volume" data-en>Approx. pages or word count</label>' +
'<label class="cf-label" for="cf-volume" data-fr>Pages approx. ou nombre de mots</label>' +
'<input class="cf-input" id="cf-volume" type="text" data-placeholder-en="e.g. 3 pages" data-placeholder-fr="ex. 3 pages">' +
'</div>';
messageWrap.parentNode.insertBefore(prequal, messageWrap);
var submitBtn = form.querySelector('.cf-submit');
if (submitBtn && !form.querySelector('.cf-wa-btn')) {
var actions = document.createElement('div');
actions.className = 'cf-form-actions';
var waBtn = document.createElement('button');
waBtn.type = 'button';
waBtn.className = 'cf-wa-btn';
waBtn.innerHTML = '<span data-en>Send request on WhatsApp</span><span data-fr>Envoyer la demande sur WhatsApp</span>';
submitBtn.parentNode.insertBefore(actions, submitBtn);
actions.appendChild(waBtn);
actions.appendChild(submitBtn);
waBtn.addEventListener('click', sendQuoteViaWhatsApp);
}
var serviceEl = form.querySelector('#cf-service');
updateDocTypeOptions(serviceEl ? serviceEl.value : null);
updateDeadlineOptions(serviceEl ? serviceEl.value : null);
if (serviceEl) {
serviceEl.addEventListener('change', function() {
updateDocTypeOptions(serviceEl.value);
updateDeadlineOptions(serviceEl.value);
updatePrequalVisibility();
applyContactSectionCopyFromService(serviceEl.value);
});
updatePrequalVisibility();
applyContactSectionCopyFromService(serviceEl.value);
}
form.dataset.prequalInit = '1';
syncBilingualSelectOptions(form);
});
}
function updatePrequalVisibility() {
var serviceEl = document.getElementById('cf-service');
if (!serviceEl) return;
var showPrequal = isTranslationService(serviceEl.value);
document.querySelectorAll('.cf-prequal').forEach(function(el) {
el.style.display = showPrequal ? '' : 'none';
});
}
var contactSectionDefaults = null;
var CONTACT_SECTION_COPY = {
training: {
en: {
title: 'Send a Training Enquiry',
intro: 'Tell me about your organisation, team size and training goals — or book a free consultation on Calendly.'
},
fr: {
title: 'Envoyer une demande de formation',
intro: 'Parlez-moi de votre organisation, la taille de l’équipe et vos objectifs — ou réservez une consultation gratuite sur Calendly.'
}
}
};
function captureContactSectionDefaults() {
var section = document.getElementById('contact');
if (!section || contactSectionDefaults) return;
contactSectionDefaults = {
en: {
title: (section.querySelector('.section-title[data-en]') || {}).textContent || '',
intro: (section.querySelector('.contact-intro--default[data-en]') || section.querySelector('.contact-intro[data-en]') || {}).textContent || ''
},
fr: {
title: (section.querySelector('.section-title[data-fr]') || {}).textContent || '',
intro: (section.querySelector('.contact-intro--default[data-fr]') || section.querySelector('.contact-intro[data-fr]') || {}).textContent || ''
}
};
}
function applyContactSectionCopyFromService(serviceValue) {
var section = document.getElementById('contact');
if (!section) return;
captureContactSectionDefaults();
var copy = isTrainingService(serviceValue) ? CONTACT_SECTION_COPY.training : contactSectionDefaults;
if (!copy) return;
['en', 'fr'].forEach(function(lang) {
var titleEl = section.querySelector('.section-title[data-' + lang + ']');
var introEl = section.querySelector('.contact-intro--default[data-' + lang + ']') || section.querySelector('.contact-intro[data-' + lang + ']');
if (titleEl && copy[lang].title) titleEl.textContent = copy[lang].title;
if (introEl && copy[lang].intro) introEl.textContent = copy[lang].intro;
});
}
function applyContactSectionCopyForContext(service) {
if (service === 'training') {
applyContactSectionCopyFromService('Corporate Training');
return;
}
captureContactSectionDefaults();
if (contactSectionDefaults) applyContactSectionCopyFromService('');
}
function getQuoteFieldValues() {
return {
name: (document.getElementById('cf-name') || {}).value || '',
contact: (document.getElementById('cf-contact') || {}).value || '',
service: (document.getElementById('cf-service') || {}).value || '',
docType: (document.getElementById('cf-doc-type') || {}).value || '',
deadline: (document.getElementById('cf-deadline') || {}).value || '',
volume: (document.getElementById('cf-volume') || {}).value || '',
message: (document.getElementById('cf-message') || {}).value || ''
};
}
function validateQuotePrequal(fields) {
var lang = getLang();
if (!fields.service) {
alert(lang === 'fr' ? 'Veuillez sélectionner un service.' : 'Please select a service.');
return false;
}
if (isTranslationService(fields.service) && !fields.deadline) {
alert(lang === 'fr' ? 'Veuillez sélectionner un délai.' : 'Please select a deadline.');
return false;
}
if (isTranslationService(fields.service) && !fields.docType) {
alert(lang === 'fr' ? 'Veuillez sélectionner le type de document.' : 'Please select a document type.');
return false;
}
return true;
}
function buildQuoteWhatsAppText(fields) {
var lang = getLang();
var lines = lang === 'fr'
? ['Bonjour Azaël, je souhaite avoir un devis :', 'Service : ' + fields.service]
: ['Hello Azaël, I would like a quote for:', 'Service: ' + fields.service];
if (fields.docType) {
lines.push((lang === 'fr' ? 'Document : ' : 'Document: ') + fields.docType);
}
if (fields.deadline) {
lines.push((lang === 'fr' ? 'Délai\u00A0: ' : 'Deadline: ') + fields.deadline);
}
if (fields.volume) {
lines.push((lang === 'fr' ? 'Volume : ' : 'Volume: ') + fields.volume.trim());
}
if (fields.name.trim()) {
lines.push((lang === 'fr' ? 'Nom : ' : 'Name: ') + fields.name.trim());
}
if (fields.contact.trim()) {
lines.push((lang === 'fr' ? 'Contact&nbsp;: ' : 'Contact: ') + fields.contact.trim());
}
if (fields.message.trim()) {
lines.push((lang === 'fr' ? 'Détails\u00A0: ' : 'Details: ') + fields.message.trim());
}
if (isQuoteEstimatorActive()) {
var estRoot = document.getElementById('quote-estimator');
if (estRoot && estRoot._lastEstimate) {
var summary = buildQuoteEstimateSummary(estRoot._lastEstimate, lang);
if (summary) lines.push('', summary);
}
}
return lines.join('\n');
}
function isQuoteEstimatorActive() {
var section = document.getElementById('general-estimate');
return !!(section && !section.classList.contains('service-context-hidden'));
}
function applyQuoteEstimatorVisibility(service) {
var section = document.getElementById('general-estimate');
if (!section) return;
var show = service === 'general';
if (show) {
section.classList.remove('service-context-hidden');
document.querySelectorAll('.contact-intro--estimate').forEach(function(el) {
el.classList.remove('service-context-hidden');
});
document.querySelectorAll('.contact-intro--default').forEach(function(el) {
el.classList.add('service-context-hidden');
});
if (!section.dataset.qeInit) initQuoteEstimator();
else syncQuoteEstimatorFields();
} else {
section.classList.add('service-context-hidden');
document.querySelectorAll('.contact-intro--estimate').forEach(function(el) {
el.classList.add('service-context-hidden');
});
document.querySelectorAll('.contact-intro--default').forEach(function(el) {
el.classList.remove('service-context-hidden');
});
}
}
var TRANSLATION_ESTIMATE = {
PAGE_WORDS: 300,
RATES: { standard: 66, technical: 118 }
};
var FX_EUR_PEG = 655.957;
var FX_CACHE_KEY = 'azael_fx_rates_v1';
var FX_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
var fxMemory = null;
var fxFetchPromise = null;
function readFxCache() {
try {
var raw = localStorage.getItem(FX_CACHE_KEY);
if (!raw) return null;
var parsed = JSON.parse(raw);
if (!parsed || !parsed.fcfaPerUnit) return null;
return parsed;
} catch (e) {
return null;
}
}
function writeFxCache(data) {
fxMemory = data;
try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
}
function fcfaPerUnitFromEurRates(eurRates, date) {
var units = { EUR: FX_EUR_PEG };
if (eurRates.USD > 0) units.USD = FX_EUR_PEG / eurRates.USD;
if (eurRates.GBP > 0) units.GBP = FX_EUR_PEG / eurRates.GBP;
return { fetchedAt: Date.now(), date: date || '', fcfaPerUnit: units };
}
function fetchFrankfurterFx() {
return fetch('https://api.frankfurter.dev/v1/latest?from=EUR&to=USD,GBP')
.then(function (res) {
if (!res.ok) throw new Error('frankfurter');
return res.json();
})
.then(function (json) {
return fcfaPerUnitFromEurRates(json.rates || {}, json.date || '');
});
}
function fetchErApiFx() {
return fetch('https://open.er-api.com/v6/latest/EUR')
.then(function (res) {
if (!res.ok) throw new Error('er-api');
return res.json();
})
.then(function (json) {
if (json.result !== 'success' || !json.rates) throw new Error('er-api');
var date = '';
if (json.time_last_update_utc) date = String(json.time_last_update_utc).slice(0, 10);
return fcfaPerUnitFromEurRates({ USD: json.rates.USD, GBP: json.rates.GBP }, date);
});
}
function fetchLiveFxRates() {
return fetchFrankfurterFx().catch(function () { return fetchErApiFx(); });
}
function getActiveFxSnapshot() {
if (fxMemory) return fxMemory;
var cached = readFxCache();
if (cached) fxMemory = cached;
return fxMemory;
}
function getFcfaPerUnit(currency) {
if (!currency || currency === 'FCFA') return 1;
if (currency === 'EUR') return FX_EUR_PEG;
var snap = getActiveFxSnapshot();
if (snap && snap.fcfaPerUnit && snap.fcfaPerUnit[currency] > 0) {
return snap.fcfaPerUnit[currency];
}
return 0;
}
function ensureFxRatesReady() {
var snap = getActiveFxSnapshot();
if (snap && (Date.now() - snap.fetchedAt) < FX_CACHE_TTL_MS) {
return Promise.resolve(snap);
}
if (!fxFetchPromise) {
var stale = snap;
fxFetchPromise = fetchLiveFxRates()
.then(function (data) {
writeFxCache(data);
return data;
})
.catch(function () {
if (stale) return stale;
return fetchErApiFx()
.then(function (data) {
writeFxCache(data);
return data;
})
.catch(function () {
return fetchFrankfurterFx
.then(function (data) {
writeFxCache(data);
return data;
});
});
})
.finally(function () { fxFetchPromise = null; });
}
return fxFetchPromise.then(function (data) {
return data || getActiveFxSnapshot();
});
}

function formatEstimateNumber(n, lang) {
if (lang === 'fr') return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function formatForeignEstimateAmount(amt, currency, lang) {
var fcfaPerUnit = getFcfaPerUnit(currency);
if (!fcfaPerUnit) return '';
var units = amt / fcfaPerUnit;
var locale = lang === 'fr' ? 'fr-FR' : 'en-US';
var formatted = units.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
var symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '';
if (!symbol) return formatted;

return lang === 'fr' ? formatted + ' ' + symbol : symbol + formatted;
}
function formatEstimateMoney(fcfaAmount, currency, lang) {
var amt = Math.max(0, fcfaAmount);
if (currency === 'EUR' || currency === 'USD' || currency === 'GBP') {
var foreign = formatForeignEstimateAmount(amt, currency, lang);
if (foreign) return foreign;
return formatEstimateNumber(amt, lang) + ' FCFA';
}
return formatEstimateNumber(amt, lang) + ' FCFA';
}
function buildEstimateFxNote(est, lang) {
if (!est || est.currency === 'FCFA') return '';
var isCorporate = est.accountType === 'corporate';
var snap = getActiveFxSnapshot();
var date = snap && snap.date ? snap.date : '';
if (est.currency === 'EUR') {
return isCorporate
? (lang === 'fr'
? 'Montants indicatifs HT. 1 € = 655,957 FCFA (taux officiel fixe).'
: 'Indicative amounts excl. tax. 1 € = 655.957 FCFA (official fixed peg).')
: (lang === 'fr'
? 'Montants indicatifs nets. 1 € = 655,957 FCFA (taux officiel fixe).'
: 'Indicative net amounts. 1 € = 655.957 FCFA (official fixed peg).');
}
if (!date) {
return isCorporate
? (lang === 'fr'
? 'Montants indicatifs HT. Taux de change mis à jour automatiquement.'
: 'Indicative amounts excl. tax. Exchange rates auto-updated.')
: (lang === 'fr'
? 'Montants indicatifs nets. Taux de change mis à jour automatiquement.'
: 'Indicative net amounts. Exchange rates auto-updated.');
}
return isCorporate
? (lang === 'fr'
? 'Montants indicatifs HT. Taux de change au ' + date + ' (mise à jour automatique).'
: 'Indicative amounts excl. tax. Exchange rate as of ' + date + ' (auto-updated).')
: (lang === 'fr'
? 'Montants indicatifs nets. Taux de change au ' + date + ' (mise à jour automatique).'
: 'Indicative net amounts. Exchange rate as of ' + date + ' (auto-updated).');
}
function calculateTranslationEstimate(opts) {
var accountType = opts.accountType === 'corporate' ? 'corporate' : 'individual';
var wordCount = Math.max(0, parseInt(opts.wordCount, 10) || 0);
var complexity = opts.complexity === 'technical' ? 'technical' : 'standard';
var currency = opts.currency || 'FCFA';
var rate = TRANSLATION_ESTIMATE.RATES[complexity];
var rawFcfa = wordCount > 0 ? wordCount * rate : 0;
var totalFcfa = rawFcfa;
var pages = wordCount > 0 ? wordCount / TRANSLATION_ESTIMATE.PAGE_WORDS : null;
return {
accountType: accountType,
wordCount: wordCount,
complexity: complexity,
currency: currency,
rate: rate,
pages: pages,
rawFcfa: rawFcfa,
totalFcfa: totalFcfa
};
}
function getQuoteEstimatorInputs() {
var accountEl = document.querySelector('input[name="qe-account"]:checked');
var wordsEl = document.getElementById('qe-words');
var unitEl = document.querySelector('input[name="qe-unit"]:checked');
var complexityEl = document.getElementById('qe-complexity');
var currencyEl = document.getElementById('qe-currency');
if (!accountEl && !wordsEl) return null;

var raw = wordsEl ? (parseFloat(wordsEl.value) || 0) : 0;
var inPages = !!unitEl && unitEl.value === 'pages';
var words = raw > 0 ? Math.round(inPages ? raw * TRANSLATION_ESTIMATE.PAGE_WORDS : raw) : 0;
return {
accountType: accountEl ? accountEl.value : 'individual',
wordCount: words > 0 ? String(words) : '',
unit: inPages ? 'pages' : 'words',
complexity: complexityEl ? complexityEl.value : 'standard',
currency: currencyEl ? currencyEl.value : 'FCFA'
};
}
function buildQuoteEstimateSummary(est, lang) {
if (!est) return '';
var lines = lang === 'fr' ? ['--- Estimation traduction générale (indicative) ---'] : ['--- General translation estimate (indicative) ---'];
lines.push((lang === 'fr' ? 'Type de compte : ' : 'Account type: ') + (est.accountType === 'corporate'
? (lang === 'fr' ? 'Entreprise / ONG / Ambassade' : 'Company / NGO / Embassy')
: (lang === 'fr' ? 'Particulier' : 'Individual')));
if (est.wordCount > 0) {
lines.push((lang === 'fr' ? 'Mots : ' : 'Words: ') + formatEstimateNumber(est.wordCount, lang));
if (est.pages != null) {
var pagesStr = est.pages % 1 === 0 ? String(est.pages) : est.pages.toFixed(1);
lines.push((lang === 'fr' ? 'Pages estimées\u00A0: ' : 'Estimated pages: ') + pagesStr);
}
}
lines.push((lang === 'fr' ? 'Complexité\u00A0: ' : 'Complexity: ') + (est.complexity === 'technical'
? (lang === 'fr' ? 'Technique / juridique' : 'Technical / Legal')
: (lang === 'fr' ? 'Standard / commercial' : 'Standard / Commercial')));
var taxLabel = est.accountType === 'corporate' ? ' HT' : (lang === 'fr' ? ' net' : ' net');
lines.push((lang === 'fr' ? 'Tarif : ' : 'Rate: ') + est.rate + (lang === 'fr' ? ' FCFA/mot' : ' FCFA/word') + taxLabel);
var total = formatEstimateMoney(est.totalFcfa, est.currency, lang) + taxLabel;
if (est.wordCount <= 0) {
total = formatEstimateMoney(est.totalFcfa, est.currency, lang) + taxLabel;
}
lines.push((lang === 'fr' ? 'Total indicatif : ' : 'Indicative total: ') + total);
return lines.join('\n');
}
function syncQuoteEstimatorFields() {
var root = document.getElementById('quote-estimator');
if (!root) return;
var accountEl = document.querySelector('input[name="qe-account"]:checked');
var isCorporate = accountEl && accountEl.value === 'corporate';
root.querySelectorAll('.qe-corporate-only').forEach(function(el) {
if (isCorporate) el.removeAttribute('hidden');
else el.setAttribute('hidden', '');
});
}
function populateEstimateModal(est) {
var lang = getLang();
var isCorporate = est.accountType === 'corporate';
var taxWord = isCorporate
? (lang === 'fr' ? 'mot HT' : 'word HT')
: (lang === 'fr' ? 'mot net' : 'word net');
var rateRow = document.getElementById('qe-modal-row-rate');
if (rateRow) rateRow.removeAttribute('hidden');
var pagesEl = document.getElementById('qe-modal-pages');
if (pagesEl) {
pagesEl.textContent = est.pages != null
? (est.pages % 1 === 0 ? String(est.pages) : est.pages.toFixed(1))
: '—';
}
var rateEl = document.getElementById('qe-modal-rate');
if (rateEl) {
rateEl.textContent = est.rate + ' FCFA/' + taxWord;
}
var totalEl = document.getElementById('qe-modal-total');
if (totalEl) {
if (est.wordCount > 0) {
var taxSuffix = isCorporate ? ' HT' : (lang === 'fr' ? ' net' : ' net');
totalEl.textContent = formatEstimateMoney(est.totalFcfa, est.currency, lang) + taxSuffix;
} else {
var taxSuffix = isCorporate ? ' HT' : (lang === 'fr' ? ' net' : ' net');
totalEl.textContent = formatEstimateMoney(est.totalFcfa, est.currency, lang) + taxSuffix;
}
}
var floorEl = document.getElementById('qe-modal-floor');
if (floorEl) {
floorEl.textContent = '';
floorEl.setAttribute('hidden', '');
}
var noteEl = document.getElementById('qe-modal-note');
if (noteEl) {
var fxNote = buildEstimateFxNote(est, lang);
if (fxNote) {
noteEl.textContent = fxNote;
if (!isCorporate) {
noteEl.textContent += lang === 'fr'
? ' Le tarif final peut varier selon la complexité réelle du document.'
: ' Final price may vary based on actual document complexity.';
}
noteEl.removeAttribute('hidden');
} else if (!isCorporate) {
noteEl.removeAttribute('hidden');
noteEl.textContent = lang === 'fr'
? 'Montant net (prix final pour les particuliers). Le tarif final peut varier selon la complexité réelle du document.'
: 'Net amount (all taxes included). Final price may vary based on actual document complexity.';
} else {
noteEl.textContent = '';
noteEl.setAttribute('hidden', '');
}
}
}
function openEstimateResultModal(trigger) {
var inputs = getQuoteEstimatorInputs();
if (!inputs) return;
var est = calculateTranslationEstimate(inputs);
var root = document.getElementById('quote-estimator');
if (root) root._lastEstimate = est;
var volumeEl = document.getElementById('cf-volume');
if (volumeEl && est.wordCount > 0) {
var lang = getLang();
volumeEl.value = String(est.wordCount) + (lang === 'fr' ? ' mots' : ' words');
}
populateEstimateModal(est);
var modal = document.getElementById('estimateResultModal');
if (!modal) return;
openAccessibleModal(modal, trigger || document.activeElement);
trackEvent('quote_estimate_view', est.accountType);
}
function closeEstimateResultModal() {
var modal = document.getElementById('estimateResultModal');
if (!modal) return;
closeAccessibleModal(modal);
}
function wireEstimateResultModal() {
var modal = document.getElementById('estimateResultModal');
if (!modal || modal.dataset.wired === 'true') return;
modal.dataset.wired = 'true';
var closeX = document.getElementById('estimateModalClose');
var closeBtn = document.getElementById('estimateModalCloseBtn');
if (closeX) closeX.addEventListener('click', closeEstimateResultModal);
if (closeBtn) closeBtn.addEventListener('click', closeEstimateResultModal);
var ctaBtn = document.getElementById('qe-modal-cta');
if (ctaBtn) ctaBtn.addEventListener('click', function() { closeEstimateResultModal(); });
modal.addEventListener('click', function(e) {
if (e.target === modal) closeEstimateResultModal();
});
}
function initQuoteEstimator() {
var section = document.getElementById('general-estimate');
var root = document.getElementById('quote-estimator');
if (!section || !root || section.dataset.qeInit) return;
section.dataset.qeInit = '1';
wireEstimateResultModal();
var wordsEl = document.getElementById('qe-words');
if (wordsEl) {
var lang = getLang();
var ph = wordsEl.getAttribute('data-placeholder-' + lang);
if (ph) wordsEl.placeholder = ph;
}
syncBilingualSelectOptions(root);
function onChange() {
syncQuoteEstimatorFields(); }
root.addEventListener('change', onChange);
root.addEventListener('input', onChange);
document.querySelectorAll('.qe-show-btn').forEach(function(btn) {
btn.addEventListener('click', function(e) {
if (btn.disabled) return;
btn.disabled = true;
ensureFxRatesReady()
.then(function() { openEstimateResultModal(btn); })
.catch(function() { openEstimateResultModal(btn); })
.finally(function() { btn.disabled = false; });
});
});
ensureFxRatesReady();
syncQuoteEstimatorFields();
}
function isHoneypotTripped() {
var hp = document.getElementById('cf-website');
return hp && hp.value && hp.value.trim().length > 0;
}
function isVisaCaptureHoneypotTripped() {
var hp = document.getElementById('visa-capture-hp');
return hp && hp.value && hp.value.trim().length > 0;
}
var VISA_CHECKLIST_LEAD_KEY = 'azael_visa_checklist_lead';
function hasVisaChecklistLeadSubmitted() {
try { return localStorage.getItem(VISA_CHECKLIST_LEAD_KEY) === '1'; } catch (e) { return false; }
}
function markVisaChecklistLeadSubmitted() {
try { localStorage.setItem(VISA_CHECKLIST_LEAD_KEY, '1'); } catch (e) {}
}
function applyVisaCaptureSubmittedUI(form) {
if (!form) return;
var successEl = document.getElementById('visa-capture-success');
var lang = getLang();
var checklistUrl = lang === 'fr'
? (form.getAttribute('data-checklist-fr') || '/fr/guides/documents-visa/#visa-checklist')
: (form.getAttribute('data-checklist-en') || '/guides/visa-documents/#visa-checklist');
var emailRow = form.querySelector('.soft-capture__email-row');
var consentLabel = form.querySelector('.soft-capture__consent');
if (emailRow) emailRow.style.display = 'none';
if (consentLabel) consentLabel.style.display = 'none';
if (successEl) {
successEl.hidden = false;
successEl.querySelectorAll('.visa-capture-checklist-link').forEach(function(link) {
link.setAttribute('href', checklistUrl);
});
}
}
function initVisaCaptureForm() {
if (!hasVisaChecklistLeadSubmitted()) return;
applyVisaCaptureSubmittedUI(document.getElementById('visa-capture-form'));
}
async function submitVisaChecklistEmail() {
if (isVisaCaptureHoneypotTripped() || hasVisaChecklistLeadSubmitted()) return;
var form = document.getElementById('visa-capture-form');
if (!form) return;
var emailEl = document.getElementById('visa-capture-email');
var consentEl = document.getElementById('visa-capture-consent');
var lang = getLang();
if (!emailEl || !emailEl.value.trim() || !emailEl.checkValidity()) {
alert(lang === 'fr' ? 'Veuillez entrer une adresse électronique valide.' : 'Please enter a valid email address.');
return;
}
if (!consentEl || !consentEl.checked) {
alert(lang === 'fr'
? 'Veuillez accepter d\'être contacté(e) au sujet de votre demande pour continuer.'
: 'Please agree to be contacted about your request to continue.');
return;
}
var buttons = document.querySelectorAll('.visa-capture-submit');
buttons.forEach(function(b) { b.disabled = true; });
try {
var res = await fetch('https://api.web3forms.com/submit', {
method: 'POST',
headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
body: JSON.stringify({
access_key: WEB3FORMS_ACCESS_KEY,
subject: 'Visa checklist lead — Azaël Iloki Website',
name: 'Visa checklist subscriber',
email: emailEl.value.trim(),
message: 'Requested the visa/study-abroad document checklist by email.',
consent: 'yes',
from_name: 'Visa Checklist Capture',
page: window.location.pathname
})
});
var data = await res.json();
if (!data.success) throw new Error(data.message || 'Submit failed');
emailEl.value = '';
if (consentEl) consentEl.checked = false;
markVisaChecklistLeadSubmitted();
applyVisaCaptureSubmittedUI(form);
trackEvent('visa_checklist_lead', 'email');
} catch (e) {
console.error('Visa checklist Web3Forms error:', e);
alert(lang === 'fr'
? 'Erreur lors de l\'envoi. Réessayez ou utilisez WhatsApp.'
: 'Error sending. Please try again or use WhatsApp.');
} finally {
buttons.forEach(function(b) { b.disabled = false; });
}
}
function sendQuoteViaWhatsApp() {
if (isHoneypotTripped()) return;
var fields = getQuoteFieldValues();
if (!validateQuotePrequal(fields)) return;
var url = 'https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(buildQuoteWhatsAppText(fields));
window.open(url, '_blank', 'noopener,noreferrer');
trackEvent('quote_whatsapp', fields.service);
}
function getEnrolTrack(pkg) {
if (/Standard Tutoring|Soutien scolaire standard/i.test(pkg)) return 'tutoring';
if (/In-Person Immersive|Cours présentiel immersif/i.test(pkg)) return 'immersive';
if (/Online Private Class|Cours particulier en ligne/i.test(pkg)) return 'online';
if (/FLE|FOS|English|Anglais|ESP|EAP/i.test(pkg)) {
return /In person|En présentiel|présentiel/i.test(pkg) ? 'immersive' : 'online';
}
if (/Professional Retainer|Forfait professionnel/i.test(pkg)) {
return /In person|En présentiel|présentiel/i.test(pkg) ? 'immersive' : 'online';
}
return 'online';
}
var ENROL_TERMS_SHARED = {
en: [
'Monthly subscription payable in advance by the 5th of each month before sessions begin.',
'Each session is 1 hour. Unused sessions do not roll over to the following month.',
'Flat rate, all-inclusive. No hidden fees or extra charges (Net amount for individuals).',
'Payment accepted via Moov Money (Moov Africa), Mixx by Yas, Ecobank Mobile, or bank transfer — details provided with invoice.',
'A minimum of 24 hours\' notice is required to reschedule. Sessions cancelled with less than 24 hours\' notice are forfeited and billed at full cost.',
'Sessions are scheduled flexibly Monday to Friday 8:00–20:00 and Saturday 8:00–18:00 (GMT+0).'
],
fr: [
'Abonnement mensuel payable à l\'avance avant le 5 de chaque mois.',
'Chaque séance dure 1 heure. Les séances non utilisées ne sont pas reportées au mois suivant.',
'Tarif net, tout inclus. Aucuns frais cachés ni taxe supplémentaire (montant net pour les particuliers).',
'Paiement via Moov Money (Moov Africa), Mixx by Yas, Ecobank Mobile ou virement bancaire — coordonnées fournies avec la facture.',
'Un préavis minimum de 24 heures est requis pour reporter une séance. Toute annulation avec moins de 24 heures de préavis est perdue et facturée au coût plein.',
'Séances planifiées de manière flexible lun.–ven. 8\u00A0h–20\u00A0h · sam. 8\u00A0h–18\u00A0h (GMT+0).'
]
};
var ENROL_TERMS_TRACK = {
tutoring: {
en: [
'In-person sessions in Lomé — at the student\'s home.',
'Includes strict school curriculum synchronisation, targeted assignment and homework reviews, continuous homework tracking, and a written monthly progress report to parents.'
],
fr: [
'Séances en présentiel à Lomé — au domicile de l\'élève.',
'Comprend la synchronisation avec le programme scolaire, les révisions ciblées des devoirs, le suivi continu du travail à la maison et un rapport de progression mensuel écrit aux parents.'
]
},
online: {
en: [
'Live one-on-one sessions via Zoom — available worldwide.',
'Includes HD virtual portal configuration, lifetime cloud resource drive access, and between-session support for corrections and practice.',
'A free placement test (1h) is recommended before your first session to determine your CEFR level (A1–C2).'
],
fr: [
'Séances individuelles en direct via Zoom — disponibles dans le monde entier.',
'Comprend la configuration du portail virtuel HD, l\'accès au espace de ressources et l\'accompagnement entre séances pour corrections et pratique.',
'Un test de positionnement gratuit (1 h) est recommandé avant la première séance pour déterminer votre niveau CECRL (A1–C2).'
]
},
immersive: {
en: [
'Sessions at your home or workplace in Lomé — you choose the setting.',
'Includes printed worksheets tailored to your level, direct feedback on pronunciation and fluency, and all local travel costs covered.',
'A free placement test (1h) is recommended before your first session to determine your CEFR level (A1–C2).'
],
fr: [
'Séances à domicile ou au lieu de travail à Lomé — vous choisissez le cadre.',
'Comprend des fiches imprimées adaptées à votre niveau, un retour direct sur la prononciation et l\'expression orale, et tous les frais de déplacement couverts.',
'Un test de positionnement gratuit (1 h) est recommandé avant la première séance pour déterminer votre niveau CECRL (A1–C2).'
]
}
};
var pendingEnrolPackage = null;
function buildEnrolTermsHtml(lang, track) {
var items = (ENROL_TERMS_TRACK[track] ? ENROL_TERMS_TRACK[track][lang] : []).concat(ENROL_TERMS_SHARED[lang] || []);
return '<ul>' + items.map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul>';
}
function closeEnrolTermsModal() {
var modal = document.getElementById('enrolTermsModal');
var checkbox = document.getElementById('enrolTermsAccept');
var confirm = document.getElementById('enrolTermsConfirm');
closeAccessibleModal(modal);
if (checkbox) checkbox.checked = false;
if (confirm) confirm.disabled = true;
pendingEnrolPackage = null;
}
function openEnrolWhatsApp(pkg) {
var lang = getLang();
var text = lang === 'fr'
? 'Bonjour Azaël, je souhaite m\'inscrire au forfait : ' + pkg
: 'Hello Azaël, I would like to enrol in the package: ' + pkg;
window.open('https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
trackEvent('package_enrol_whatsapp', pkg);
}
function openEnrolTermsModal(pkg, trigger) {
var modal = document.getElementById('enrolTermsModal');
var pkgEl = document.getElementById('enrolTermsPackage');
var bodyEl = document.getElementById('enrolTermsBody');
var checkbox = document.getElementById('enrolTermsAccept');
var confirm = document.getElementById('enrolTermsConfirm');
if (!modal || !pkgEl || !bodyEl) {
openEnrolWhatsApp(pkg);
return;
}
pendingEnrolPackage = pkg;
var lang = getLang();
var track = getEnrolTrack(pkg);
pkgEl.textContent = pkg;
bodyEl.innerHTML = buildEnrolTermsHtml(lang, track);
if (checkbox) checkbox.checked = false;
if (confirm) confirm.disabled = true;
openAccessibleModal(modal, trigger || document.activeElement);
}
function getDynamicEnrolPackage(kind) {
if (kind === 'course-adult') return buildCourseAdultPackage();
if (kind === 'retainer-pro') return buildRetainerPackage();
var freq = (document.querySelector('.freq-btn.active') || {}).getAttribute('data-freq') || '4';
var packs = {
'tutoring-standard': {
en: { '4': 'Standard Tutoring · 4 sessions · 30,000 FCFA/mo', '8': 'Standard Tutoring · 8 sessions · 60,000 FCFA/mo' },
fr: { '4': 'Soutien scolaire standard · 4 séances · 30 000 FCFA/mois', '8': 'Soutien scolaire standard · 8 séances · 60 000 FCFA/mois' }
}
};
var lang = getLang();
var set = packs[kind];
if (!set) return '';
return (set[lang] || set.en)[freq] || set.en['4'];
}
function revealEnrolFaqSection() {
var faq = document.getElementById('faq');
if (!faq) return;
faq.classList.remove('service-context-hidden');
faq.querySelectorAll('.faq-item[data-service-scope="academic"]').forEach(function(item) {
item.classList.remove('service-context-hidden');
});
}
function navigateToEnrolFaq(e) {
if (e) e.preventDefault();
closeEnrolTermsModal();
var faqLink = document.getElementById('enrolTermsFaqLink');
var href = faqLink ? faqLink.getAttribute('href') : '';
if (href && href.indexOf('/faq') !== -1) {
window.location.href = href;
return;
}
revealEnrolFaqSection();
if (history.replaceState) {
history.replaceState(null, '', '#faq');
} else {
window.location.hash = 'faq';
}
scrollToAnchor('faq');
}
var packageEnrolInit = false;


var CERTIFIED_PAGE_RATE = 15000;
function initCertifiedEstimate() {
var section = document.getElementById('certified-estimate');
if (!section || section.dataset.ceInit) return;
section.dataset.ceInit = '1';
var input = document.getElementById('ce-pages');
var btn = document.getElementById('ce-show-btn');
var out = document.getElementById('ce-result');
var curEl = document.getElementById('ce-currency');
if (!input || !btn || !out) return;
function render() {
var lang = getLang();
var pages = Math.floor(parseFloat(input.value) || 0);
if (pages < 1) {
out.textContent = lang === 'fr'
? 'Indiquez un nombre de pages — une page au minimum.'
: 'Enter a number of pages — one page minimum.';
return;
}
if (pages > 200) pages = 200;
var cur = curEl ? curEl.value : 'FCFA';
var nb = function(v) { return String(v).replace(/ /g, ' '); };
var total = pages * CERTIFIED_PAGE_RATE;
var money = nb(formatEstimateMoney(total, cur, lang));
var unit = nb(formatEstimateMoney(CERTIFIED_PAGE_RATE, cur, lang));
var pageWord = pages > 1 ? ' pages' : ' page';
var sum = pages + pageWord + ' × ' + unit;
var wa = lang === 'fr'
? 'Bonjour Azaël, je souhaite un devis pour une traduction certifiée.\n\nNombre de pages : ' + pages + '\nDocuments :\nDestination (pays / établissement) :\nDate de dépôt :'
: 'Hello Azaël, I would like a quote for a certified translation.\n\nNumber of pages: ' + pages + '\nDocuments:\nDestination (country / institution):\nFiling date:';
out.innerHTML = '';
var strong = document.createElement('strong');
strong.textContent = sum + ' = ' + money;
out.appendChild(strong);
var note = document.createElement('span');
note.className = 'ce-result__note';
note.textContent = lang === 'fr'
? 'À partir de. Les pièces denses (contrats, jugements) se facturent au mot — je confirme le prix exact sous 2 heures ouvrées après avoir vu les documents.'
: 'Starting price. Dense documents (contracts, court rulings) are priced per word — I confirm the exact price within 2 working hours once I have seen the files.';

var fxNote = buildEstimateFxNote({ currency: cur, accountType: 'individual' }, lang);
if (fxNote) note.textContent += ' ' + fxNote;
out.appendChild(note);
var link = document.createElement('a');
link.className = 'btn--wa ce-result__cta';
link.href = 'https://wa.me/22879716258?text=' + encodeURIComponent(wa);
link.target = '_blank';
link.rel = 'noopener noreferrer';
link.textContent = lang === 'fr' ? 'Envoyer les documents — devis sous 2 h' : 'Send the documents — quote in 2h';
out.appendChild(link);
trackEvent('certified_estimate_view', String(pages));
}
function show() {
if (btn.disabled) return;
btn.disabled = true;
ensureFxRatesReady()
.then(function() { render(); })
.catch(function() { render(); })
.then(function() { btn.disabled = false; });
}
btn.addEventListener('click', show);
input.addEventListener('keydown', function(e) {
if (e.key === 'Enter') { e.preventDefault(); show(); }
});

if (curEl) curEl.addEventListener('change', function() { if (out.innerHTML) show(); });
}
function initPackageEnrol() {
if (packageEnrolInit) return;
packageEnrolInit = true;
var modal = document.getElementById('enrolTermsModal');
var checkbox = document.getElementById('enrolTermsAccept');
var confirm = document.getElementById('enrolTermsConfirm');
var closeBtn = document.getElementById('enrolTermsClose');
var cancelBtn = document.getElementById('enrolTermsCancel');
var faqLink = document.getElementById('enrolTermsFaqLink');
document.addEventListener('click', function(e) {
var btn = e.target.closest('[data-enrol-package], [data-enrol-dynamic]');
if (!btn) return;
e.preventDefault();
e.stopPropagation();
var courseId = btn.getAttribute('data-course-id');
if (courseId) setSelectedCourseId(courseId);
var pkg = btn.getAttribute('data-enrol-package');
if (!pkg && btn.hasAttribute('data-enrol-dynamic')) {
pkg = getDynamicEnrolPackage(btn.getAttribute('data-enrol-dynamic'));
}
if (!pkg) return;
showCoursesPackagesAllTracks();
openEnrolTermsModal(pkg, btn);
});
if (checkbox && confirm) {
checkbox.addEventListener('change', function() {
confirm.disabled = !checkbox.checked;
});
}
if (confirm) {
confirm.addEventListener('click', function() {
if (!checkbox || !checkbox.checked || !pendingEnrolPackage) return;
var pkg = pendingEnrolPackage;
closeEnrolTermsModal();
openEnrolWhatsApp(pkg);
});
}
if (closeBtn) closeBtn.addEventListener('click', closeEnrolTermsModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeEnrolTermsModal);
if (modal) {
modal.addEventListener('click', function(e) {
if (e.target === modal) closeEnrolTermsModal();
});
}
if (faqLink) {
faqLink.addEventListener('click', navigateToEnrolFaq);
}
}
function setActiveNavLink() {
var path = window.location.pathname;
var hash = window.location.hash;
document.querySelectorAll('.nav-links a[href]').forEach(function(a) {
var href = a.getAttribute('href');
if (!href || href.indexOf('http') === 0 || href.indexOf('calendly') >= 0) return;
a.classList.remove('active');
var parts = href.split('#');
var linkPath = new URL(parts[0] || '.', window.location.href).pathname;
var samePath = linkPath === path ||
linkPath.replace(/\/index\.html$/, '/') === path.replace(/\/index\.html$/, '/');
if (parts[1]) {
if (samePath && hash === '#' + parts[1]) a.classList.add('active');
} else if (samePath && !parts[1]) {
a.classList.add('active');
}
});
document.querySelectorAll('.nav-dropdown-toggle').forEach(function(btn) {
btn.classList.remove('active');
var dd = btn.closest('.nav-dropdown');
if (!dd) return;
var match = dd.querySelector('.nav-dropdown-menu a.active');
if (match) btn.classList.add('active');
});
}
function applySectionNav() {
if (!/\/business(\/|$)/.test(window.location.pathname)) return;
document.querySelectorAll('[data-nav-bucket="academic"]').forEach(function(el) {
el.classList.add('nav-section-hidden');
});
}
var SERVICE_CTX_KEY = 'azaelServiceContext';
var REVIEW_SERVICE_FOR = {
sworn: { en: 'Certified Translation', fr: 'Traduction certifiée' },
general: { en: 'General Translation', fr: 'Traduction générale' },
training: { en: 'Corporate Training', fr: 'Formation entreprise' },
interpretation: { en: 'Interpretation', fr: 'Interprétation' },
tutoring: { en: 'Academic Tutoring', fr: 'Soutien scolaire' },
courses: { en: 'Language Courses', fr: 'Cours de langues' },
content: { en: 'Web Content & SEO', fr: 'Contenu web & SEO' },
lawfirms: { en: 'Law Firms', fr: 'Cabinets juridiques' },
transcription: { en: 'Transcription', fr: 'Transcription' },
icao: { en: 'Aviation English (ICAO)', fr: 'Anglais aéronautique (OACI)' }
};
var PAGE_SERVICES = {
business: ['general', 'training', 'interpretation'],
interpretation: ['interpretation'],
courses: ['courses']
};
var NAV_HIDE_FRAGMENTS = {
general: ['#svc-training'],
training: ['#svc-general'],
interpretation: ['#svc-general', '#svc-training']
};
var NAV_HIDE_SERVICES = {
general: ['training'],
training: ['general'],
interpretation: ['general', 'training']
};
var FORM_OPTIONS_FOR = {
sworn: ['Certified Translation', 'Traduction certifiée', 'Law Firms', 'Cabinets juridiques'],
general: ['General Translation', 'Traduction générale', 'Web Content & SEO', 'Contenu web & SEO'],
training: ['Corporate Training', 'Formation entreprise', 'Formation linguistique entreprise', 'Professional Retainer', 'Forfait professionnel'],
interpretation: ['Interpretation', 'Interprétation'],
tutoring: ['Academic Tutoring', 'Soutien scolaire'],
courses: ['Language Courses', 'Cours de langues', 'Professional Retainer', 'Forfait professionnel'],
content: ['Web Content & SEO', 'Contenu web & SEO'],
lawfirms: ['Law Firms', 'Cabinets juridiques'],
transcription: ['Transcription'],
icao: ['Aviation English (ICAO)', 'Anglais aéronautique (OACI)']
};
var CF_SERVICE_TO_CTX = {
'Certified Translation': 'sworn',
'Traduction certifiée': 'sworn',
'Law Firms': 'lawfirms',
'Cabinets juridiques': 'lawfirms',
'General Translation': 'general',
'Traduction générale': 'general',
'Web Content & SEO': 'content',
'Contenu web & SEO': 'content',
'Corporate Training': 'training',
'Formation entreprise': 'training',
'Formation linguistique entreprise': 'training',
'Professional Retainer': 'training',
'Forfait professionnel': 'training',
'Interpretation': 'interpretation',
'Interprétation': 'interpretation',
'Academic Tutoring': 'tutoring',
'Soutien scolaire': 'tutoring',
'Language Courses': 'courses',
'Cours de langues': 'courses',
'Transcription': 'transcription',
'Aviation English (ICAO)': 'icao',
'Anglais aéronautique (OACI)': 'icao'
};
var DOC_TYPE_OPTIONS = {
sworn: [
{ en: { v: 'Birth / Marriage Certificate', l: 'Birth / Marriage Certificate' }, fr: { v: 'Acte de naissance / mariage', l: 'Acte de naissance / mariage' } },
{ en: { v: 'Diploma / Transcript', l: 'Diploma / Transcript' }, fr: { v: 'Diplôme / Relevé de notes', l: 'Diplôme / Relevé de notes' } },
{ en: { v: 'Identity / Passport', l: 'Identity / Passport' }, fr: { v: 'Identité / Passeport', l: 'Identité / Passeport' } },
{ en: { v: 'Criminal Record', l: 'Criminal Record' }, fr: { v: 'Casier judiciaire', l: 'Casier judiciaire' } },
{ en: { v: 'Court / Judicial Document', l: 'Court / Judicial Document' }, fr: { v: 'Document judiciaire', l: 'Document judiciaire' } },
{ en: { v: 'Power of Attorney / Notarial Act', l: 'Power of Attorney / Notarial Act' }, fr: { v: 'Procuration / Acte notarié', l: 'Procuration / Acte notarié' } },
{ en: { v: 'Several documents (visa or study file)', l: 'Several documents (visa or study file)' }, fr: { v: 'Plusieurs documents (dossier visa ou études)', l: 'Plusieurs documents (dossier visa ou études)' } },
{ en: { v: 'Other official document', l: 'Other official document' }, fr: { v: 'Autre document officiel', l: 'Autre document officiel' } }
],
general: [
{ en: { v: 'Commercial Contract', l: 'Commercial Contract' }, fr: { v: 'Contrat commercial', l: 'Contrat commercial' } },
{ en: { v: 'Corporate / NGO Report', l: 'Corporate / NGO Report' }, fr: { v: 'Rapport entreprise / ONG', l: 'Rapport entreprise / ONG' } },
{ en: { v: 'Institutional / Project Document', l: 'Institutional / Project Document' }, fr: { v: 'Document institutionnel / projet', l: 'Document institutionnel / projet' } },
{ en: { v: 'Marketing / Website Content', l: 'Marketing / Website Content' }, fr: { v: 'Contenu marketing / site web', l: 'Contenu marketing / site web' } },
{ en: { v: 'Financial / Audit Report', l: 'Financial / Audit Report' }, fr: { v: 'Rapport financier / audit', l: 'Rapport financier / audit' } },
{ en: { v: 'Training / Internal Material', l: 'Training / Internal Material' }, fr: { v: 'Supports de formation / interne', l: 'Supports de formation / interne' } },
{ en: { v: 'Several documents', l: 'Several documents' }, fr: { v: 'Plusieurs documents', l: 'Plusieurs documents' } },
{ en: { v: 'Other', l: 'Other' }, fr: { v: 'Autre', l: 'Autre' } }
]
};
var DEADLINE_OPTIONS = {
sworn: [
{ en: { v: 'Express 24h (+50%)', l: 'Express 24h (+50%)' }, fr: { v: 'Express 24h (+50%)', l: 'Express 24h (+50%)' } },
{ en: { v: 'Within 3–5 business days', l: 'Within 3–5 business days' }, fr: { v: 'Sous 3–5 jours ouvrables', l: 'Sous 3–5 jours ouvrables' } },
{ en: { v: 'Within 1 week', l: 'Within 1 week' }, fr: { v: 'Sous 1 semaine', l: 'Sous 1 semaine' } },
{ en: { v: 'Flexible / No rush', l: 'Flexible / No rush' }, fr: { v: 'Flexible / Pas urgent', l: 'Flexible / Pas urgent' } }
],
general: [
{ en: { v: 'Urgent priority (+30% to +50%)', l: 'Urgent priority (+30% to +50%)' }, fr: { v: 'Tarif d’urgence prioritaire (+30\u00A0% à +50\u00A0%)', l: 'Tarif d’urgence prioritaire (+30\u00A0% à +50\u00A0%)' } },
{ en: { v: 'Within 3–5 business days', l: 'Within 3–5 business days' }, fr: { v: 'Sous 3–5 jours ouvrables', l: 'Sous 3–5 jours ouvrables' } },
{ en: { v: 'Within 1 week', l: 'Within 1 week' }, fr: { v: 'Sous 1 semaine', l: 'Sous 1 semaine' } },
{ en: { v: 'Flexible / No rush', l: 'Flexible / No rush' }, fr: { v: 'Flexible / Pas urgent', l: 'Flexible / Pas urgent' } }
]
};
var CONTENT_SCOPE_INCLUDES = {
sworn: ['sworn', 'translation', 'shared'],
general: ['general', 'translation', 'shared'],
training: ['training', 'shared'],
interpretation: ['interpretation', 'shared'],
tutoring: ['tutoring', 'academic', 'shared'],
courses: ['courses', 'academic', 'shared'],
content: ['general', 'translation', 'shared'],
lawfirms: ['sworn', 'translation', 'shared']
};
var AUX_SECTION_COPY = {
business: {
training: {
trust: {
en: { eyebrow: 'Why Corporate Clients', title: 'Built for teams, not documents' },
fr: { eyebrow: 'Pourquoi les entreprises', title: 'Conçu pour les équipes, pas les documents' }
},
policies: {
en: { eyebrow: 'Programme Terms', title: 'Clear retainer terms. No surprises.', sub: 'These terms apply to the Corporate Training monthly retainer.' },
fr: { eyebrow: 'Conditions du programme', title: 'Conditions claires. Aucune surprise.', sub: 'Ces conditions s\'appliquent au contrat mensuel de Formation entreprise.' }
}
}
}
};
var auxSectionDefaults = {};
var NAV_CTA_BY_CONTEXT = {
home: { href: '#funnel-paths', en: 'Find Your Path', fr: 'Trouver mon parcours' },
hub: { href: '#page-hub-funnel', en: 'Choose a Service', fr: 'Choisir un service' },
sworn: { href: '#quote-intake', en: 'Request a free quote', fr: 'Demander un devis gratuit' },
general: { href: '#quote-intake', en: 'Request a free quote', fr: 'Demander un devis gratuit' },
training: { href: '#contact', en: 'Send a Training Inquiry', fr: 'Demande de formation' },
interpretation: { href: '#quote-intake', en: 'Request a free quote', fr: 'Demander un devis gratuit' },
tutoring: { href: '#book-packages', en: 'View Packages', fr: 'Voir les forfaits' },
courses: { href: '#course-pricing-hub', en: 'View Packages', fr: 'Voir les forfaits' }
};
var PACKAGE_HIDE_SERVICES = ['sworn'];
var SERVICE_SECTION_COPY = {
business: {
sworn: {
en: { eyebrow: 'Certified & Corporate Language Services', title: 'Official certified translation' },
fr: { eyebrow: 'Services linguistiques certifiés & B2B', title: 'Traduction certifiée officielle' }
},
general: {
en: { eyebrow: 'Professional Translation', title: 'General translation for contracts, reports & institutions' },
fr: { eyebrow: 'Traduction professionnelle', title: 'Traduction générale pour contrats, rapports & institutions' }
},
training: {
en: { eyebrow: 'Corporate Training', title: 'Monthly language retainer for your team' },
fr: { eyebrow: 'Formation entreprise', title: 'Contrat mensuel linguistique pour votre équipe' }
}
},
courses: {
tutoring: {
en: { eyebrow: 'Individual & Private Services', title: 'Exam-focused tutoring — BAC, BEPC' },
fr: { eyebrow: 'Services aux particuliers', title: 'Soutien scolaire tourné vers l’examen — BAC, BEPC' }
},
courses: {
en: { eyebrow: 'Individual & Private Services', title: 'Adult English & French courses — A1 to C2' },
fr: { eyebrow: 'Services aux particuliers', title: 'Cours d’anglais et de français pour adultes — A1 à C2' }
},
sworn: {
en: { eyebrow: 'Individual & Private Services', title: 'Personal document translation — visa & university files' },
fr: { eyebrow: 'Services aux particuliers', title: 'Traduction de documents personnels — visa & université' }
}
}
};
var serviceSectionDefaults = null;
function initServiceCardNumbers() {
document.querySelectorAll('.svc-card .svc-num').forEach(function(numEl) {
if (!numEl.dataset.svcNum) numEl.dataset.svcNum = numEl.textContent.trim();
});
}
function captureServiceSectionDefaults() {
var section = document.getElementById('services');
if (!section || serviceSectionDefaults) return;
serviceSectionDefaults = {
en: {
eyebrow: (section.querySelector('.eyebrow[data-en]') || {}).textContent || '',
title: (section.querySelector('.section-title[data-en]') || {}).textContent || ''
},
fr: {
eyebrow: (section.querySelector('.eyebrow[data-fr]') || {}).textContent || '',
title: (section.querySelector('.section-title[data-fr]') || {}).textContent || ''
}
};
}
function applyServiceSectionCopy(pageKind, service) {
var section = document.getElementById('services');
if (!section) return;
captureServiceSectionDefaults();
var copy = service
? (SERVICE_SECTION_COPY[pageKind] && SERVICE_SECTION_COPY[pageKind][service])
: null;
var src = copy || serviceSectionDefaults;
if (!src) return;
var eyebrowEn = section.querySelector('.eyebrow[data-en]');
var eyebrowFr = section.querySelector('.eyebrow[data-fr]');
var titleEn = section.querySelector('.section-title[data-en]');
var titleFr = section.querySelector('.section-title[data-fr]');
if (src.en) {
if (eyebrowEn) eyebrowEn.textContent = src.en.eyebrow;
if (titleEn) titleEn.textContent = src.en.title;
}
if (src.fr) {
if (eyebrowFr) eyebrowFr.textContent = src.fr.eyebrow;
if (titleFr) titleFr.textContent = src.fr.title;
}
}
function applyServiceGridLayout() {
document.querySelectorAll('.services .services-grid').forEach(function(grid) {
grid.classList.remove('services-grid--solo', 'services-grid--duo', 'services-grid--trio');
var visible = [];
grid.querySelectorAll('.svc-card').forEach(function(card) {
card.classList.remove('svc-card--featured');
if (card.classList.contains('service-context-hidden')) {
var numEl = card.querySelector('.svc-num');
if (numEl && numEl.dataset.svcNum) numEl.textContent = numEl.dataset.svcNum;
return;
}
if (card.classList.contains('svc-card--span')) return;
visible.push(card);
});
if (visible.length === 1) {
grid.classList.add('services-grid--solo');
visible[0].classList.add('svc-card--featured');
} else if (visible.length === 2) {
grid.classList.add('services-grid--duo');
} else if (visible.length === 3) {
grid.classList.add('services-grid--trio');
}
visible.forEach(function(card, index) {
var numEl = card.querySelector('.svc-num');
if (numEl) numEl.textContent = String(index + 1).padStart(2, '0');
});
});
}
function getPageKind() {
var path = window.location.pathname;
if (/\/business(\/|$)/.test(path)) return 'business';
if (/\/courses(\/|$)/.test(path)) return 'courses';
return null;
}
function getServiceFromHash() {
var hash = window.location.hash.replace('#', '');
if (hash === 'svc-retainer') {
return getPageKind() === 'courses' ? 'courses' : 'training';
}
if (hash === 'interpretation') return 'interpretation';
if (hash === 'course-pricing-hub' || hash === 'course-formats') return 'courses';
return /^svc-(sworn|general|training|tutoring|courses)$/.test(hash) ? hash.replace('svc-', '') : null;
}
function persistServiceContext(service) {
try {
if (service) sessionStorage.setItem(SERVICE_CTX_KEY, service);
else sessionStorage.removeItem(SERVICE_CTX_KEY);
} catch (e) {}
}
function readPersistedServiceContext() {
try {
var saved = sessionStorage.getItem(SERVICE_CTX_KEY);
return saved;
} catch (e) { return null; }
}
function resolveActiveService() {
var fromHash = getServiceFromHash();
if (fromHash) {
persistServiceContext(fromHash);
return fromHash;
}
var svcParam = new URLSearchParams(window.location.search).get('service');
if (svcParam) {
var fromQuery = CF_SERVICE_TO_CTX[decodeURIComponent(svcParam)];
if (fromQuery) {
persistServiceContext(fromQuery);
return fromQuery;
}
}
var pageKind = getPageKind();
if (!pageKind) {
persistServiceContext(null);
return null;
}
var anchor = window.location.hash.replace('#', '');
if (anchor === 'quote-intake' || anchor === 'contact' || anchor === 'general-estimate' || anchor === 'book-packages' || anchor === 'course-formats') {
var saved = readPersistedServiceContext();
if (saved && PAGE_SERVICES[pageKind].indexOf(saved) !== -1) return saved;
}
persistServiceContext(null);
return null;
}
function resetServiceContext() {
document.querySelectorAll('.service-context-hidden').forEach(function(el) {
el.classList.remove('service-context-hidden');
});
var siteFooter = document.getElementById('site-footer');
if (siteFooter) {
siteFooter.classList.remove('service-context-hidden');
siteFooter.querySelectorAll('.af__inner, .af__grid, .af__brand, .af__col, .af__contact, .af__divider').forEach(function(el) {
el.classList.remove('service-context-hidden');
});
}
if (typeof ensureFooterLocaleVisible === 'function') ensureFooterLocaleVisible();
document.querySelectorAll('#cf-service option, #wr-service option, #wr-service-fr option').forEach(function(opt) {
opt.hidden = false;
opt.disabled = false;
});
var tabsBar = document.querySelector('.proc-tabs');
if (tabsBar) tabsBar.classList.remove('service-context-hidden');
document.querySelectorAll('.services-grid').forEach(function(grid) {
grid.classList.remove('services-grid--solo', 'services-grid--duo', 'services-grid--trio');
});
document.querySelectorAll('.svc-card--featured').forEach(function(card) {
card.classList.remove('svc-card--featured');
});
document.querySelectorAll('.svc-num[data-svc-num]').forEach(function(numEl) {
numEl.textContent = numEl.dataset.svcNum;
});
var pageKind = getPageKind();
if (pageKind && serviceSectionDefaults) applyServiceSectionCopy(pageKind, null);
if (contactSectionDefaults) applyContactSectionCopyFromService('');
if (pageKind) applyAuxSectionCopy(pageKind, null);
var payment = document.getElementById('payment');
if (payment) payment.classList.remove('payment-order--individual-first', 'payment-order--institutional-first');
updatePrequalVisibility();
}
function hideNavLinksForFragments(fragments) {
if (!fragments || !fragments.length) return;
document.querySelectorAll('.nav-links a[href]').forEach(function(a) {
var href = a.getAttribute('href') || '';
var match = fragments.some(function(frag) { return href.indexOf(frag) !== -1; });
if (match) a.classList.add('service-context-hidden');
});
}
function hideNavLinksForService(service) {
var hide = NAV_HIDE_SERVICES[service] || [];
document.querySelectorAll('[data-nav-service]').forEach(function(el) {
var svc = el.getAttribute('data-nav-service');
if (hide.indexOf(svc) !== -1) el.classList.add('service-context-hidden');
});
}
function prefillReviewService(service) {
var map = REVIEW_SERVICE_FOR[service];
if (!map) return;
var enSel = document.getElementById('wr-service');
var frSel = document.getElementById('wr-service-fr');
if (enSel) {
for (var i = 0; i < enSel.options.length; i++) {
var opt = enSel.options[i];
if (opt.value === map.en && !opt.hidden && !opt.disabled) {
enSel.value = map.en;
break;
}
}
}
if (frSel) {
for (var j = 0; j < frSel.options.length; j++) {
var optFr = frSel.options[j];
if (optFr.value === map.fr && !optFr.hidden && !optFr.disabled) {
frSel.value = map.fr;
break;
}
}
}
}
function applyPaymentBlockOrder(service) {
var section = document.getElementById('payment');
if (!section || !section.querySelector('.payment-blocks')) return;
section.classList.remove('payment-order--individual-first', 'payment-order--institutional-first');
if (service === 'sworn') section.classList.add('payment-order--individual-first');
else section.classList.add('payment-order--institutional-first');
}
function filterFormOptionsForService(service) {
var allowed = FORM_OPTIONS_FOR[service];
if (!allowed) return;
prefillContactServiceForContext(service);
updateDocTypeOptions(service);
updateDeadlineOptions(service);
syncBilingualSelectOptions(document, service);
var cf = document.getElementById('cf-service');
updatePrequalVisibility();
if (cf) applyContactSectionCopyFromService(cf.value);
prefillReviewService(service);
}
function applyHeroContext(service) {
document.querySelectorAll('.hero-context').forEach(function(el) {
var ctx = el.getAttribute('data-hero-for');
if (ctx === service) el.classList.remove('service-context-hidden');
else el.classList.add('service-context-hidden');
});
}
function applyNavCta(contextKey) {
var cfg = NAV_CTA_BY_CONTEXT[contextKey];
if (!cfg) return;
document.querySelectorAll('.nav-cta').forEach(function(a) {
a.setAttribute('href', cfg.href);
if (cfg.external) {
a.setAttribute('target', '_blank');
a.setAttribute('rel', 'noopener noreferrer');
} else {
a.removeAttribute('target');
a.removeAttribute('rel');
}
if (a.hasAttribute('data-en')) a.textContent = cfg.en;
if (a.hasAttribute('data-fr')) a.textContent = cfg.fr;
});
}
function setFunnelBodyVisible(visible) {
var pageKind = getPageKind();
document.querySelectorAll('[data-funnel-body]').forEach(function(el) {
if (!visible && el.id === 'contact' && (pageKind === 'business' || pageKind === 'courses')) {
el.classList.remove('service-context-hidden');
return;
}
if (visible) el.classList.remove('service-context-hidden');
else el.classList.add('service-context-hidden');
});
}
function applyHubMode(pageKind) {
var hub = document.getElementById('page-hub-funnel');
if (hub) hub.classList.remove('service-context-hidden');
var pricingHub = document.getElementById('course-pricing-hub');
if (pricingHub) pricingHub.classList.add('service-context-hidden');
setFunnelBodyVisible(false);
applyHeroContext('hub');
applyNavCta('hub');
if (getPageAnchor() === 'page-hub-funnel') scrollToAnchor('page-hub-funnel');
applyQuoteEstimatorVisibility(null);
}
function scrollToAnchor(id) {
var el = typeof id === 'string' ? document.getElementById(id) : id;
if (!el) return;
requestAnimationFrame(function() {
requestAnimationFrame(function() {
el.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
});
}
function getPageAnchor() {
return window.location.hash.replace('#', '');
}
function scrollToFunnelTarget(service) {
var hash = getPageAnchor();
if (hash === 'svc-retainer') {
scrollToAnchor('svc-retainer');
return;
}
if (hash === 'course-pricing-hub') {
scrollToAnchor('course-pricing-hub');
return;
}
if (hash === 'book-packages' || hash === 'course-formats') {
scrollToAnchor('book-packages');
return;
}
if (hash === 'interpretation') {
var interpPath = (document.documentElement.lang === 'fr' || /(?:^|\/)fr(?:\/|$)/.test(location.pathname))
? '/fr/interpretation/'
: '/interpretation/';
if (!/(?:^|\/)interpretation\/?$/.test(location.pathname.replace(/\\/g, '/'))) {
location.replace(interpPath);
return;
}
scrollToAnchor('interpretation');
return;
}
if (hash === 'quote-intake' || hash === 'contact' || hash === 'general-estimate') {
scrollToAnchor(hash === 'contact' ? 'contact' : (hash === 'general-estimate' ? 'general-estimate' : (service === 'training' ? 'contact' : 'quote-intake')));
return;
}
if (hash === 'page-hub-funnel') {
scrollToAnchor('page-hub-funnel');
return;
}
if (!getServiceFromHash()) return;
var target = service === 'courses'
? (document.getElementById('course-pricing-hub') || document.getElementById('svc-' + service))
: document.getElementById('svc-' + service);
if (!target) target = document.getElementById('services');
if (target) scrollToAnchor(target);
}
function showCoursesPackagesAllTracks() {
var packages = document.getElementById('book-packages');
if (!packages) return;
packages.classList.remove('service-context-hidden');
packages.querySelectorAll('[data-service-scope]').forEach(function(el) {
el.classList.remove('service-context-hidden');
});
applyCourseTrackLayout();
}
function applyColdSectionDeepLink(pageKind, anchor) {
var hubEl = document.getElementById('page-hub-funnel');
if (hubEl) hubEl.classList.add('service-context-hidden');
var saved = readPersistedServiceContext();
if (anchor === 'general-estimate' || saved === 'general') {
setFunnelBodyVisible(true);
} else {
var showId = anchor === 'quote-intake' || anchor === 'contact' ? 'contact'
: (anchor === 'svc-retainer' && pageKind === 'courses' ? 'book-packages' : anchor);
document.querySelectorAll('[data-funnel-body]').forEach(function(el) {
if (el.id === showId) el.classList.remove('service-context-hidden');
else el.classList.add('service-context-hidden');
});
}
if (saved && PAGE_SERVICES[pageKind].indexOf(saved) !== -1) {
applyHeroContext(saved);
applyNavCta(saved);
isolateServiceContent(pageKind, saved);
} else if (anchor === 'general-estimate' && pageKind === 'business') {
persistServiceContext('general');
applyHeroContext('general');
applyNavCta('general');
isolateServiceContent(pageKind, 'general');
} else {
var navKey = (anchor === 'book-packages' || (anchor === 'svc-retainer' && pageKind === 'courses'))
? 'courses'
: (pageKind === 'courses' ? 'courses' : 'general');
applyNavCta(navKey);
applyQuoteEstimatorVisibility(null);
}
if (pageKind === 'courses' && (anchor === 'book-packages' || anchor === 'course-formats' || anchor === 'svc-retainer')) {
showCoursesPackagesAllTracks();
}
scrollToAnchor(saved === 'training' && anchor === 'quote-intake' ? 'contact' : anchor);
}
function applyContentScope(service) {
if (!service) return;
var allowed = CONTENT_SCOPE_INCLUDES[service] || [];
document.querySelectorAll('[data-service-scope]').forEach(function(el) {
if (allowed.indexOf(el.getAttribute('data-service-scope')) === -1) {
el.classList.add('service-context-hidden');
}
});
}
function captureAuxSectionDefaults(pageKind) {
if (auxSectionDefaults[pageKind]) return;
auxSectionDefaults[pageKind] = {};
['trust', 'policies'].forEach(function(sectionId) {
var section = document.getElementById(sectionId);
if (!section) return;
auxSectionDefaults[pageKind][sectionId] = {
en: {
eyebrow: (section.querySelector('.eyebrow[data-en]') || {}).textContent || '',
title: (section.querySelector('.section-title[data-en]') || {}).textContent || '',
sub: (section.querySelector('.policies-sub[data-en]') || {}).textContent || ''
},
fr: {
eyebrow: (section.querySelector('.eyebrow[data-fr]') || {}).textContent || '',
title: (section.querySelector('.section-title[data-fr]') || {}).textContent || '',
sub: (section.querySelector('.policies-sub[data-fr]') || {}).textContent || ''
}
};
});
}
function applyAuxSectionCopy(pageKind, service) {
captureAuxSectionDefaults(pageKind);
var defaults = auxSectionDefaults[pageKind] || {};
var copy = service && AUX_SECTION_COPY[pageKind] ? AUX_SECTION_COPY[pageKind][service] : null;
['trust', 'policies'].forEach(function(sectionId) {
var section = document.getElementById(sectionId);
if (!section) return;
var src = (copy && copy[sectionId]) ? copy[sectionId] : defaults[sectionId];
if (!src) return;
['en', 'fr'].forEach(function(lang) {
var eyebrowEl = section.querySelector('.eyebrow[data-' + lang + ']');
var titleEl = section.querySelector('.section-title[data-' + lang + ']');
var subEl = section.querySelector('.policies-sub[data-' + lang + ']');
if (eyebrowEl && src[lang].eyebrow) eyebrowEl.textContent = src[lang].eyebrow;
if (titleEl && src[lang].title) titleEl.textContent = src[lang].title;
if (subEl && src[lang].sub !== undefined) subEl.textContent = src[lang].sub;
});
});
}
function isHomePage() {
var path = window.location.pathname.replace(/\/index\.html$/i, '/');
return path === '/' || path === '/fr/';
}
function applyHomeFunnel() {
if (!isHomePage() || getPageKind()) return;
applyNavCta('home');
}
function isolateServiceContent(pageKind, service) {
var services = PAGE_SERVICES[pageKind];
if (!service || services.indexOf(service) === -1) return;
services.forEach(function(s) {
if (s === service) return;
var card = document.getElementById('svc-' + s);
if (card) card.classList.add('service-context-hidden');
});
var pricingHub = document.getElementById('course-pricing-hub');
if (pricingHub) {
if (service === 'courses') pricingHub.classList.remove('service-context-hidden');
else pricingHub.classList.add('service-context-hidden');
}
var visibleTabs = 0;
document.querySelectorAll('.proc-tab[data-service]').forEach(function(tab) {
var svc = tab.getAttribute('data-service');
if (services.indexOf(svc) === -1) return;
if (svc !== service) {
tab.classList.add('service-context-hidden');
} else {
visibleTabs++;
}
});
var tabsBar = document.querySelector('.proc-tabs');
if (tabsBar && visibleTabs <= 1) tabsBar.classList.add('service-context-hidden');
showProcess(service);
hideNavLinksForFragments(NAV_HIDE_FRAGMENTS[service] || []);
hideNavLinksForService(service);
applyContentScope(service);
applyPaymentBlockOrder(service);
var packages = document.getElementById('book-packages');
if (packages) {
var packagesAnchor = getPageAnchor() === 'book-packages' || getPageAnchor() === 'course-formats';
if (PACKAGE_HIDE_SERVICES.indexOf(service) !== -1 && !packagesAnchor) {
packages.classList.add('service-context-hidden');
} else if (pageKind === 'courses') {
packages.classList.remove('service-context-hidden');
}
}
filterFormOptionsForService(service);
applyServiceSectionCopy(pageKind, service);
applyAuxSectionCopy(pageKind, service);
applyContactSectionCopyForContext(service);
applyServiceGridLayout();
applyCourseTrackLayout();
applyQuoteEstimatorVisibility(service);
}
function applyCourseTrackLayout() {
var grid = document.querySelector('#book-packages .course-tracks');
if (!grid) return;
grid.classList.remove('course-tracks--solo', 'course-tracks--duo');
var visible = [];
grid.querySelectorAll('.course-track').forEach(function(track) {
track.classList.remove('course-track--featured');
if (!track.classList.contains('service-context-hidden')) visible.push(track);
});
if (visible.length === 1) {
grid.classList.add('course-tracks--solo');
visible[0].classList.add('course-track--featured');
} else if (visible.length === 2) {
grid.classList.add('course-tracks--duo');
}
}
function applyServiceContext() {
resetServiceContext();
applyHomeFunnel();
var pageKind = getPageKind();
if (!pageKind) {
requestReviewsRender();
return;
}
if (pageKind === 'business' && document.body.classList.contains('page-linear')) {
setFunnelBodyVisible(true);
applyHeroContext('hub');
applyNavCta('general');
var hubLinear = document.getElementById('page-hub-funnel');
if (hubLinear) hubLinear.classList.remove('service-context-hidden');
applyQuoteEstimatorVisibility('general');
prefillContactServiceForContext('general');
var businessHash = getPageAnchor();
if (businessHash === 'svc-retainer') {
prefillContactService(getLang() === 'fr' ? 'Forfait professionnel' : 'Professional Retainer');
}
if (businessHash === 'interpretation') {
location.replace(getLang() === 'fr' ? '/fr/interpretation/' : '/interpretation/');
return;
}
if (businessHash) scrollToAnchor(businessHash);
requestReviewsRender();
return;
}
var service = resolveActiveService();
var anchor = getPageAnchor();
if (!service && anchor === 'book-packages' && pageKind === 'courses') {
applyColdSectionDeepLink(pageKind, anchor);
requestReviewsRender();
return;
}
if (!service && (anchor === 'quote-intake' || anchor === 'contact' || anchor === 'general-estimate')) {
applyColdSectionDeepLink(pageKind, anchor);
requestReviewsRender();
return;
}
if (!service) {
if (pageKind === 'courses' && document.body.classList.contains('page-linear')) {
applyNavCta('courses');
var linearHash = getPageAnchor();
if (linearHash === 'course-pricing-hub' || linearHash === 'svc-retainer' || linearHash === 'book-packages' || linearHash === 'course-formats') {
scrollToAnchor(linearHash === 'book-packages' || linearHash === 'course-formats' ? 'course-pricing-hub' : linearHash);
}
requestReviewsRender();
return;
}
applyHubMode(pageKind);
requestReviewsRender();
return;
}
var hub = document.getElementById('page-hub-funnel');
if (hub) hub.classList.add('service-context-hidden');
setFunnelBodyVisible(true);
applyHeroContext(service);
applyNavCta(service);
isolateServiceContent(pageKind, service);
scrollToFunnelTarget(service);
if (anchor === 'svc-retainer') {
prefillContactService(getLang() === 'fr' ? 'Forfait professionnel' : 'Professional Retainer');
}
requestReviewsRender();
}
function closeNavDropdowns(except) {
document.querySelectorAll('.nav-dropdown.open').forEach(function(dd) {
if (except && dd === except) return;
dd.classList.remove('open');
var toggle = dd.querySelector('.nav-dropdown-toggle');
if (toggle) toggle.setAttribute('aria-expanded', 'false');
});
}
function initNavDropdowns() {
document.querySelectorAll('.nav-dropdown').forEach(function(dd) {
var toggle = dd.querySelector('.nav-dropdown-toggle');
if (!toggle) return;
toggle.addEventListener('click', function(e) {
e.stopPropagation();
var open = dd.classList.contains('open');
closeNavDropdowns();
if (!open) {
dd.classList.add('open');
toggle.setAttribute('aria-expanded', 'true');
}
});
dd.querySelectorAll('.nav-dropdown-menu a').forEach(function(a) {
a.addEventListener('click', function() { closeNavDropdowns(); });
});
});
document.addEventListener('click', function(e) {
if (!e.target.closest('.nav-dropdown')) closeNavDropdowns();
});
}
function trackEvent(action, label) {
try {
if (typeof gtag === 'function') gtag('event', action, { event_label: label });
} catch(e) {}
}
var ICON_CAL_PATH = 'M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9Zm-9 3a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm4 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm4 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm-8 4a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm4 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z';
var ICON_WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';
var ICON_EMAIL_PATH = 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2.236V6H4v.236l8 4.667 8-4.667ZM4 18V9.764l7.386 4.303a1.5 1.5 0 0 0 1.228 0L20 9.764V18H4Z';
var ICON_PATHS = { cal: ICON_CAL_PATH, wa: ICON_WA_PATH, email: ICON_EMAIL_PATH };
var EMOJI_CAL = '\uD83D\uDCC5';
var EMOJI_WA = '\uD83D\uDCF2';
var EMOJI_EMAIL = '\uD83D\uDCE7';
function emojiToIconType(emoji) {
if (emoji === EMOJI_CAL) return 'cal';
if (emoji === EMOJI_WA) return 'wa';
if (emoji === EMOJI_EMAIL) return 'email';
return 'cal';
}
function createInlineIcon(type) {
var span = document.createElement('span');
span.className = 'ico ico--' + type;
span.setAttribute('aria-hidden', 'true');
var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('viewBox', '0 0 24 24');
svg.setAttribute('focusable', 'false');
var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
path.setAttribute('fill', 'currentColor');
path.setAttribute('d', ICON_PATHS[type] || ICON_CAL_PATH);
svg.appendChild(path);
span.appendChild(svg);
return span;
}
function replaceEmojiIcons(root) {
var re = /\uD83D\uDCC5|\uD83D\uDCF2|\uD83D\uDCE7/g;
var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
var nodes = [];
var node;
while (node = walker.nextNode()) {
if (!re.test(node.textContent)) continue;
re.lastIndex = 0;
var parent = node.parentNode;
if (!parent) continue;
var tag = parent.tagName;
if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') continue;
nodes.push(node);
}
nodes.forEach(function(textNode) {
var text = textNode.textContent;
var frag = document.createDocumentFragment();
var last = 0;
var match;
re.lastIndex = 0;
while ((match = re.exec(text)) !== null) {
if (match.index > last) {
frag.appendChild(document.createTextNode(text.slice(last, match.index)));
}
frag.appendChild(createInlineIcon(emojiToIconType(match[0])));
last = match.index + match[0].length;
}
if (last < text.length) {
frag.appendChild(document.createTextNode(text.slice(last)));
}
textNode.parentNode.replaceChild(frag, textNode);
});
}
function initNavLinkTitles() {
var fullFr = { Entreprise: 'Parcours entreprise', Individuel: 'Cours & soutien' };
document.querySelectorAll('.nav-links a[href]').forEach(function(a) {
var label = (a.textContent || '').trim();
var full = fullFr[label] || label;
if (!full) return;
a.setAttribute('title', full);
if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', full);
});
document.querySelectorAll('.lang-btn--nav').forEach(function(btn) {
var t = (btn.textContent || '').trim();
var name = t === 'FR' ? 'Français' : 'English';
btn.setAttribute('title', name);
if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', name);
});
}
function shareLinkedIn(url) {
window.open(
'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
'_blank', 'noopener,width=600,height=600'
);
}
function shareWhatsApp(url, message) {
var text = message + ' ' + url;
window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
}
var shareToastTimer = null;
function showShareToast(message) {
var toast = document.getElementById('share-toast');
if (!toast) {
toast = document.createElement('div');
toast.id = 'share-toast';
toast.className = 'share-toast';
toast.setAttribute('role', 'status');
toast.setAttribute('aria-live', 'polite');
document.body.appendChild(toast);
}
toast.textContent = message;
toast.classList.add('share-toast--visible');
clearTimeout(shareToastTimer);
shareToastTimer = setTimeout(function () {
toast.classList.remove('share-toast--visible');
}, 2000);
}
function shareOrCopy(url, title, isFr) {
if (navigator.share) {
return navigator.share({ url: url, title: title }).catch(function() {});
}
return navigator.clipboard.writeText(url).then(function() {
showShareToast(isFr ? 'Lien copié\u00A0!' : 'Link copied!');
}).catch(function() {
showShareToast(isFr ? 'Impossible de copier le lien' : 'Could not copy link');
});
}
function initShareBars() {
var path = window.location.pathname.replace(/\\/g, '/');
var isFr = /(?:^|\/)fr(?:\/|$)/.test(path);
document.querySelectorAll('.share-bar').forEach(function(bar) {
var url = bar.getAttribute('data-url') || window.location.href;
var title = bar.getAttribute('data-title') || document.title;
var message = bar.getAttribute('data-message') || '';
var linkedInBtn = bar.querySelector('.share-linkedin');
var whatsAppBtn = bar.querySelector('.share-whatsapp');
var copyBtn = bar.querySelector('.share-copy');
if (linkedInBtn) {
linkedInBtn.addEventListener('click', function() { shareLinkedIn(url); });
}
if (whatsAppBtn) {
whatsAppBtn.addEventListener('click', function() { shareWhatsApp(url, message); });
}
if (copyBtn) {
copyBtn.addEventListener('click', function() { shareOrCopy(url, title, isFr); });
}
});
}
document.addEventListener('DOMContentLoaded', function() {
if (location.hash === '#page-count-policy' && /\/business(\/|$)/.test(window.location.pathname)) {
var onFrBiz = /(?:^|\/)fr\/business(?:\/|$)/.test(window.location.pathname.replace(/\\/g, '/'));
location.replace((onFrBiz ? '/fr/traduction-certifiee/' : '/certified-translation/') + '#pricing');
return;
}
initPackageEnrol();
initCertifiedEstimate();
replaceEmojiIcons(document.body);
initServiceCardNumbers();
initNavLinkTitles();
applySectionNav();
initNavDropdowns();
injectQuotePrequal();
syncBilingualSelectOptions(document);
initReviewsBrowsePage();
initReviewsLazyLoad();
initAnalyticsClickTracking();
initCookieConsent();
initShareBars();
syncModalAriaLabels();
applyServiceContext();
applyServiceGridLayout();
applyCourseTrackLayout();
setActiveNavLink();
applyContactDeepLink();
syncBilingualSelectOptions(document, readPersistedServiceContext);
window.addEventListener('hashchange', function() {
applyServiceContext();
applyServiceGridLayout();
applyCourseTrackLayout();
setActiveNavLink();
applyContactDeepLink();
});
document.addEventListener('click', function(e) {
var link = e.target.closest('a[data-cf-service], a[data-persist-service]');
if (!link) return;
var persistSvc = link.getAttribute('data-persist-service');
var svc = link.getAttribute('data-cf-service');
var ctx = svc ? CF_SERVICE_TO_CTX[svc] : null;
if (persistSvc) persistServiceContext(persistSvc);
else if (ctx) persistServiceContext(ctx);
var href = link.getAttribute('href') || '';
var isPackageLink = href.indexOf('#book-packages') !== -1 || href.indexOf('#course-formats') !== -1 || href.indexOf('#course-pricing-hub') !== -1 || href.indexOf('#svc-retainer') !== -1;
var isQuoteLink = href.indexOf('#quote-intake') !== -1 || href.indexOf('#contact') !== -1 || href.indexOf('#general-estimate') !== -1;
setTimeout(function () {
if (svc) prefillContactService(svc);
if ((isQuoteLink || isPackageLink) && getPageKind()) applyServiceContext();
}, (isQuoteLink || isPackageLink) ? 50 : 150);
});
document.addEventListener('keydown', function(e) {
if (e.key === 'Escape') {
var enrolModal = document.getElementById('enrolTermsModal');
if (enrolModal && enrolModal.classList.contains('open')) {
closeEnrolTermsModal();
return;
}
var estimateModal = document.getElementById('estimateResultModal');
if (estimateModal && estimateModal.classList.contains('open')) {
closeEstimateResultModal();
return;
}
closeReviewModal();
}
});
var btt = document.getElementById('backToTop');
if (btt) btt.addEventListener('click', function() {
window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.querySelectorAll('.proc-tab').forEach(function(tab) {
tab.addEventListener('click', function() {
var svc = this.getAttribute('data-service');
if (svc) showProcess(svc);
});
});

document.querySelectorAll('.faq-q').forEach(function(btn, i) {
var answer = btn.nextElementSibling;
if (answer && answer.classList.contains('faq-a')) {
if (!btn.id) btn.id = 'faq-q-' + (i + 1);
if (!answer.id) answer.id = 'faq-a-' + (i + 1);
btn.setAttribute('aria-controls', answer.id);
answer.setAttribute('aria-labelledby', btn.id);
}
btn.addEventListener('click', function(e) { toggleFaq(this); });
});
initPayAccordions();
initCoursePricingHub();
initRetainerPricing();
document.querySelectorAll('.freq-btn').forEach(function(btn) {
btn.addEventListener('click', function(e) {
var freq = this.getAttribute('data-freq');
if (freq) setFreq(freq);
});
});
document.addEventListener('click', function(e) {
var btn = e.target.closest('.policy-btn');
if (btn) togglePolicy(btn);
});
document.querySelectorAll('.star-btn').forEach(function(btn, i) {
btn.addEventListener('click', function(e) { setStars(i + 1); });
});
initStarA11y();

document.querySelectorAll('form.cf-form').forEach(function(form) {
form.addEventListener('submit', function(e) {
e.preventDefault();
if (window.location.pathname.indexOf('/business') !== -1) {
submitContactEmail();
} else {
submitContactForm();
}
});
});
document.querySelectorAll('.wr-submit').forEach(function(btn) {
btn.addEventListener('click', submitReview);
});
document.querySelectorAll('.visa-capture-submit').forEach(function(btn) {
btn.addEventListener('click', submitVisaChecklistEmail);
});
initVisaCaptureForm();
});

(function () {
var WA_BASE = 'https://wa.me/22879716258?text=';

var MSG = {
certified: {
en: ['Hello, I would like a quote for a certified translation.\n\nDocument:\nDestination (country / institution):\nFiling date:', 'Certified Translation'],
fr: ["Bonjour Azaël, je souhaite obtenir un devis pour une traduction certifiée.\n\nDocument\u00A0:\nDestination (pays / établissement)\u00A0:\nDate de dépôt\u00A0:", 'Traduction certifiée']
},
business: {
en: ['Hello, I would like a quote for my organisation.\n\nOrganisation:\nNeed:\nTimeline:', 'General Translation'],
fr: ["Bonjour Azaël, je souhaite obtenir un devis pour mon organisation.\n\nOrganisation\u00A0:\nBesoin\u00A0:\nPour quand\u00A0:", 'Traduction générale']
},
firm: {
en: ['Hello, I represent a law firm and would like the firm rate.\n\nFirm:\nTypical document types:\nEstimated monthly volume:', 'Certified Translation'],
fr: ["Bonjour Azaël, je représente un cabinet et souhaite recevoir la grille tarifaire dédiée aux partenaires.\n\nCabinet\u00A0:\nTypes de documents\u00A0:\nVolume mensuel estimé\u00A0:", 'Traduction certifiée']
},
interpretation: {
en: ['Hello, I need an interpreter.\n\nDate and place:\nLanguages:\nType of meeting:', 'Interpretation'],
fr: ["Bonjour Azaël, j’ai besoin d’un interprète.\n\nDate et lieu\u00A0:\nLangues\u00A0:\nType de rencontre\u00A0:", 'Interprétation']
},
transcription: {
en: ['Hello, I have a recording to transcribe.\n\nApproximate length:\nSpoken language:\nIntended use (case file, administration, publication):', 'Transcription'],
fr: ["Bonjour Azaël, j’ai un enregistrement à faire transcrire.\n\nDurée approximative\u00A0:\nLangue parlée\u00A0:\nUsage prévu (dossier, administration, publication)\u00A0:", 'Transcription']
},
web: {
en: ['Hello, I would like a quote for web content.\n\nSite or pages:\nApproximate word count:\nDeadline:', 'Web Content'],
fr: ["Bonjour, je souhaite un devis pour du contenu web.\n\nSite ou pages :\nNombre de mots approximatif :\nPour quand :", 'Contenu web']
},
icao: {
en: ['Hello, I would like information on ICAO Level 4 aviation English.\n\nCurrent level:\nTarget date:\nNumber of candidates:', 'Aviation English (ICAO)'],
fr: ["Bonjour Azaël, je souhaite obtenir des informations sur l’anglais aéronautique (OACI niveau 4).\n\nNiveau actuel\u00A0:\nÉchéance\u00A0:\nNombre de participants\u00A0:", 'Anglais aéronautique (OACI)']
},
courses: {
en: ['Hello, I would like information on language courses.\n\nLanguage:\nCurrent level:\nPreferred format (online / in person):', 'Language Courses'],
fr: ["Bonjour Azaël, je souhaite obtenir des informations sur les cours de langues.\n\nLangue\u00A0:\nNiveau actuel\u00A0:\nFormat souhaité (en ligne / en présentiel)\u00A0:", 'Cours de langues']
},
tutoring: {
en: ['Hello, I would like information on academic tutoring.\n\nClass or exam (BAC, BEPC):\nSubject:\nPreferred format (online / in person):', 'Academic Tutoring'],
fr: ["Bonjour, je souhaite des informations sur le soutien scolaire.\n\nClasse ou examen (BAC, BEPC) :\nMatière :\nFormat souhaité (en ligne / en présentiel) :", 'Soutien scolaire']
}
};

var CTA_ROUTES = {
'page-home': MSG.certified,
'page-certified': MSG.certified,
'page-guide-visa': MSG.certified,
'page-west-africa': MSG.certified,
'page-business': MSG.business,
'page-law-firms': MSG.firm,
'page-cabinets-juridiques': MSG.firm,
'page-interpretation': MSG.interpretation,
'page-transcription': MSG.transcription,
'page-content-translation': MSG.web,
'page-contenu-web': MSG.web,
'page-icao': MSG.icao,
'page-courses': MSG.courses,
'page-tutoring': MSG.tutoring
};

function initQuoteCtaRouting() {
var cta = document.querySelector('.ah__cta:not([hidden])');
if (!cta) return;
var isFr = (document.documentElement.lang || 'en').toLowerCase().indexOf('fr') === 0;
var cls = document.body.className.split(/\s+/);
for (var i = 0; i < cls.length; i++) {
var route = CTA_ROUTES[cls[i]];
if (!route) continue;
var pick = isFr ? route.fr : route.en;
cta.setAttribute('href', WA_BASE + encodeURIComponent(pick[0]));
cta.setAttribute('data-cf-service', pick[1]);
return;
}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initQuoteCtaRouting);
else initQuoteCtaRouting();
})();