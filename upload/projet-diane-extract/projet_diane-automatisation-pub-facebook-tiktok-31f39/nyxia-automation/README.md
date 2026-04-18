# 🌌 NyXia - Système d'Automatisation Sociale

> **Intelligence + Mystère + Maîtrise**  
> Votre guide cosmique pour l'automatisation Facebook & TikTok

---

## ✨ Fonctionnalités

### 🎯 Automatisation Complète
- **Génération IA automatique** : Pollinations AI (gratuit) + Wan API
- **Planification 90 jours** : X reels/jour + Y images/jour
- **Publications multi-plateformes** : Facebook Pages & TikTok
- **Support multi-comptes** : Gérez plusieurs pages simultanément

### 🎨 Interface NyXia Premium
- **Design galactique** : Bleu nuit, violet lumineux, touches dorées
- **Background animé** : 400 étoiles + étoiles filantes
- **Glassmorphism** : Transparence + flou élégant
- **Animations fluides** : Scintillement, glow, effets de profondeur

### 🔧 Architecture Technique
```
nyxia-automation/
├── backend/                 # API FastAPI (Python)
│   ├── main.py             # 7 endpoints REST
│   ├── app/
│   │   ├── config.py       # Configuration
│   │   ├── models.py       # Modèles SQLAlchemy
│   │   ├── scheduler.py    # Planificateur 90 jours
│   │   ├── generator.py    # IA: Pollinations + Wan
│   │   ├── publisher.py    # Facebook + TikTok
│   │   └── autopublisher.py # Tâches planifiées
│   ├── static/             # Images & vidéos générées
│   └── data/               # Base SQLite
├── frontend/               # Interface NyXia
│   ├── index.html          # Dashboard principal
│   ├── nyxia-design.css    # Design System complet
│   └── starry-background.tsx # Composant React (étoiles)
└── config/
    └── .env.example        # Template configuration
```

---

## 🚀 Installation Rapide

### 1. Backend (Python FastAPI)

```bash
cd nyxia-automation

# Installer les dépendances
pip install -r requirements.txt

# Configurer les clés API
cp config/.env.example .env
# Éditez .env avec vos clés

# Lancer le serveur
python main.py
```

Le serveur démarre sur **http://localhost:8000**

### 2. Frontend (Cloudflare Pages / Static)

```bash
# Le frontend est 100% statique
# Ouvrez simplement frontend/index.html dans un navigateur
# Ou hébergez sur Cloudflare Pages
```

### 3. Configuration des APIs

| Service | URL | Coût | Status |
|---------|-----|------|--------|
| **Pollinations AI** | https://pollinations.ai | ✅ Gratuit | Configuré |
| **Wan API** | https://wan.video | 💰 Crédits | À configurer |
| **Facebook Graph** | developers.facebook.com | ✅ Gratuit | À configurer |
| **TikTok API** | developers.tiktok.com | ✅ Gratuit | À configurer |

---

## 📖 Utilisation

### Créer une Campagne

**Via l'interface :**
1. Ouvrez `frontend/index.html`
2. Remplissez le formulaire "Nouvelle Campagne"
3. Cliquez sur "🚀 Créer la Campagne"

**Via API (curl) :**
```bash
curl -X POST http://localhost:8000/campaigns/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ma Campagne 90 Jours",
    "posts_per_day_reels": 3,
    "posts_per_day_images": 3,
    "planning_days": 90,
    "hashtags": "#viral #trending #monhashtag"
  }'
```

### Générer le Planning 90 Jours

**Via l'interface :**
1. Sélectionnez votre campagne
2. Entrez vos titres (un par ligne)
3. Cliquez sur "✨ Générer le Planning 90 Jours"

**Via API :**
```bash
curl -X POST http://localhost:8000/campaigns/1/schedule/ \
  -H "Content-Type: application/json" \
  -d '{
    "reels_titles": ["Titre Reel 1", "Titre Reel 2", "Titre Reel 3"],
    "images_titles": ["Titre Image 1", "Titre Image 2", "Titre Image 3"]
  }'
```

Résultat : **540 contenus** automatiquement planifiés !

### Ajouter une Page Sociale

```bash
curl -X POST http://localhost:8000/campaigns/1/pages/ \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "page_id": "votre_page_id",
    "access_token": "votre_token"
  }'
```

---

## 🎨 Design System NyXia

### Palette de Couleurs

```css
--nyxia-deep-blue: #0A1628      /* Fond principal */
--nyxia-night-blue: #0B1F3A     /* Dominante */
--nyxia-mystic-purple: #7B5CFF  /* Violet lumineux */
--nyxia-electric-blue: #4FA3FF  /* Bleu électrique */
--nyxia-gold: #F4C842           /* Or premium */
```

