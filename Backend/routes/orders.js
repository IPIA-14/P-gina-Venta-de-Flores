const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { getDb } = require('../db/database');

const formatOrder = (o) => {
  return { ...o, items: o.items ? JSON.parse(o.items) : [] };
};

// POST /api/orders — crear un pedido
router.post('/', async (req, res) => {
  try {
    const { items, total, whatsappText } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'El pedido no tiene items' });
    }

    const newOrder = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pendiente',
      items: JSON.stringify(items),
      total: total,
      message: whatsappText
    };

    const db = await getDb();
    await db.run(
      'INSERT INTO orders (id, createdAt, status, items, total, message) VALUES (?, ?, ?, ?, ?, ?)',
      [newOrder.id, newOrder.createdAt, newOrder.status, newOrder.items, newOrder.total, newOrder.message]
    );

    res.status(201).json({ success: true, orderId: newOrder.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error guardando pedido' });
  }
});

// GET /api/orders — obtener pedidos (admin only)
router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  try {
    const db = await getDb();
    const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
    res.json(orders.map(formatOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leyendo pedidos' });
  }
});

// PATCH /api/orders/:id/status — actualizar estado
router.patch('/:id/status', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  try {
    const { status } = req.body;
    if (!['pendiente', 'confirmado', 'entregado'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const db = await getDb();
    const result = await db.run(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando estado' });
  }
});

module.exports = router;
