// ============================================================
//  embeds.js — Embeds Discord (objets JSON bruts, pas discord.js)
// ============================================================
export const COLORS = {
  gold:    0xFFAA00,
  orange:  0xFF6600,
  green:   0x2ECC71,
  red:     0xE74C3C,
  blue:    0x3498DB,
  purple:  0x9B59B6,
  dark:    0x1A1A2E,
};

export function gameEmbed(game, registeredCount) {
  const isFull   = registeredCount >= game.slots;
  const barFull  = Math.floor((registeredCount / game.slots) * 10);
  const barEmpty = 10 - barFull;
  const bar = '🟩'.repeat(barFull) + '⬛'.repeat(barEmpty);

  const embed = {
    color: isFull ? COLORS.red : COLORS.gold,
    title: `🔱 ${game.title}`,
    description: `> *L'Apocalypse Valkyrie commence bientôt. Êtes-vous prêts ?*`,
    fields: [
      { name: '🎮 Mode de jeu', value: `\`${game.mode}\``, inline: true },
      { name: '⏰ Heure de début', value: `<t:${game.time_ts}:R>  (<t:${game.time_ts}:t>)`, inline: true },
      { name: '👥 Inscriptions', value: `${bar}\n**${registeredCount} / ${game.slots}** joueurs${isFull ? '\n🔴 **COMPLET**' : ''}`, inline: false }
    ],
    footer: { text: `ID Partie : ${game.id}  •  Valkyrie UHC  •  valkyrie-uhc.fr` },
    timestamp: new Date().toISOString()
  };
  if (game.banner_url) embed.image = { url: game.banner_url };
  return embed;
}

export function gameButtons(gameId, isFull = false) {
  return {
    type: 1,
    components: [
      { type: 2, custom_id: `register_${gameId}`, label: "S'inscrire", emoji: { name: '✅' }, style: isFull ? 2 : 3, disabled: isFull },
      { type: 2, custom_id: `unregister_${gameId}`, label: 'Quitter', emoji: { name: '❌' }, style: 4 },
      { type: 2, custom_id: `list_${gameId}`, label: 'Liste', emoji: { name: '📋' }, style: 1 }
    ]
  };
}

export function drawEmbed(game, selected, substitutes) {
  const selectedList = selected
    .map((r, i) => `\`${String(i + 1).padStart(2, '0')}\` <@${r.discord_id}> — **${r.mc_pseudo}**`)
    .join('\n') || '*Aucun joueur*';

  const subList = substitutes.length > 0
    ? substitutes.map((r, i) => `\`${String(i + 1).padStart(2, '0')}\` <@${r.discord_id}> — ${r.mc_pseudo}`).join('\n')
    : '*Aucun remplaçant*';

  const embed = {
    color: COLORS.gold,
    title: `🏆 Résultats — ${game.title}`,
    description: `> Tirage au sort effectué ! **${selected.length}** joueur(s) sélectionné(s) sur **${game.slots}** slots.`,
    fields: [
      { name: `🏆 JOUEURS SÉLECTIONNÉS (${selected.length}/${game.slots})`, value: selectedList.length > 1020 ? selectedList.substring(0, 1020) + '...' : selectedList, inline: false },
      { name: `⏳ REMPLAÇANTS (${substitutes.length})`, value: subList.length > 1020 ? subList.substring(0, 1020) + '...' : subList, inline: false },
      { name: '🎮 Mode · Slots', value: `\`${game.mode}\` · **${game.slots}** places`, inline: true }
    ],
    footer: { text: `Partie #${game.id}  •  Valkyrie UHC` },
    timestamp: new Date().toISOString()
  };
  if (game.banner_url) embed.thumbnail = { url: game.banner_url };
  return embed;
}

export function adminListEmbed(game, registrations) {
  const list = registrations.length > 0
    ? registrations.map((r, i) => `\`${String(i + 1).padStart(2, '0')}\` <@${r.discord_id}> — **${r.mc_pseudo}**`).join('\n')
    : '*Aucun inscrit pour le moment.*';

  return {
    color: COLORS.blue,
    title: `📋 Liste — ${game.title}`,
    description: `**${registrations.length} / ${game.slots}** joueur(s) inscrit(s)\n\n${list.length > 3900 ? list.substring(0, 3900) + '...' : list}`,
    footer: { text: `Partie #${game.id}  •  Valkyrie UHC` },
    timestamp: new Date().toISOString()
  };
}

export function selectedDMEmbed(game, serverIp) {
  return {
    color: COLORS.gold,
    title: '🏆 Félicitations ! Tu as été sélectionné(e) !',
    description:
      `Tu fais partie des joueurs retenus pour **${game.title}** !\n\n` +
      `**Connecte-toi le <t:${game.time_ts}:F>**\n\n` +
      `>>> 🌐 **IP du serveur :** \`${serverIp}\`\n` +
      `🎮 **Mode :** \`${game.mode}\`\n\n` +
      `Bonne chance ! ⚔️`,
    thumbnail: { url: 'https://i.imgur.com/7RkFw1b.png' },
    footer: { text: 'Valkyrie UHC  •  valkyrie-uhc.fr' },
    timestamp: new Date().toISOString()
  };
}

export function substituteDMEmbed(game, rank) {
  return {
    color: COLORS.orange,
    title: '⏳ Tu es remplaçant(e) !',
    description:
      `Tu n'as pas été tiré(e) au sort pour **${game.title}**, mais tu es **remplaçant #${rank}**.\n\n` +
      `Si un joueur sélectionné est absent, tu pourrais être appelé(e). Reste disponible !`,
    footer: { text: 'Valkyrie UHC  •  valkyrie-uhc.fr' },
    timestamp: new Date().toISOString()
  };
}

export function reminderDMEmbed(game, serverIp, customMessage) {
  return {
    color: COLORS.purple,
    title: '🔔 Rappel — Partie UHC à venir !',
    description:
      `Tu es inscrit(e) pour **${game.title}** !\n\n` +
      `**Ça commence <t:${game.time_ts}:R> (<t:${game.time_ts}:F>)**\n\n` +
      `>>> 🌐 **IP du serveur :** \`${serverIp}\`\n` +
      `🎮 **Mode :** \`${game.mode}\`\n\n` +
      (customMessage ? `📝 ${customMessage}\n\n` : '') +
      `Sois prêt(e) à l'heure ! ⚔️`,
    thumbnail: { url: 'https://i.imgur.com/7RkFw1b.png' },
    footer: { text: 'Valkyrie UHC  •  valkyrie-uhc.fr' },
    timestamp: new Date().toISOString()
  };
}

export function errorEmbed(message) {
  return { color: COLORS.red, description: `❌ ${message}` };
}

export function successEmbed(message) {
  return { color: COLORS.green, description: `✅ ${message}` };
}
