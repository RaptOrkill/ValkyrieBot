// ============================================================
//  embeds.js — Embeds Discord centralisés
// ============================================================
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ── Couleurs Valkyrie ────────────────────────────────────────
const COLORS = {
  gold:    0xFFAA00,
  orange:  0xFF6600,
  green:   0x2ECC71,
  red:     0xE74C3C,
  blue:    0x3498DB,
  purple:  0x9B59B6,
  dark:    0x1A1A2E,
};

// ============================================================
//  Embed principal de partie
// ============================================================
function gameEmbed(game, registeredCount) {
  const isFull   = registeredCount >= game.slots;
  const barFull  = Math.floor((registeredCount / game.slots) * 10);
  const barEmpty = 10 - barFull;
  const bar = '🟩'.repeat(barFull) + '⬛'.repeat(barEmpty);

  const embed = new EmbedBuilder()
    .setColor(isFull ? COLORS.red : COLORS.gold)
    .setTitle(`🔱 ${game.title}`)
    .setDescription(
      `> *L'Apocalypse Valkyrie commence bientôt. Êtes-vous prêts ?*`
    )
    .addFields(
      {
        name: '🎮 Mode de jeu',
        value: `\`${game.mode}\``,
        inline: true
      },
      {
        name: '⏰ Heure de début',
        value: `<t:${game.time_ts}:R>  (<t:${game.time_ts}:t>)`,
        inline: true
      },
      {
        name: '👥 Inscriptions',
        value: `${bar}\n**${registeredCount} / ${game.slots}** joueurs${isFull ? '\n🔴 **COMPLET**' : ''}`,
        inline: false
      }
    )
    .setFooter({
      text: `ID Partie : ${game.id}  •  Valkyrie UHC  •  valkyrie-uhc.fr`,
      iconURL: 'https://i.imgur.com/7RkFw1b.png'
    })
    .setTimestamp();

  if (game.banner_url) embed.setImage(game.banner_url);

  return embed;
}

// ── Boutons de la partie ─────────────────────────────────────
function gameButtons(gameId, isFull = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`register_${gameId}`)
      .setLabel('S\'inscrire')
      .setEmoji('✅')
      .setStyle(isFull ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(isFull),

    new ButtonBuilder()
      .setCustomId(`unregister_${gameId}`)
      .setLabel('Quitter')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`list_${gameId}`)
      .setLabel('Liste')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary)
  );
}

// ============================================================
//  Embed de tirage au sort
// ============================================================
function drawEmbed(game, selected, substitutes) {
  const selectedList = selected
    .map((r, i) => `\`${String(i + 1).padStart(2, '0')}\` <@${r.discord_id}> — **${r.mc_pseudo}**`)
    .join('\n') || '*Aucun joueur*';

  const subList = substitutes.length > 0
    ? substitutes
        .map((r, i) => `\`${String(i + 1).padStart(2, '0')}\` <@${r.discord_id}> — ${r.mc_pseudo}`)
        .join('\n')
    : '*Aucun remplaçant*';

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`🏆 Résultats — ${game.title}`)
    .setDescription(
      `> Tirage au sort effectué ! **${selected.length}** joueur(s) sélectionné(s) sur **${game.slots}** slots.`
    )
    .addFields(
      {
        name: `🏆 JOUEURS SÉLECTIONNÉS (${selected.length}/${game.slots})`,
        value: selectedList.length > 1020 ? selectedList.substring(0, 1020) + '...' : selectedList,
        inline: false
      },
      {
        name: `⏳ REMPLAÇANTS (${substitutes.length})`,
        value: subList.length > 1020 ? subList.substring(0, 1020) + '...' : subList,
        inline: false
      }
    )
    .addFields({
      name: '🎮 Mode · Slots',
      value: `\`${game.mode}\` · **${game.slots}** places`,
      inline: true
    })
    .setFooter({ text: `Partie #${game.id}  •  Valkyrie UHC` })
    .setTimestamp();

  if (game.banner_url) embed.setThumbnail(game.banner_url);

  return embed;
}

