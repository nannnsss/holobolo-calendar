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
      color TEXT DEFAULT '#6366f1',
      description TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add description column if upgrading from older schema
  try {
    db.exec(`ALTER TABLE events ADD COLUMN description TEXT DEFAULT ''`);
    console.log('Migrated: added description column');
  } catch (e) {
    // Column already exists, ignore
  }

  console.log('Database ready');
}

module.exports = { db, initDatabase };
