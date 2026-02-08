// Footer year
const y = document.getElementById("y");
if (y) y.textContent = String(new Date().getFullYear());

// Menu dropdown + smooth scroll + close on click
(function () {
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("siteMenu");
  if (!btn || !menu) return;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function closeMenu() {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }
  function toggleMenu() {
    const isOpen = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("open")) return;
    if (menu.contains(e.target) || btn.contains(e.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    closeMenu();

    const header = document.querySelector(".header");
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 14;

    if (prefersReduced) window.scrollTo(0, top);
    else window.scrollTo({ top, behavior: "smooth" });

    history.pushState(null, "", id);
  });
})();
