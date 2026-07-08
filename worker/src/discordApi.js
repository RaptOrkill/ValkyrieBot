// ============================================================
//  discordApi.js — Appels REST Discord (fetch, pas de gateway)
// ============================================================
const API = 'https://discord.com/api/v10';

function headers(token) {
  return {
    'Authorization': `Bot ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function createDM(token, userId) {
  const res = await fetch(`${API}/users/@me/channels`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ recipient_id: userId })
  });
  return res.ok ? res.json() : null;
}

export async function sendMessage(token, channelId, payload) {
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload)
  });
  return res.ok ? res.json() : null;
}

export async function sendDM(token, userId, payload) {
  const dm = await createDM(token, userId);
  if (!dm) return false;
  const msg = await sendMessage(token, dm.id, payload);
  return !!msg;
}

export async function editMessage(token, channelId, messageId, payload) {
  const res = await fetch(`${API}/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(payload)
  });
  return res.ok;
}

export async function createChannel(token, guildId, payload) {
  const res = await fetch(`${API}/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload)
  });
  return res.ok ? res.json() : null;
}

export async function deleteChannel(token, channelId) {
  const res = await fetch(`${API}/channels/${channelId}`, {
    method: 'DELETE',
    headers: headers(token)
  });
  return res.ok;
}

export async function editOriginalResponse(applicationId, interactionToken, payload) {
  const res = await fetch(`${API}/webhooks/${applicationId}/${interactionToken}/messages/@original`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.ok;
}
