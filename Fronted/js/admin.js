/* ═══════════════════════════════════════════════
   admin.js — Panel de administración
   ═══════════════════════════════════════════════ */

/* ── Cargar admin ──────────────────────────────── */
async function loadAdmin() {
  await Promise.all([loadAdminProducts(), loadAdminOrders()]);
}

/* ── Productos ─────────────────────────────────── */
async function loadAdminProducts() {
  const container = document.getElementById('adminProducts');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--muted);padding:20px 0">Cargando productos...</p>';

  const products = await fetchProducts();
  if (!products || !products.length) {
    container.innerHTML = '<p style="color:var(--muted)">No se pudieron cargar los productos.</p>';
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="admin-product-row" id="row-${p.id}">
      <div class="admin-product-info">
        <b>${p.icon} ${p.name}</b>
        <small>${p.qty} ${p.qty === '1' ? 'rosa' : 'rosas'} · ${p.presentation}</small>
      </div>
      <input
        class="admin-input"
        id="price-${p.id}"
        type="number"
        min="0"
        step="1000"
        value="${p.price}"
        placeholder="Precio"
      >
      <button
        class="save-btn"
        id="save-${p.id}"
        onclick="savePrice(${p.id})"
      >
        Guardar
      </button>
    </div>
  `).join('');
}

/* ── Guardar precio ────────────────────────────── */
async function savePrice(id) {
  const input = document.getElementById(`price-${id}`);
  const btn = document.getElementById(`save-${id}`);
  if (!input) return;

  const price = Number(input.value);
  if (isNaN(price) || price < 0) {
    alert('Precio inválido');
    return;
  }

  btn.textContent = 'Guardando...';
  btn.disabled = true;

  try {
    await updateProduct(id, { price });
    btn.textContent = '✓ Guardado';
    btn.classList.add('saved');
    setTimeout(() => {
      btn.textContent = 'Guardar';
      btn.classList.remove('saved');
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    alert('Error al guardar. Verifica que el servidor esté corriendo.');
    btn.textContent = 'Guardar';
    btn.disabled = false;
  }
}

/* ── Pedidos ───────────────────────────────────── */
async function loadAdminOrders() {
  const container = document.getElementById('adminOrders');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--muted);padding:20px 0">Cargando pedidos...</p>';

  const orders = await fetchOrders();

  if (!orders.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--muted)">
        <div style="font-size:40px;margin-bottom:12px">📋</div>
        <div>Aún no hay pedidos registrados</div>
        <small>Los pedidos aparecerán aquí cuando los clientes hagan clic en "Pedir por WhatsApp"</small>
      </div>`;
    return;
  }

  container.innerHTML = orders.map(order => {
    const date = new Date(order.createdAt);
    const dateStr = date.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
    const timeStr = date.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
    const items = order.items || [];
    const total = order.total || items.reduce((s, x) => s + x.price, 0);

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div class="order-id">Pedido #${String(order.id).slice(-6)}</div>
            <div class="order-date">${dateStr} a las ${timeStr}</div>
          </div>
          <div>
            <span class="order-status ${order.status}">${order.status}</span>
            <select
              onchange="changeOrderStatus(${order.id}, this.value)"
              style="margin-top:6px;display:block;font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:6px;cursor:pointer"
            >
              <option value="pendiente" ${order.status==='pendiente'?'selected':''}>Pendiente</option>
              <option value="confirmado" ${order.status==='confirmado'?'selected':''}>Confirmado</option>
              <option value="entregado" ${order.status==='entregado'?'selected':''}>Entregado</option>
            </select>
          </div>
        </div>
        ${items.map(x => `
          <div class="order-item-line">
            🌹 ${x.name} — <b>$${money(x.price)}</b>
            ${x.customization ? `<small style="color:var(--muted)"> · ${x.customization.roseColor} · ${x.customization.presentation}</small>` : ''}
          </div>
        `).join('')}
        <div class="order-total">Total: $${money(total)}</div>
      </div>
    `;
  }).join('');
}

/* ── Cambiar estado de pedido ──────────────────── */
async function changeOrderStatus(id, status) {
  try {
    await updateOrderStatus(id, status);
  } catch (err) {
    console.error('Error actualizando estado:', err);
  }
}

/* ── Inicializar ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadAdmin);
