# 🔗 Guide de Connexion aux Réseaux Sociaux

## Vue d'ensemble

NyXia permet de connecter vos pages Facebook et comptes TikTok pour automatiser les publications. Cette section explique comment obtenir les tokens d'accès nécessaires.

---

## 📘 Facebook Pages

### Étape 1: Créer une application Facebook Developer

1. Rendez-vous sur [Facebook Developers](https://developers.facebook.com)
2. Cliquez sur **"My Apps"** → **"Create App"**
3. Choisissez le type **"Business"** (recommandé) ou **"Other"**
4. Remplissez les informations de base
5. Dans le dashboard, cliquez sur **"Add Product"** → **"Graph API"**

### Étape 2: Obtenir un Token d'Accès

#### Option A: Graph API Explorer (Recommandé pour tester)

1. Allez dans **Tools & Support** → **Graph API Explorer**
2. Sélectionnez votre application en haut
3. Cliquez sur **"Get Token"** → **"Get User Access Token"**
4. Cochez les permissions suivantes:
   - `pages_manage_posts` (pour publier)
   - `pages_read_engagement` (pour lire les infos)
   - `pages_show_list` (pour lister les pages)
5. Cliquez sur **"Generate Token"** et acceptez les permissions
6. Sélectionnez votre page dans la liste
7. Générez un **Page Access Token** avec:
   ```
   GET /{page-id}?fields=access_token
   ```
8. Copiez le token retourné

#### Option B: Token de longue durée (Production)

1. Utilisez l'outil [Access Token Debugger](https://developers.facebook.com/tools/debug/access_token/)
2. Convertissez votre token utilisateur en token de longue durée (60 jours)
3. Pour un token de page permanent, assurez-vous que:
   - Votre page est liée à un Business Manager
   - Vous avez les droits admin sur la page

### Étape 3: Trouver l'ID de votre Page

**Méthode 1:** Via Graph API Explorer
```
GET /me/accounts
```

**Méthode 2:** Via l'URL de la page
- Allez sur votre page Facebook
- L'URL ressemble à: `facebook.com/YourPageName` ou `facebook.com/123456789`
- Si c'est un nom, allez dans **À propos** → cherchez "Identifiant de la Page"

### Permissions Requises

| Permission | Description |
|------------|-------------|
| `pages_manage_posts` | Publier du contenu |
| `pages_read_engagement` | Lire les statistiques |
| `pages_show_list` | Lister les pages gérées |

---

## 🎵 TikTok

### Étape 1: Devenir Développeur TikTok

1. Rendez-vous sur [TikTok Developers](https://developers.tiktok.com)
2. Créez un compte développeur
3. Complétez la vérification (peut prendre 1-3 jours)

### Étape 2: Créer une Application

1. Dans le dashboard, cliquez **"Create App"**
2. Choisissez **"Connect with TikTok"**
3. Remplissez:
   - Nom de l'application
   - Description
   - URL de redirect OAuth (ex: `http://localhost:8000/callback`)
   - Logo et captures d'écran

### Étape 3: Demander l'Accès à Video Upload

⚠️ **Important:** L'upload de vidéo nécessite une approbation manuelle

1. Allez dans **"Products"** → **"Video Upload"**
2. Cliquez sur **"Request Access"**
3. Soumettez:
   - Cas d'usage détaillé
   - Vidéo de démonstration
   - Politique de confidentialité
4. Attendez l'approbation (5-10 jours ouvrables)

### Étape 4: Implémenter OAuth 2.0

Une fois approuvé:

1. **URL d'autorisation:**
   ```
   https://www.tiktok.com/auth/authorize/?
     client_key=YOUR_CLIENT_KEY&
     scope=video.upload,user.info.basic&
     response_type=code&
     redirect_uri=YOUR_REDIRECT_URI&
     state=RANDOM_STATE
   ```

2. **Échanger le code contre un token:**
   ```bash
   POST https://open.tiktokapis.com/v2/oauth/token/
   
   {
     "client_key": "YOUR_CLIENT_KEY",
     "client_secret": "YOUR_CLIENT_SECRET",
     "code": "CODE_FROM_REDIRECT",
     "grant_type": "authorization_code",
     "redirect_uri": "YOUR_REDIRECT_URI"
   }
   ```

3. **Réponse:**
   ```json
   {
     "access_token": "votre_token_ici",
     "expires_in": 86400,
     "refresh_token": "votre_refresh_token",
     "scope": "video.upload,user.info.basic"
   }
   ```

### Étape 5: Trouver l'ID Utilisateur

Après avoir obtenu le token:
```bash
GET https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name

Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Scopes Requis

| Scope | Description |
|-------|-------------|
| `video.upload` | Uploader des vidéos |
| `user.info.basic` | Infos utilisateur de base |

---

## 🔒 Sécurité des Tokens

### Bonnes Pratiques

✅ **À FAIRE:**
- Stocker les tokens cryptés dans la base de données
- Utiliser HTTPS en production
- Renouveler les tokens avant expiration
- Limiter les permissions au minimum nécessaire
- Révoquer les tokens inutilisés

❌ **À ÉVITER:**
- Jamais committer les tokens dans Git
- Jamais partager les tokens publiquement
- Jamais stocker en clair dans le code
- Ne pas utiliser de tokens expirés

### Durée de Vie des Tokens

| Plateforme | Durée | Renouvelable |
|------------|-------|--------------|
| Facebook User Token | 1-2 heures | Oui (60 jours) |
| Facebook Page Token | 60 jours | Oui (permanent si config correcte) |
| TikTok Access Token | 24 heures | Oui (via refresh token) |
| TikTok Refresh Token | 1 an | Non |

---

## 🧪 Tester vos Tokens

### Facebook

```bash
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
```

Si valide, vous recevrez vos infos utilisateur.

### TikTok

```bash
curl -X GET "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ❓ Dépannage

### Erreur: "Invalid OAuth Access Token" (Facebook)

**Cause:** Token expiré ou révoqué
**Solution:** Régénérer un nouveau token via Graph API Explorer

### Erreur: "Missing permissions" (Facebook)

**Cause:** Permissions insuffisantes
**Solution:** Vérifier que toutes les permissions requises sont accordées

### Erreur: "Unapproved App" (TikTok)

**Cause:** Votre app n'est pas approuvée pour Video Upload
**Solution:** Soumettre une demande d'accès et attendre l'approbation

### Erreur: "Token Expired" (TikTok)

**Cause:** Token de 24h expiré
**Solution:** Utiliser le refresh token pour en obtenir un nouveau

---

## 📞 Support

- **Facebook Developers:** [community.facebook.com](https://community.facebook.com)
- **TikTok Developers:** [developers.tiktok.com/support](https://developers.tiktok.com/support)
- **Documentation NyXia:** `/README.md`

---

## 🚀 Prochaines Étapes

Une fois vos tokens obtenus:

1. Allez sur le dashboard NyXia
2. Cliquez sur **"🔗 Connexions Sociales"**
3. Sélectionnez votre campagne
4. Cliquez sur Facebook ou TikTok
5. Entrez:
   - Nom affiché (ex: "Ma Page Pro")
   - ID de la page/compte
   - Token d'accès
6. Cliquez sur **"✨ Connecter le compte"**

Votre compte est maintenant prêt pour l'automatisation ! 🎉
