# ⚡ Déploiement 24/7 gratuit à vie — Cloudflare Workers (serverless)

C'est la version la plus robuste : **pas de VM, pas de serveur à maintenir, aucun
risque de pénurie de capacité** (contrairement à Oracle Cloud). Le bot tourne en
HTTP "Interactions" — Discord appelle directement une URL à chaque commande /
clic de bouton, au lieu de garder une connexion permanente ouverte.

**Limites gratuites Cloudflare** (largement suffisantes pour ce bot) :
100 000 requêtes/jour, base D1 : 5 Go, 5M lectures/jour, 100k écritures/jour.

⚠️ Différence importante : le bot va apparaître **hors ligne (gris)** dans la
liste des membres Discord — c'est normal pour ce type de bot HTTP, les
commandes fonctionnent quand même parfaitement.

Le code est dans le dossier [`worker/`](https://github.com/RaptOrkill/ValkyrieBot/tree/main/worker) du repo.

---

## Étape 1 — Créer un compte Cloudflare (gratuit, pas de carte requise)

1. Va sur https://dash.cloudflare.com/sign-up
2. Crée ton compte (email + mot de passe)

## Étape 2 — Récupérer la Public Key de ton bot Discord

1. Va sur https://discord.com/developers/applications → ton application
2. Onglet **General Information** → copie la valeur de **"Public Key"**
   (différente du token — celle-ci n'est pas secrète)

## Étape 3 — Installer et configurer

Depuis un terminal, dans le dossier `worker/` :

```bash
cd ValkyrieUHC_Bot/ValkyrieBot/worker
npm install
npx wrangler login
```

`wrangler login` ouvre ton navigateur pour connecter le compte Cloudflare.

## Étape 4 — Créer la base de données D1

```bash
npx wrangler d1 create valkyriebot
```

Ça affiche un `database_id` (UUID). Copie-le.

Puis :
```bash
cp wrangler.toml.example wrangler.toml
```

Édite `wrangler.toml` et remplace :
- `database_id` par la valeur obtenue ci-dessus
- `CLIENT_ID`, `GUILD_ID`, `ANNOUNCE_CHANNEL_ID`, `ADMIN_ROLE_ID` (tes valeurs `.env` habituelles)
- `DISCORD_PUBLIC_KEY` (récupérée à l'étape 2)

Puis crée les tables :
```bash
npx wrangler d1 execute valkyriebot --remote --file=schema.sql
```

## Étape 5 — Ajouter le token en secret (jamais en clair dans un fichier)

```bash
npx wrangler secret put DISCORD_TOKEN
```
→ colle ton token Discord quand demandé (rien ne s'affiche à l'écran, c'est normal).

## Étape 6 — Déployer

```bash
npx wrangler deploy
```

Tu obtiens une URL du type `https://valkyriebot.<ton-sous-domaine>.workers.dev`.
**Copie cette URL.**

## Étape 7 — Brancher l'URL sur Discord

1. Retourne sur https://discord.com/developers/applications → ton application
2. Onglet **General Information** → champ **"Interactions Endpoint URL"**
3. Colle l'URL du Worker (étape 6) → **Save Changes**

Discord va immédiatement envoyer un PING à cette URL pour vérifier qu'elle
répond correctement (signature valide) — si ça échoue, vérifie que
`DISCORD_PUBLIC_KEY` dans `wrangler.toml` est correcte et redéploie.

## Étape 8 — Enregistrer les commandes slash

Crée un fichier `.env` dans `worker/` (copie de `.env.example`) avec
`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, puis :

```bash
node deploy-commands.js
```

## Étape 9 — Tester

Sur ton serveur Discord, tape `/pseudo` — tu dois voir la réponse. Le bot
apparaîtra hors ligne dans la liste des membres, c'est normal.

---

## Mettre à jour le bot plus tard

```bash
cd worker
npx wrangler deploy
```

(Si tu ajoutes une nouvelle commande slash, relance aussi `node deploy-commands.js`.)

## Limites à connaître

- Pas d'événement `ready`/présence — le bot est toujours "hors ligne" visuellement.
- Pas d'écoute de messages classiques (pas de préfixe `!commande`) — uniquement
  slash commands, boutons et modals, ce que ce bot utilise déjà entièrement.
- Chaque interaction doit répondre en moins de 3 secondes (sinon Discord affiche
  une erreur) — `/draw` et `/rappel` utilisent une réponse différée
  (`ctx.waitUntil`) pour contourner ça pendant l'envoi des MP.
