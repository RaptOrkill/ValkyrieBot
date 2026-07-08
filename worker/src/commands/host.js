// ============================================================
//  /host — Créer une partie UHC (Admin) — ouvre un Modal
// ============================================================
import { errorEmbed } from '../embeds.js';
import { isAdmin, json, ephemeral } from '../permissions.js';

function textInput(customId, label, required, maxLength, placeholder) {
  return { type: 4, custom_id: customId, style: 1, label, required, max_length: maxLength, placeholder };
}
function row(component) {
  return { type: 1, components: [component] };
}

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return ephemeral(errorEmbed('Tu dois être Administrateur pour utiliser cette commande.'));
  }

  return json({
    type: 9, // MODAL
    data: {
      custom_id: 'modal_host',
      title: '🔱 Créer une partie ValkyrieUHC',
      components: [
        row(textInput('title', 'Titre de la partie', true, 100, 'ex: Valkyrie All Stars #1')),
        row(textInput('mode', 'Mode de jeu', true, 50, 'ex: UHC Meetup, UHC Speed, Hitman...')),
        row(textInput('slots', 'Nombre de slots', true, 3, 'ex: 30')),
        row(textInput('time', 'Heure + Jour  (HH:MM  ou  HH:MM JJ/MM)', true, 11, 'ex: 18:00  ou  18:00 15/06')),
        row(textInput('banner', 'URL de la bannière (optionnel)', false, 500, 'https://...'))
      ]
    }
  });
}
