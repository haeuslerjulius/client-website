// Footer year
const y = document.getElementById("y");
if (y) y.textContent = String(new Date().getFullYear());

// Smooth scrolling with header offset (and closes mobile menu on click)
(function () {
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  function smoothScrollTo(el) {
    const header = document.querySelector("header");
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerH - 14;
    window.scrollTo({ top, behavior: "smooth" });
  }

  document.addEventListener("click", function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    smoothScrollTo(target);
    history.pushState(null, "", id);

    // close mobile menu after navigation
    const mm = document.getElementById("mobileMenu");
    const mb = document.getElementById("menuBtn");
    if (mm && mb) {
      mm.classList.remove("open");
      mb.setAttribute("aria-expanded", "false");
    }
  });
})();

// Mobile menu toggle + close on outside click / escape
(function () {
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;

  function closeMenu() {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    const isOpen = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", function (e) {
    if (!menu.classList.contains("open")) return;
    if (menu.contains(e.target) || btn.contains(e.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });
})();
