// ============================================================
//  /pseudo — Lier son pseudo Minecraft
// ============================================================
import { upsertUser } from '../db.js';
import { errorEmbed, successEmbed } from '../embeds.js';
import { ephemeral } from '../permissions.js';

export async function execute(interaction, env) {
  const opt = (interaction.data.options || []).find(o => o.name === 'nom');
  const value = (opt?.value || '').trim();

  if (!/^[a-zA-Z0-9_]{2,16}$/.test(value)) {
    return ephemeral(errorEmbed('Pseudo invalide. Utilise seulement des lettres, chiffres et underscores (2-16 caractères).'));
  }

  const userId = interaction.member?.user?.id || interaction.user?.id;
  await upsertUser(env.DB, userId, value);

  return ephemeral(successEmbed(`Ton pseudo **\`${value}\`** est lié à ton compte Discord !\nTu peux maintenant t'inscrire aux parties UHC.`));
}
