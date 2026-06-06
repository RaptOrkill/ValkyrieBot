// ============================================================
//  /draw [gameId] — Tirage au sort (Admin)
// ============================================================
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionOverwrites
} = require('discord.js');
const db = require('../database');
const { drawEmbed, selectedDMEmbed, substituteDMEmbed, errorEmbed, successEmbed } = require('../embeds');

const SERVER_IP = process.env.SERVER_IP || 'play.valkyrieuhc.fr';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('draw')
    .setDescription('Lance le tirage au sort pour une partie.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(opt =>
      opt.setName('id')
        .setDescription('ID de la partie (affiché sur l\'embed)')
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
    if (game.status === 'drawn') {
      return interaction.editReply({ embeds: [errorEmbed(`Le tirage pour la partie #${gameId} a déjà été effectué.`)] });
    }

    const all = db.getRegistrations(gameId);
    if (all.length === 0) {
      return interaction.editReply({ embeds: [errorEmbed('Aucun joueur inscrit dans cette partie.')] });
    }

    // ── Tirage au sort (Fisher-Yates shuffle) ───────────────
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    const selected    = shuffled.slice(0, game.slots);
    const substitutes = shuffled.slice(game.slots);

    // ── Création du salon de liste ───────────────────────────
    let listChannel = null;
    try {
      const channelName = `liste-${game.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}`;

      listChannel = await interaction.guild.channels.create({
        name: `📂-${channelName}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            // @everyone ne peut pas écrire mais peut lire
            id: interaction.guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny:  [PermissionFlagsBits.SendMessages]
          }
        ],
        topic: `Liste officielle — ${game.title} | ID: ${gameId}`
      });

      // Envoyer l'embed dans le salon
      const listMsg = await listChannel.send({ embeds: [drawEmbed(game, selected, substitutes)] });
      db.setGameChannel(gameId, listChannel.id);

    } catch (e) {
      console.error('[draw] Erreur création salon:', e);
    }

    // ── Mise à jour du statut ────────────────────────────────
    db.setGameStatus(gameId, 'drawn');

    // ── Notifications MP ─────────────────────────────────────
    let dmSuccess = 0, dmFail = 0;

    // MP aux sélectionnés
    for (const player of selected) {
      try {
        const member = await interaction.guild.members.fetch(player.discord_id).catch(() => null);
        if (member) {
          await member.send({ embeds: [selectedDMEmbed(game, SERVER_IP)] });
          dmSuccess++;
        }
      } catch {
        dmFail++;
      }
    }

    // MP aux remplaçants
    for (let i = 0; i < substitutes.length; i++) {
      try {
        const member = await interaction.guild.members.fetch(substitutes[i].discord_id).catch(() => null);
        if (member) {
          await member.send({ embeds: [substituteDMEmbed(game, i + 1)] });
        }
      } catch { /* MP désactivés */ }
    }

    // ── Réponse admin ────────────────────────────────────────
    const replyLines = [
      `✅ Tirage effectué pour **${game.title}** !`,
      `🏆 **${selected.length}** sélectionnés · ⏳ **${substitutes.length}** remplaçants`,
      `📨 MP envoyés : ${dmSuccess} succès · ${dmFail} échecs (MP désactivés)`,
    ];
    if (listChannel) replyLines.push(`📂 Salon créé : ${listChannel}`);

    return interaction.editReply({
      embeds: [successEmbed(replyLines.join('\n'))]
    });
  }
};
