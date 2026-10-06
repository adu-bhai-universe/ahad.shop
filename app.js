"use strict";

/* ---------- Data (replace with your API or database) ---------- */
const PRODUCTS = [
  { id: 1, name: "Stoneware pour-over set", cat: "Kitchen", price: 48, was: null, rating: 4.8, reviews: 212, color: "#d3e3df", badge: "Bestseller" },
  { id: 2, name: "Walnut desk shelf", cat: "Desk", price: 64, was: 80, rating: 4.7, reviews: 148, color: "#e8dccb", badge: "Sale" },
  { id: 3, name: "Waxed canvas daypack", cat: "Bags", price: 118, was: null, rating: 4.9, reviews: 331, color: "#cdd6e4", badge: "" },
  { id: 4, name: "Insulated steel bottle", cat: "Kitchen", price: 32, was: null, rating: 4.6, reviews: 509, color: "#d9e2d0", badge: "" },
  { id: 5, name: "Linen laptop sleeve", cat: "Bags", price: 42, was: 55, rating: 4.5, reviews: 96, color: "#e4d3d3", badge: "Sale" },
  { id: 6, name: "Brass desk lamp", cat: "Desk", price: 89, was: null, rating: 4.8, reviews: 177, color: "#eadfc2", badge: "New" },
  { id: 7, name: "Hand-glazed mug pair", cat: "Kitchen", price: 38, was: null, rating: 4.7, reviews: 264, color: "#d8d3e6", badge: "" },
  { id: 8, name: "Leather cable organizer", cat: "Desk", price: 24, was: null, rating: 4.4, reviews: 88, color: "#e0d2c4", badge: "" }
];

const ICONS = {
  Kitchen: '<svg viewBox="0 0 64 64" fill="none" stroke="#14202b" stroke-width="2.5" stroke-linejoin="round"><path d="M12 22h34v18a12 12 0 0 1-12 12H24a12 12 0 0 1-12-12z"/><path d="M46 26h4a6 6 0 0 1 0 12h-4"/><path d="M22 10c-2 3 2 4 0 8M32 10c-2 3 2 4 0 8"/></svg>',
  Desk: '<svg viewBox="0 0 64 64" fill="none" stroke="#14202b" stroke-width="2.5" stroke-linejoin="round"><path d="M20 54h24M32 54V30"/><path d="M32 30 18 14h28z"/><path d="M32 30l12 10"/></svg>',
  Bags: '<svg viewBox="0 0 64 64" fill="none" stroke="#14202b" stroke-width="2.5" stroke-linejoin="round"><rect x="14" y="20" width="36" height="34" rx="6"/><path d="M24 20v-4a8 8 0 0 1 16 0v4"/><path d="M14 36h36"/></svg>'
};

const FREE_SHIPPING = 75;
const STORAGE_KEY = "hd-cart-v1";

/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const byId = (id) => PRODUCTS.find((p) => p.id === id);

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
}

/* ---------- State ---------- */
let cart = loadCart();           // [{ id, qty }]
const state = { cat: "All", sort: "featured", query: "" };

/* ---------- Catalog ---------- */
function visibleProducts() {
  const q = state.query.trim().toLowerCase();
  let list = PRODUCTS.filter((p) =>
    (state.cat === "All" || p.cat === state.cat) &&
    (!q || p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q))
  );
  if (state.sort === "low") list.sort((a, b) => a.price - b.price);
  if (state.sort === "high") list.sort((a, b) => b.price - a.price);
  if (state.sort === "rating") list.sort((a, b) => b.rating - a.rating);
  return list;
}

function renderFilters() {
  const cats = ["All", ...new Set(PRODUCTS.map((p) => p.cat))];
  $("#filters").innerHTML = cats.map((c) =>
    `<button class="chip ${c === state.cat ? "is-active" : ""}" data-cat="${c}" aria-pressed="${c === state.cat}">${c}</button>`
  ).join("");
}

