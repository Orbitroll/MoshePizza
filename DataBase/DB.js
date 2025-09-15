// db.js (ESM)
import sqlite3pkg from "sqlite3";
import fs from "fs";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlite3 = sqlite3pkg.verbose();

const dataDir = join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, "app.db");

// Singleton connection
let _db;

/** Open DB once */
function getDB() {
  if (_db) return _db;
  _db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Failed to open SQLite DB:", err);
      throw err;
    }
  });

  _db.serialize(() => {
    // Pragmas for better reliability
    _db.run("PRAGMA journal_mode = WAL;");
    _db.run("PRAGMA foreign_keys = ON;");
    _db.run("PRAGMA busy_timeout = 5000;");

    // Schema
    _db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer TEXT NOT NULL,
        total REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        json TEXT
      )
    `);
    // Optional: versioning table for future migrations
    _db.run(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  return _db;
}

// Promise helpers
export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

export const close = () =>
  new Promise((resolve, reject) => {
    if (!_db) return resolve();
    _db.close((err) => {
      if (err) return reject(err);
      _db = null;
      resolve();
    });
  });

// Convenience APIs for invoices
export async function createInvoice({ customer, total, json = null }) {
  return run(
    `INSERT INTO invoices (customer, total, json) VALUES (?, ?, ?)`,
    [customer, total, json]
  );
}

export async function getInvoiceById(id) {
  return get(`SELECT * FROM invoices WHERE id = ?`, [id]);
}

export async function listInvoices({ limit = 50, offset = 0 } = {}) {
  return all(
    `SELECT * FROM invoices ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export default { run, get, all, close, createInvoice, getInvoiceById, listInvoices };
