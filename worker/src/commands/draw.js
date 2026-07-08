// ============================================================
//  /draw [id] — Tirage au sort (Admin)
// ============================================================
import { getGame, getRegistrations, setGameStatus, setGameChannel } from '../db.js';
import { drawEmbed, selectedDMEmbed, substituteDMEmbed, errorEmbed, successEmbed } from '../embeds.js';
import { createChannel, sendMessage, sendDM, editOriginalResponse } from '../discordApi.js';
import { isAdmin, json, ephemeral } from '../permissions.js';

export async function execute(interaction, env, ctx) {
  if (!isAdmin(interaction)) {
    return ephemeral(errorEmbed('Administrateurs seulement.'));
  }

  const gameId = interaction.data.options.find(o => o.name === 'id').value;

  ctx.waitUntil(process(interaction, env, gameId));

  return json({ type: 5, data: { flags: 64 } }); // deferred ephemeral
}

async function process(interaction, env, gameId) {
  const finish = (embed) => editOriginalResponse(env.CLIENT_ID, interaction.token, { embeds: [embed] });

  const game = await getGame(env.DB, gameId);
  if (!game) return finish(errorEmbed(`Partie #${gameId} introuvable.`));
  if (game.status === 'drawn') return finish(errorEmbed(`Le tirage pour la partie #${gameId} a déjà été effectué.`));

  const all = await getRegistrations(env.DB, gameId);
  if (all.length === 0) return finish(errorEmbed('Aucun joueur inscrit dans cette partie.'));

  const shuffled = [...all].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, game.slots);
  const substitutes = shuffled.slice(game.slots);

  let listChannel = null;
  const channelName = `liste-${game.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}`;
  listChannel = await createChannel(env.DISCORD_TOKEN, env.GUILD_ID, {
    name: `📂-${channelName}`,
    type: 0,
    topic: `Liste officielle — ${game.title} | ID: ${gameId}`
  });
  if (listChannel) {
    await sendMessage(env.DISCORD_TOKEN, listChannel.id, { embeds: [drawEmbed(game, selected, substitutes)] });
    await setGameChannel(env.DB, gameId, listChannel.id);
  }

  await setGameStatus(env.DB, gameId, 'drawn');

  let dmSuccess = 0, dmFail = 0;
  for (const player of selected) {
    const ok = await sendDM(env.DISCORD_TOKEN, player.discord_id, { embeds: [selectedDMEmbed(game, env.SERVER_IP)] });
    ok ? dmSuccess++ : dmFail++;
  }
  for (let i = 0; i < substitutes.length; i++) {
    await sendDM(env.DISCORD_TOKEN, substitutes[i].discord_id, { embeds: [substituteDMEmbed(game, i + 1)] });
  }

  const lines = [
    `✅ Tirage effectué pour **${game.title}** !`,
    `🏆 **${selected.length}** sélectionnés · ⏳ **${substitutes.length}** remplaçants`,
    `📨 MP envoyés : ${dmSuccess} succès · ${dmFail} échecs (MP désactivés)`
  ];
  if (listChannel) lines.push(`📂 Salon créé : <#${listChannel.id}>`);

  return finish(successEmbed(lines.join('\n')));
}
