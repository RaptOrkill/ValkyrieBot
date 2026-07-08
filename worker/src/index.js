// ============================================================
//  index.js — Worker principal : vérifie la signature Discord
//  et route l'interaction (PING, slash command, bouton, modal)
// ============================================================
import { verifyKey } from 'discord-interactions';
import * as pseudo from './commands/pseudo.js';
import * as host from './commands/host.js';
import * as draw from './commands/draw.js';
import * as rappel from './commands/rappel.js';
import * as close from './commands/close.js';
import * as whitelist from './commands/whitelist.js';
import { handleButton } from './interactions/buttons.js';
import { handleModal } from './interactions/modals.js';
import { json } from './permissions.js';

const InteractionType = { PING: 1, APPLICATION_COMMAND: 2, MESSAGE_COMPONENT: 3, MODAL_SUBMIT: 5 };

const commands = { pseudo, host, draw, rappel, close, whitelist };

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('ValkyrieUHC Bot — Cloudflare Workers', { status: 200 });
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    const isValid = signature && timestamp &&
      await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);

    if (!isValid) {
      return new Response('Bad request signature', { status: 401 });
    }

    const interaction = JSON.parse(body);

    if (interaction.type === InteractionType.PING) {
      return json({ type: 1 });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const mod = commands[interaction.data.name];
      if (!mod) return json({ type: 4, data: { content: 'Commande inconnue.', flags: 64 } });
      return mod.execute(interaction, env, ctx);
    }

    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      return handleButton(interaction, env, ctx);
    }

    if (interaction.type === InteractionType.MODAL_SUBMIT) {
      return handleModal(interaction, env, ctx);
    }

    return json({ type: 4, data: { content: "Type d'interaction non supporté.", flags: 64 } });
  }
};
