// ============================================================
//  /close [id] — Fermer et supprimer une partie (Admin)
// ============================================================
import { getGame, deleteGame } from '../db.js';
import { errorEmbed, successEmbed } from '../embeds.js';
import { deleteChannel, editMessage } from '../discordApi.js';
import { isAdmin, ephemeral } from '../permissions.js';

export async function execute(interaction, env) {
  if (!isAdmin(interaction)) {
    return ephemeral(errorEmbed('Administrateurs seulement.'));
  }

  const gameId = interaction.data.options.find(o => o.name === 'id').value;
  const game = await getGame(env.DB, gameId);
  if (!game) {
    return ephemeral(errorEmbed(`Partie #${gameId} introuvable.`));
  }

  const lines = [`Partie **#${gameId} — ${game.title}** fermée.`];

  if (game.channel_list_id) {
    const ok = await deleteChannel(env.DISCORD_TOKEN, game.channel_list_id);
    lines.push(ok ? '📂 Salon de liste supprimé.' : '⚠️ Impossible de supprimer le salon (déjà supprimé ?)');
  }

  if (game.msg_id && env.ANNOUNCE_CHANNEL_ID) {
    const ok = await editMessage(env.DISCORD_TOKEN, env.ANNOUNCE_CHANNEL_ID, game.msg_id, { components: [] });
    if (ok) lines.push("🔒 Boutons d'inscription désactivés.");
  }

  await deleteGame(env.DB, gameId);
  lines.push('🗑️ Données supprimées de la base.');

  return ephemeral(successEmbed(lines.join('\n')));
}
