// ============================================================
//  /rappel [id] — Envoie un MP de rappel aux inscrits (Admin)
// ============================================================
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');
const { reminderDMEmbed, errorEmbed, successEmbed } = require('../embeds');

const SERVER_IP = process.env.SERVER_IP || 'play.valkyrieuhc.fr';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rappel')
    .setDescription('Envoie un rappel en MP à tous les joueurs inscrits à une partie.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(opt =>
      opt.setName('id')
        .setDescription('ID de la partie (affiché sur l\'embed)')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('Message additionnel (optionnel)')
        .setRequired(false)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [errorEmbed('Administrateurs seulement.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const gameId = interaction.options.getInteger('id');
    const customMessage = interaction.options.getString('message');
    const game = db.getGame(gameId);

    if (!game) {
      return interaction.editReply({ embeds: [errorEmbed(`Partie #${gameId} introuvable.`)] });
    }

    const regs = db.getRegistrations(gameId);
    if (regs.length === 0) {
      return interaction.editReply({ embeds: [errorEmbed('Aucun joueur inscrit dans cette partie.')] });
    }

    let dmSuccess = 0, dmFail = 0;

    for (const player of regs) {
      try {
        const member = await interaction.guild.members.fetch(player.discord_id).catch(() => null);
        if (member) {
          await member.send({ embeds: [reminderDMEmbed(game, SERVER_IP, customMessage)] });
          dmSuccess++;
        } else {
          dmFail++;
        }
      } catch {
        dmFail++;
      }
    }

    return interaction.editReply({
      embeds: [successEmbed(
        `🔔 Rappel envoyé pour **${game.title}** (#${gameId})\n` +
        `📨 MP envoyés : ${dmSuccess} succès · ${dmFail} échecs (MP désactivés ou membre introuvable)`
      )]
    });
  }
};
