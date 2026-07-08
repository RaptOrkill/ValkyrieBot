// ============================================================
//  /whitelist [id] — Génère la commande whitelist Minecraft (Admin)
// ============================================================
import { getGame, getRegistrations } from '../db.js';
import { errorEmbed } from '../embeds.js';
import { isAdmin, json, ephemeral } from '../permissions.js';

export async function execute(interaction, env) {
  if (!isAdmin(interaction)) {
    return ephemeral(errorEmbed('Administrateurs seulement.'));
  }

  const gameId = interaction.data.options.find(o => o.name === 'id').value;
  const game = await getGame(env.DB, gameId);
  if (!game) {
    return ephemeral(errorEmbed(`Partie #${gameId} introuvable.`));
  }

  const regs = await getRegistrations(env.DB, gameId);
  if (regs.length === 0) {
    return ephemeral(errorEmbed('Aucun inscrit.'));
  }

  const players = regs.slice(0, game.slots);
  const pseudos = players.map(r => r.mc_pseudo).join(' ');

  const msg = [
    '```',
    '# ── Commandes à coller dans la console Minecraft ──',
    'whitelist on',
    `whitelist add ${pseudos}`,
    'whitelist reload',
    '```',
    '```',
    `# Pseudos uniquement (${players.length}) :`,
    pseudos,
    '```'
  ].join('\n');

  return json({
    type: 4,
    data: {
      content: `📋 **Whitelist pour la partie #${gameId} — ${game.title}**\n${msg}`,
      flags: 64
    }
  });
}
