# 🚀 Déploiement Railway — ValkyrieBot

## Étape 1 — Crée un compte GitHub
Va sur https://github.com et crée un compte si tu n'en as pas.

## Étape 2 — Crée un repo GitHub

1. Clique sur **New repository**
2. Nom : `ValkyrieBot` (privé recommandé)
3. **Ne coche rien** (pas de README, pas de .gitignore)
4. Clique **Create repository**

## Étape 3 — Upload le bot sur GitHub

Ouvre un terminal dans `ValkyrieUHC_Bot/ValkyrieBot/` puis :

```bash
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/ValkyrieBot.git
git push -u origin main
```

## Étape 4 — Crée un projet Railway

1. Va sur https://railway.app
2. **Login with GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. Sélectionne `ValkyrieBot`
5. Railway détecte Node.js automatiquement ✅

## Étape 5 — Ajoute les variables d'environnement

Dans Railway → ton projet → onglet **Variables** → **Add Variable** :

| Clé | Valeur |
|-----|--------|
| `DISCORD_TOKEN` | (ton token depuis .env) |
| `CLIENT_ID` | (ton client id depuis .env) |
| `GUILD_ID` | (ton guild id depuis .env) |
| `ANNOUNCE_CHANNEL_ID` | (depuis .env) |
| `SERVER_IP` | (depuis .env) |
| `ADMIN_ROLE_ID` | (depuis .env) |
| `DB_DIR` | `/data` |

## Étape 6 — Ajoute un Volume (base de données persistante)

**C'est la partie la plus importante** — sans ça la DB se remet à zéro à chaque redémarrage.

1. Dans Railway → ton projet → onglet **Volumes**
2. **New Volume**
3. Mount Path : `/data`
4. Clique **Create**

Le dossier `/data` est maintenant persistant — `valkyrie.db.json` survivra aux redémarrages ✅

## Étape 7 — Lance le deploy

Railway redémarre automatiquement. Va dans l'onglet **Logs** pour vérifier que le bot démarre bien.

Tu devrais voir :
```
✅ Bot connecté en tant que ValkyrieBot#XXXX
```

## Étape 8 — Redéploiements futurs

À chaque fois que tu modifies le code :

```bash
git add .
git commit -m "Mise à jour"
git push
```

Railway redéploie automatiquement ✅

---

## Prix

- **Gratuit** : 500 heures/mois (suffisant pour 1 bot)
- **5$/mois** : heures illimitées (si tu dépasses)

## Problèmes fréquents

**Bot ne démarre pas** → Vérifie que DISCORD_TOKEN est bien dans les Variables

**DB se remet à zéro** → Vérifie que le Volume est monté sur `/data` ET que `DB_DIR=/data` est dans les Variables

**Commandes non reconnues** → Lance `/deploy` une fois depuis ton PC pour enregistrer les slash commands
