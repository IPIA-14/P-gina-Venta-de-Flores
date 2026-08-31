const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authenticate } = require('../middleware/authenticate');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const UPLOADS_DIR   = path.join(__dirname, '../../Fronted/uploads');

// Asegurar que exista la carpeta de uploads
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${req.params.id}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo imágenes permitidas'));
  }
});

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

// PUT /api/products/:id — actualizar producto (admin only)
router.put('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  try {
    const products = readProducts();
    const idx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    const { price, name, desc } = req.body;
    if (price !== undefined) products[idx].price = Number(price);
    if (name  !== undefined) products[idx].name  = name;
    if (desc  !== undefined) products[idx].desc  = desc;

    writeProducts(products);
    res.json({ success: true, product: products[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando producto' });
  }
});

// POST /api/products/:id/images — subir imagen (admin only)
router.post('/:id/images', authenticate, upload.single('image'), (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const products = readProducts();
    const idx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    if (!req.file) return res.status(400).json({ error: 'No se envió imagen' });

    const imageUrl = `/uploads/${req.file.filename}`;
    if (!products[idx].images) products[idx].images = [];
    products[idx].images.push(imageUrl);

    writeProducts(products);
    res.json({ success: true, imageUrl, images: products[idx].images });
  } catch (err) {
    res.status(500).json({ error: 'Error subiendo imagen' });
  }
});

// DELETE /api/products/:id/images — eliminar imagen (admin only)
router.delete('/:id/images', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl requerida' });

    const products = readProducts();
    const idx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    // Eliminar archivo físico
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    products[idx].images = (products[idx].images || []).filter(u => u !== imageUrl);
    writeProducts(products);
    res.json({ success: true, images: products[idx].images });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando imagen' });
  }
});

module.exports = router;
