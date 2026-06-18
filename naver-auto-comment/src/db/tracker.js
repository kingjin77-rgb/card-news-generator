import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../logs/comments.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS commented_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        comment TEXT,
        type TEXT,
        commented_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS daily_counts (
        date TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0
      );
    `);
  }
  return db;
}

export function hasCommented(url) {
  const row = getDb().prepare('SELECT id FROM commented_posts WHERE url = ?').get(url);
  return !!row;
}

export function markCommented(url, comment, type) {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO commented_posts (url, comment, type) VALUES (?, ?, ?)').run(url, comment, type);
  const today = new Date().toISOString().slice(0, 10);
  db.prepare('INSERT INTO daily_counts (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1').run(today);
}

export function getDailyCount() {
  const today = new Date().toISOString().slice(0, 10);
  const row = getDb().prepare('SELECT count FROM daily_counts WHERE date = ?').get(today);
  return row ? row.count : 0;
}

export function getHistory(limit = 50) {
  return getDb().prepare('SELECT url, comment, type, commented_at FROM commented_posts ORDER BY commented_at DESC LIMIT ?').all(limit);
}

export function getStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as cnt FROM commented_posts').get().cnt;
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = db.prepare('SELECT count FROM daily_counts WHERE date = ?').get(today);
  const byType = db.prepare('SELECT type, COUNT(*) as cnt FROM commented_posts GROUP BY type').all();
  return { total, today: todayRow ? todayRow.count : 0, byType };
}
