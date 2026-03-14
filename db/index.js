const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'hits.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create hits table
db.exec(`
  CREATE TABLE IF NOT EXISTS hits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip TEXT,
    user_agent TEXT,
    origin_url TEXT,
    referer TEXT,
    cookies TEXT,
    local_storage TEXT,
    session_storage TEXT,
    dom TEXT,
    screenshot TEXT,
    extra TEXT
  );

  CREATE TABLE IF NOT EXISTS ssrf_hits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    probe_id TEXT,
    ip TEXT,
    user_agent TEXT,
    referer TEXT,
    host_header TEXT,
    all_headers TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

module.exports = db;
