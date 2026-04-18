# 🚀 Social Media Automation - Système de Publication Automatique

Un système complet d'automatisation pour générer et publier du contenu sur Facebook et TikTok pendant 90 jours.

## ✨ Fonctionnalités

### 🎯 Ce que le système fait :
- **Génération automatique de contenu IA** :
  - 📸 Images via Pollinations AI (100% gratuit)
  - 🎥 Vidéos Reels via Wan API (votre clé API)
  
- **Planification intelligente** :
  - Planning automatique sur 90 jours
  - Configuration du nombre de publications/jour (ex: 3 reels + 3 images)
  - Horaires optimisés répartis dans la journée
  
- **Publications multi-plateformes** :
  - Facebook Pages (via Graph API)
  - TikTok (via TikTok API)
  - Support multi-comptes/pages
  
- **Interface simple** :
  - Entrez vos titres, textes et 3 hashtags
  - Le système génère automatiquement les prompts IA
  - Calendrier de publication automatique

## 📁 Structure du projet

```
social-automation/
├── main.py                 # API FastAPI principale
├── requirements.txt        # Dépendances Python
├── config/
│   └── .env.example       # Template de configuration
├── app/
│   ├── config.py          # Configuration de l'app
│   ├── models.py          # Modèles de base de données
│   ├── scheduler.py       # Planificateur de contenu
│   ├── generator.py       # Générateur IA (images/vidéos)
│   ├── publisher.py       # Publications réseaux sociaux
│   └── autopublisher.py   # Gestion des tâches planifiées
├── static/
│   ├── images/            # Images générées
│   └── videos/            # Vidéos générées
└── data/
    └── automation.db      # Base de données SQLite
```

## 🛠️ Installation

### 1. Cloner/naviguer dans le projet
```bash
cd social-automation
```

### 2. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 3. Configurer les clés API

Copiez le fichier d'exemple et remplissez avec vos clés :
```bash
cp config/.env.example .env
```

Éditez `.env` avec vos informations :

```env
# Wan API (pour les vidéos)
WAN_API_KEY=votre_cle_api_wan
WAN_API_URL=https://api.wan.video/v1

# Pollinations AI (gratuit - pas de clé nécessaire)
POLLINATIONS_API_URL=https://image.pollinations.ai/prompt

# Facebook Graph API
FACEBOOK_APP_ID=votre_app_id
FACEBOOK_APP_SECRET=votre_app_secret
FACEBOOK_ACCESS_TOKEN=votre_access_token

# TikTok API
TIKTOK_CLIENT_KEY=votre_client_key
TIKTOK_CLIENT_SECRET=votre_client_secret
TIKTOK_ACCESS_TOKEN=votre_access_token

# Paramètres
DATABASE_URL=sqlite+aiosqlite:///./data/automation.db
DEBUG=true
```

### 4. Obtenir les clés API

#### 🖼️ Pollinations AI (Images - Gratuit)
- Aucune inscription nécessaire
- API gratuite et illimitée
- URL: https://pollinations.ai

#### 🎥 Wan API (Vidéos)
- Inscrivez-vous sur https://wan.video
- Créez votre clé API dans le dashboard

#### 📘 Facebook Graph API
1. Allez sur https://developers.facebook.com
2. Créez une application
3. Obtenez un token d'accès avec les permissions : `pages_manage_posts`, `pages_read_engagement`
4. Pour tester : https://developers.facebook.com/tools/explorer/

#### 🎵 TikTok API
1. Allez sur https://developers.tiktok.com
2. Créez une application
3. Demandez l'accès à "Video Upload API"
4. Suivez le flux OAuth pour obtenir le token

## 🚀 Utilisation

### Démarrer le serveur
```bash
python main.py
# ou
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

L'API est accessible sur : http://localhost:8000

Documentation interactive : http://localhost:8000/docs

### 📝 Exemple d'utilisation complète

#### Étape 1: Créer une campagne
```bash
curl -X POST "http://localhost:8000/campaigns/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ma Campagne 90 Jours",
    "description": "Publication automatique de contenu",
    "posts_per_day_reels": 3,
    "posts_per_day_images": 3,
    "planning_days": 90,
    "hashtags": "#monhashtag #viral #trending"
  }'
```

Réponse :
```json
{
  "success": true,
  "campaign_id": 1,
  "title": "Ma Campagne 90 Jours",
  "planning_days": 90,
  "posts_per_day_reels": 3,
  "posts_per_day_images": 3
}
```

#### Étape 2: Ajouter une page Facebook
```bash
curl -X POST "http://localhost:8000/campaigns/1/pages/" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "page_id": "123456789",
    "page_name": "Ma Page Facebook",
    "access_token": "votre_token_page"
  }'
