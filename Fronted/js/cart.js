/* ═══════════════════════════════════════════════
   cart.js — Lógica del Carrito de Compras
   ═══════════════════════════════════════════════ */

let cart = [];

/* ── Formateo de moneda ────────────────────────── */
function money(n) {
  return Number(n).toLocaleString('es-CO');
}

/* ── Agregar al carrito ────────────────────────── */
function addToCart(product, customization = null, qty = 1) {
  for (let i = 0; i < qty; i++) {
    cart.push({
      id: Date.now() + i,
      productId: product.id,
      name: product.name,
      icon: product.icon,
      price: product.price + (customization ? extraCostFromCustom(customization) : 0),
      customization: customization ? { ...customization } : null
    });
  }
  renderCart();
  openCartDrawer();
  animateCartButton();
}

function extraCostFromCustom(c) {
  if (!c || !c.extra) return 0;
  if (c.extra === 'Chocolates') return 15000;
  if (c.extra === 'Peluche') return 25000;
  if (c.extra === 'Chocolates + peluche') return 35000;
  return 0;
}

/* ── Remover del carrito ───────────────────────── */
function removeFromCart(cartItemId) {
  cart = cart.filter(x => x.id !== cartItemId);
  renderCart();
}

/* ── Limpiar carrito ───────────────────────────── */
function clearCart() {
  cart = [];
  renderCart();
}

/* ── Render del carrito ────────────────────────── */
function renderCart() {
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');

  if (countEl) countEl.textContent = cart.length;

  const total = cart.reduce((s, x) => s + x.price, 0);
  if (totalEl) totalEl.textContent = money(total);

  if (!itemsEl) return;

  if (!cart.length) {
    itemsEl.innerHTML = `<div class="cart-empty">🌹 Tu carrito está vacío<br><small>¡Agrega un detalle especial!</small></div>`;
    return;
  }

  itemsEl.innerHTML = cart.map(x => `
    <div class="cart-item">
      <div style="flex:1">
        <div class="cart-item-name">${x.icon} ${x.name}</div>
        ${x.customization ? `<div class="cart-item-detail">
          ${x.customization.roseColor} · ${x.customization.presentation} · ${x.customization.boxColor}
          ${x.customization.extra !== 'Sin extra' ? ' · ' + x.customization.extra : ''}
          ${x.customization.message ? '<br>💌 ' + x.customization.message : ''}
        </div>` : ''}
      </div>
      <div class="cart-item-price">$${money(x.price)}</div>
      <button class="cart-remove" onclick="removeFromCart(${x.id})" title="Eliminar">×</button>
    </div>
  `).join('');
}

/* ── Toggle carrito ────────────────────────────── */
function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  if (!drawer) return;
  drawer.classList.toggle('open');
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.classList.add('open');
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.classList.remove('open');
}

/* ── Animación botón carrito ───────────────────── */
function animateCartButton() {
  const btn = document.querySelector('.cart-float');
  if (!btn) return;
  btn.style.animation = 'pulse 0.4s ease';
  setTimeout(() => { btn.style.animation = ''; }, 400);
}

/* ── Enviar por WhatsApp ───────────────────────── */
async function sendWhatsApp() {
  if (!cart.length) {
    alert('Agrega al menos un producto al carrito primero. 🌹');
    return;
  }

  const total = cart.reduce((s, x) => s + x.price, 0);

  const itemsText = cart.map(x => {
    let line = `• ${x.name} - $${money(x.price)}`;
    if (x.customization) {
      line += `\n   🌹 ${x.customization.roseColor} | 📦 ${x.customization.presentation} | 🎀 ${x.customization.boxColor}`;
      if (x.customization.extra !== 'Sin extra') line += ` | 🎁 ${x.customization.extra}`;
      if (x.customization.message) line += `\n   💌 Mensaje: "${x.customization.message}"`;
    }
    return line;
  }).join('\n');

  const text = `Hola! Quiero realizar un pedido de Rosas Eternas 🌹\n\n${itemsText}\n\n💰 *Total: $${money(total)}*\n\n¿Pueden confirmar disponibilidad?`;

  // Guardar pedido en backend (sin bloquear)
  if (typeof submitOrder === 'function') {
    submitOrder({ items: cart, total, message: text }).catch(() => {});
  }

  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/573001234567?text=${encoded}`, '_blank');
}

/* ── Cerrar al hacer clic fuera ────────────────── */
document.addEventListener('click', (e) => {
  const drawer = document.getElementById('cartDrawer');
  const floatBtn = document.querySelector('.cart-float');
  if (!drawer || !floatBtn) return;
  if (!drawer.contains(e.target) && !floatBtn.contains(e.target)) {
    drawer.classList.remove('open');
  }
});
