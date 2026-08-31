const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const fs = require('fs');
const path = require('path');

// Obtener la clave secreta desde .env (misma que server.js)
const envPath = path.join(__dirname, '../.env');
let JWT_SECRET = 'clave_secreta_fallback';
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const match = envFile.match(/JWT_SECRET=(.*)/);
  if (match) JWT_SECRET = match[1].trim();
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token, 
      user: { username: user.username, role: user.role } 
    });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
