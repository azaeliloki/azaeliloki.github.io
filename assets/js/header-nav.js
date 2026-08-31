(function () {
var header = document.getElementById("navbar");
if (!header || !header.classList.contains("ah")) return;

var burger = document.getElementById("hamburger");
var mqMenu = window.matchMedia("(max-width: 767px)");
var lastY = window.scrollY;
var menuFocusTrap = null;

function setMenuOpen(open) {
header.classList.toggle("is-open", open);
if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
document.body.classList.toggle("ah-menu-open", open && mqMenu.matches);
if (open && mqMenu.matches) enableFocusTrap();
else disableFocusTrap();
if (!open) closeAllDropdowns();
}

function closeMenu() {
setMenuOpen(false);
}

function getFocusable(root) {
return Array.prototype.slice.call(
root.querySelectorAll(
'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
)
).filter(function (el) {
return !el.hidden && el.offsetParent !== null;
});
}

function enableFocusTrap() {
var panel = document.getElementById("primary-menu");
if (!panel) return;
disableFocusTrap();
menuFocusTrap = function (e) {
if (e.key !== "Tab" || !header.classList.contains("is-open")) return;
var items = getFocusable(panel);
if (!items.length) return;
var first = items[0];
var last = items[items.length - 1];
if (e.shiftKey && document.activeElement === first) {
e.preventDefault();
last.focus();
} else if (!e.shiftKey && document.activeElement === last) {
e.preventDefault();
first.focus();
}
};
document.addEventListener("keydown", menuFocusTrap);
var firstLink = panel.querySelector(".ah__links a, .ah__lang button");
if (firstLink) firstLink.focus();
}

function disableFocusTrap() {
if (!menuFocusTrap) return;
document.removeEventListener("keydown", menuFocusTrap);
menuFocusTrap = null;
}

function closeAllDropdowns(except) {
header.querySelectorAll(".ah__item--dropdown.is-open").forEach(function (item) {
if (except && item === except) return;
item.classList.remove("is-open");
var btn = item.querySelector(".ah__drop-trigger");
if (btn) btn.setAttribute("aria-expanded", "false");
});
}

function toggleDropdown(item, open) {
if (!item) return;
var btn = item.querySelector(".ah__drop-trigger");
var next = typeof open === "boolean" ? open : !item.classList.contains("is-open");
closeAllDropdowns(item);
item.classList.toggle("is-open", next);
if (btn) btn.setAttribute("aria-expanded", next ? "true" : "false");
}

header.querySelectorAll(".ah__item--dropdown").forEach(function (item) {
var btn = item.querySelector(".ah__drop-trigger");
var menu = item.querySelector(".ah__drop-menu");
if (!btn || !menu) return;

btn.addEventListener("click", function (e) {
e.preventDefault();
e.stopPropagation();
toggleDropdown(item);
});

btn.addEventListener("keydown", function (e) {
if (e.key === "Enter" || e.key === " ") {
e.preventDefault();
toggleDropdown(item);
} else if (e.key === "ArrowDown") {
e.preventDefault();
toggleDropdown(item, true);
var first = menu.querySelector("a");
if (first) first.focus();
}
});

item.addEventListener("mouseenter", function () {
if (!mqMenu.matches) toggleDropdown(item, true);
});
item.addEventListener("mouseleave", function () {
if (!mqMenu.matches) toggleDropdown(item, false);
});
item.addEventListener("focusin", function () {
if (!mqMenu.matches) toggleDropdown(item, true);
});

menu.querySelectorAll("a").forEach(function (link, idx, links) {
link.addEventListener("keydown", function (e) {
if (e.key === "Escape") {
e.preventDefault();
toggleDropdown(item, false);
btn.focus();
} else if (e.key === "ArrowDown") {
e.preventDefault();
var next = links[idx + 1] || links[0];
if (next) next.focus();
} else if (e.key === "ArrowUp") {
e.preventDefault();
var prev = links[idx - 1] || links[links.length - 1];
if (prev) prev.focus();
} else if (e.key === "Tab" && !e.shiftKey && idx === links.length - 1) {
toggleDropdown(item, false);
}
});
link.addEventListener("click", function () {
closeAllDropdowns();
closeMenu();
});
});
});

document.addEventListener("keydown", function (e) {
if (e.key !== "Escape") return;
var openItem = header.querySelector(".ah__item--dropdown.is-open");
if (openItem && !header.classList.contains("is-open")) {
var trigger = openItem.querySelector(".ah__drop-trigger");
toggleDropdown(openItem, false);
if (trigger) trigger.focus();
return;
}
if (header.classList.contains("is-open")) {
closeMenu();
if (burger) burger.focus();
}
});

if (burger) {
burger.addEventListener("click", function (e) {
e.stopPropagation();
header.classList.remove("is-hidden");
setMenuOpen(!header.classList.contains("is-open"));
});
}

header.querySelectorAll(".ah__links a").forEach(function (a) {
a.addEventListener("click", closeMenu);
});

header.querySelectorAll(".ah__lang button").forEach(function (btn) {
btn.addEventListener("click", closeMenu);
});

document.addEventListener("click", function (e) {
if (!e.target.closest(".ah__item--dropdown")) closeAllDropdowns();
if (header.classList.contains("is-open") && !header.contains(e.target)) {
closeMenu();
}
});

header.addEventListener("focusin", function () {
header.classList.remove("is-hidden");
});

function onScroll() {
var y = window.scrollY;
header.classList.toggle("is-scrolled", y > 8);
header.classList.toggle("scrolled", y > 20);
if (mqMenu.matches && !header.classList.contains("is-open")) {
if (y > lastY && y > 90) header.classList.add("is-hidden");
else if (y < lastY) header.classList.remove("is-hidden");
} else {
header.classList.remove("is-hidden");
}
lastY = y;
}

window.addEventListener("scroll", onScroll, { passive: true });
mqMenu.addEventListener("change", function () {
closeMenu();
closeAllDropdowns();
if (!mqMenu.matches) header.classList.remove("is-hidden");
});

onScroll();
})();