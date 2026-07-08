// ============================================================
//  db.js — Requêtes D1 (SQLite serverless Cloudflare)
// ============================================================

// ── USERS ─────────────────────────────────────────────────────
export async function upsertUser(db, discordId, mcPseudo) {
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO users (discord_id, mc_pseudo, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(discord_id) DO UPDATE SET mc_pseudo = excluded.mc_pseudo, updated_at = excluded.updated_at`
  ).bind(discordId, mcPseudo, now).run();
}

export async function getUser(db, discordId) {
  return await db.prepare(`SELECT * FROM users WHERE discord_id = ?`).bind(discordId).first();
}

// ── GAMES ─────────────────────────────────────────────────────
export async function createGame(db, hostId, title, mode, slots, timeTs, bannerUrl) {
  const now = new Date().toISOString();
  const res = await db.prepare(
    `INSERT INTO games (host_id, title, mode, slots, time_ts, banner_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`
  ).bind(hostId, title, mode, slots, timeTs, bannerUrl || null, now).run();
  return res.meta.last_row_id;
}

export async function getGame(db, gameId) {
  return await db.prepare(`SELECT * FROM games WHERE id = ?`).bind(Number(gameId)).first();
}

export async function setGameMessage(db, gameId, msgId) {
  await db.prepare(`UPDATE games SET msg_id = ? WHERE id = ?`).bind(msgId, Number(gameId)).run();
}

export async function setGameChannel(db, gameId, channelId) {
  await db.prepare(`UPDATE games SET channel_list_id = ? WHERE id = ?`).bind(channelId, Number(gameId)).run();
}

export async function setGameStatus(db, gameId, status) {
  await db.prepare(`UPDATE games SET status = ? WHERE id = ?`).bind(status, Number(gameId)).run();
}

export async function deleteGame(db, gameId) {
  await db.prepare(`DELETE FROM games WHERE id = ?`).bind(Number(gameId)).run();
  await db.prepare(`DELETE FROM registrations WHERE game_id = ?`).bind(Number(gameId)).run();
}

export async function getOpenGames(db) {
  const res = await db.prepare(`SELECT * FROM games WHERE status != 'closed' ORDER BY id DESC`).all();
  return res.results;
}

// ── REGISTRATIONS ────────────────────────────────────────────
export async function register(db, gameId, discordId, mcPseudo) {
  const existing = await db.prepare(
    `SELECT 1 FROM registrations WHERE game_id = ? AND discord_id = ?`
  ).bind(Number(gameId), discordId).first();
  if (existing) return { success: false, reason: 'already' };

  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO registrations (game_id, discord_id, mc_pseudo, joined_at) VALUES (?, ?, ?, ?)`
  ).bind(Number(gameId), discordId, mcPseudo, now).run();
  return { success: true };
}

export async function unregister(db, gameId, discordId) {
  const res = await db.prepare(
    `DELETE FROM registrations WHERE game_id = ? AND discord_id = ?`
  ).bind(Number(gameId), discordId).run();
  return res.meta.changes > 0;
}

export async function getRegistrations(db, gameId) {
  const res = await db.prepare(
    `SELECT * FROM registrations WHERE game_id = ? ORDER BY joined_at ASC`
  ).bind(Number(gameId)).all();
  return res.results;
}

export async function countRegistrations(db, gameId) {
  const row = await db.prepare(
    `SELECT COUNT(*) as c FROM registrations WHERE game_id = ?`
  ).bind(Number(gameId)).first();
  return row.c;
}

export async function isRegistered(db, gameId, discordId) {
  const row = await db.prepare(
    `SELECT 1 FROM registrations WHERE game_id = ? AND discord_id = ?`
  ).bind(Number(gameId), discordId).first();
  return !!row;
}
