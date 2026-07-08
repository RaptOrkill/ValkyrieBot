// ============================================================
//  permissions.js — Vérification permission Administrateur
// ============================================================
const ADMINISTRATOR = 0x8n;

export function isAdmin(interaction) {
  if (!interaction.member || !interaction.member.permissions) return false;
  return (BigInt(interaction.member.permissions) & ADMINISTRATOR) === ADMINISTRATOR;
}

export function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } });
}

export function ephemeral(embed) {
  return json({ type: 4, data: { embeds: [embed], flags: 64 } });
}
