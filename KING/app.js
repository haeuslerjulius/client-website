// ===============================
// CONFIG
// ===============================

// Google Sheet Webhook URL
const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbyfRgHqbU6pR_JSXLGOM9TD8rZao0bGnRMFNJrUwIZWADktqPmJRxah1ZZ5OgkLzvE_YQ/exec";

// ===============================
// TRACKING CORE
// ===============================

const SESSION_ID =
  localStorage.getItem("session_id") ||
  (function () {
    const id = "s" + Math.random().toString(36).substring(2,10);
    localStorage.setItem("session_id", id);
    return id;
  })();

function track(event, data = {}) {

  const form = new FormData();

  form.append("event", event);
  form.append("timestamp", new Date().toISOString());
  form.append("session_id", SESSION_ID);
  form.append("page", window.location.pathname);
  form.append("referrer", document.referrer || "");

  const device =
    /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";

  form.append("device", device);

  if (data.value) form.append("value", data.value);

  fetch(GOOGLE_SHEET_WEBHOOK, {
    method: "POST",
    body: form
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
  return Array.from(grid.querySelectorAll(".menu-item")).map(el => {
    const name = el.dataset.itemName || "";
    const price = Number(el.dataset.itemPrice || "0");
    const qtyEl = el.querySelector("[data-qty]");
    const qty = qtyEl ? Number(qtyEl.textContent || "0") : 0;
    return { el, name, price, qty };
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

   if (action === "inc") {

  qty += 1;

  const item = btn.closest(".menu-item");
  const itemName = item.dataset.itemName || "";
  const itemPrice = item.dataset.itemPrice || "";

  track("order_item_add", {
    item_name: itemName,
    item_price: itemPrice
  });

  }
    if (action === "dec") qty = Math.max(0, qty - 1);

    qtyEl.textContent = String(qty);

    computeTotal();

    updateWhatsAppLink();

  });

  computeTotal();

  updateWhatsAppLink();

})();
