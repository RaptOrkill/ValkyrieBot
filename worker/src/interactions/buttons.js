// ============================================================
//  buttons.js — register_/unregister_/list_ (boutons de partie)
// ============================================================
import { getGame, getUser, register, unregister, getRegistrations, countRegistrations } from '../db.js';
import { gameEmbed, gameButtons, adminListEmbed, errorEmbed } from '../embeds.js';
import { editMessage } from '../discordApi.js';
import { json } from '../permissions.js';

async function updateGameMessage(env, game) {
  if (!game.msg_id || !env.ANNOUNCE_CHANNEL_ID) return;
  const count = await countRegistrations(env.DB, game.id);
  await editMessage(env.DISCORD_TOKEN, env.ANNOUNCE_CHANNEL_ID, game.msg_id, {
    embeds: [gameEmbed(game, count)],
    components: [gameButtons(game.id, count >= game.slots)]
  });
}

export async function handleButton(interaction, env) {
  const customId = interaction.data.custom_id;
  const sep = customId.indexOf('_');
  const action = customId.substring(0, sep);
  const gameId = customId.substring(sep + 1);
  const userId = interaction.member?.user?.id || interaction.user?.id;

  const game = await getGame(env.DB, gameId);
  if (!game) {
    return json({ type: 4, data: { embeds: [errorEmbed("Cette partie n'existe plus.")], flags: 64 } });
  }

  if (action === 'register') {
    const user = await getUser(env.DB, userId);
    if (!user) {
      return json({ type: 4, data: { embeds: [errorEmbed("Utilise `/pseudo` avant de t'inscrire.")], flags: 64 } });
    }
    const count = await countRegistrations(env.DB, gameId);
    if (count >= game.slots) {
      return json({ type: 4, data: { embeds: [errorEmbed('Cette partie est complète.')], flags: 64 } });
    }
    const result = await register(env.DB, gameId, userId, user.mc_pseudo);
    if (!result.success) {
      return json({ type: 4, data: { embeds: [errorEmbed('Tu es déjà inscrit à cette partie.')], flags: 64 } });
    }
    await updateGameMessage(env, game);
    return json({ type: 4, data: { content: '✅ Inscription confirmée !', flags: 64 } });
  }

  if (action === 'unregister') {
    await unregister(env.DB, gameId, userId);
    await updateGameMessage(env, game);
    return json({ type: 4, data: { content: '❌ Tu as quitté la partie.', flags: 64 } });
  }

  if (action === 'list') {
    const regs = await getRegistrations(env.DB, gameId);
    return json({ type: 4, data: { embeds: [adminListEmbed(game, regs)], flags: 64 } });
  }

  return json({ type: 4, data: { content: 'Action inconnue.', flags: 64 } });
}
