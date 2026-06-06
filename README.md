# 🔱 ValkyrieUHC Bot

Bot Discord de gestion d'UHC — Discord.js v14 + Better-SQLite3

---

## 📦 Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et configurer le .env
cp .env.example .env
```

## ⚙️ Configuration (.env)

```env
DISCORD_TOKEN=        # Token du bot (discord.com/developers)
CLIENT_ID=            # ID de l'application bot
GUILD_ID=             # ID de ton serveur Discord
ANNOUNCE_CHANNEL_ID=  # ID du salon d'annonces UHC
SERVER_IP=play.valkyrieuhc.fr
ADMIN_ROLE_ID=        # ID du rôle Admin (optionnel)
```

## 🚀 Démarrage

```bash
# Déployer les commandes slash (1 seule fois)
node src/deploy.js

# Lancer le bot
node src/index.js
```

---

## 📋 Commandes

| Commande | Permission | Description |
|---|---|---|
| `/pseudo [NomMC]` | Public | Lie ton pseudo Minecraft |
| `/host` | Admin | Créer une partie (Modal) |
| `/draw [id]` | Admin | Tirage au sort |
| `/close [id]` | Admin | Fermer + nettoyage |
| `/whitelist [id]` | Admin | Générer la whitelist MC |

---

## 🔄 Flux complet

```
/host  →  Formulaire  →  Embed avec boutons
                ↓
         Joueurs s'inscrivent avec ✅
         (bloqué sans /pseudo)
                ↓
/draw [id]  →  Tirage Fisher-Yates
            →  Salon 📂 créé
            →  MP aux sélectionnés (IP incluse)
            →  MP aux remplaçants
                ↓
/whitelist [id]  →  Commande console MC prête
                ↓
/close [id]  →  Salon supprimé + DB nettoyée
```

---

## 📁 Structure

```
ValkyrieBot/
├── src/
│   ├── index.js          ← Point d'entrée
│   ├── deploy.js         ← Déploiement commandes
│   ├── database.js       ← SQLite (Better-SQLite3)
│   ├── embeds.js         ← Tous les Embeds Discord
│   ├── commands/
│   │   ├── pseudo.js     ← /pseudo
│   │   ├── host.js       ← /host + Modal
│   │   ├── draw.js       ← /draw (tirage)
│   │   └── close.js      ← /close + /whitelist
│   └── handlers/
│       └── interactions.js ← Modals + Boutons
├── valkyrie.db           ← Base de données (auto-créée)
├── .env.example
├── package.json
└── README.md
```
