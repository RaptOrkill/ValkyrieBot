// ============================================================
//  interactions.js — Gestion des Modals et Boutons
// ============================================================
const db      = require('../database');
const embeds  = require('../embeds');
const { PermissionFlagsBits } = require('discord.js');

const SERVER_IP         = process.env.SERVER_IP          || 'play.valkyrieuhc.fr';
const ANNOUNCE_CHANNEL  = process.env.ANNOUNCE_CHANNEL_ID;

// ============================================================
//  Dispatcher principal
// ============================================================
async function handleInteraction(interaction, client) {

  // ── Slash Commands ───────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (e) {
      console.error('[CMD]', e);
      const payload = { embeds: [embeds.errorEmbed('Une erreur interne est survenue.')], ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
    return;
  }

  // ── Modal Submit ─────────────────────────────────────────
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_host') {
      await handleHostModal(interaction);
    }
    return;
  }

  // ── Boutons ──────────────────────────────────────────────
  if (interaction.isButton()) {
    const [action, gameIdStr] = interaction.customId.split('_');
    const gameId = parseInt(gameIdStr, 10);

    switch (action) {
      case 'register':   await handleRegister(interaction, gameId);   break;
      case 'unregister': await handleUnregister(interaction, gameId); break;
      case 'list':       await handleList(interaction, gameId);       break;
    }
  }
}

// ============================================================
//  Modal /host → Création de la partie
// ============================================================
async function handleHostModal(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const title     = interaction.fields.getTextInputValue('title').trim();
    const mode      = interaction.fields.getTextInputValue('mode').trim();
    const slotsRaw  = interaction.fields.getTextInputValue('slots').trim();
    const timeRaw   = interaction.fields.getTextInputValue('time').trim();
    const bannerUrl = interaction.fields.getTextInputValue('banner').trim() || null;

    // ── Validation slots ────────────────────────────────────
    const slots = parseInt(slotsRaw, 10);
    if (isNaN(slots) || slots < 2 || slots > 200) {
      return interaction.editReply({
        embeds: [embeds.errorEmbed('Nombre de slots invalide (doit être entre 2 et 200).')]
      });
    }

    // ── Calcul timestamp ────────────────────────────────────
    // Format accepté :
    //   "HH:MM"          → aujourd'hui (ou demain si heure passée)
    //   "HH:MM JJ/MM"    → jour précis dans l'année en cours (ou suivante si passé)
    //   "HH:MM JJ/MM/AAAA" → date complète
    const fullMatch = timeRaw.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    const timeOnly  = timeRaw.match(/^(\d{1,2}):(\d{2})$/);

    if (!fullMatch && !timeOnly) {
      return interaction.editReply({
        embeds: [embeds.errorEmbed(
          'Format invalide. Exemples :\n' +
          '• `18:00` — aujourd\'hui (ou demain si passé)\n' +
          '• `18:00 15/06` — le 15 juin\n' +
          '• `18:00 15/06/2026` — date précise'
        )]
      });
    }

    let hours, minutes, gameDate;
    const now = new Date();

    if (fullMatch) {
      hours   = parseInt(fullMatch[1], 10);
      minutes = parseInt(fullMatch[2], 10);
      const day   = parseInt(fullMatch[3], 10);
      const month = parseInt(fullMatch[4], 10) - 1; // 0-indexed
      const year  = fullMatch[5] ? parseInt(fullMatch[5], 10) : now.getFullYear();

      if (hours > 23 || minutes > 59 || day < 1 || day > 31 || month < 0 || month > 11) {
        return interaction.editReply({ embeds: [embeds.errorEmbed('Date ou heure invalide.')] });
      }
      gameDate = new Date(year, month, day, hours, minutes, 0, 0);
      // Si la date est passée et qu'aucune année n'était précisée → an prochain
      if (gameDate <= now && !fullMatch[5]) {
        gameDate.setFullYear(year + 1);
      }
    } else {
      // Heure seule → aujourd'hui ou demain
      hours   = parseInt(timeOnly[1], 10);
      minutes = parseInt(timeOnly[2], 10);
      if (hours > 23 || minutes > 59) {
        return interaction.editReply({ embeds: [embeds.errorEmbed('Heure invalide.')] });
      }
      gameDate = new Date(now);
      gameDate.setHours(hours, minutes, 0, 0);
      if (gameDate <= now) gameDate.setDate(gameDate.getDate() + 1);
    }

    const timeTs = Math.floor(gameDate.getTime() / 1000);

    // Validation URL bannière
    if (bannerUrl && !/^https?:\/\/\S+$/.test(bannerUrl)) {
      return interaction.editReply({
        embeds: [embeds.errorEmbed('URL de bannière invalide (doit commencer par http:// ou https://).')]
      });
    }

    // ── Création en DB ──────────────────────────────────────
    const gameId = db.createGame(
      interaction.user.id, title, mode, slots, timeTs, bannerUrl
    );
    const game = db.getGame(gameId);

    // ── Envoi de l'embed ────────────────────────────────────
    let announceChannel = null;
    if (ANNOUNCE_CHANNEL) {
      announceChannel = await interaction.guild.channels.fetch(ANNOUNCE_CHANNEL).catch(() => null);
    }
    if (!announceChannel) {
      announceChannel = interaction.channel;
    }

    const msg = await announceChannel.send({
      embeds:     [embeds.gameEmbed(game, 0)],
      components: [embeds.gameButtons(gameId, false)]
    });

    db.setGameMessage(gameId, msg.id);

    return interaction.editReply({
      embeds: [embeds.successEmbed(
        `Partie **#${gameId} — ${title}** créée !\n` +
        `📢 Embed publié dans ${announceChannel}\n` +
        `🕐 Début : <t:${timeTs}:R>\n` +
        `👥 Slots : **${slots}**`
      )]
    });

  } catch (e) {
    console.error('[modal_host]', e);
    if (interaction.deferred) {
      interaction.editReply({ embeds: [embeds.errorEmbed('Erreur interne lors de la création.')] });
    }
  }
}