function renderGrid() {
  const list = visibleProducts();
  $("#resultCount").textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  if (!list.length) {
    $("#grid").innerHTML = '<p class="empty">No products match your search. Try a different word or clear the filter.</p>';
    return;
  }
  $("#grid").innerHTML = list.map((p) => `
    <article class="card">
      <div class="thumb" style="--tile:${p.color}">
        ${ICONS[p.cat]}
        ${p.badge ? `<span class="badge ${p.badge === "Sale" ? "is-sale" : ""}">${p.badge}</span>` : ""}
      </div>
      <div class="info">
        <h3>${p.name}</h3>
        <p class="rating">&#9733; ${p.rating} (${p.reviews})</p>
        <div class="buy">
          <p class="price">${money(p.price)}${p.was ? `<s>${money(p.was)}</s>` : ""}</p>
          <button class="btn btn-primary btn-sm" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`).join("");
}

/* ---------- Cart ---------- */
function cartTotals() {
  const count = cart.reduce((n, i) => n + i.qty, 0);
  const subtotal = cart.reduce((n, i) => n + byId(i.id).price * i.qty, 0);
  return { count, subtotal };
}

function renderCart() {
  const { count, subtotal } = cartTotals();
  $("#cartCount").textContent = count;
  $("#subtotal").textContent = money(subtotal);

  const left = FREE_SHIPPING - subtotal;
  $("#shipMsg").textContent = subtotal === 0 ? `Free shipping on orders over ${money(FREE_SHIPPING)}`
    : left > 0 ? `Add ${money(left)} more for free shipping` : "You've unlocked free shipping";
  $("#shipBar").style.width = Math.min(100, (subtotal / FREE_SHIPPING) * 100) + "%";

  $("#checkout").disabled = count === 0;
  $("#cartItems").innerHTML = cart.length ? cart.map((i) => {
    const p = byId(i.id);
    return `
      <li class="line">
        <div class="line-thumb" style="--tile:${p.color}">${ICONS[p.cat]}</div>
        <div>
          <h4>${p.name}</h4>
          <div class="qty">
            <button data-dec="${p.id}" aria-label="Decrease quantity">&minus;</button>
            <span>${i.qty}</span>
            <button data-inc="${p.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="line-side">
          <strong>${money(p.price * i.qty)}</strong><br>
          <button class="remove" data-remove="${p.id}">Remove</button>
        </div>
      </li>`;
  }).join("") : '<li class="cart-empty">Your cart is empty. Add something from the shop.</li>';
}

function addToCart(id) {
  const line = cart.find((i) => i.id === id);
  line ? line.qty++ : cart.push({ id, qty: 1 });
  update();
  toast(`${byId(id).name} added to cart`);
}
function changeQty(id, delta) {
  const line = cart.find((i) => i.id === id);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter((i) => i.id !== id);
  update();
}
function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  update();
}
function update() { saveCart(); renderCart(); }

/* ---------- Drawer + toast ---------- */
let lastFocus = null;
function openCart() {
  lastFocus = document.activeElement;
  $("#overlay").hidden = false;
  $("#drawer").classList.add("is-open");
  $("#drawer").setAttribute("aria-hidden", "false");
  $("#closeCart").focus();
}
function closeCart() {
  $("#overlay").hidden = true;
  $("#drawer").classList.remove("is-open");
  $("#drawer").setAttribute("aria-hidden", "true");
  if (lastFocus) lastFocus.focus();
}
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-show"), 2200);
}

/* ---------- Events ---------- */
$("#filters").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn) return;
  state.cat = btn.dataset.cat;
  renderFilters();
  renderGrid();
});
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
$("#search").addEventListener("input", (e) => { state.query = e.target.value; renderGrid(); });
$("#grid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToCart(Number(btn.dataset.add));
});
$("#cartItems").addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.inc) changeQty(Number(t.dataset.inc), 1);
  if (t.dataset.dec) changeQty(Number(t.dataset.dec), -1);
  if (t.dataset.remove) removeFromCart(Number(t.dataset.remove));
});
$("#cartBtn").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
$("#checkout").addEventListener("click", () => {
  // Connect this to your payment provider (Stripe Checkout, PayPal, etc.)
  toast("Demo store: connect a payment provider to enable checkout");
});

/* ---------- Init ---------- */
cart = cart.filter((i) => byId(i.id));   // drop items that no longer exist
$("#heroArt").innerHTML = ICONS.Kitchen;
renderFilters();
renderGrid();
renderCart();
