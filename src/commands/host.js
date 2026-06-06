// ============================================================
//  /host — Créer une partie UHC (Admin)
// ============================================================
const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { errorEmbed } = require('../embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('host')
    .setDescription('Créer une nouvelle partie UHC.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        embeds: [errorEmbed('Tu dois être Administrateur pour utiliser cette commande.')],
        ephemeral: true
      });
    }

    // ── Construction du Modal ───────────────────────────────
    const modal = new ModalBuilder()
      .setCustomId('modal_host')
      .setTitle('🔱 Créer une partie ValkyrieUHC');

    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Titre de la partie')
      .setPlaceholder('ex: Valkyrie All Stars #1')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const modeInput = new TextInputBuilder()
      .setCustomId('mode')
      .setLabel('Mode de jeu')
      .setPlaceholder('ex: UHC Meetup, UHC Speed, Hitman...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const slotsInput = new TextInputBuilder()
      .setCustomId('slots')
      .setLabel('Nombre de slots')
      .setPlaceholder('ex: 30')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(3);

    const timeInput = new TextInputBuilder()
      .setCustomId('time')
      .setLabel('Heure + Jour  (HH:MM  ou  HH:MM JJ/MM)')
      .setPlaceholder('ex: 18:00  ou  18:00 15/06')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(11);

    const bannerInput = new TextInputBuilder()
      .setCustomId('banner')
      .setLabel('URL de la bannière (optionnel)')
      .setPlaceholder('https://...')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(modeInput),
      new ActionRowBuilder().addComponents(slotsInput),
      new ActionRowBuilder().addComponents(timeInput),
      new ActionRowBuilder().addComponents(bannerInput)
    );

    await interaction.showModal(modal);
  }
};
