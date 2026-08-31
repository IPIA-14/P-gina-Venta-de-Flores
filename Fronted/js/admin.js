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
    <div class="admin-product-row" id="row-${p.id}" style="flex-wrap:wrap; gap:10px">
      <div class="admin-product-info" style="flex:1; min-width:200px">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px">
          <span>${p.icon}</span>
          <input class="admin-input" id="name-${p.id}" type="text" value="${p.name}" style="flex:1; padding:4px; font-weight:bold" placeholder="Nombre">
        </div>
        <textarea class="admin-input" id="desc-${p.id}" style="width:100%; height:40px; padding:4px; font-size:12px; resize:none" placeholder="Descripción">${p.desc}</textarea>
        <small>${p.qty} ${p.qty === '1' ? 'rosa' : 'rosas'} · ${p.presentation}</small>
      </div>
      <div style="display:flex; align-items:center; gap:8px">
        <input class="admin-input" id="price-${p.id}" type="number" min="0" step="1000" value="${p.price}" placeholder="Precio" style="width:100px">
        <button class="save-btn" id="save-${p.id}" onclick="saveProduct(${p.id})">Guardar</button>
      </div>
    </div>
  `).join('');
}

/* ── Guardar Producto ────────────────────────────── */
async function saveProduct(id) {
  const inputPrice = document.getElementById(`price-${id}`);
  const inputName = document.getElementById(`name-${id}`);
  const inputDesc = document.getElementById(`desc-${id}`);
  const btn = document.getElementById(`save-${id}`);

  if (!inputPrice || !inputName || !inputDesc) return;

  const price = Number(inputPrice.value);
  const name = inputName.value.trim();
  const desc = inputDesc.value.trim();

  if (isNaN(price) || price < 0 || !name) {
    alert('Precio o nombre inválidos');
    return;
  }

  btn.textContent = 'Guardando...';
  btn.disabled = true;

  try {
    await updateProduct(id, { price, name, desc });
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
    const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
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
              <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
              <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>Entregado</option>
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