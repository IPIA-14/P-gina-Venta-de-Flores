/* ═══════════════════════════════════════════════
   admin.js — Panel de administración
   ═══════════════════════════════════════════════ */

/* ── Guardia de sesión ─────────────────────────── */
(function() {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token || role !== 'admin') {
    window.location.href = 'login.html';
  }
})();

/* ── Formatear moneda ──────────────────────────── */
function money(n) {
  return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(n);
}

/* ── Cargar admin ──────────────────────────────── */
async function loadAdmin() {
  await Promise.all([loadAdminProducts(), loadAdminOrders()]);
}

/* ── Productos ───────────────────────────────────── */
let allProductsCache = [];

async function loadAdminProducts() {
  const container = document.getElementById('adminProducts');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--muted);padding:20px 0">Cargando productos...</p>';

  const products = await fetchProducts();
  if (!products || !products.length) {
    container.innerHTML = '<p style="color:var(--muted)">No se pudieron cargar los productos.</p>';
    return;
  }

  allProductsCache = products;

  container.innerHTML = products.map(p => `
    <div class="admin-product-card" id="card-${p.id}">
      <div class="apc-icon">${p.icon}</div>
      <div class="apc-info">
        <div class="apc-name">${p.name}</div>
        <div class="apc-meta">${p.qty} ${p.qty === '1' ? 'rosa' : 'rosas'} · ${p.presentation}</div>
        <div class="apc-desc">${p.desc || 'Sin descripción'}</div>
      </div>
      <div class="apc-right">
        <div class="apc-price">$${money(p.price)}</div>
        <button class="edit-btn" onclick="openEditModal(${p.id})">✏️ Editar</button>
      </div>
    </div>
  `).join('');
}

/* ── Modal de edición ───────────────────────────── */
function openEditModal(id) {
  const p = allProductsCache.find(x => x.id === id);
  if (!p) return;

  document.getElementById('editModalTitle').textContent = `${p.icon} ${p.name}`;
  document.getElementById('editProductId').value = id;
  document.getElementById('editName').value = p.name;
  document.getElementById('editDesc').value = p.desc || '';
  document.getElementById('editPrice').value = p.price;

  renderImagesGrid(p.images || []);

  document.getElementById('editModal').classList.add('open');
}

function renderImagesGrid(images) {
  const grid = document.getElementById('editImagesGrid');
  const id = Number(document.getElementById('editProductId').value);
  grid.innerHTML = images.map(url => `
    <div class="img-thumb">
      <img src="${url}" alt="Imagen producto" loading="lazy">
      <button class="img-thumb-remove" onclick="removeImage(${id}, '${url}')" title="Eliminar">×</button>
    </div>
  `).join('') + `
    <button class="img-add-btn" onclick="document.getElementById('imageFileInput').click()" title="Agregar imagen">+</button>
  `;
}

/* ── Imágenes ────────────────────────────────────── */
async function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const id = Number(document.getElementById('editProductId').value);
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);

  // Feedback visual
  const grid = document.getElementById('editImagesGrid');
  const addBtn = grid.querySelector('.img-add-btn');
  if (addBtn) { addBtn.textContent = '⏳'; addBtn.disabled = true; }

  try {
    const res = await fetch(`/api/products/${id}/images`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');

    // Actualizar caché local
    const idx = allProductsCache.findIndex(x => x.id === id);
    if (idx !== -1) allProductsCache[idx].images = data.images;

    // Actualizar miniatura en tarjeta
    updateCardThumbnail(id, data.images);

    renderImagesGrid(data.images);
  } catch (err) {
    alert('Error al subir imagen: ' + err.message);
    if (addBtn) { addBtn.textContent = '+'; addBtn.disabled = false; }
  }
  input.value = '';
}

async function removeImage(id, imageUrl) {
  if (!confirm('¿Eliminar esta imagen?')) return;
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`/api/products/${id}/images`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ imageUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');

    // Actualizar caché
    const idx = allProductsCache.findIndex(x => x.id === id);
    if (idx !== -1) allProductsCache[idx].images = data.images;

    updateCardThumbnail(id, data.images);
    renderImagesGrid(data.images);
  } catch (err) {
    alert('Error al eliminar imagen: ' + err.message);
  }
}

function updateCardThumbnail(id, images) {
  const card = document.getElementById(`card-${id}`);
  if (!card) return;
  const icon = card.querySelector('.apc-icon');
  if (!icon) return;
  if (images && images.length > 0) {
    icon.innerHTML = `<img src="${images[0]}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;" alt="">`;
  } else {
    const p = allProductsCache.find(x => x.id === id);
    icon.textContent = p ? p.icon : '🌹';
  }
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
}

function handleOverlayClick(e) {
  if (e.target.id === 'editModal') closeEditModal();
}

async function submitEditProduct() {
  const id = Number(document.getElementById('editProductId').value);
  const name = document.getElementById('editName').value.trim();
  const desc = document.getElementById('editDesc').value.trim();
  const price = Number(document.getElementById('editPrice').value);
  const saveBtn = document.getElementById('editSaveBtn');

  if (!name || isNaN(price) || price < 0) {
    alert('Nombre o precio inválidos');
    return;
  }

  saveBtn.textContent = 'Guardando...';
  saveBtn.disabled = true;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ name, desc, price })
    });

    if (!response.ok) throw new Error('Error en servidor');

    // Actualizar caché local
    const idx = allProductsCache.findIndex(x => x.id === id);
    if (idx !== -1) allProductsCache[idx] = { ...allProductsCache[idx], name, desc, price };

    // Actualizar tarjeta en UI sin recargar todo
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.querySelector('.apc-name').textContent = name;
      card.querySelector('.apc-desc').textContent = desc || 'Sin descripción';
      card.querySelector('.apc-price').textContent = `$${money(price)}`;
    }

    saveBtn.textContent = '✓ Guardado';
    setTimeout(() => {
      closeEditModal();
      saveBtn.textContent = 'Guardar cambios';
      saveBtn.disabled = false;
    }, 1200);
  } catch (err) {
    alert('Error al guardar. Verifica que el servidor esté corriendo.');
    saveBtn.textContent = 'Guardar cambios';
    saveBtn.disabled = false;
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