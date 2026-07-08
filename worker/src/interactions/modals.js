// ============================================================
//  modals.js — Soumission du modal /host
// ============================================================
import { createGame, setGameMessage } from '../db.js';
import { gameEmbed, gameButtons, errorEmbed, successEmbed } from '../embeds.js';
import { sendMessage } from '../discordApi.js';
import { json } from '../permissions.js';

function parseTimeToTs(timeStr) {
  const now = new Date();
  const parts = timeStr.trim().split(/\s+/);
  const timePart = parts[0];
  const datePart = parts[1];

  const [h, m] = timePart.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) throw new Error('bad time');

  let day = now.getDate(), month = now.getMonth() + 1, year = now.getFullYear();
  if (datePart) {
    const [d, mo] = datePart.split('/').map(Number);
    if (Number.isNaN(d) || Number.isNaN(mo)) throw new Error('bad date');
    day = d; month = mo;
  }

  const date = new Date(year, month - 1, day, h, m, 0);
  if (!datePart && date.getTime() < now.getTime()) {
    date.setDate(date.getDate() + 1);
  }
  return Math.floor(date.getTime() / 1000);
}

export async function handleModal(interaction, env) {
  if (interaction.data.custom_id !== 'modal_host') {
    return json({ type: 4, data: { content: 'Modal inconnu.', flags: 64 } });
  }

  const values = {};
  for (const row of interaction.data.components) {
    for (const comp of row.components) {
      values[comp.custom_id] = comp.value;
    }
  }

  const slots = parseInt(values.slots, 10);
  if (!slots || slots < 1) {
    return json({ type: 4, data: { embeds: [errorEmbed('Nombre de slots invalide.')], flags: 64 } });
  }

  let timeTs;
  try {
    timeTs = parseTimeToTs(values.time);
  } catch {
    return json({ type: 4, data: { embeds: [errorEmbed("Format d'heure invalide. Utilise HH:MM ou HH:MM JJ/MM.")], flags: 64 } });
  }

  const hostId = interaction.member?.user?.id || interaction.user?.id;
  const gameId = await createGame(env.DB, hostId, values.title, values.mode, slots, timeTs, values.banner || null);
  const game = { id: gameId, title: values.title, mode: values.mode, slots, time_ts: timeTs, banner_url: values.banner || null };

  if (env.ANNOUNCE_CHANNEL_ID) {
    const msg = await sendMessage(env.DISCORD_TOKEN, env.ANNOUNCE_CHANNEL_ID, {
      embeds: [gameEmbed(game, 0)],
      components: [gameButtons(gameId, false)]
    });
    if (msg) await setGameMessage(env.DB, gameId, msg.id);
  }

  return json({ type: 4, data: { embeds: [successEmbed(`Partie **#${gameId} — ${values.title}** créée !`)], flags: 64 } });
}
