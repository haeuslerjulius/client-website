// ===============================
// CONFIG
// ===============================

// Google Sheet Webhook URL
const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbyw8tr2wtW6FnL6SstFK7yZJuM_tPugoTSCF-yiVZd9OtnyERc56Nlcf6FSwGF7EuEIcg/exec";


// ===============================
// TRACKING CORE
// ===============================

function track(event, data = {}) {

  const payload = {
    event: event,
    ...data,
    timestamp: new Date().toISOString(),
    page: window.location.pathname
  };

  fetch(GOOGLE_SHEET_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});

}


// ===============================
// PAGE VIEW TRACKING
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  track("page_view");
});


// ===============================
// Footer year
// ===============================

const y = document.getElementById("y");
if (y) y.textContent = String(new Date().getFullYear());


// ===============================
// Menu dropdown
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

  const WHATSAPP_NUMBER = "491701234567";

  const openBtns = document.querySelectorAll(".js-open-order");
  const sheet = document.getElementById("orderSheet");
  const backdrop = document.getElementById("sheetBackdrop");
  const closeBtn = document.getElementById("sheetClose");
  const grid = document.getElementById("sheetGrid");
  const totalEl = document.getElementById("orderTotal");
  const waLink = document.getElementById("sheetWhatsApp");

  if (!sheet || !backdrop || !grid || !totalEl || !waLink) return;

  function formatEUR(n){
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function getItems(){
    return Array.from(grid.querySelectorAll(".orderItem")).map(el => {
      const price = Number(el.dataset.price || "0");
      const qtyEl = el.querySelector("[data-qty]");
      const qty = qtyEl ? Number(qtyEl.textContent || "0") : 0;
      return { price, qty };
    });
  }

  function computeTotal(){

    const items = getItems();

    let sum = 0;

    for (const it of items) {
      sum += it.price * it.qty;
    }

    totalEl.textContent = formatEUR(sum);

    return sum;

  }

  function updateWhatsAppLink(){

    const total = computeTotal();

    if (total <= 0){

      waLink.setAttribute("aria-disabled","true");
      waLink.style.opacity="0.55";
      waLink.style.pointerEvents="none";
      waLink.href="#";

      return;
    }

    waLink.removeAttribute("aria-disabled");
    waLink.style.opacity="1";
    waLink.style.pointerEvents="auto";

    waLink.href=`https://wa.me/${WHATSAPP_NUMBER}`;

    waLink.onclick = function(){

      track("order_whatsapp_click",{
        value: total
      });

    };

  }

  function openSheet(){

    backdrop.hidden=false;

    sheet.classList.add("open");

    sheet.setAttribute("aria-hidden","false");

    document.body.style.overflow="hidden";

    track("order_sheet_open");

    computeTotal();

    updateWhatsAppLink();

  }

  function closeSheet(){

    sheet.classList.remove("open");

    sheet.setAttribute("aria-hidden","true");

    document.body.style.overflow="";

    backdrop.hidden=true;

  }

  openBtns.forEach(btn => btn.addEventListener("click", openSheet));

  backdrop.addEventListener("click", closeSheet);

  if (closeBtn) closeBtn.addEventListener("click", closeSheet);

  document.addEventListener("keydown", (e) => {

    if (e.key === "Escape" && sheet.classList.contains("open")) {

      closeSheet();

    }

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

  computeTotal();

  updateWhatsAppLink();

})();
