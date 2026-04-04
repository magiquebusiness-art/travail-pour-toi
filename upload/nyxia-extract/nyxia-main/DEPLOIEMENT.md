# 🚀 Déploiement NyXia sur Cloudflare Workers — Phase 3

## Ce qui change en Phase 3

- NyXia tourne **sur Cloudflare Workers** (plus besoin d'un serveur local)
- Le vault est **chiffré AES-256-GCM** et stocké dans **Cloudflare KV**
- Les tokens survivent aux redémarrages — NyXia se souvient de tout
- L'interface tourne sur le même Worker (zéro infrastructure externe)

---

## Prérequis

```bash
# Node.js 18+ requis
node --version

# Installer Wrangler (outil CLI Cloudflare)
npm install -g wrangler

# Se connecter à Cloudflare
npx wrangler login
```

---

## Étape 1 — Créer le namespace KV (vault de NyXia)

```bash
npx wrangler kv namespace create "NYXIA_VAULT"
```

Tu vas recevoir quelque chose comme :

```
{ binding = "NYXIA_VAULT", id = "abc123def456..." }
```

**Copie cet `id`** et colle-le dans `wrangler.toml` :

```toml
[[kv_namespaces]]
binding = "NYXIA_VAULT"
id      = "abc123def456..."   # ← ton ID ici
```

---

## Étape 2 — Configurer les secrets

Ces deux valeurs ne doivent JAMAIS apparaître dans le code :

```bash
# Ton token Groq (cerveau de NyXia)
npx wrangler secret put GROQ_API_KEY
# → Colle ta clé Groq (console.groq.com/keys)

# Clé de chiffrement du vault (invente une phrase secrète forte)
npx wrangler secret put VAULT_SECRET
# → Ex: "NyXia-2024-MonMotDePasseTresLong-Publication-Web!"
```

⚠️ **Note le VAULT_SECRET quelque part de sécurisé** — si tu le perds,
le vault ne pourra plus être déchiffré.

---

## Étape 3 — Déployer NyXia

```bash
npx wrangler deploy
```

Si tout se passe bien, tu verras :

```
✓ Deployed nyxia-agent to https://nyxia-agent.TON-COMPTE.workers.dev
```

---

## Étape 4 — Vérifier

Ouvre l'URL dans ton navigateur → tu dois voir l'interface NyXia.

Vérifie le status : `https://nyxia-agent.TON-COMPTE.workers.dev/api/status`

Tu dois voir :
```json
{
  "groq": true,
  "vault": true,
  "github": false,
  "cloudflare": false,
  "accounts": 0,
  "projects": 0
}
```

---

## Étape 5 — Configurer NyXia dans le chat

Ouvre l'interface et donne tes tokens à NyXia directement :

```
NyXia, voici mes infos pour AffiliationPro :
- Token GitHub : ghp_xxxxx
- Username GitHub : moncompte
- Repo : affiliationpro
- Token Cloudflare : xxxxx
- Account ID CF : xxxxx
- Worker : affiliationpro-api
```

NyXia les enregistre dans le vault chiffré — c'est persistant ! ✓

---

## Commandes utiles

```bash
# Voir les logs en temps réel
npx wrangler tail

# Redéployer après une modif
npx wrangler deploy

# Voir les clés du vault
npx wrangler kv key list --binding=NYXIA_VAULT

# Vider le vault (reset complet)
npx wrangler kv key delete --binding=NYXIA_VAULT "nyxia:accounts"
npx wrangler kv key delete --binding=NYXIA_VAULT "nyxia:projects"

# Changer le VAULT_SECRET
npx wrangler secret put VAULT_SECRET
```

---

## Structure finale du projet

```
agent-ia/
├── worker/
│   ├── index.js      ← Point d'entrée Cloudflare Worker
│   ├── tools.js      ← Tools (GitHub + Cloudflare APIs)
│   └── vault-kv.js   ← Vault chiffré AES-256-GCM
├── public/
│   └── index.html    ← Interface NyXia
├── src/              ← Version locale (développement)
│   ├── agent.js
│   ├── tools.js
│   ├── vault.js
│   └── server.js
├── wrangler.toml     ← Config Cloudflare
├── package.json
└── .env.example
```
