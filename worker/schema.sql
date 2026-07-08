-- ============================================================
--  schema.sql — Schéma D1 (SQLite serverless Cloudflare)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  discord_id TEXT PRIMARY KEY,
  mc_pseudo  TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id         TEXT NOT NULL,
  title           TEXT NOT NULL,
  mode            TEXT NOT NULL,
  slots           INTEGER NOT NULL,
  time_ts         INTEGER NOT NULL,
  banner_url      TEXT,
  status          TEXT NOT NULL DEFAULT 'open',
  msg_id          TEXT,
  channel_list_id TEXT,
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  game_id    INTEGER NOT NULL,
  discord_id TEXT NOT NULL,
  mc_pseudo  TEXT NOT NULL,
  joined_at  TEXT NOT NULL,
  PRIMARY KEY (game_id, discord_id)
);
