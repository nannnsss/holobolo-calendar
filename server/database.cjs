const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'calendar.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      allDay INTEGER DEFAULT 0,
      color TEXT DEFAULT 'hsl(239, 100%, 80%)',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Database ready');
}

module.exports = { db, initDatabase };