### Effets Visuels

- **Glassmorphism** : `backdrop-filter: blur(12px)`
- **Glow violet** : `box-shadow: 0 0 20px rgba(123, 92, 255, 0.4)`
- **Dégradés** : Violet → Bleu électrique
- **Halo doré** : Subtle autour des éléments clés

### Typographie

- **Titres** : Cormorant Garamond (serif moderne)
- **Corps** : Outfit (sans-serif digital)
- **Effet** : Gradient lumineux sur les titres

---

## 🔌 Endpoints API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/campaigns/` | Créer une campagne |
| `GET` | `/campaigns/` | Lister les campagnes |
| `POST` | `/campaigns/{id}/pages/` | Ajouter page sociale |
| `POST` | `/campaigns/{id}/schedule/` | Générer planning 90j |
| `GET` | `/campaigns/{id}/stats/` | Statistiques campagne |
| `POST` | `/generate/` | Tester génération IA |
| `POST` | `/publish/{id}/` | Publication immédiate |
| `GET` | `/content/pending/` | Contenu en attente |

**Documentation interactive** : http://localhost:8000/docs

---

## 📊 Exemple de Flux Complet

1. **Création** : Campagne "Auto 90J" avec 3 reels + 3 images/jour
2. **Configuration** : 10 titres reels + 10 titres images
3. **Génération** : 540 tâches planifiées automatiquement
4. **Planning** : Publications réparties sur 90 jours (6h, 12h, 18h)
5. **Exécution** : 
   - Génération IA automatique (Pollinations/Wan)
   - Publication auto sur Facebook & TikTok
   - Suivi en temps réel dans le dashboard

---

## 🛠️ Personnalisation

### Modifier l'Ambiance

Dans `frontend/nyxia-design.css` :

```css
/* Changer la densité des étoiles */
const numStars = 400  // Augmentez pour plus d'étoiles

/* Modifier la fréquence des étoiles filantes */
if (Math.random() < 0.012)  // 0.02 = plus fréquent
```

### Ajouter des Plateformes

Dans `app/publisher.py` :

```python
class Publisher:
    async def publish_to_instagram(self, content):
        # Implémenter Instagram Graph API
        pass
    
    async def publish_to_youtube(self, content):
        # Implémenter YouTube Data API
        pass
```

---

## 🔐 Sécurité

- Clés API dans `.env` (jamais commitées)
- Tokens OAuth sécurisés
- Rate limiting sur les APIs
- Logs dans `logs/automation.log`

---

## 📝 Fichiers de Configuration

### `.env` (à créer)

```env
# WAN API
WAN_API_KEY=votre_cle_wan
WAN_API_URL=https://api.wan.video/v1

# Facebook
FB_APP_ID=votre_app_id
FB_APP_SECRET=votre_secret

# TikTok
TIKTOK_CLIENT_KEY=votre_client_key
TIKTOK_CLIENT_SECRET=votre_secret

# Database
DATABASE_URL=sqlite:///data/automation.db

# Scheduler
SCHEDULER_ENABLED=true
TIMEZONE=Europe/Paris
```

---

## 🎯 Roadmap

- [ ] Support Instagram Reels
- [ ] Génération de captions IA
- [ ] Analytics avancés
- [ ] A/B testing automatique
- [ ] Support YouTube Shorts
- [ ] Webhooks pour notifications

---

## 💡 Conseils d'Utilisation

1. **Commencez petit** : 1 reel + 1 image/jour pour tester
2. **Variez les horaires** : 9h, 13h, 19h pour meilleur engagement
3. **Qualité > Quantité** : Mieux vaut 3 posts excellents que 10 moyens
4. **Surveillez les stats** : Ajustez selon les performances
5. **Respectez les ToS** : Facebook & TikTok ont des limites

---

## 🆘 Support

**Problèmes courants :**

❌ *"Erreur de connexion API"*  
→ Vérifiez vos clés dans `.env`

❌ *"Pas de publications"*  
→ Vérifiez que le scheduler est activé : `SCHEDULER_ENABLED=true`

❌ *"Images non générées"*  
→ Pollinations est gratuit mais peut être lent. Patientez.

---

## 🌟 Credits

**NyXia** - Créé avec ❤️ pour l'automatisation intelligente  
Design System : Ambiance cosmique galactique  
Backend : Python FastAPI + SQLAlchemy  
Frontend : HTML/CSS/JS vanilla + Canvas API  

---

**© 2024 NyXia - Intelligence + Mystère + Maîtrise**
