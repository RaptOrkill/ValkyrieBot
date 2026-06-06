// ============================================================
//  database.js — Stockage JSON pur (lowdb v2 compatible)
//  Zéro compilation requise — fonctionne avec Node 24
// ============================================================
const fs   = require('fs');
const path = require('path');

// Sur Railway : DB_DIR pointe vers le volume persistant /data
// En local   : fichier à la racine du projet
const DB_DIR  = process.env.DB_DIR || path.join(__dirname, '..');
const DB_PATH = path.join(DB_DIR, 'valkyrie.db.json');

// Crée le dossier si besoin (cas du volume Railway au premier démarrage)
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DEFAULT = {
  users:         [],
  games:         [],
  registrations: [],
  nextGameId:    1
};

// ── Base de données synchrone (lecture/écriture JSON) ────────
class Store {
  constructor(filePath) {
    this.path = filePath;
    this._load();
  }

  _load() {
    if (fs.existsSync(this.path)) {
      try { this.data = JSON.parse(fs.readFileSync(this.path, 'utf-8')); }
      catch { this.data = JSON.parse(JSON.stringify(DEFAULT)); }
    } else {
      this.data = JSON.parse(JSON.stringify(DEFAULT));
    }
    // Garantir toutes les clés
    for (const k of Object.keys(DEFAULT)) {
      if (this.data[k] === undefined) this.data[k] = DEFAULT[k];
    }
  }

  _save() {
    fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }

  get(key)      { return this.data[key]; }
  set(key, val) { this.data[key] = val; this._save(); }
}

const store = new Store(DB_PATH);

// ── USERS ─────────────────────────────────────────────────────
function upsertUser(discordId, mcPseudo) {
  const users = store.get('users');
  const idx   = users.findIndex(u => u.discord_id === discordId);
  const now   = new Date().toISOString();
  if (idx >= 0) users[idx] = { discord_id: discordId, mc_pseudo: mcPseudo, updated_at: now };
  else          users.push({ discord_id: discordId, mc_pseudo: mcPseudo, updated_at: now });
  store.set('users', users);
}

function getUser(discordId) {
  return store.get('users').find(u => u.discord_id === discordId) || null;
}

// ── GAMES ─────────────────────────────────────────────────────
function createGame(hostId, title, mode, slots, timeTs, bannerUrl) {
  const games = store.get('games');
  const id    = store.get('nextGameId');
  games.push({
    id, host_id: hostId, title, mode, slots,
    time_ts: timeTs, banner_url: bannerUrl || null,
    status: 'open', msg_id: null, channel_list_id: null,
    created_at: new Date().toISOString()
  });
  store.set('games', games);
  store.set('nextGameId', id + 1);
  return id;
}

function getGame(gameId) {
  return store.get('games').find(g => g.id === Number(gameId)) || null;
}

function setGameMessage(gameId, msgId) {
  const games = store.get('games');
  const g = games.find(g => g.id === Number(gameId));
  if (g) { g.msg_id = msgId; store.set('games', games); }
}

function setGameChannel(gameId, channelId) {
  const games = store.get('games');
  const g = games.find(g => g.id === Number(gameId));
  if (g) { g.channel_list_id = channelId; store.set('games', games); }
}

function setGameStatus(gameId, status) {
  const games = store.get('games');
  const g = games.find(g => g.id === Number(gameId));
  if (g) { g.status = status; store.set('games', games); }
}

function deleteGame(gameId) {
  store.set('games', store.get('games').filter(g => g.id !== Number(gameId)));
  store.set('registrations', store.get('registrations').filter(r => r.game_id !== Number(gameId)));
}

function getOpenGames() {
  return store.get('games').filter(g => g.status !== 'closed').sort((a, b) => b.id - a.id);
}

// ── REGISTRATIONS ─────────────────────────────────────────────
function register(gameId, discordId, mcPseudo) {
  const regs = store.get('registrations');
  if (regs.find(r => r.game_id === Number(gameId) && r.discord_id === discordId))
    return { success: false, reason: 'already' };
  regs.push({ game_id: Number(gameId), discord_id: discordId, mc_pseudo: mcPseudo, joined_at: new Date().toISOString() });
  store.set('registrations', regs);
  return { success: true };
}

function unregister(gameId, discordId) {
  const regs = store.get('registrations');
  const filtered = regs.filter(r => !(r.game_id === Number(gameId) && r.discord_id === discordId));
  store.set('registrations', filtered);
  return filtered.length < regs.length;
}

function getRegistrations(gameId) {
  return store.get('registrations')
    .filter(r => r.game_id === Number(gameId))
    .sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
}

function countRegistrations(gameId) {
  return store.get('registrations').filter(r => r.game_id === Number(gameId)).length;
}

function isRegistered(gameId, discordId) {
  return !!store.get('registrations').find(r => r.game_id === Number(gameId) && r.discord_id === discordId);
}

module.exports = {
  store,
  upsertUser, getUser,
  createGame, getGame, setGameMessage, setGameChannel,
  setGameStatus, deleteGame, getOpenGames,
  register, unregister, getRegistrations, countRegistrations, isRegistered
};
