# 🌌 NyXia - Démarrage Rapide

## ⚡ En 5 Minutes

### 1. Cloner et Installer
```bash
cd nyxia-automation
pip install -r requirements.txt
```

### 2. Configurer les Clés API
```bash
cp config/.env.example .env
nano .env  # Ajoutez vos clés
```

### 3. Lancer le Backend
```bash
python main.py
```
→ http://localhost:8000/docs

### 4. Ouvrir le Frontend
```bash
# Ouvrez simplement dans votre navigateur :
frontend/index.html
```
Ou avec un serveur local :
```bash
cd frontend
python -m http.server 3000
```
→ http://localhost:3000

---

## 🎯 Premier Test (2 minutes)

### Via l'interface :
1. Ouvrez `frontend/index.html`
2. Créez une campagne "Test 90J"
3. Entrez 3 titres reels + 3 titres images
4. Cliquez sur "Générer le Planning"
5. ✨ **540 contenus planifiés !**

### Via API (curl) :
```bash
# 1. Créer campagne
curl -X POST http://localhost:8000/campaigns/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","posts_per_day_reels":3,"posts_per_day_images":3,"planning_days":90,"hashtags":"#test"}'

# 2. Générer planning
curl -X POST http://localhost:8000/campaigns/1/schedule/ \
  -H "Content-Type: application/json" \
  -d '{"reels_titles":["T1","T2","T3"],"images_titles":["I1","I2","I3"]}'
```

---

## 🚀 Déploiement Cloudflare Pages

### Option A: Dashboard (Plus simple)
1. Allez sur https://dash.cloudflare.com/pages
2. "Create project" → "Direct Upload"
3. Uploadez le dossier `frontend/`
4. Déployez ! (5 secondes)

### Option B: Wrangler CLI
```bash
npm install -g wrangler
wrangler login
cd frontend
wrangler pages deploy . --project-name=nyxia-frontend
```

✅ Votre frontend est en ligne sur :  
`https://nyxia-frontend.pages.dev`

---

## 🔧 Prochaines Étapes

1. **Ajouter vos pages Facebook/TikTok** via l'API
2. **Configurer Wan API** pour les vidéos
3. **Activer le scheduler** pour publications auto
4. **Personnaliser le design** dans `nyxia-design.css`

---

## 📚 Documentation Complète

- **README.md** : Guide complet
- **frontend/cloudflare-deploy.md** : Déploiement détaillé
- **http://localhost:8000/docs** : API interactive

---

## 💬 Besoin d'Aide ?

Problèmes courants :

| Problème | Solution |
|----------|----------|
| Erreur CORS | Vérifiez que le backend tourne sur port 8000 |
| Images non générées | Pollinations peut être lent, patientez |
| Scheduler inactif | Vérifiez `SCHEDULER_ENABLED=true` dans .env |

---

**🌟 NyXia est opérationnel !**

Intelligence + Mystère + Maîtrise
