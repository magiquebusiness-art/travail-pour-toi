# Agent IA Publication-Web 🤖

Cerveau : **Groq** (llama-3.3-70b-versatile)  
Stack : Node.js (ESM) + Express + Octokit + Cloudflare API

---

## Démarrage rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer les tokens
```bash
cp .env.example .env
# Ouvre .env et remplis tes clés
```

### 3. Lancer l'agent
```bash
# Mode développement (auto-reload)
npm run dev

# Mode production
npm start
```

### 4. Ouvrir l'interface
→ http://localhost:3000

---

## Structure du projet

```
agent-ia/
├── src/
│   ├── agent.js    ← Cerveau : Groq + boucle de conversation
│   ├── tools.js    ← Tools : GitHub, Cloudflare, génération code
│   └── server.js   ← API HTTP + serveur web
├── public/
│   └── index.html  ← Interface de chat
├── .env.example    ← Template des tokens (ne pas committer .env)
└── package.json
```

---

## Tokens nécessaires

| Token | Où le trouver | Phase |
|-------|---------------|-------|
| `GROQ_API_KEY` | console.groq.com/keys | Phase 1 ✅ |
| `GITHUB_TOKEN` | github.com/settings/tokens | Phase 2 |
| `CF_API_TOKEN` | dash.cloudflare.com/profile/api-tokens | Phase 2 |
| `CF_ACCOUNT_ID` | dash.cloudflare.com (barre droite) | Phase 2 |

---

## Ce que l'agent peut faire

- **Générer du code** JS, Node.js, PHP selon tes instructions
- **GitHub** : créer/modifier des fichiers, créer des branches, lire du code
- **Cloudflare** : déployer des Workers, écrire dans KV
- Tout ça en **français**, avec confirmation avant les actions critiques

---

## Phase 2 → À venir

- Exécution de code dans un sandbox
- Gestion des Pull Requests
- Déploiement Cloudflare Pages
- Mémoire longue durée (KV)
