// ============================================================
//  deploy-commands.js — Enregistre les slash commands
//  Lance avec : node deploy-commands.js
//  (nécessite un .env local avec DISCORD_TOKEN, CLIENT_ID, GUILD_ID)
// ============================================================
import 'dotenv/config';

const commands = [
  {
    name: 'pseudo',
    description: 'Lie ton pseudo Minecraft à ton compte Discord.',
    options: [
      { name: 'nom', description: 'Ton pseudo Minecraft exact (sensible à la casse)', type: 3, required: true, min_length: 2, max_length: 16 }
    ]
  },
  {
    name: 'host',
    description: 'Créer une nouvelle partie UHC.',
    default_member_permissions: '8'
  },
  {
    name: 'draw',
    description: 'Lance le tirage au sort pour une partie.',
    default_member_permissions: '8',
    options: [
      { name: 'id', description: "ID de la partie (affiché sur l'embed)", type: 4, required: true, min_value: 1 }
    ]
  },
  {
    name: 'rappel',
    description: 'Envoie un rappel en MP à tous les joueurs inscrits à une partie.',
    default_member_permissions: '8',
    options: [
      { name: 'id', description: "ID de la partie (affiché sur l'embed)", type: 4, required: true, min_value: 1 },
      { name: 'message', description: 'Message additionnel (optionnel)', type: 3, required: false, max_length: 500 }
    ]
  },
  {
    name: 'close',
    description: 'Ferme et supprime une partie UHC.',
    default_member_permissions: '8',
    options: [
      { name: 'id', description: 'ID de la partie à fermer', type: 4, required: true, min_value: 1 }
    ]
  },
  {
    name: 'whitelist',
    description: 'Génère la commande whitelist Minecraft pour les joueurs sélectionnés.',
    default_member_permissions: '8',
    options: [
      { name: 'id', description: 'ID de la partie', type: 4, required: true, min_value: 1 }
    ]
  }
];

(async () => {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId || !guildId) {
    console.error('❌ DISCORD_TOKEN, CLIENT_ID et GUILD_ID sont requis dans worker/.env');
    process.exit(1);
  }

  console.log('🔄 Déploiement des commandes...');

  const res = await fetch(`https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  if (!res.ok) {
    console.error('❌ Erreur de déploiement :', res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log(`✅ ${data.length} commande(s) déployée(s) sur le serveur !`);
  console.log('   ' + data.map(c => `/${c.name}`).join('  '));
})();