```

#### Étape 3: Ajouter une page TikTok (optionnel)
```bash
curl -X POST "http://localhost:8000/campaigns/1/pages/" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "tiktok",
    "page_id": "tiktok_user_id",
    "page_name": "Mon TikTok",
    "access_token": "votre_token_tiktok"
  }'
```

#### Étape 4: Générer le planning de contenu
Fournissez vos titres, le système crée automatiquement 90 jours de contenu :

```bash
curl -X POST "http://localhost:8000/campaigns/1/schedule/" \
  -H "Content-Type: application/json" \
  -d '{
    "reels_titles": [
      "Découverte incroyable",
      "Astuce du jour",
      "Tendance du moment",
      "Conseil pratique",
      "Inspiration quotidienne"
    ],
    "images_titles": [
      "Citation motivante",
      "Photo artistique",
      "Infographie utile",
      "Mème drôle",
      "Annonce spéciale"
    ]
  }'
```

Le système va :
- Générer automatiquement des prompts IA variés pour chaque titre
- Créer 270 reels (3/jour × 90 jours)
- Créer 270 images (3/jour × 90 jours)
- Planifier les publications aux heures optimales
- Programmer la génération et publication automatique

#### Étape 5: Consulter les statistiques
```bash
curl "http://localhost:8000/campaigns/1/stats/"
```

#### Étape 6: Tester une publication immédiate
```bash
# Récupérer un contenu en attente
curl "http://localhost:8000/content/pending/?limit=1"

# Publier immédiatement (pour test)
curl -X POST "http://localhost:8000/publish/1/"
```

## 🔧 Personnalisation

### Modifier le nombre de publications par jour
Lors de la création de campagne, ajustez :
- `posts_per_day_reels`: Nombre de reels par jour (défaut: 3)
- `posts_per_day_images`: Nombre d'images par jour (défaut: 3)
- `planning_days`: Durée en jours (défaut: 90)

### Exemples de configurations

**Configuration légère :**
```json
{
  "posts_per_day_reels": 1,
  "posts_per_day_images": 1,
  "planning_days": 30
}
```
→ 30 reels + 30 images = 60 publications totales

**Configuration intensive :**
```json
{
  "posts_per_day_reels": 5,
  "posts_per_day_images": 5,
  "planning_days": 90
}
```
→ 450 reels + 450 images = 900 publications totales

## 📊 Comment ça marche

1. **Création de campagne** → Vous définissez les paramètres
2. **Ajout des pages** → Connectez Facebook/TikTok
3. **Saisie des titres** → Vous entrez 5-10 titres pour reels et images
4. **Génération automatique** :
   - Le système crée des variantes de prompts IA
   - Planifie les dates de publication (90 jours)
   - Programme les tâches de génération
5. **Publication automatique** :
   - Aux heures programmées, le contenu est généré par IA
   - Publication immédiate sur les réseaux connectés
   - Suivi des statistiques en temps réel

## 🎨 Génération de prompts automatique

Le système diversifie automatiquement vos titres en prompts IA :

**Votre titre :** `"Astuce du jour"`

**Prompts générés (exemples) :**
- "Professional photo of Astuce du jour, high quality, vibrant colors"
- "Short video clip showing Astuce du jour, dynamic movement, engaging"
- "Artistic representation of Astuce du jour, modern style, eye-catching"
- "Cinematic reel about Astuce du jour, smooth transitions, professional"

## ⚠️ Points importants

### Limites des APIs
- **Facebook** : Limite de posts/jour selon votre page
- **TikTok** : Approval requis pour l'API de upload
- **Wan API** : Crédits limités selon votre abonnement
- **Pollinations** : Gratuit et illimité ✅

### Bonnes pratiques
1. Testez d'abord avec une campagne de 7 jours
2. Vérifiez les tokens d'accès régulièrement
3. Surveillez les logs de publication
4. Ajustez les horaires selon votre audience

## 🐛 Dépannage

### Les publications ne se font pas ?
- Vérifiez que les tokens API sont valides
- Consultez les logs dans le terminal
- Testez avec `/publish/{id}/` pour publication manuelle

### Erreur Wan API ?
- Vérifiez votre clé API
- Assurez-vous d'avoir des crédits disponibles
- Testez l'endpoint `/generate/` séparément

### Images ne s'affichent pas ?
- Pollinations peut être lent parfois
- Vérifiez le dossier `static/images/`
- Redémarrez le serveur

## 📞 Support & Améliorations

Ce système est évolutif ! Vous pouvez ajouter :
- Plus de plateformes (Instagram, LinkedIn, Twitter)
- Templates de prompts personnalisés
- Interface web avec dashboard
- Analytics avancés
- A/B testing de contenu

## 📄 Licence

Utilisation libre pour vos projets personnels et commerciaux.

---

**Développé avec ❤️ pour l'automatisation sociale**
