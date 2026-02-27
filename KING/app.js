// ===============================
// CONFIG
// ===============================

// Google Sheet Webhook URL (Apps Script / Webhook endpoint)
const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// Optional: If GA not globally initialized elsewhere
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";


// ===============================
// TRACKING CORE
// ===============================

function track(event, data = {}) {
  const payload = {
    event,
    ...data,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  // Send to Google Analytics (if available)
  if (typeof gtag === "function") {
    gtag("event", event, data);
  }

  // Send to Google Sheet webhook
  if (GOOGLE_SHEET_WEBHOOK) {
    fetch(GOOGLE_SHEET_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }
}


// ===============================
// Footer year
// ===============================

const y = document.getElementById("y");
if (y) y.textContent = String(new Date().getFullYear());


// ===============================
// Menu dropdown + smooth scroll
// ===============================

(function () {
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("siteMenu");
  if (!btn || !menu) return;

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

})();


// ===============================
// ORDER SYSTEM
// ===============================

(function(){

  const WHATSAPP_NUMBER = "491701234567"; // digits only

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
    lines.push("Hi 👋");
    lines.push("I want to order for pickup:");
    lines.push("");

    for (const c of chosen){
      lines.push(`${c.qty}x ${c.name} (${formatEUR(c.price)})`);
    }

    const note = (notes && notes.value || "").trim();
    if (note) {
      lines.push("");
      lines.push(`Notes: ${note}`);
    }

    lines.push("");
    lines.push(`Total: ${formatEUR(sum)}`);

    return lines.join("\n");
  }

  function updateWhatsAppLink(){
    const { sum, items } = computeTotal();
    const chosen = items.filter(i => i.qty > 0);
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

    waLink.onclick = function () {
      track("order_whatsapp_click", {
        total_value: sum,
        item_count: chosen.length
      });
    };
  }

  function openSheet(){
    backdrop.hidden = false;
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    track("order_sheet_open");

    computeTotal();
    updateWhatsAppLink();
  }

  function closeSheet(){
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    backdrop.hidden = true;
  }

  function resetAll(){
    for (const it of getItems()){
      const qtyEl = it.el.querySelector("[data-qty]");
      if (qtyEl) qtyEl.textContent = "0";
    }
    if (notes) notes.value = "";
    track("order_reset");
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

    if (action === "inc") {
      qty += 1;
      track("order_item_add", {
        item_name: item.dataset.name,
        item_price: item.dataset.price
      });
    }

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