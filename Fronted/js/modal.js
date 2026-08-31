/* ═══════════════════════════════════════════════
   modal.js — Modal de personalización de producto
   ═══════════════════════════════════════════════ */

let selectedProduct = null;
let customization = {
  roseColor: 'Rojo',
  presentation: 'Caja',
  boxColor: 'Negra',
  extra: 'Sin extra'
};
let customQty = 1;

/* ── Abrir modal ───────────────────────────────── */
function openProduct(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  selectedProduct = product;
  customization = { roseColor: 'Rojo', presentation: 'Caja', boxColor: 'Negra', extra: 'Sin extra' };
  customQty = 1;

  // Llenar datos del modal
  document.getElementById('modalName').textContent = product.name;
  document.getElementById('modalBasePrice').textContent = money(product.price);
  document.getElementById('modalVisualIcon').textContent = product.icon;
  document.getElementById('modalQty').textContent = customQty;
  document.getElementById('customMessage').value = '';

  // Reset selecciones
  document.querySelectorAll('#productModal .choice').forEach(b => b.classList.remove('selected'));
  document.querySelector('#roseColors .choice')?.classList.add('selected');
  document.querySelector('#presentations .choice')?.classList.add('selected');
  document.querySelectorAll('#productModal .choices').forEach(group => {
    if (group.id !== 'roseColors' && group.id !== 'presentations') {
      group.querySelector('.choice')?.classList.add('selected');
    }
  });

  updateModalPrice();
  updateSummary();

  const modal = document.getElementById('productModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ── Cerrar modal ──────────────────────────────── */
function closeProduct() {
  const modal = document.getElementById('productModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  selectedProduct = null;
}

/* ── Elegir opción ─────────────────────────────── */
function choose(btn, key, value) {
  customization[key] = value;
  btn.closest('.choices').querySelectorAll('.choice').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  updateModalPrice();
  updateSummary();
}

/* ── Cambiar cantidad ──────────────────────────── */
function changeQty(delta) {
  customQty = Math.max(1, customQty + delta);
  document.getElementById('modalQty').textContent = customQty;
  updateModalPrice();
}

/* ── Extra cost ────────────────────────────────── */
function getExtraCost() {
  const map = { 'Chocolates': 15000, 'Peluche': 25000, 'Chocolates + peluche': 35000 };
  return map[customization.extra] || 0;
}

/* ── Actualizar precio en modal ────────────────── */
function updateModalPrice() {
  if (!selectedProduct) return;
  const unit = selectedProduct.price + getExtraCost();
  const total = unit * customQty;
  const priceEl = document.getElementById('modalTotalPrice');
  if (priceEl) priceEl.textContent = money(total);
}

/* ── Resumen del detalle ───────────────────────── */
function updateSummary() {
  if (!selectedProduct) return;
  const el = document.getElementById('summaryText');
  if (!el) return;
  const parts = [
    selectedProduct.name,
    `🌹 ${customization.roseColor}`,
    `📦 ${customization.presentation}`,
    `🎀 ${customization.boxColor}`
  ];
  if (customization.extra !== 'Sin extra') parts.push(`🎁 ${customization.extra}`);
  el.textContent = parts.join(' · ');
}

/* ── Agregar personalizado al carrito ──────────── */
function addCustomized() {
  if (!selectedProduct) return;
  const message = document.getElementById('customMessage').value.trim();
  const fullCustomization = { ...customization, message };
  addToCart(selectedProduct, fullCustomization, customQty);
  closeProduct();
}

/* ── Cerrar modal al hacer clic fuera ──────────── */
document.getElementById('productModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeProduct();
});

/* ── Tecla Escape ──────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProduct();
});
