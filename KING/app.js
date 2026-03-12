// ===============================
// CONFIG
// ===============================

// Google Sheet Webhook URL
const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbyBcrJi6SrR4zzOrRJx8NJL23yvJYQ7xijHU9c_4lKOTxXsOz5uas5z1Q53ExA9rX-9Tg/exec";

// ===============================
// SESSION TRACKING
// ===============================

const SESSION_ID =
  localStorage.getItem("session_id") ||
  (function () {
    const id = "s" + Math.random().toString(36).substring(2,10);
    localStorage.setItem("session_id", id);
    return id;
  })();


// ===============================
// TRACK FUNCTION
// ===============================

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
  if (data.item_name) form.append("item_name", data.item_name);
  if (data.item_price) form.append("item_price", data.item_price);
  if (data.items) form.append("items", data.items);
  if (data.item_count) form.append("item_count", data.item_count);

  fetch(GOOGLE_SHEET_WEBHOOK, {
    method: "POST",
    body: form
  }).catch(() => {});

}


// ===============================
// PAGE VIEW
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  track("page_view");
});


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
  const resetBtn = document.getElementById("sheetReset");
  const notes = document.getElementById("orderNotes");

  if (!sheet || !grid || !totalEl || !waLink) return;


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

    return { sum, items };
  }


  function updateWhatsAppLink(){

    const { sum, items } = computeTotal();

    const chosen = items.filter(i => i.qty > 0);

    if (chosen.length === 0){

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

  const basket = chosen
    .map(i => `${i.name} x${i.qty}`)
    .join(", ");

  track("order_whatsapp_click",{
    value: sum,
    items: basket,
    item_count: chosen.reduce((n,i)=>n+i.qty,0)
  });


chosen.forEach(item => {

  track("order_item_ordered",{
    item_name: item.name,
    item_qty: item.qty,
    item_price: item.price,
    order_value: sum
  });

});
   

  // reset AFTER link opens
  setTimeout(() => {
    resetAll();
  }, 200);

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


  function resetAll(){

    for (const it of getItems()){
      const qtyEl = it.el.querySelector("[data-qty]");
      if (qtyEl) qtyEl.textContent="0";
    }

    computeTotal();
    updateWhatsAppLink();

  }


  openBtns.forEach(btn => btn.addEventListener("click", openSheet));

  if (backdrop) backdrop.addEventListener("click", closeSheet);
  if (closeBtn) closeBtn.addEventListener("click", closeSheet);

  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape" && sheet.classList.contains("open")){
      closeSheet();
    }
  });


  grid.addEventListener("click",(e)=>{

    const btn = e.target.closest(".qtyBtn");
    if(!btn) return;

    const item = btn.closest(".menu-item");
    const qtyEl = item.querySelector("[data-qty]");

    const action = btn.dataset.action;

    let qty = Number(qtyEl.textContent || "0");

    if(action==="inc"){

      qty+=1;

      const itemName = item.dataset.itemName || "";
      const itemPrice = item.dataset.itemPrice || "";

      track("order_item_add",{
        item_name:itemName,
        item_price:itemPrice
      });

    }

 if(action==="dec"){

  if(qty > 0){

    const itemName = item.dataset.itemName || "";
    const itemPrice = item.dataset.itemPrice || "";

    track("order_item_remove",{
      item_name: itemName,
      item_price: itemPrice
    });

  }

  qty = Math.max(0, qty-1);
}

    qtyEl.textContent = String(qty);

    computeTotal();
    updateWhatsAppLink();

  });


  if(resetBtn) resetBtn.addEventListener("click", resetAll);

  computeTotal();
  updateWhatsAppLink();

})();
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
