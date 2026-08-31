const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/authenticate');

const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

function readOrders() {
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
}

function writeOrders(data) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2));
}

// POST /api/orders — guardar un pedido
router.post('/', (req, res) => {
  try {
    const orders = readOrders();
    const newOrder = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pendiente',
      ...req.body
    };
    orders.push(newOrder);
    writeOrders(orders);
    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando pedido' });
  }
});

// GET /api/orders — listar todos los pedidos (admin)
router.get('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  try {
    const orders = readOrders();
    res.json(orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo pedidos' });
  }
});

// PATCH /api/orders/:id/status — actualizar estado de pedido
router.patch('/:id/status', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  try {
    const orders = readOrders();
    const idx = orders.findIndex(o => o.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Pedido no encontrado' });
    orders[idx].status = req.body.status || 'pendiente';
    writeOrders(orders);
    res.json({ success: true, order: orders[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando pedido' });
  }
});

module.exports = router;
