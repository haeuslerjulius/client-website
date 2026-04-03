// =============================================================
// KING IMBISS — Conversion-Optimized App
// Full event tracking for every important user interaction
// =============================================================

// ---- CONFIG ----
const CONFIG = {
  whatsappNumber: "4917627759002",
  googleSheetWebhook: "https://script.google.com/macros/s/AKfycbyBcrJi6SrR4zzOrRJx8NJL23yvJYQ7xijHU9c_4lKOTxXsOz5uas5z1Q53ExA9rX-9Tg/exec",
  businessName: "KING IMBISS Rosenheim"
};

// ---- MENU ITEMS (source of truth for the order sheet) ----
const MENU_ITEMS = [
  { name: "Döner",               price: 7.50,  desc: "Fladenbrot, Fleisch, Salat, Sauce" },
  { name: "Dürüm",               price: 8.50,  desc: "Yufka-Wrap, Fleisch, Salat, Sauce" },
  { name: "Döner Box",           price: 8.90,  desc: "Fleisch + Pommes/Reis + Sauce" },
  { name: "Falafel Dürüm",       price: 7.90,  desc: "Vegetarisch – Falafel, Hummus, Salat" },
  { name: "Lahmacun",            price: 7.50,  desc: "Türkische Pizza mit Salat" },
  { name: "Lahmacun Dürüm",      price: 8.50,  desc: "Lahmacun gerollt mit Döner & Salat" },
  { name: "Veggie Döner",        price: 7.50,  desc: "Falafel, Grillgemüse, Hummus" },
  { name: "Schüler-Döner",       price: 4.50,  desc: "Mit Ausweis" },
  { name: "Pizza Margherita",    price: 8.00,  desc: "Tomatensoße, Mozzarella" },
  { name: "Pizza Döner",         price: 9.00,  desc: "Käse, Dönerfleisch, Zwiebeln" },
  { name: "Pizza Salami",        price: 8.50,  desc: "Tomatensoße, Mozzarella, Salami" },
  { name: "Pizza Sucuk",         price: 9.00,  desc: "Tomatensoße, Mozzarella, Sucuk" },
  { name: "Pizza King Spezial",  price: 10.50, desc: "Alles drauf" },
  { name: "Döner Teller",        price: 12.00, desc: "Fleisch, Reis, Salat, Sauce" },
  { name: "Spezial Döner Teller",price: 15.00, desc: "Extra Fleisch, Pommes, Reis, Salat" },
  { name: "Falafel Teller",      price: 10.00, desc: "Falafel, Hummus, Reis, Salat" },
  { name: "Menü King",           price: 13.50, desc: "Dürüm + Pommes + Getränk" },
  { name: "Menü Döner",          price: 12.50, desc: "Döner + Pommes + Getränk" },
  { name: "Menü Pizza Family",   price: 25.00, desc: "2x Pizza + Salat + 2 Getränke" },
  { name: "Pommes",              price: 3.50,  desc: "Klein" },
  { name: "Nuggets",             price: 5.00,  desc: "6 Stk. mit Dip" },
  { name: "Currywurst + Pommes", price: 7.50,  desc: "Hausgemachte Currysoße" },
  { name: "Salat",               price: 5.50,  desc: "Groß, Dressing nach Wahl" },
  { name: "Softdrink 0.33l",     price: 2.00,  desc: "Cola, Fanta, Sprite, Eistee" },
  { name: "Ayran",               price: 2.00,  desc: "Türkisches Joghurtgetränk" },
  { name: "Wasser",              price: 1.50,  desc: "0,5l still oder sprudel" },
];

// =============================================================
// SESSION & TRACKING
// =============================================================

const SESSION_ID = localStorage.getItem("ki_session") || (() => {
  const id = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  localStorage.setItem("ki_session", id);
  return id;
})();

const DEVICE = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";

function track(event, data = {}) {
  const payload = new FormData();
  payload.append("event", event);
  payload.append("timestamp", new Date().toISOString());
  payload.append("session_id", SESSION_ID);
  payload.append("page", location.pathname);
  payload.append("referrer", document.referrer || "");
  payload.append("device", DEVICE);

  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null && v !== "") {
      payload.append(k, String(v));
    }
  }

  fetch(CONFIG.googleSheetWebhook, { method: "POST", body: payload }).catch(() => {});
}

// =============================================================
// PAGE VIEW + SCROLL DEPTH TRACKING
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  track("page_view", { url: location.href });

  // Track scroll depth milestones
  const milestones = [25, 50, 75, 100];
  const reached = new Set();

  function checkScroll() {
    const scrollPct = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    for (const m of milestones) {
      if (scrollPct >= m && !reached.has(m)) {
        reached.add(m);
        track("scroll_depth", { depth: m });
      }
    }
  }

  let scrollTimer;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(checkScroll, 150);
  }, { passive: true });

  // Track time on page
  let timeOnPage = 0;
  const timeInterval = setInterval(() => {
    timeOnPage += 30;
    if (timeOnPage === 30) track("engaged_30s");
    if (timeOnPage === 60) track("engaged_60s");
    if (timeOnPage === 180) {
      track("engaged_180s");
      clearInterval(timeInterval);
    }
  }, 30000);
});

