// king/app.js

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

// ===== Order Sheet =====
(function(){
  // Digits only, e.g. 491701234567
  const WHATSAPP_NUMBER = "+491772383924";

  const openBtns = document.querySelectorAll(".js-open-order");
  const sheet = document.getElementById("orderSheet");
  const backdrop = document.getElementById("sheetBackdrop");
  const closeBtn = document.getElementById("sheetClose");
  const grid = document.getElementById("sheetGrid");
  const totalEl = document.getElementById("orderTotal");
  const waLink = document.getElementById("sheetWhatsApp");
  const resetBtn = document.getElementById("sheetReset");
  const notes = document.getElementById("orderNotes");

  if (!sheet || !backdrop || !grid || !totalEl || !waLink) return;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function formatEUR(n){
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function getItems(){
    return Array.from(grid.querySelectorAll(".orderItem")).map(el => {
      const name = el.dataset.name || "";
      const price = Number(el.dataset.price || "0");
      const qtyEl = el.querySelector("[data-qty]");
      const qty = qtyEl ? Number(qtyEl.textContent || "0") : 0;
      return { el, name, price, qty };
    });
  }

  function computeTotal(){
    const items = getItems();
    let sum = 0;
    for (const it of items) sum += it.price * it.qty;
    totalEl.textContent = formatEUR(sum);
    return { sum, items };
  }

  function buildMessage(){
    const { sum, items } = computeTotal();
    const chosen = items.filter(i => i.qty > 0);
    if (chosen.length === 0) return "";

    const lines = [];
    lines.push("Hi KING IMBISS 👋");
    lines.push("I want to order for pickup:");
    lines.push("");

    for (const c of chosen){
      lines.push(`${c.qty}x ${c.name} (${formatEUR(c.price)})`);
    }

    lines.push("");
    const note = (notes && notes.value || "").trim();
    if (note) lines.push(`Notes: ${note}`);

    lines.push("");
    lines.push(`Total: ${formatEUR(sum)}`);

    return lines.join("\n");
  }

  function updateWhatsAppLink(){
    const msg = buildMessage();
    if (!msg){
      waLink.setAttribute("aria-disabled", "true");
      waLink.style.opacity = "0.55";
      waLink.style.pointerEvents = "none";
      waLink.href = "#";
      return;
    }
    waLink.removeAttribute("aria-disabled");
    waLink.style.opacity = "1";
    waLink.style.pointerEvents = "auto";
    waLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  function openSheet(){
    backdrop.hidden = false;
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    computeTotal();
    updateWhatsAppLink();
  }

  function closeSheet(){
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.setTimeout(() => { backdrop.hidden = true; }, prefersReduced ? 0 : 220);
  }

  function resetAll(){
    for (const it of getItems()){
      const qtyEl = it.el.querySelector("[data-qty]");
      if (qtyEl) qtyEl.textContent = "0";
    }
    if (notes) notes.value = "";
    computeTotal();
    updateWhatsAppLink();
  }

  openBtns.forEach(btn => btn.addEventListener("click", openSheet));
  backdrop.addEventListener("click", closeSheet);
  if (closeBtn) closeBtn.addEventListener("click", closeSheet);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("open")) closeSheet();
  });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".qtyBtn");
    if (!btn) return;

    const item = btn.closest(".orderItem");
    const qtyEl = item ? item.querySelector("[data-qty]") : null;
    if (!item || !qtyEl) return;

    const action = btn.dataset.action;
    let qty = Number(qtyEl.textContent || "0");

    if (action === "inc") qty += 1;
    if (action === "dec") qty = Math.max(0, qty - 1);

    qtyEl.textContent = String(qty);
    computeTotal();
    updateWhatsAppLink();
  });

  if (notes) notes.addEventListener("input", updateWhatsAppLink);
  if (resetBtn) resetBtn.addEventListener("click", resetAll);

  computeTotal();
  updateWhatsAppLink();
})();
