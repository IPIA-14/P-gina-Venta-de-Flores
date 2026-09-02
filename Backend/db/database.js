const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/database.sqlite');

// Ensure data directory exists
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: DB_PATH,
      driver: sqlite3.Database
    }).then(async (db) => {
      // Create tables if they don't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          role TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          qty TEXT,
          presentation TEXT,
          price REAL NOT NULL,
          icon TEXT,
          desc TEXT,
          category TEXT,
          images TEXT, -- JSON string array
          is_available INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY,
          createdAt TEXT NOT NULL,
          status TEXT NOT NULL,
          items TEXT, -- JSON string array
          total REAL,
          message TEXT
        );
      `);

      // Migración segura de columna si la DB ya existía
      try {
        await db.exec(`ALTER TABLE products ADD COLUMN is_available INTEGER DEFAULT 1;`);
      } catch (err) {
        // La columna ya existe, ignorar error
      }

      return db;
    });
  }
  return dbPromise;
}

module.exports = { getDb };
