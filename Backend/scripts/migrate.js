const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/database');

async function migrate() {
  console.log('Iniciando migración a SQLite...');
  try {
    const db = await getDb();

    // 1. Migrar Usuarios
    const usersPath = path.join(__dirname, '../data/users.json');
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      for (const u of users) {
        await db.run(
          `INSERT OR IGNORE INTO users (username, passwordHash, role) VALUES (?, ?, ?)`,
          [u.username, u.passwordHash, u.role]
        );
      }
      console.log(`✅ Migrados ${users.length} usuarios.`);
    }

    // 2. Migrar Productos
    const productsPath = path.join(__dirname, '../data/products.json');
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
      for (const p of products) {
        await db.run(
          `INSERT OR REPLACE INTO products (id, name, qty, presentation, price, icon, desc, category, images) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.qty, p.presentation, p.price, p.icon, p.desc, p.category, JSON.stringify(p.images || [])]
        );
      }
      console.log(`✅ Migrados ${products.length} productos.`);
    }

    // 3. Migrar Pedidos
    const ordersPath = path.join(__dirname, '../data/orders.json');
    if (fs.existsSync(ordersPath)) {
      const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
      for (const o of orders) {
        await db.run(
          `INSERT OR REPLACE INTO orders (id, createdAt, status, items, total, message) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [o.id, o.createdAt, o.status, JSON.stringify(o.items || []), o.total, o.message]
        );
      }
      console.log(`✅ Migrados ${orders.length} pedidos.`);
    }

    console.log('🎉 Migración completada exitosamente.');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
}

migrate();
