const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── Servir archivos estáticos del Frontend ──────────────────
app.use(express.static(path.join(__dirname, '../Fronted')));

// ── Rutas API ───────────────────────────────────────────────
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🌹 Rosas Eternas API funcionando' });
});

// ── Fallback: todas las rutas no-API van al index.html ───────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Fronted/index.html'));
});

// ── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌹 Rosas Eternas — Backend corriendo`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → API: http://localhost:${PORT}/api/products\n`);
});
