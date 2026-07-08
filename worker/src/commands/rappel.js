// ============================================================
//  /rappel [id] [message] — MP de rappel aux inscrits (Admin)
// ============================================================
import { getGame, getRegistrations } from '../db.js';
import { reminderDMEmbed, errorEmbed, successEmbed } from '../embeds.js';
import { sendDM, editOriginalResponse } from '../discordApi.js';
import { isAdmin, json, ephemeral } from '../permissions.js';

export async function execute(interaction, env, ctx) {
  if (!isAdmin(interaction)) {
    return ephemeral(errorEmbed('Administrateurs seulement.'));
  }

  const options = interaction.data.options || [];
  const gameId = options.find(o => o.name === 'id').value;
  const messageOpt = options.find(o => o.name === 'message');
  const customMessage = messageOpt ? messageOpt.value : null;

  ctx.waitUntil(process(interaction, env, gameId, customMessage));

  return json({ type: 5, data: { flags: 64 } });
}

async function process(interaction, env, gameId, customMessage) {
  const finish = (embed) => editOriginalResponse(env.CLIENT_ID, interaction.token, { embeds: [embed] });

  const game = await getGame(env.DB, gameId);
  if (!game) return finish(errorEmbed(`Partie #${gameId} introuvable.`));

  const regs = await getRegistrations(env.DB, gameId);
  if (regs.length === 0) return finish(errorEmbed('Aucun joueur inscrit dans cette partie.'));

  let dmSuccess = 0, dmFail = 0;
  for (const player of regs) {
    const ok = await sendDM(env.DISCORD_TOKEN, player.discord_id, { embeds: [reminderDMEmbed(game, env.SERVER_IP, customMessage)] });
    ok ? dmSuccess++ : dmFail++;
  }

  return finish(successEmbed(
    `🔔 Rappel envoyé pour **${game.title}** (#${gameId})\n` +
    `📨 MP envoyés : ${dmSuccess} succès · ${dmFail} échecs (MP désactivés ou membre introuvable)`
  ));
}