// ============================================================
//  Bouton ✅ S'inscrire
// ============================================================
async function handleRegister(interaction, gameId) {
  await interaction.deferReply({ ephemeral: true });

  const game = db.getGame(gameId);
  if (!game || game.status !== 'open') {
    return interaction.editReply({
      embeds: [embeds.errorEmbed('Les inscriptions pour cette partie sont fermées.')]
    });
  }

  // Vérifier pseudo lié
  const user = db.getUser(interaction.user.id);
  if (!user) {
    // MP si possible
    try {
      await interaction.user.send({
        embeds: [embeds.errorEmbed(
          '❌ Tu dois lier ton pseudo Minecraft avant de t\'inscrire !\n\n' +
          '**Tape `/pseudo NomMC` sur le serveur Discord.**'
        )]
      });
    } catch { /* MP désactivés */ }
    return interaction.editReply({
      embeds: [embeds.errorEmbed('Tu dois d\'abord lier ton pseudo avec `/pseudo NomMC`.')]
    });
  }

  // Vérifier si déjà inscrit
  if (db.isRegistered(gameId, interaction.user.id)) {
    return interaction.editReply({
      embeds: [embeds.errorEmbed('Tu es déjà inscrit(e) à cette partie !')]
    });
  }

  // Vérifier si complet
  const count = db.countRegistrations(gameId);
  if (count >= game.slots) {
    return interaction.editReply({
      embeds: [embeds.errorEmbed('Les slots sont complets ! Tu peux t\'inscrire quand même en tant que remplaçant lors du `/draw`.')]
    });
  }

  // Inscription
  const result = db.register(gameId, interaction.user.id, user.mc_pseudo);
  if (!result.success) {
    return interaction.editReply({ embeds: [embeds.errorEmbed('Erreur lors de l\'inscription.')] });
  }

  // MP de confirmation
  try {
    await interaction.user.send({
      embeds: [new (require('discord.js').EmbedBuilder)()
        .setColor(embeds.COLORS.green)
        .setTitle('✅ Inscription confirmée !')
        .setDescription(
          `Tu es inscrit(e) à **${game.title}** avec le pseudo \`${user.mc_pseudo}\` !\n\n` +
          `📅 <t:${game.time_ts}:F>\n🎮 Mode : \`${game.mode}\``
        )
        .setFooter({ text: 'Valkyrie UHC  •  valkyrie-uhc.fr' })
      ]
    });
  } catch { /* MP désactivés */ }

  // Mise à jour de l'embed
  await refreshGameEmbed(interaction.guild, game);

  const newCount = db.countRegistrations(gameId);
  return interaction.editReply({
    embeds: [embeds.successEmbed(
      `Inscription confirmée ! Tu es **#${newCount}** sur ${game.slots} slots.\n` +
      `Un MP de confirmation t'a été envoyé.`
    )]
  });
}

