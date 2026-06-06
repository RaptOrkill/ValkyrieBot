// ============================================================
//  deploy.js — Déploiement des Slash Commands
//  Lance avec : node src/deploy.js
// ============================================================
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { closeCommand, whitelistCommand } = require('./commands/close');

const commands = [
  require('./commands/pseudo').data,
  require('./commands/host').data,
  require('./commands/draw').data,
  closeCommand.data,
  whitelistCommand.data
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Déploiement des commandes...');

    // Déploiement sur le serveur uniquement (instantané)
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID || 'REMPLACE_PAR_TON_CLIENT_ID',
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log(`✅ ${data.length} commande(s) déployée(s) sur le serveur !`);
    console.log('   ' + data.map(c => `/${c.name}`).join('  '));

  } catch (error) {
    console.error('❌ Erreur de déploiement :', error);
  }
})();
