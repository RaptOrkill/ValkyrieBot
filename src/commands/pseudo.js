// ============================================================
//  /pseudo — Lier son pseudo Minecraft
// ============================================================
const { SlashCommandBuilder } = require('discord.js');
const { upsertUser } = require('../database');
const { successEmbed, errorEmbed } = require('../embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pseudo')
    .setDescription('Lie ton pseudo Minecraft à ton compte Discord.')
    .addStringOption(opt =>
      opt.setName('nom')
        .setDescription('Ton pseudo Minecraft exact (sensible à la casse)')
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(16)
    ),

  async execute(interaction) {
    const pseudo = interaction.options.getString('nom').trim();

    // Validation : caractères autorisés (lettres, chiffres, underscore)
    if (!/^[a-zA-Z0-9_]{2,16}$/.test(pseudo)) {
      return interaction.reply({
        embeds: [errorEmbed('Pseudo invalide. Utilise seulement des lettres, chiffres et underscores (2-16 caractères).')],
        ephemeral: true
      });
    }

    upsertUser(interaction.user.id, pseudo);

    return interaction.reply({
      embeds: [successEmbed(`Ton pseudo **\`${pseudo}\`** est lié à ton compte Discord !\nTu peux maintenant t'inscrire aux parties UHC.`)],
      ephemeral: true
    });
  }
};
