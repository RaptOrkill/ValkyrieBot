# 🆓 Déploiement 24/7 gratuit à vie — Oracle Cloud Always Free

Pourquoi Oracle et pas Railway : Railway n'est plus vraiment gratuit en continu
(500h sans CB, ou 5$/mois de crédit qui s'épuise). Oracle Cloud "Always Free"
donne une vraie petite machine **gratuite pour toujours**, tant que tu restes
dans les limites du tier gratuit (aucun prélèvement).

Le repo est public (aucun secret dedans — `.env` et la DB sont dans
`.gitignore`), ce qui permet à la machine de cloner le code sans identifiants.

---

## Étape 1 — Créer un compte Oracle Cloud (à faire toi-même)

1. Va sur https://signup.oraclecloud.com/
2. Remplis le formulaire (email, pays). Une carte bancaire est demandée pour
   vérification d'identité **mais elle ne sera jamais débitée** tant que tu
   restes sur les ressources "Always Free" (pas d'upgrade automatique).
3. Choisis une **Home Region** proche de toi (ex: `eu-paris-1` ou
   `eu-marseille-1`) — tu ne pourras plus en changer après.

## Étape 2 — Créer la machine (Compute Instance)

1. Menu ☰ → **Compute** → **Instances** → **Create Instance**
2. Nom : `valkyriebot`
3. **Image** : Ubuntu 22.04 (clique "Edit" à côté de l'image si besoin de changer)
4. **Shape** : clique "Edit", choisis **Ampere (ARM)** si dispo (`VM.Standard.A1.Flex`,
   1 OCPU / 6 GB suffit largement) — sinon prends **`VM.Standard.E2.1.Micro`**
   (AMD, toujours éligible Always Free, 1GB RAM). Les deux sont gratuits à vie ;
   si l'ARM affiche "Out of capacity", reprends en E2.1.Micro, plus simple à obtenir.
5. **Clé SSH** : laisse Oracle générer la paire de clés → **télécharge la clé privée**
   (`ssh-key-xxxx.key`) et garde-la précieusement (sert à te connecter en cas de besoin).
6. Clique **"Show advanced options"** en bas → onglet **Management** →
   champ **"Initialization script" / "Cloud-init script"** → colle le script
   ci-dessous **après avoir remplacé les `<...>` par tes vraies valeurs**
   (celles de ton `.env` local) :

```yaml
#cloud-config
package_update: true
packages:
  - git
  - curl
write_files:
  - path: /opt/valkyriebot.env
    permissions: '0600'
    content: |
      DISCORD_TOKEN=<TON_DISCORD_TOKEN>
      CLIENT_ID=<TON_CLIENT_ID>
      GUILD_ID=<TON_GUILD_ID>
      ANNOUNCE_CHANNEL_ID=<TON_ANNOUNCE_CHANNEL_ID>
      SERVER_IP=play.valkyrieuhc.fr
      ADMIN_ROLE_ID=<TON_ADMIN_ROLE_ID>
      DB_DIR=/opt/valkyriebot/data
  - path: /etc/cron.d/valkyriebot-keepalive
    permissions: '0644'
    content: |
      0 */4 * * * root timeout 60 sh -c 'i=0; while [ $i -lt 20000000 ]; do i=$((i+1)); done'
runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y nodejs
  - npm install -g pm2
  - mkdir -p /opt/valkyriebot/data
  - git clone https://github.com/RaptOrkill/ValkyrieBot.git /opt/valkyriebot/app
  - cp /opt/valkyriebot.env /opt/valkyriebot/app/.env
  - bash -c "cd /opt/valkyriebot/app && npm install --production"
  - bash -c "cd /opt/valkyriebot/app && node src/deploy.js >> /var/log/valkyriebot-deploy.log 2>&1"
  - pm2 start /opt/valkyriebot/app/src/index.js --name valkyriebot --cwd /opt/valkyriebot/app
  - pm2 startup systemd -u root --hp /root
  - pm2 save
```

   Ce que fait ce script automatiquement au premier démarrage : installe Node.js
   et pm2, clone le bot, écrit ton `.env`, installe les dépendances, enregistre
   les slash commands (`/pseudo`, `/host`, `/draw`, `/rappel`, `/close`,
   `/whitelist`), lance le bot avec **pm2** (redémarre automatiquement en cas de
   crash) et configure le démarrage automatique au boot de la VM. Le cron
   `valkyriebot-keepalive` fait un petit calcul CPU 1 min toutes les 4h pour
   éviter la récupération de ressource "idle" d'Oracle (politique anti-instances
   inactives) — sans impact réel sur les perfs.

7. Clique **Create**. Attends ~2 minutes que la VM démarre et que le script
   s'exécute (l'installation se fait en tâche de fond au premier boot).

## Étape 3 — Vérifier que le bot tourne

Note l'**adresse IP publique** de l'instance (visible sur la page de l'instance),
puis depuis un terminal avec la clé privée téléchargée à l'étape 2 :

```bash
ssh -i chemin/vers/ssh-key-xxxx.key ubuntu@TON_IP_PUBLIQUE
pm2 logs valkyriebot
```

Tu dois voir `✅ [ValkyrieUHC Bot] Connecté en tant que ...`. `Ctrl+C` pour
quitter les logs (le bot continue de tourner en fond).

## Étape 4 — Mettre à jour le bot plus tard

Après un `git push` sur le repo, connecte-toi en SSH puis :

```bash
cd /opt/valkyriebot/app && git pull && npm install --production && pm2 restart valkyriebot
```

## Sécurité — inbound réseau

Un bot Discord ne fait que des connexions **sortantes** (WebSocket vers Discord).
Aucun port entrant n'a besoin d'être ouvert à part le SSH (22, déjà ouvert par
défaut) — ne touche pas aux règles de sécurité entrantes de la VCN.
