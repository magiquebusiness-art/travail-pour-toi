---
Task ID: 1
Agent: Main Agent
Task: Base de connaissance avec upload PDF + injection chat + corrections

Work Log:
- Analysé le projet existant: dashboard index.html, APIs (knowledge, integrations, wan, media, auth, chat), schema D1
- Confirmé que les 3 features (KB, Intégrations, Création IA) avaient déjà des UI et APIs de base
- Identifié le besoin principal: upload PDF dans la KB + injection de la KB dans le chat
- Ajouté colonnes D1: type, file_name, page_count à la table knowledge
- Mis à jour l'API KB (knowledge/crud.js) pour supporter les nouveaux champs PDF
- Mis à jour chat.js pour injecter toute la base de connaissance dans le system prompt
- Ajouté au dashboard: zone upload PDF avec drag & drop, barre de progression, extraction pdf.js côté client
- Ajouté modal de détail pour consulter une entrée KB complète
- Ajouté boutons modifier/supprimer sur chaque carte KB
- Nettoyé le CSS (doublons kb-grid/kb-card)
- Commit + tentative de push (bloqué par auth GitHub)

Stage Summary:
- Tous les fichiers modifiés et commités localement sur main
- Diane doit push vers GitHub pour déclencher le déploiement Cloudflare Pages
- Migration D1 nécessaire: les colonnes seront auto-créées par l'API (ALTER TABLE fallback)
- Nouvelles capacités: upload PDF dans KB, drag & drop, extraction automatique, injection dans le chat
