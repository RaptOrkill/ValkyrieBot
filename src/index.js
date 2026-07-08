// ============================================================
//  index.js — ValkyrieUHC Bot — Point d'entrée
// ============================================================
require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { handleInteraction } = require('./handlers/interactions');

// ── Constante IP Minecraft (modifiable ici) ─────────────────
const SERVER_IP = process.env.SERVER_IP || 'play.valkyrieuhc.fr';

// ── Client Discord ──────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

// ── Chargement des commandes ────────────────────────────────
client.commands = new Collection();

const pseudo       = require('./commands/pseudo');
const host         = require('./commands/host');
const draw         = require('./commands/draw');
const rappel       = require('./commands/rappel');
const { closeCommand, whitelistCommand } = require('./commands/close');

for (const cmd of [pseudo, host, draw, rappel, closeCommand, whitelistCommand]) {
  client.commands.set(cmd.data.name, cmd);
}

// ── Events ──────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ [ValkyrieUHC Bot] Connecté en tant que ${client.user.tag}`);
  console.log(`🌐 IP Serveur MC : ${SERVER_IP}`);
  console.log(`📊 Serveurs : ${client.guilds.cache.size}`);

  // Statut du bot
  client.user.setActivity('ValkyrieUHC • /pseudo', { type: 0 });
});

client.on('interactionCreate', interaction => {
  handleInteraction(interaction, client).catch(e => {
    console.error('[interactionCreate]', e);
  });
});

// ── Erreurs globales ────────────────────────────────────────
client.on('error', e => console.error('[CLIENT ERROR]', e));
process.on('unhandledRejection', e => console.error('[UNHANDLED REJECTION]', e));

// ── Connexion ───────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN).catch(e => {
  console.error('❌ Impossible de se connecter :', e.message);
  process.exit(1);
});
