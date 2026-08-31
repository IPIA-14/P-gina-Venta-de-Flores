/* ═══════════════════════════════════════════════
   api.js — Comunicación con el Backend
   Base URL apunta a http://localhost:3000
   ═══════════════════════════════════════════════ */

const API_BASE = 'http://localhost:3000/api';

/**
 * Obtiene los headers de autenticación si existe un token
 * @returns {Object}
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los productos desde el backend.
 * @returns {Promise<Array>}
 */
async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Error al cargar productos');
    return await res.json();
  } catch (err) {
    console.warn('Backend no disponible, usando datos locales:', err.message);
    return null; // El caller usará fallback
  }
}

/**
 * Obtiene un producto por ID.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function fetchProductById(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetchProductById:', err);
    return null;
  }
}

/**
 * Crea un nuevo producto.
 * @param {Object} data — { name, desc, price, qty, presentation, category, icon }
 * @returns {Promise<Object>}
 */
async function createProduct(data) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error creando producto');
  return await res.json();
}

/**
 * Actualiza el precio (y opcionalmente nombre/desc) de un producto.
 * @param {number} id
 * @param {Object} data — { price, name?, desc? }
 * @returns {Promise<Object>}
 */
async function updateProduct(id, data) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error actualizando producto');
  return await res.json();
}

/**
 * Guarda un nuevo pedido en el backend.
 * @param {Object} orderData — { items, total, whatsappText }
 * @returns {Promise<Object>}
 */
async function submitOrder(orderData) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Error guardando pedido');
    return await res.json();
  } catch (err) {
    console.error('Error submitOrder:', err);
    return null;
  }
}

/**
 * Obtiene todos los pedidos (para el panel admin).
 * @returns {Promise<Array>}
 */
async function fetchOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html'; // Redirigir si no está autorizado
      }
      throw new Error('Error cargando pedidos');
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetchOrders:', err);
    return [];
  }
}

/**
 * Actualiza el estado de un pedido.
 * @param {number} id
 * @param {string} status — 'pendiente' | 'confirmado' | 'entregado'
 */
async function updateOrderStatus(id, status) {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
      }
      throw new Error('Error actualizando estado');
  }
  return await res.json();
}