// =============================================================
// SECTION VISIBILITY TRACKING
// =============================================================

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (id) {
          track("section_view", { section: id });
          sectionObserver.unobserve(entry.target);
        }
      }
    });
  }, { threshold: 0.3 });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("section[id]").forEach(el => sectionObserver.observe(el));
  });
}

// =============================================================
// FADE-IN ANIMATIONS
// =============================================================

if ("IntersectionObserver" in window) {
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".card, .review-card, .info-card, .menu-board").forEach(el => {
      el.classList.add("fade-in");
      fadeObserver.observe(el);
    });
  });
}

// =============================================================
// LINK / BUTTON CLICK TRACKING
// =============================================================

document.addEventListener("click", (e) => {
  // Track phone calls
  const phoneLink = e.target.closest('a[href^="tel:"]');
  if (phoneLink) {
    track("click_phone", { phone: phoneLink.href });
    return;
  }

  // Track WhatsApp chat link (not the order one)
  const waLink = e.target.closest('a[href*="wa.me"]');
  if (waLink && waLink.id !== "sheetWhatsApp") {
    track("click_whatsapp_chat");
    return;
  }

  // Track Instagram
  const instaLink = e.target.closest('a[href*="instagram.com"]');
  if (instaLink) {
    track("click_instagram");
    return;
  }

  // Track map / route
  const mapLink = e.target.closest('a[href*="google.com/maps"]');
  if (mapLink) {
    track("click_route_planner");
    return;
  }

  // Track nav clicks
  const navLink = e.target.closest('.nav a, .mobile-menu nav a');
  if (navLink) {
    track("click_nav", { target: navLink.getAttribute("href") });
  }
});

// =============================================================
// HAMBURGER MENU
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  if (!hamburger || !mobileMenu) return;

  function toggleMobile() {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) track("mobile_menu_open");
  }

  function closeMobile() {
    mobileMenu.classList.remove("open");
    hamburger.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  hamburger.addEventListener("click", toggleMobile);
  mobileMenu.querySelectorAll("a, button").forEach(el => {
    el.addEventListener("click", closeMobile);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobile();
  });
});

// =============================================================
// MENU CATEGORY TABS
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".menu-tab");
  const categories = document.querySelectorAll(".menu-category");
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const cat = tab.dataset.cat;

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      track("menu_filter", { category: cat });

      categories.forEach(c => {
        if (cat === "all" || c.dataset.cat === cat) {
          c.style.display = "";
        } else {
          c.style.display = "none";
        }
      });
    });
  });
});

// =============================================================
// ORDER SHEET SYSTEM
// =============================================================