// ============================================================
//  Bouton ❌ Se désinscrire
// ============================================================
async function handleUnregister(interaction, gameId) {
  await interaction.deferReply({ ephemeral: true });

  const game = db.getGame(gameId);
  if (!game || game.status !== 'open') {
    return interaction.editReply({
      embeds: [embeds.errorEmbed('Les inscriptions pour cette partie sont fermées.')]
    });
  }

  const removed = db.unregister(gameId, interaction.user.id);
  if (!removed) {
    return interaction.editReply({
      embeds: [embeds.errorEmbed('Tu n\'étais pas inscrit(e) à cette partie.')]
    });
  }

  await refreshGameEmbed(interaction.guild, game);

  return interaction.editReply({
    embeds: [embeds.successEmbed('Tu as bien été désinscrit(e) de la partie.')]
  });
}

// ============================================================
//  Bouton 📋 Liste admin
// ============================================================
async function handleList(interaction, gameId) {
  await interaction.deferReply({ ephemeral: true });

  // Seuls les admins voient la liste complète
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  const game = db.getGame(gameId);
  if (!game) {
    return interaction.editReply({ embeds: [embeds.errorEmbed('Partie introuvable.')] });
  }

  const regs  = db.getRegistrations(gameId);
  const count = regs.length;

  if (!isAdmin) {
    // Version publique : juste le compteur + son statut
    const user = db.getUser(interaction.user.id);
    const registered = user ? db.isRegistered(gameId, interaction.user.id) : false;
    return interaction.editReply({
      embeds: [embeds.successEmbed(
        `**${game.title}**\n` +
        `👥 ${count} / ${game.slots} inscrits\n` +
        `Tu es ${registered ? '✅ inscrit(e)' : '❌ non inscrit(e)'}.`
      )]
    });
  }

  // Version admin : liste complète
  return interaction.editReply({
    embeds: [embeds.adminListEmbed(game, regs)]
  });
}

// ============================================================
//  Utilitaire : Rafraîchir l'embed de la partie
// ============================================================
async function refreshGameEmbed(guild, game) {
  try {
    if (!game.msg_id || !ANNOUNCE_CHANNEL) return;

    const channel = await guild.channels.fetch(ANNOUNCE_CHANNEL).catch(() => null);
    if (!channel) return;

    const msg = await channel.messages.fetch(game.msg_id).catch(() => null);
    if (!msg) return;

    const count  = db.countRegistrations(game.id);
    const isFull = count >= game.slots;

    await msg.edit({
      embeds:     [embeds.gameEmbed(game, count)],
      components: [embeds.gameButtons(game.id, isFull)]
    });
  } catch (e) {
    console.error('[refreshGameEmbed]', e.message);
  }
}

module.exports = { handleInteraction };
