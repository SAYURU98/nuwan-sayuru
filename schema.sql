CREATE TABLE IF NOT EXISTS endorsements (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT, company TEXT, relation TEXT, link TEXT, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', ip TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT, name TEXT NOT NULL, email TEXT, message TEXT NOT NULL, ip TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS site_content (id INTEGER PRIMARY KEY, data TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL DEFAULT (datetime('now')), updated_by TEXT);
CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, iterations INTEGER NOT NULL DEFAULT 100000);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS hits (ip TEXT NOT NULL, kind TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS hits_ip ON hits(ip, kind, at);
INSERT OR IGNORE INTO site_content (id, data, updated_by) VALUES (1, '{}', 'setup');
-- The admin password hash is inserted directly into the production database, never committed here.