// ============================================================
//  Embed liste admin
// ============================================================
function adminListEmbed(game, registrations) {
  const list = registrations.length > 0
    ? registrations
        .map((r, i) => `\`${String(i + 1).padStart(2, '0')}\` <@${r.discord_id}> — **${r.mc_pseudo}**`)
        .join('\n')
    : '*Aucun inscrit pour le moment.*';

  return new EmbedBuilder()
    .setColor(COLORS.blue)
    .setTitle(`📋 Liste — ${game.title}`)
    .setDescription(
      `**${registrations.length} / ${game.slots}** joueur(s) inscrit(s)\n\n${
        list.length > 3900 ? list.substring(0, 3900) + '...' : list
      }`
    )
    .setFooter({ text: `Partie #${game.id}  •  Valkyrie UHC` })
    .setTimestamp();
}

// ============================================================
//  Embed MP sélectionné
// ============================================================
function selectedDMEmbed(game, serverIp) {
  return new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle('🏆 Félicitations ! Tu as été sélectionné(e) !')
    .setDescription(
      `Tu fais partie des joueurs retenus pour **${game.title}** !\n\n` +
      `**Connecte-toi le <t:${game.time_ts}:F>**\n\n` +
      `>>> 🌐 **IP du serveur :** \`${serverIp}\`\n` +
      `🎮 **Mode :** \`${game.mode}\`\n\n` +
      `Bonne chance ! ⚔️`
    )
    .setThumbnail('https://i.imgur.com/7RkFw1b.png')
    .setFooter({ text: 'Valkyrie UHC  •  valkyrie-uhc.fr' })
    .setTimestamp();
}

// ============================================================
//  Embed MP remplaçant
// ============================================================
function substituteDMEmbed(game, rank) {
  return new EmbedBuilder()
    .setColor(COLORS.orange)
    .setTitle('⏳ Tu es remplaçant(e) !')
    .setDescription(
      `Tu n'as pas été tiré(e) au sort pour **${game.title}**, mais tu es **remplaçant #${rank}**.\n\n` +
      `Si un joueur sélectionné est absent, tu pourrais être appelé(e). Reste disponible !`
    )
    .setFooter({ text: 'Valkyrie UHC  •  valkyrie-uhc.fr' })
    .setTimestamp();
}

// ============================================================
//  Embed MP rappel
// ============================================================
function reminderDMEmbed(game, serverIp, customMessage) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.purple)
    .setTitle('🔔 Rappel — Partie UHC à venir !')
    .setDescription(
      `Tu es inscrit(e) pour **${game.title}** !\n\n` +
      `**Ça commence <t:${game.time_ts}:R> (<t:${game.time_ts}:F>)**\n\n` +
      `>>> 🌐 **IP du serveur :** \`${serverIp}\`\n` +
      `🎮 **Mode :** \`${game.mode}\`\n\n` +
      (customMessage ? `📝 ${customMessage}\n\n` : '') +
      `Sois prêt(e) à l'heure ! ⚔️`
    )
    .setThumbnail('https://i.imgur.com/7RkFw1b.png')
    .setFooter({ text: 'Valkyrie UHC  •  valkyrie-uhc.fr' })
    .setTimestamp();

  return embed;
}

// ============================================================
//  Embed erreur (éphémère)
// ============================================================
function errorEmbed(message) {
  return new EmbedBuilder()
    .setColor(COLORS.red)
    .setDescription(`❌ ${message}`);
}

// ============================================================
//  Embed succès (éphémère)
// ============================================================
function successEmbed(message) {
  return new EmbedBuilder()
    .setColor(COLORS.green)
    .setDescription(`✅ ${message}`);
}

module.exports = {
  COLORS,
  gameEmbed, gameButtons,
  drawEmbed, adminListEmbed,
  selectedDMEmbed, substituteDMEmbed, reminderDMEmbed,
  errorEmbed, successEmbed
};
