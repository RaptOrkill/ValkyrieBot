// ============================================================
//  /close [gameId] — Fermer une partie + /whitelist
// ============================================================
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');
const { errorEmbed, successEmbed } = require('../embeds');

// ── /close ────────────────────────────────────────────────────
const closeCommand = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Ferme et supprime une partie UHC.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(opt =>
      opt.setName('id')
        .setDescription('ID de la partie à fermer')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [errorEmbed('Administrateurs seulement.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const gameId = interaction.options.getInteger('id');
    const game   = db.getGame(gameId);

    if (!game) {
      return interaction.editReply({ embeds: [errorEmbed(`Partie #${gameId} introuvable.`)] });
    }

    const lines = [`Partie **#${gameId} — ${game.title}** fermée.`];

    // Supprimer le salon de liste si existant
    if (game.channel_list_id) {
      try {
        const ch = await interaction.guild.channels.fetch(game.channel_list_id).catch(() => null);
        if (ch) {
          await ch.delete('Fermeture de la partie ' + gameId);
          lines.push('📂 Salon de liste supprimé.');
        }
      } catch (e) {
        lines.push('⚠️ Impossible de supprimer le salon (déjà supprimé ?)');
      }
    }

    // Désactiver les boutons sur l'embed de la partie
    if (game.msg_id && game.channel_list_id) {
      try {
        const announceChannelId = process.env.ANNOUNCE_CHANNEL_ID;
        if (announceChannelId) {
          const ch  = await interaction.guild.channels.fetch(announceChannelId).catch(() => null);
          const msg = ch ? await ch.messages.fetch(game.msg_id).catch(() => null) : null;
          if (msg) {
            await msg.edit({ components: [] }); // Retire les boutons
            lines.push('🔒 Boutons d\'inscription désactivés.');
          }
        }
      } catch { /* message peut-être supprimé */ }
    }

    // Supprimer de la DB (cascade sur registrations)
    db.deleteGame(gameId);
    lines.push('🗑️ Données supprimées de la base.');

    return interaction.editReply({ embeds: [successEmbed(lines.join('\n'))] });
  }
};

// ── /whitelist ────────────────────────────────────────────────
const whitelistCommand = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Génère la commande whitelist Minecraft pour les joueurs sélectionnés.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(opt =>
      opt.setName('id')
        .setDescription('ID de la partie')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [errorEmbed('Administrateurs seulement.')], ephemeral: true });
    }

    const gameId = interaction.options.getInteger('id');
    const game   = db.getGame(gameId);

    if (!game) {
      return interaction.reply({ embeds: [errorEmbed(`Partie #${gameId} introuvable.`)], ephemeral: true });
    }

    const regs = db.getRegistrations(gameId);
    if (regs.length === 0) {
      return interaction.reply({ embeds: [errorEmbed('Aucun inscrit.')], ephemeral: true });
    }

    // Prendre les X premiers selon les slots (ordre d'inscription ou après draw)
    const players = regs.slice(0, game.slots);
    const pseudos = players.map(r => r.mc_pseudo).join(' ');

    const wlCmd       = `whitelist add ${pseudos}`;
    const wlEnableCmd = `whitelist on`;
    const wlReloadCmd = `whitelist reload`;

    const msg = [
      '```',
      '# ── Commandes à coller dans la console Minecraft ──',
      wlEnableCmd,
      wlCmd,
      wlReloadCmd,
      '```',
      `\`\`\``,
      `# Pseudos uniquement (${players.length}) :`,
      pseudos,
      `\`\`\``
    ].join('\n');

    return interaction.reply({
      content: `📋 **Whitelist pour la partie #${gameId} — ${game.title}**\n${msg}`,
      ephemeral: true
    });
  }
};

module.exports = { closeCommand, whitelistCommand };