(function () {
  const sheet = document.getElementById("orderSheet");
  const backdrop = document.getElementById("sheetBackdrop");
  const closeBtn = document.getElementById("sheetClose");
  const itemsContainer = document.getElementById("sheetItems");
  const totalEl = document.getElementById("orderTotal");
  const waBtn = document.getElementById("sheetWhatsApp");
  const resetBtn = document.getElementById("sheetReset");
  const notesEl = document.getElementById("orderNotes");
  if (!sheet || !itemsContainer) return;

  // State: { name: qty }
  const cart = {};

  // Build sheet items from MENU_ITEMS
  function renderSheetItems() {
    itemsContainer.innerHTML = "";
    MENU_ITEMS.forEach(item => {
      const qty = cart[item.name] || 0;
      const el = document.createElement("div");
      el.className = "sheet-item";
      el.dataset.itemName = item.name;
      el.innerHTML = `
        <div class="sheet-item__info">
          <div class="sheet-item__name">${item.name}</div>
          <div class="sheet-item__meta">${item.desc}</div>
        </div>
        <div class="sheet-item__right">
          <div class="sheet-item__price">${formatEUR(item.price)}</div>
          <div class="qty-control">
            <button class="qty-btn" data-action="dec" aria-label="Weniger" type="button">−</button>
            <div class="qty-val" data-qty>${qty}</div>
            <button class="qty-btn" data-action="inc" aria-label="Mehr" type="button">+</button>
          </div>
        </div>
      `;
      itemsContainer.appendChild(el);
    });
  }

  function formatEUR(n) {
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function getTotal() {
    let sum = 0;
    for (const item of MENU_ITEMS) {
      sum += item.price * (cart[item.name] || 0);
    }
    return sum;
  }

  function updateUI() {
    const total = getTotal();
    totalEl.textContent = formatEUR(total);

    // Update qty displays
    itemsContainer.querySelectorAll(".sheet-item").forEach(el => {
      const name = el.dataset.itemName;
      const qtyEl = el.querySelector("[data-qty]");
      if (qtyEl) qtyEl.textContent = String(cart[name] || 0);
    });

    // Update WhatsApp button state
    const hasItems = Object.values(cart).some(q => q > 0);
    if (waBtn) {
      waBtn.style.opacity = hasItems ? "1" : ".45";
      waBtn.style.pointerEvents = hasItems ? "auto" : "none";
    }
  }

  function buildWhatsAppURL() {
    const lines = [];
    let total = 0;
    for (const item of MENU_ITEMS) {
      const qty = cart[item.name] || 0;
      if (qty > 0) {
        lines.push(`${qty}x ${item.name} (${formatEUR(item.price * qty)})`);
        total += item.price * qty;
      }
    }
    const notes = notesEl ? notesEl.value.trim() : "";

    let msg = `Hallo KING IMBISS! 👋\n\nIch möchte gerne bestellen:\n\n`;
    msg += lines.join("\n");
    msg += `\n\n💰 Gesamt: ${formatEUR(total)}`;
    if (notes) msg += `\n\n📝 Notiz: ${notes}`;
    msg += `\n\nDanke!`;

    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }

  // ---- Open / Close ----
  function openSheet() {
    renderSheetItems();
    updateUI();
    backdrop.hidden = false;
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    track("order_sheet_open");
  }

  function closeSheet() {
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    backdrop.hidden = true;
    track("order_sheet_close");
  }

  function resetCart() {
    for (const key of Object.keys(cart)) delete cart[key];
    if (notesEl) notesEl.value = "";
    renderSheetItems();
    updateUI();
    track("order_cart_reset");
  }

  // ---- Event: open buttons ----
  document.querySelectorAll(".js-open-order, .js-open-order-sticky").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openSheet();
    });
  });

  // ---- Event: quick-add from menu/bestseller ----
  document.addEventListener("click", (e) => {
    const quickAdd = e.target.closest(".js-quick-add");
    if (!quickAdd) return;
    e.preventDefault();

    const name = quickAdd.dataset.item;
    const price = quickAdd.dataset.price;
    if (!name) return;

    cart[name] = (cart[name] || 0) + 1;
    track("order_item_quick_add", { item_name: name, item_price: price });

    // Subtle feedback
    quickAdd.textContent = "✓ Hinzugefügt";
    quickAdd.style.background = "#16a34a";
    quickAdd.style.borderColor = "#16a34a";
    setTimeout(() => {
      quickAdd.textContent = quickAdd.classList.contains("menu-item-row__add") ? "+" : "+ In den Warenkorb";
      quickAdd.style.background = "";
      quickAdd.style.borderColor = "";
    }, 1200);

    openSheet();
  });

  // ---- Event: qty buttons in sheet ----
  itemsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".qty-btn");
    if (!btn) return;

    const itemEl = btn.closest(".sheet-item");
    const name = itemEl.dataset.itemName;
    const action = btn.dataset.action;
    const menuItem = MENU_ITEMS.find(i => i.name === name);

    if (action === "inc") {
      cart[name] = (cart[name] || 0) + 1;
      track("order_item_add", { item_name: name, item_price: menuItem?.price });
    }
    if (action === "dec" && (cart[name] || 0) > 0) {
      cart[name] = (cart[name] || 0) - 1;
      if (cart[name] === 0) delete cart[name];
      track("order_item_remove", { item_name: name, item_price: menuItem?.price });
    }

    updateUI();
  });

  // ---- Event: WhatsApp send ----
  if (waBtn) {
    waBtn.addEventListener("click", (e) => {
      const hasItems = Object.values(cart).some(q => q > 0);
      if (!hasItems) { e.preventDefault(); return; }

      waBtn.href = buildWhatsAppURL();

      const total = getTotal();
      const itemList = MENU_ITEMS
        .filter(i => (cart[i.name] || 0) > 0)
        .map(i => `${cart[i.name]}x ${i.name}`)
        .join(", ");

      const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

      track("order_whatsapp_send", {
        value: total.toFixed(2),
        items: itemList,
        item_count: itemCount
      });

      // Track each item individually
      MENU_ITEMS.forEach(item => {
        const qty = cart[item.name] || 0;
        if (qty > 0) {
          track("order_item_ordered", {
            item_name: item.name,
            item_qty: qty,
            item_price: item.price,
            order_value: total.toFixed(2)
          });
        }
      });

      setTimeout(() => {
        resetCart();
        closeSheet();
      }, 300);
    });
  }

  // ---- Event: close / reset ----
  if (backdrop) backdrop.addEventListener("click", closeSheet);
  if (closeBtn) closeBtn.addEventListener("click", closeSheet);
  if (resetBtn) resetBtn.addEventListener("click", resetCart);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("open")) closeSheet();
  });

  // Initial render
  renderSheetItems();
  updateUI();
})();

// =============================================================
// FOOTER YEAR
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("footerYear");
  if (el) el.textContent = String(new Date().getFullYear());
});

// =============================================================
// EXIT INTENT TRACKING (desktop)
// =============================================================

if (DEVICE === "desktop") {
  let exitTracked = false;
  document.addEventListener("mouseout", (e) => {
    if (!exitTracked && e.clientY <= 0) {
      exitTracked = true;
      track("exit_intent");
    }
  });
}
