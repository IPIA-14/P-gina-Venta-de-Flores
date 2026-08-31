const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authenticate } = require('../middleware/authenticate');
const { getDb } = require('../db/database');

const UPLOADS_DIR = path.join(__dirname, '../../Fronted/uploads');

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

// Parsear images de JSON string a Array de JS
const formatProduct = (p) => {
  return { ...p, images: p.images ? JSON.parse(p.images) : [] };
};

// GET /api/products — todos los productos
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const products = await db.all('SELECT * FROM products');
    res.json(products.map(formatProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leyendo productos' });
  }
});

// GET /api/products/:id — un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(formatProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leyendo producto' });
  }
});

// POST /api/products — crear nuevo producto (admin only)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const db = await getDb();
    const { name, desc, price, qty, presentation, category, icon } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }

    const result = await db.run(
      `INSERT INTO products (name, desc, price, qty, presentation, category, icon, images) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, desc || '', Number(price), qty || '1', presentation || 'individual', category || 'eternas', icon || '🌹', '[]']
    );

    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, product: formatProduct(newProduct) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

// PUT /api/products/:id — actualizar producto (admin only)
router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const db = await getDb();
    const { price, name, desc, qty, presentation, category, icon } = req.body;
    
    // Obtener valores actuales
    const current = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Producto no encontrado' });

    const newPrice = price !== undefined ? Number(price) : current.price;
    const newName = name !== undefined ? name : current.name;
    const newDesc = desc !== undefined ? desc : current.desc;
    const newQty = qty !== undefined ? qty : current.qty;
    const newPresentation = presentation !== undefined ? presentation : current.presentation;
    const newCategory = category !== undefined ? category : current.category;
    const newIcon = icon !== undefined ? icon : current.icon;

    await db.run(
      'UPDATE products SET price = ?, name = ?, desc = ?, qty = ?, presentation = ?, category = ?, icon = ? WHERE id = ?',
      [newPrice, newName, newDesc, newQty, newPresentation, newCategory, newIcon, req.params.id]
    );
    
    const updated = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, product: formatProduct(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
});

// POST /api/products/:id/images — subir imagen (admin only)
router.post('/:id/images', authenticate, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  if (!req.file) return res.status(400).json({ error: 'No se envió imagen' });

  try {
    const db = await getDb();
    const product = await db.get('SELECT images FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const images = product.images ? JSON.parse(product.images) : [];
    images.push(imageUrl);

    await db.run('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(images), req.params.id]);
    res.json({ success: true, imageUrl, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error subiendo imagen' });
  }
});

// DELETE /api/products/:id/images — eliminar imagen (admin only)
router.delete('/:id/images', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl requerida' });

  try {
    const db = await getDb();
    const product = await db.get('SELECT images FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    // Eliminar archivo físico
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    let images = product.images ? JSON.parse(product.images) : [];
    images = images.filter(u => u !== imageUrl);

    await db.run('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(images), req.params.id]);
    res.json({ success: true, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando imagen' });
  }
});

module.exports = router;
