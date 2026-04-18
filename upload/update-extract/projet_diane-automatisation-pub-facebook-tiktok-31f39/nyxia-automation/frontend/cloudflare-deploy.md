# 🚀 Déploiement sur Cloudflare Pages

## Option 1: Frontend Statique (Recommandé)

Le frontend NyXia est 100% statique (HTML/CSS/JS), parfait pour Cloudflare Pages !

### Étapes de déploiement :

1. **Préparer le dossier frontend**
```bash
cd nyxia-automation/frontend
# Tous les fichiers sont prêts : index.html, nyxia-design.css
```

2. **Via Cloudflare Dashboard**
   - Allez sur https://dash.cloudflare.com/?to=/:account/pages
   - Cliquez sur "Create a project"
   - Choisissez "Direct Upload"
   - Uploadez le dossier `frontend/`
   - Nommez-le "nyxia-frontend"
   - Déployez !

3. **Via Wrangler CLI** (alternative)
```bash
npm install -g wrangler
wrangler login
cd frontend
wrangler pages deploy . --project-name=nyxia-frontend
```

4. **Configuration du domaine**
   - Dans Cloudflare Pages → nyxia-frontend → Settings
   - Ajoutez votre domaine personnalisé (ex: app.nyxia.ai)
   - Cloudflare gère automatiquement le SSL

### Variables d'environnement (optionnel)

Dans Cloudflare Pages → Settings → Environment Variables :
```
API_BASE_URL=https://votre-backend.railway.app
```

Puis mettez à jour `index.html` :
```javascript
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000'
```

---

## Option 2: Backend Python sur Railway/Render

Cloudflare Workers ne supporte pas Python nativement. Pour le backend :

### Railway.app (Recommandé)

1. Créez un compte sur https://railway.app
2. Nouveau projet → Deploy from GitHub repo
3. Sélectionnez votre repo nyxia-automation
4. Railway détecte automatiquement Python
5. Ajoutez les variables d'environnement :
   ```
   WAN_API_KEY=votre_cle
   FB_APP_ID=votre_id
   TIKTOK_CLIENT_KEY=votre_key
   DATABASE_URL=postgresql://...
   ```
6. Déployez !

URL obtenue : `https://nyxia-backend-production.up.railway.app`

### Alternative : Render.com

1. https://render.com → New Web Service
2. Connectez votre repo GitHub
3. Build Command : `pip install -r requirements.txt`
4. Start Command : `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Ajoutez les variables d'environnement

---

## Architecture Finale Recommandée

```
┌─────────────────────────────────────┐
│     Cloudflare Pages (Frontend)     │
│     https://app.nyxia.ai            │
│     - HTML/CSS/JS statique          │
│     - Background étoilé animé       │
│     - Design NyXia premium          │
└──────────────┬──────────────────────┘
               │ API Calls (HTTPS)
               ▼
┌─────────────────────────────────────┐
│   Railway.app (Backend FastAPI)     │
│   https://api.nyxia.ai              │
│   - endpoints REST                  │
│   - Scheduler APScheduler           │
│   - Génération IA                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      PostgreSQL (Railway DB)        │
│   - Campagnes                       │
│   - Contenu planifié                │
│   - Pages sociales                  │
└─────────────────────────────────────┘
```

---

## Coûts Estimés

| Service | Plan | Prix | Inclus |
|---------|------|------|--------|
| **Cloudflare Pages** | Free | $0/mois | 100k requêtes/jour |
| **Railway** | Hobby | $5/mois | 500h de runtime |
| **Pollinations AI** | Free | $0/mois | Illimité |
| **Wan API** | Pay-per-use | ~$10/mois | Selon usage |
| **Total** | | **~$15/mois** | Pour démarrer |

---

## Mise à Jour

### Frontend (Cloudflare Pages)
```bash
cd frontend
wrangler pages deploy . --project-name=nyxia-frontend
# Déploiement instantané (~5 secondes)
```

### Backend (Railway)
```bash
git push origin main
# Railway rebuild automatiquement
```

---

## Monitoring

### Cloudflare Analytics
- Traffic en temps réel
- Bandwidth utilisé
- Errors 4xx/5xx

### Railway Logs
- Logs applicatifs
- Performance des endpoints
- Usage CPU/RAM

### Logs Locaux
```bash
tail -f logs/automation.log
```

---

## Sécurité Production

1. **CORS** : Déjà configuré dans `main.py`
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.nyxia.ai"],  # Votre domaine Cloudflare
    ...
)
```

2. **Rate Limiting** : À ajouter avec `slowapi`

3. **Authentication** : JWT tokens pour protéger l'API

4. **Secrets** : Jamais de clés API dans le code
   - Utilisez Railway Variables
   - Cloudflare Secrets

---

## Checklist Déploiement

- [ ] Frontend déployé sur Cloudflare Pages
- [ ] Backend déployé sur Railway
- [ ] Base de données configurée
- [ ] Variables d'environnement ajoutées
- [ ] Domaine personnalisé connecté
- [ ] SSL activé (automatique chez Cloudflare)
- [ ] CORS configuré pour le domaine de prod
- [ ] Tests API effectués
- [ ] Monitoring activé
- [ ] Backup database configuré

---

## Support

Problèmes courants :

❌ *"CORS error"*  
→ Ajoutez votre domaine Cloudflare dans `allow_origins`

❌ *"Database connection failed"*  
→ Vérifiez DATABASE_URL dans Railway Variables

❌ *"Frontend ne se connecte pas au backend"*  
→ Mettez à jour `API_BASE` dans `index.html`

---

**🌌 NyXia est prêt pour la production !**
