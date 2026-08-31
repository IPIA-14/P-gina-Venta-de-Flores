const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

function readProducts() {
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
}

function writeProducts(data) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
}

// GET /api/products — todos los productos
router.get('/', (req, res) => {
  try {
    const products = readProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo productos' });
  }
});

// GET /api/products/:id — un producto por ID
router.get('/:id', (req, res) => {
  try {
    const products = readProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo producto' });
  }
});

// PUT /api/products/:id — actualizar precio
router.put('/:id', (req, res) => {
  try {
    const products = readProducts();
    const idx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    const { price, name, desc } = req.body;
    if (price !== undefined) products[idx].price = Number(price);
    if (name !== undefined) products[idx].name = name;
    if (desc !== undefined) products[idx].desc = desc;

    writeProducts(products);
    res.json({ success: true, product: products[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando producto' });
  }
});

module.exports = router;
