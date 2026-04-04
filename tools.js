// ============================================================
//  TOOLS — NyXia Worker (Cloudflare) — Phase 4
//  Vault + GitHub + Cloudflare + Auto-déploiement
// ============================================================

import { setAccount, setProject, listAccounts, listProjects, resolveCredentials } from "./vault-kv.js";
import { runDeployPipeline, healthCheck, formatReport, githubPushMultipleFiles } from "./deploy-engine.js";
import { updateProfile, logProjectEvent, getProjectHistory, buildMemoryContext } from "./memory.js";
import { notify }                          from "./notifier.js";
import { generateWebhookHandler, generateWebhookSecret, getIntegrationGuide } from "./systemeio.js";
import {
  d1Query, d1Batch, applyMigration, getAppliedMigrations,
  listTables, describeTable, SCHEMAS,
  generateD1WorkerCode, generateWranglerD1Config,
} from "./d1-manager.js";
import {
  CSS_PRESETS, HTML_BLOCKS, EMAIL_TEMPLATES,
  generateProjectCSS,
} from "./systemeio-designer.js";
import {
  runSandbox, runSandboxMultiple,
  formatSandboxReport, cfDryRun,
} from "./sandbox.js";
import {
  generateSite, deploySiteToPages, resolveSubdomain,
  registerAsAffiliate, runSiteGenerationPipeline, PALETTES,
} from "./site-generator.js";
import {
  processImageRequest, generateMidjourneyPrompt,
  generatePlaceholder, classifyImageRequest, shouldUseCfAI,
} from "./image-engine.js";
import {
  callAgent, orchestrate, classifyRequest,
  agentCopywriter, agentCommunity, agentAnalyst, agentSupport,
  AGENT_TOOLS, AGENT_PROMPTS,
} from "./agents.js";
import {
  detectImprovements, generatePatch, generateDiff,
  runSelfImprovementPipeline, getImprovementHistory,
  formatImprovementReport, isProtectedFile, PROTECTED_FILES,
} from "./self-improve.js";

// ─── Helpers ──────────────────────────────────────────────

async function ghFetch(token, owner, repo, path, options = {}) {
  if (!token) throw new Error("Token GitHub manquant — enregistre le compte avec register_account");
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept":        "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent":    "NyXia-Agent",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub ${res.status}: ${err.message || res.statusText}`);
  }
  return res;
}

async function cfApiFetch(token, accountId, path, options = {}) {
  if (!token)     throw new Error("Token Cloudflare manquant");
  if (!accountId) throw new Error("Account ID Cloudflare manquant");
  return fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
      ...(options.headers || {}),
    },
  });
}

function creds(projectKey) {
  const c = resolveCredentials(projectKey);
  if (!c) throw new Error(`Projet "${projectKey}" inconnu. Utilise list_vault ou register_project.`);
  return c;
}

// ─── Schémas (identiques à src/tools.js) ──────────────────

export const tools = [
  { type:"function", function:{ name:"register_account", description:"Enregistre un compte GitHub OU Cloudflare dans le vault persistant chiffré. Appelle ce tool dès que l'utilisateur donne un token.", parameters:{ type:"object", properties:{ alias:{type:"string",description:"Nom court du compte (ex: affiliationpro)"}, github_token:{type:"string"}, github_owner:{type:"string"}, cf_token:{type:"string"}, cf_account_id:{type:"string"} }, required:["alias"] } } },
  { type:"function", function:{ name:"register_project", description:"Enregistre un projet dans le vault avec repo GitHub et ressources Cloudflare.", parameters:{ type:"object", properties:{ key:{type:"string"}, label:{type:"string"}, description:{type:"string"}, accountAlias:{type:"string",description:"Alias du compte associé"}, github_owner:{type:"string"}, github_repo:{type:"string"}, github_branch:{type:"string",default:"main"}, cf_worker:{type:"string"}, cf_pages:{type:"string"}, cf_kv:{type:"string"}, stack:{type:"array",items:{type:"string"}}, status:{type:"string",enum:["en_cours","stable","archivé"]} }, required:["key","label","accountAlias"] } } },
  { type:"function", function:{ name:"list_vault", description:"Affiche comptes et projets du vault (sans révéler les tokens).", parameters:{ type:"object", properties:{} } } },
  { type:"function", function:{ name:"github_list_files", description:"Liste les fichiers d'un dossier dans un repo GitHub.", parameters:{ type:"object", properties:{ project:{type:"string"}, path:{type:"string",default:""}, branch:{type:"string"} }, required:["project"] } } },
  { type:"function", function:{ name:"github_read_file", description:"Lit le contenu d'un fichier GitHub.", parameters:{ type:"object", properties:{ project:{type:"string"}, path:{type:"string"}, branch:{type:"string"} }, required:["project","path"] } } },
  { type:"function", function:{ name:"github_list_branches", description:"Liste les branches d'un repo.", parameters:{ type:"object", properties:{ project:{type:"string"} }, required:["project"] } } },
  { type:"function", function:{ name:"github_push_file", description:"Crée ou met à jour un fichier dans GitHub. Demande confirmation si le fichier existe.", parameters:{ type:"object", properties:{ project:{type:"string"}, path:{type:"string"}, content:{type:"string"}, message:{type:"string"}, branch:{type:"string"} }, required:["project","path","content","message"] } } },
  { type:"function", function:{ name:"github_create_branch", description:"Crée une nouvelle branche.", parameters:{ type:"object", properties:{ project:{type:"string"}, branch_name:{type:"string"}, from_branch:{type:"string",default:"main"} }, required:["project","branch_name"] } } },
  { type:"function", function:{ name:"generate_code", description:"Génère du code JS, Node.js ou PHP prêt à l'emploi.", parameters:{ type:"object", properties:{ language:{type:"string",enum:["javascript","nodejs","php","html","css","json"]}, filename:{type:"string"}, description:{type:"string"}, code:{type:"string"} }, required:["language","filename","description","code"] } } },
  { type:"function", function:{ name:"cloudflare_list_workers", description:"Liste les Workers Cloudflare d'un compte.", parameters:{ type:"object", properties:{ project:{type:"string"} }, required:["project"] } } },
  { type:"function", function:{ name:"cloudflare_deploy_worker", description:"Déploie un Worker Cloudflare. Demande confirmation avant prod.", parameters:{ type:"object", properties:{ project:{type:"string"}, worker_name:{type:"string"}, script:{type:"string"}, environment:{type:"string",enum:["staging","production"]} }, required:["project","script","environment"] } } },
  { type:"function", function:{ name:"cloudflare_pages_list", description:"Liste les projets Cloudflare Pages.", parameters:{ type:"object", properties:{ project:{type:"string"} }, required:["project"] } } },
  { type:"function", function:{ name:"cloudflare_pages_deployments", description:"Liste les derniers déploiements d'un projet Pages.", parameters:{ type:"object", properties:{ project:{type:"string"}, pages_project:{type:"string"} }, required:["project"] } } },
  { type:"function", function:{ name:"cloudflare_kv_list_namespaces", description:"Liste les namespaces KV.", parameters:{ type:"object", properties:{ project:{type:"string"} }, required:["project"] } } },
  { type:"function", function:{ name:"cloudflare_kv_get", description:"Lit une valeur KV.", parameters:{ type:"object", properties:{ project:{type:"string"}, namespace_id:{type:"string"}, key:{type:"string"} }, required:["project","key"] } } },
  { type:"function", function:{ name:"cloudflare_kv_set", description:"Écrit une valeur KV.", parameters:{ type:"object", properties:{ project:{type:"string"}, namespace_id:{type:"string"}, key:{type:"string"}, value:{type:"string"}, ttl:{type:"number"} }, required:["project","key","value"] } } },
  { type:"function", function:{ name:"cloudflare_kv_list_keys", description:"Liste les clés d'un namespace KV.", parameters:{ type:"object", properties:{ project:{type:"string"}, namespace_id:{type:"string"}, prefix:{type:"string"}, limit:{type:"number"} }, required:["project"] } } },

  // ══ PHASE 5 — MÉMOIRE LONG TERME ════════════════════════

  {
    type:"function", function:{
      name:"update_profile",
      description:"Met à jour le profil persistant de l'utilisateur (prénom, préférences, style). Appelle ce tool dès que l'utilisateur donne son prénom ou exprime une préférence.",
      parameters:{ type:"object", properties:{
        name:        { type:"string", description:"Prénom ou nom de l'utilisateur" },
        notes:       { type:"string", description:"Notes générales sur l'utilisateur" },
        preferences: { type:"object", description:"Préférences techniques", properties:{
          language:   { type:"string", description:"Langage préféré (ex: Node.js, PHP)" },
          codeStyle:  { type:"string", description:"Style de code préféré" },
          deployEnv:  { type:"string", description:"Environnement de déploiement préféré" },
        }},
        style:       { type:"object", description:"Style de communication", properties:{
          tone:       { type:"string", description:"Ton souhaité (ex: concis, détaillé, avec exemples)" },
        }},
      }}
    }
  },

  {
    type:"function", function:{
      name:"log_project_event",
      description:"Ajoute un événement au journal du projet (déploiement, code créé, bug résolu, décision prise). Appelle ce tool après chaque action importante.",
      parameters:{ type:"object", properties:{
        project: { type:"string", description:"Clé du projet" },
        type:    { type:"string", enum:["deploy","code","bug","decision","note"], description:"Type d'événement" },
        summary: { type:"string", description:"Description courte de l'événement (max 120 chars)" },
        details: { type:"string", description:"Détails optionnels" },
        file:    { type:"string", description:"Fichier concerné (optionnel)" },
        url:     { type:"string", description:"URL ou lien associé (optionnel)" },
      }, required:["project","type","summary"]}
    }
  },

  {
    type:"function", function:{
      name:"get_project_history",
      description:"Affiche l'historique des actions passées sur un projet (déploiements, code, bugs, décisions).",
      parameters:{ type:"object", properties:{
        project: { type:"string", description:"Clé du projet" },
        limit:   { type:"number", description:"Nombre d'événements à retourner (défaut: 10)" },
      }, required:["project"]}
    }
  },

  {
    type:"function", function:{
      name:"get_memory_summary",
      description:"Affiche le résumé complet de la mémoire de NyXia : profil utilisateur, sessions récentes, activité des projets.",
      parameters:{ type:"object", properties:{} }
    }
  },

  // ══ PHASE 10 — AUTO-AMÉLIORATION ════════════════════════

  {
    type:"function", function:{
      name:"detect_improvements",
      description:"NyXia analyse son propre système et propose des améliorations concrètes avec priorité, risque et fichier cible. Ne modifie RIEN — propose seulement.",
      parameters:{ type:"object", properties:{
        recent_errors:     { type:"array",  items:{type:"string"}, description:"Erreurs récentes détectées" },
        performance_data:  { type:"object", description:"Données de performance (temps réponse, taux erreurs...)" },
        user_feedback:     { type:"array",  items:{type:"string"}, description:"Retours utilisateur récents" },
        focus:             { type:"string", description:"Domaine à analyser en priorité (ex: performance, sécurité, UX)" },
      }}
    }
  },

  {
    type:"function", function:{
      name:"generate_improvement_patch",
      description:"Génère le code du patch pour une amélioration identifiée. Produit aussi le diff visuel ligne par ligne. Ne modifie RIEN — génère le code pour approbation.",
      parameters:{ type:"object", properties:{
        improvement_id:    { type:"string", description:"ID de l'amélioration (depuis detect_improvements)" },
        improvement_title: { type:"string", description:"Titre de l'amélioration" },
        improvement_desc:  { type:"string", description:"Description problème + solution" },
        filepath:          { type:"string", description:"Fichier à modifier (ex: worker/tools.js)" },
        current_code:      { type:"string", description:"Code actuel du fichier (optionnel)" },
        type:              { type:"string", enum:["bug_fix","performance","feature","security","refactor"] },
      }, required:["improvement_title","improvement_desc","filepath"] }
    }
  },

  {
    type:"function", function:{
      name:"apply_improvement",
      description:"⚠ ACTION IRRÉVERSIBLE — Applique une amélioration après approbation explicite de l'utilisateur. Inclut backup GitHub, sandbox score > 90, déploiement et health check avec rollback automatique.",
      parameters:{ type:"object", properties:{
        improvement_id:   { type:"string", description:"ID de l'amélioration" },
        improvement_title:{ type:"string" },
        improvement_desc: { type:"string" },
        filepath:         { type:"string" },
        new_code:         { type:"string", description:"Code du patch à appliquer" },
        type:             { type:"string", enum:["bug_fix","performance","feature","security","refactor"] },
        user_confirmed:   { type:"boolean", description:"L'utilisateur a EXPLICITEMENT dit oui — OBLIGATOIRE", default:false },
      }, required:["improvement_title","filepath","new_code","user_confirmed"] }
    }
  },

  {
    type:"function", function:{
      name:"get_improvement_history",
      description:"Consulte le journal des auto-améliorations passées de NyXia.",
      parameters:{ type:"object", properties:{
        limit: { type:"number", description:"Nombre d'entrées à retourner (défaut: 20)", default:20 },
      }}
    }
  },

  // ══ PHASE 9 — AGENTS SPÉCIALISÉS ════════════════════════
  ...AGENT_TOOLS,

  // ══ IMAGES ═══════════════════════════════════════════════

  {
    type:"function", function:{
      name:"generate_image",
      description:"Génère une image pour un client. Décide automatiquement entre Cloudflare AI (gratuit, instantané) pour les fonds/banners/illustrations, ou génère un prompt optimisé Midjourney/Leonardo pour les personnes et mockups complexes.",
      parameters:{ type:"object", properties:{
        description:  { type:"string", description:"Ce que l'image doit représenter (en langage naturel)" },
        image_type:   { type:"string", enum:["person","product","background","banner","illustration"], description:"Type d'image (auto-détecté si absent)" },
        palette:      { type:"string", enum:["violet","emeraude","corail","ardoise","rose","ocean","sombre"], description:"Palette de couleurs du site pour cohérence" },
        platform:     { type:"string", enum:["midjourney","leonardo","dalle3"], description:"Plateforme pour les prompts complexes", default:"midjourney" },
        style:        { type:"string", description:"Style voulu (ex: chaud, professionnel, naturel, minimal, 3d, lifestyle)" },
        gender:       { type:"string", enum:["woman","man","person"], description:"Genre pour les portraits", default:"woman" },
        role:         { type:"string", description:"Rôle/métier de la personne (ex: coach, thérapeute, entrepreneur)" },
        return_prompt_only: { type:"boolean", description:"Retourner uniquement le prompt sans générer l'image CF AI", default:false },
      }, required:["description"] }
    }
  },

  {
    type:"function", function:{
      name:"generate_image_batch",
      description:"Génère plusieurs images en lot pour un site complet (hero, section produit, fond, portrait). Optimisé pour équiper un site entier en une seule demande.",
      parameters:{ type:"object", properties:{
        site_type:    { type:"string", enum:["landing","minisite","coach","ecommerce","systemeio"] },
        palette:      { type:"string", enum:["violet","emeraude","corail","ardoise","rose","ocean","sombre"] },
        context:      { type:"string", description:"Description de l'activité du client (pour personnaliser les prompts)" },
        platform:     { type:"string", enum:["midjourney","leonardo","dalle3"], default:"midjourney" },
        gender:       { type:"string", enum:["woman","man","person"], default:"woman" },
        role:         { type:"string", description:"Rôle du propriétaire du site" },
      }, required:["site_type","palette","context"] }
    }
  },

  {
    type:"function", function:{
      name:"generate_placeholder",
      description:"Génère un placeholder SVG intelligent (pas un carré gris — un vrai visuel harmonieux) à intégrer dans un site pendant que les vraies images sont créées.",
      parameters:{ type:"object", properties:{
        type:    { type:"string", enum:["person","product","background","banner","illustration"] },
        palette: { type:"string", enum:["violet","emeraude","corail","ardoise","rose","ocean","sombre"] },
        label:   { type:"string", description:"Label à afficher sur le placeholder" },
        width:   { type:"number", default:1200 },
        height:  { type:"number", default:600 },
      }, required:["type","palette"] }
    }
  },

  // ══ GÉNÉRATEUR DE SITES IA ═══════════════════════════════

  {
    type:"function", function:{
      name:"generate_site_full",
      description:"Pipeline COMPLET : génère un site HTML via IA, le déploie sur Cloudflare Pages, configure le sous-domaine et inscrit le client dans AffiliationPro. C'est LE tool principal pour créer un site client.",
      parameters:{ type:"object", properties:{
        type:         { type:"string", enum:["landing","minisite","systemeio","coach","ecommerce"], description:"Type de site" },
        prompt:       { type:"string", description:"Description du site en langage naturel (activité, produit, public cible, ton voulu)" },
        language:     { type:"string", description:"Langue du site (fr, en, es, pt, de...)", default:"fr" },
        palette:      { type:"string", enum:["violet","emeraude","corail","ardoise","rose","ocean","sombre"], description:"Palette de couleurs", default:"violet" },
        owner_name:   { type:"string", description:"Nom du propriétaire / auteur du site" },
        product_name: { type:"string", description:"Nom du produit ou service" },
        price:        { type:"string", description:"Prix (ex: 97€, gratuit, sur devis)" },
        affiliate_url:{ type:"string", description:"URL affilié à intégrer dans les CTAs" },
        client_email: { type:"string", description:"Email du client (pour l'inscrire dans AffiliationPro)" },
        client_name:  { type:"string", description:"Nom/prénom du client" },
        client_domain:{ type:"string", description:"Domaine existant du client (ex: moncoach.com) → crée affiliation.moncoach.com" },
        client_slug:  { type:"string", description:"Identifiant court si pas de domaine (ex: mariecaron) → mariecaron.market.publication-web.com" },
        referrer_id:  { type:"string", description:"ID de l'affilié qui a amené ce client (pour les commissions)" },
      }, required:["type","prompt"] }
    }
  },

  {
    type:"function", function:{
      name:"generate_site_preview",
      description:"Génère uniquement le HTML du site (sans déployer). Utile pour prévisualiser avant de déployer, ou pour donner le code au client.",
      parameters:{ type:"object", properties:{
        type:         { type:"string", enum:["landing","minisite","systemeio","coach","ecommerce"] },
        prompt:       { type:"string" },
        language:     { type:"string", default:"fr" },
        palette:      { type:"string", enum:["violet","emeraude","corail","ardoise","rose","ocean","sombre"], default:"violet" },
        owner_name:   { type:"string" },
        product_name: { type:"string" },
        price:        { type:"string" },
        affiliate_url:{ type:"string" },
      }, required:["type","prompt"] }
    }
  },

  {
    type:"function", function:{
      name:"resolve_subdomain",
      description:"Calcule le sous-domaine et les instructions DNS pour un client. Utilise avant generate_site_full pour informer le client.",
      parameters:{ type:"object", properties:{
        client_domain:{ type:"string", description:"Domaine existant du client (optionnel)" },
        client_slug:  { type:"string", description:"Identifiant court si pas de domaine" },
      }}
    }
  },

  {
    type:"function", function:{
      name:"list_palettes",
      description:"Liste toutes les palettes de couleurs disponibles pour les sites générés.",
      parameters:{ type:"object", properties:{} }
    }
  },

  // ══ SANDBOX — TEST AVANT DÉPLOIEMENT ════════════════════

  {
    type:"function", function:{
      name:"sandbox_test",
      description:"Analyse et teste le code AVANT de le déployer. Détecte les erreurs de syntaxe, patterns dangereux (DROP TABLE, eval, tokens en dur), incompatibilités CF Workers, et calcule un score de confiance 0-100. NyXia DOIT appeler ce tool avant tout deploy_pipeline.",
      parameters:{ type:"object", properties:{
        files:        { type:"array", description:"Fichiers à tester", items:{ type:"object", properties:{ path:{type:"string"}, content:{type:"string"} }, required:["content"] } },
        project:      { type:"string", description:"Projet — pour récupérer les credentials CF pour le dry-run" },
        worker_name:  { type:"string", description:"Nom du Worker pour le dry-run Cloudflare" },
        skip_dry_run: { type:"boolean", description:"Passer le dry-run CF (tests locaux uniquement)", default:false },
      }, required:["files"] }
    }
  },

  {
    type:"function", function:{
      name:"sandbox_test_single",
      description:"Teste un seul fichier rapidement. Retourne le rapport détaillé avec score, problèmes et recommandations.",
      parameters:{ type:"object", properties:{
        code:      { type:"string", description:"Code à analyser" },
        filename:  { type:"string", description:"Nom du fichier (ex: webhook.js)" },
        file_type: { type:"string", enum:["worker","javascript","php","html","css"], description:"Type de fichier", default:"javascript" },
      }, required:["code"] }
    }
  },

  // ══ PHASE 7 — D1 DATABASE ════════════════════════════════

  {
    type:"function", function:{
      name:"d1_query",
      description:"Exécute une requête SQL sur une base Cloudflare D1. Utilise pour lire (SELECT) ou écrire (INSERT/UPDATE/DELETE) dans la base de données.",
      parameters:{ type:"object", properties:{
        project:    { type:"string", description:"Clé du projet" },
        db_binding: { type:"string", description:"Nom du binding D1 dans wrangler.toml (ex: DB)", default:"DB" },
        sql:        { type:"string", description:"Requête SQL à exécuter" },
        params:     { type:"array", items:{type:"string"}, description:"Paramètres liés (? dans le SQL)" },
      }, required:["sql"] }
    }
  },

  {
    type:"function", function:{
      name:"d1_list_tables",
      description:"Liste toutes les tables d'une base Cloudflare D1.",
      parameters:{ type:"object", properties:{
        project:    { type:"string" },
        db_binding: { type:"string", default:"DB" },
      }}
    }
  },

  {
    type:"function", function:{
      name:"d1_describe_table",
      description:"Décrit la structure d'une table D1 (colonnes, types, nombre de lignes).",
      parameters:{ type:"object", properties:{
        project:    { type:"string" },
        db_binding: { type:"string", default:"DB" },
        table:      { type:"string", description:"Nom de la table" },
      }, required:["table"] }
    }
  },

  {
    type:"function", function:{
      name:"d1_apply_schema",
      description:"Applique le schéma complet d'un projet (migrations versionnées). Supporte affiliationpro et publicationcashflow avec leurs tables prêtes.",
      parameters:{ type:"object", properties:{
        project:    { type:"string", description:"Clé du projet" },
        db_binding: { type:"string", default:"DB" },
        schema_key: { type:"string", enum:["affiliationpro","publicationcashflow"], description:"Schéma prédéfini à appliquer" },
      }, required:["schema_key"] }
    }
  },

  {
    type:"function", function:{
      name:"d1_generate_config",
      description:"Génère la configuration wrangler.toml pour ajouter une base D1 à un projet, et le code Worker de base pour l'utiliser.",
      parameters:{ type:"object", properties:{
        db_name:    { type:"string", description:"Nom de la base D1 (ex: affiliationpro-db)" },
        db_id:      { type:"string", description:"ID de la base (après création avec wrangler d1 create)" },
        project:    { type:"string" },
        with_code:  { type:"boolean", description:"Inclure un exemple de Worker", default:true },
      }, required:["db_name"] }
    }
  },

  // ══ PHASE 7 — SYSTEME.IO DESIGNER ════════════════════════

  {
    type:"function", function:{
      name:"generate_systemeio_css",
      description:"Génère du CSS personnalisé à coller dans Systeme.io. Peut générer un preset existant ou un CSS sur mesure selon les couleurs et le style voulus.",
      parameters:{ type:"object", properties:{
        preset:          { type:"string", enum:["button_glow","button_fire","hero_gradient","testimonials","countdown_banner","typography_premium"], description:"Preset CSS prêt à l'emploi" },
        custom:          { type:"boolean", description:"Générer un CSS sur mesure", default:false },
        primary_color:   { type:"string", description:"Couleur primaire hex (ex: #7c3aed)" },
        secondary_color: { type:"string", description:"Couleur secondaire hex" },
        accent_color:    { type:"string", description:"Couleur d'accent (boutons, highlights)" },
        font_heading:    { type:"string", description:"Police pour les titres (Google Fonts)" },
        font_body:       { type:"string", description:"Police pour le corps de texte" },
        style:           { type:"string", enum:["premium","urgency","minimal"], description:"Style général" },
        description:     { type:"string", description:"Description de l'effet voulu (ex: bouton rouge qui pulse avec animation feu)" },
      }}
    }
  },

  {
    type:"function", function:{
      name:"generate_systemeio_html",
      description:"Génère un bloc HTML à coller dans l'éditeur Systeme.io (badge garantie, compte à rebours, barre logos, etc.).",
      parameters:{ type:"object", properties:{
        block_type:   { type:"string", enum:["guarantee_badge","countdown_timer","social_proof_bar","custom"], description:"Type de bloc" },
        description:  { type:"string", description:"Description du bloc voulu si type custom" },
        target_date:  { type:"string", description:"Date cible pour le compte à rebours (ISO 8601)" },
        company_name: { type:"string", description:"Nom de l'entreprise" },
        custom_text:  { type:"string", description:"Texte personnalisé" },
      }, required:["block_type"] }
    }
  },

  {
    type:"function", function:{
      name:"generate_systemeio_email",
      description:"Génère un template email HTML complet pour Systeme.io (bienvenue affilié, notification de vente, résumé de session, ou email sur mesure).",
      parameters:{ type:"object", properties:{
        template:      { type:"string", enum:["welcome","sale_notification","session_summary_email","custom"], description:"Type d'email" },
        description:   { type:"string", description:"Description de l'email si type custom" },
        company_name:  { type:"string", description:"Nom de l'entreprise" },
        primary_color: { type:"string", description:"Couleur principale" },
        affiliate_link:{ type:"string", description:"Lien affilié exemple" },
        dashboard_url: { type:"string", description:"URL du dashboard affilié" },
        custom_vars:   { type:"object", description:"Variables personnalisées pour le template" },
      }, required:["template"] }
    }
  },

  {
    type:"function", function:{
      name:"list_systemeio_assets",
      description:"Liste tous les presets CSS, blocs HTML et templates email disponibles pour Systeme.io.",
      parameters:{ type:"object", properties:{} }
    }
  },

  // ══ PHASE 6 — NOTIFICATIONS & SYSTEME.IO ════════════════

  {
    type:"function", function:{
      name:"send_notification",
      description:"Envoie une notification sur Discord et/ou par email. Appelle ce tool automatiquement après chaque déploiement, push GitHub important, ou fin de session.",
      parameters:{ type:"object", properties:{
        type:        { type:"string", enum:["deploy_success","deploy_failure","github_push","session_summary","info"], description:"Type d'événement" },
        title:       { type:"string", description:"Titre de la notification" },
        description: { type:"string", description:"Message principal" },
        project:     { type:"string", description:"Projet concerné" },
        environment: { type:"string", description:"Environnement (staging/production)" },
        worker:      { type:"string", description:"Nom du Worker déployé" },
        commit:      { type:"string", description:"SHA du commit" },
        url:         { type:"string", description:"URL associée" },
        files:       { type:"array", items:{type:"string"}, description:"Fichiers concernés" },
        error:       { type:"string", description:"Message d'erreur si échec" },
        latency:     { type:"string", description:"Latence du health check" },
        summary:     { type:"object", description:"Résumé de session (done, nextSteps, decisions)" },
      }, required:["type","title"] }
    }
  },

  {
    type:"function", function:{
      name:"configure_notifications",
      description:"Configure les destinations de notifications (Discord webhook URL, email to/from). Ces infos sont sauvegardées dans le vault chiffré.",
      parameters:{ type:"object", properties:{
        discord_webhook: { type:"string", description:"URL du webhook Discord (https://discord.com/api/webhooks/...)" },
        email_to:        { type:"string", description:"Email destinataire des notifications" },
        email_from:      { type:"string", description:"Email expéditeur (doit être validé sur MailChannels)" },
      }}
    }
  },

  {
    type:"function", function:{
      name:"generate_systemeio_webhook",
      description:"Génère le code complet d'un Cloudflare Worker pour recevoir et traiter les webhooks Systeme.io avec vérification de signature HMAC. Inclut les instructions d'intégration.",
      parameters:{ type:"object", properties:{
        project:        { type:"string", description:"Clé du projet dans le vault" },
        project_name:   { type:"string", description:"Nom lisible du projet" },
        events:         { type:"array", items:{type:"string"}, description:"Événements à gérer (ex: order.completed, subscription.created, affiliate.commission)" },
        notify_discord: { type:"boolean", description:"Inclure les notifications Discord dans le code", default:true },
        notify_email:   { type:"boolean", description:"Inclure les notifications email", default:true },
        kv_namespace:   { type:"string", description:"Nom du binding KV pour stocker les données (ex: MY_KV)" },
      }, required:["project_name"] }
    }
  },

  {
    type:"function", function:{
      name:"generate_webhook_secret",
      description:"Génère une clé secrète cryptographiquement sûre pour sécuriser un webhook Systeme.io ou tout autre webhook.",
      parameters:{ type:"object", properties:{
        length: { type:"number", description:"Longueur en bytes (défaut: 32 = 64 chars hex)", default:32 }
      }}
    }
  },

  {
    type:"function", function:{
      name:"get_systemeio_guide",
      description:"Affiche le guide complet d'intégration Systeme.io avec l'URL du webhook et les étapes à suivre dans l'interface Systeme.io.",
      parameters:{ type:"object", properties:{
        project:    { type:"string", description:"Clé du projet" },
        worker_url: { type:"string", description:"URL du Worker déployé (ex: https://mon-worker.workers.dev)" },
        secret:     { type:"string", description:"Clé secrète du webhook" },
      }, required:["worker_url"] }
    }
  },

  // ══ PHASE 4 — AUTO-DÉPLOIEMENT ══════════════════════════

  {
    type:"function", function:{
      name:"deploy_pipeline",
      description:"Lance le pipeline complet : push GitHub + déploiement Cloudflare Worker + health check automatique + rapport. Utilise quand l'utilisateur veut déployer du code en une seule commande. Demande toujours confirmation avant de lancer sur production.",
      parameters:{ type:"object", properties:{
        project:        { type:"string", description:"Clé du projet dans le vault" },
        files:          { type:"array", description:"Fichiers à déployer", items:{ type:"object", properties:{ path:{type:"string",description:"Chemin dans le repo (ex: worker/index.js)"}, name:{type:"string",description:"Nom du module (ex: index.js)"}, content:{type:"string"} }, required:["path","content"] } },
        commit_message: { type:"string", description:"Message de commit Git" },
        worker_name:    { type:"string", description:"Override du nom du Worker Cloudflare" },
        health_check_url:{ type:"string", description:"URL à tester après déploiement (ex: https://mon-worker.workers.dev/api/status)" },
        skip_github:    { type:"boolean", description:"Passer l'étape GitHub (deploy CF direct)", default:false },
        environment:    { type:"string", enum:["staging","production"], description:"Environnement cible" },
      }, required:["project","files","commit_message"] }
    }
  },

  {
    type:"function", function:{
      name:"health_check_url",
      description:"Vérifie qu'une URL répond correctement. Utile pour tester un déploiement ou surveiller un endpoint.",
      parameters:{ type:"object", properties:{
        url:             { type:"string", description:"URL à vérifier" },
        expected_status: { type:"number", description:"Code HTTP attendu (défaut: 200)", default:200 },
        max_retries:     { type:"number", description:"Nombre de tentatives (défaut: 5)", default:5 },
      }, required:["url"] }
    }
  },

  {
    type:"function", function:{
      name:"github_push_multiple",
      description:"Pousse plusieurs fichiers en un seul commit atomique (plus propre que plusieurs push séparés).",
      parameters:{ type:"object", properties:{
        project:        { type:"string" },
        files:          { type:"array", items:{ type:"object", properties:{ path:{type:"string"}, content:{type:"string"} }, required:["path","content"] } },
        commit_message: { type:"string" },
        branch:         { type:"string" },
      }, required:["project","files","commit_message"] }
    }
  },

  {
    type:"function", function:{
      name:"get_worker_url",
      description:"Retourne l'URL publique d'un Cloudflare Worker déployé.",
      parameters:{ type:"object", properties:{
        project:     { type:"string" },
        worker_name: { type:"string" },
      }, required:["project"] }
    }
  },

  {
    type:"function", function:{
      name:"cloudflare_worker_logs",
      description:"Récupère les métadonnées récentes d'un Worker (dernière modification, taille, statut).",
      parameters:{ type:"object", properties:{
        project:     { type:"string" },
        worker_name: { type:"string" },
      }, required:["project"] }
    }
  },
];

// ─── Exécution (reçoit kv + secret du Worker) ─────────────

export async function executeTool(name, args, kv, secret) {
  try {
    switch (name) {

      case "register_account": {
        const acc = await setAccount(kv, secret, args.alias, args);
        return { success:true, message:`Compte "${args.alias}" enregistré et chiffré dans le vault persistant`, github: acc.github ? `✓ (${acc.github.owner})` : "—", cloudflare: acc.cloudflare ? "✓" : "—" };
      }

      case "register_project": {
        const p = await setProject(kv, secret, args.key, args);
        return { success:true, message:`Projet "${p.label}" enregistré (compte:${p.accountAlias}, repo:${p.github.owner}/${p.github.repo})` };
      }

      case "list_vault":
        return { success:true, accounts: listAccounts(), projects: listProjects() };

      case "github_list_files": {
        const { github: gh } = creds(args.project);
        const res = await ghFetch(gh.token, gh.owner, gh.repo, `/contents/${args.path || ""}${args.branch ? `?ref=${args.branch}` : `?ref=${gh.branch}`}`);
        const data = await res.json();
        const files = Array.isArray(data) ? data.map(f => ({ name:f.name, type:f.type, path:f.path, size:f.size })) : [{ name:data.name, type:data.type, path:data.path }];
        return { success:true, repo:`${gh.owner}/${gh.repo}`, files };
      }

      case "github_read_file": {
        const { github: gh } = creds(args.project);
        const res  = await ghFetch(gh.token, gh.owner, gh.repo, `/contents/${args.path}?ref=${args.branch || gh.branch}`);
        const data = await res.json();
        return { success:true, path:args.path, size:data.size, sha:data.sha, content: atob(data.content.replace(/\n/g,"")) };
      }

      case "github_list_branches": {
        const { github: gh } = creds(args.project);
        const res  = await ghFetch(gh.token, gh.owner, gh.repo, "/branches");
        const data = await res.json();
        return { success:true, branches: data.map(b => ({ name:b.name, sha:b.commit.sha.slice(0,8) })) };
      }

      case "github_push_file": {
        const { github: gh } = creds(args.project);
        const branch  = args.branch || gh.branch;
        const content = btoa(unescape(encodeURIComponent(args.content)));
        let sha;
        try {
          const ex   = await ghFetch(gh.token, gh.owner, gh.repo, `/contents/${args.path}?ref=${branch}`);
          const exData = await ex.json();
          sha = exData.sha;
        } catch (_) {}
        await ghFetch(gh.token, gh.owner, gh.repo, `/contents/${args.path}`, {
          method:"PUT", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ message:args.message, content, sha, branch }),
        });
        return { success:true, message:`${args.path} ${sha?"mis à jour":"créé"} sur ${gh.owner}/${gh.repo}@${branch}`, url:`https://github.com/${gh.owner}/${gh.repo}/blob/${branch}/${args.path}` };
      }

      case "github_create_branch": {
        const { github: gh } = creds(args.project);
        const refRes  = await ghFetch(gh.token, gh.owner, gh.repo, `/git/ref/heads/${args.from_branch||"main"}`);
        const refData = await refRes.json();
        await ghFetch(gh.token, gh.owner, gh.repo, "/git/refs", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ ref:`refs/heads/${args.branch_name}`, sha:refData.object.sha }),
        });
        return { success:true, message:`Branche "${args.branch_name}" créée dans ${gh.owner}/${gh.repo}` };
      }

      case "generate_code":
        return { success:true, filename:args.filename, language:args.language, description:args.description, code:args.code, lines:args.code.split("\n").length };

      case "cloudflare_list_workers": {
        const { cloudflare: cf } = creds(args.project);
        const res = await cfApiFetch(cf.token, cf.accountId, "/workers/scripts");
        const j   = await res.json();
        return j.success ? { success:true, workers: j.result.map(w => ({ id:w.id, modified:w.modified_on })) } : { success:false, error: JSON.stringify(j.errors) };
      }

      case "cloudflare_deploy_worker": {
        const { cloudflare: cf } = creds(args.project);
        const wName = args.worker_name || cf.worker;
        if (!wName) return { success:false, error:"Nom du Worker requis" };
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/workers/scripts/${wName}`, {
          method:"PUT", headers:{ "Authorization":`Bearer ${cf.token}`, "Content-Type":"application/javascript" }, body:args.script,
        });
        const j = await res.json();
        return j.success ? { success:true, message:`Worker "${wName}" déployé en ${args.environment}` } : { success:false, error: JSON.stringify(j.errors) };
      }

      case "cloudflare_pages_list": {
        const { cloudflare: cf } = creds(args.project);
        const res = await cfApiFetch(cf.token, cf.accountId, "/pages/projects");
        const j   = await res.json();
        return j.success ? { success:true, projects: j.result.map(p => ({ name:p.name, subdomain:p.subdomain, latest:p.latest_deployment?.created_on||"—" })) } : { success:false, error: JSON.stringify(j.errors) };
      }

      case "cloudflare_pages_deployments": {
        const { cloudflare: cf } = creds(args.project);
        const name = args.pages_project || cf.pages_project;
        if (!name) return { success:false, error:"Nom du projet Pages requis" };
        const res = await cfApiFetch(cf.token, cf.accountId, `/pages/projects/${name}/deployments`);
        const j   = await res.json();
        return j.success ? { success:true, deployments: j.result.slice(0,5).map(d => ({ id:d.id.slice(0,8), status:d.latest_stage?.status, created:d.created_on, url:d.url })) } : { success:false, error: JSON.stringify(j.errors) };
      }

      case "cloudflare_kv_list_namespaces": {
        const { cloudflare: cf } = creds(args.project);
        const res = await cfApiFetch(cf.token, cf.accountId, "/storage/kv/namespaces");
        const j   = await res.json();
        return j.success ? { success:true, namespaces: j.result.map(n => ({ id:n.id, title:n.title })) } : { success:false, error: JSON.stringify(j.errors) };
      }

      case "cloudflare_kv_get": {
        const { cloudflare: cf } = creds(args.project);
        const nsId = args.namespace_id || cf.kv_namespace;
        if (!nsId) return { success:false, error:"namespace_id requis" };
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(args.key)}`, { headers:{ "Authorization":`Bearer ${cf.token}` } });
        return res.status===404 ? { success:false, error:`Clé "${args.key}" introuvable` } : { success:true, key:args.key, value: await res.text() };
      }

      case "cloudflare_kv_set": {
        const { cloudflare: cf } = creds(args.project);
        const nsId = args.namespace_id || cf.kv_namespace;
        if (!nsId) return { success:false, error:"namespace_id requis" };
        const url = `https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(args.key)}${args.ttl?`?expiration_ttl=${args.ttl}`:""}`;
        const res = await fetch(url, { method:"PUT", headers:{ "Authorization":`Bearer ${cf.token}`, "Content-Type":"text/plain" }, body:args.value });
        const j   = await res.json();
        return j.success ? { success:true, message:`Clé "${args.key}" enregistrée` } : { success:false, error: JSON.stringify(j.errors) };
      }

      case "cloudflare_kv_list_keys": {
        const { cloudflare: cf } = creds(args.project);
        const nsId = args.namespace_id || cf.kv_namespace;
        if (!nsId) return { success:false, error:"namespace_id requis" };
        const params = new URLSearchParams({ limit: String(args.limit||50) });
        if (args.prefix) params.set("prefix", args.prefix);
        const res = await cfApiFetch(cf.token, cf.accountId, `/storage/kv/namespaces/${nsId}/keys?${params}`);
        const j   = await res.json();
        return j.success ? { success:true, keys: j.result.map(k=>k.name), total:j.result.length } : { success:false, error: JSON.stringify(j.errors) };
      }

      // ── Phase 10 : Auto-amélioration ─────────────────────

      case "detect_improvements": {
        const groqKey = process.env?.GROQ_API_KEY || "";
        if (!groqKey) return { success:false, error:"GROQ_API_KEY requise" };

        const result = await detectImprovements(groqKey, {
          recentErrors:    args.recent_errors    || [],
          performanceData: args.performance_data || {},
          userFeedback:    args.user_feedback    || [],
          currentFiles:    [
            "worker/index.js","worker/tools.js","worker/agents.js",
            "worker/site-generator.js","worker/sandbox.js","worker/plans.js",
          ],
        });

        return {
          success:      true,
          summary:      result.summary,
          count:        result.improvements?.length || 0,
          improvements: result.improvements?.map(imp => ({
            ...imp,
            protected: isProtectedFile(imp.file || ""),
            warning:   isProtectedFile(imp.file || "") ? "🔒 Fichier protégé — double confirmation requise" : null,
          })),
          protected_files: PROTECTED_FILES,
          message: `${result.improvements?.length || 0} amélioration(s) identifiée(s)`,
        };
      }

      case "generate_improvement_patch": {
        const groqKey = process.env?.GROQ_API_KEY || "";
        if (!groqKey) return { success:false, error:"GROQ_API_KEY requise" };

        if (isProtectedFile(args.filepath)) {
          return {
            success:   false,
            blocked:   true,
            protected: true,
            message:   `🔒 Fichier protégé : ${args.filepath} — double confirmation explicite requise`,
            files_protected: PROTECTED_FILES,
          };
        }

        const improvement = {
          title:   args.improvement_title,
          problem: args.improvement_desc,
          solution:args.improvement_desc,
          type:    args.type || "feature",
        };

        const patch = await generatePatch(groqKey, {
          improvement,
          currentCode: args.current_code || "",
          filepath:    args.filepath,
        });

        const diff = args.current_code
          ? generateDiff(args.current_code, patch.new_code)
          : null;

        return {
          success:      true,
          patch_type:   patch.patch_type,
          new_code:     patch.new_code,
          diff_summary: patch.diff_summary,
          lines_changed:patch.lines_changed,
          diff:         diff?.formatted,
          diff_stats:   diff?.stats,
          message:      `Patch généré pour ${args.filepath} — ${patch.lines_changed} lignes modifiées`,
          next_step:    "Dis 'oui j'approuve' pour appliquer avec apply_improvement",
        };
      }

      case "apply_improvement": {
        if (!args.user_confirmed) {
          return {
            success:  false,
            blocked:  true,
            message:  "🔒 BLOQUÉ — NyXia ne peut pas s'auto-modifier sans confirmation explicite.",
            required: "Dis explicitement 'oui j'approuve cette modification' pour continuer.",
          };
        }

        const report = await runSelfImprovementPipeline({
          improvementId:   args.improvement_id || `imp_${Date.now()}`,
          improvement: {
            title:   args.improvement_title,
            problem: args.improvement_desc,
            solution:args.improvement_desc,
            type:    args.type || "feature",
          },
          currentCode:   args.current_code || "",
          filepath:      args.filepath,
          newCode:       args.new_code,
          approvedByUser:args.user_confirmed === true,
        }, {
          GROQ_API_KEY:  process.env?.GROQ_API_KEY || "",
          CF_API_TOKEN:  process.env?.CF_API_TOKEN  || "",
          CF_ACCOUNT_ID: process.env?.CF_ACCOUNT_ID || "",
          NYXIA_VAULT:   kv,
          WORKER_URL:    "https://nyxia-agent.workers.dev",
        });

        return {
          success:      report.success,
          blocked:      report.blocked,
          rollback_done:report.rollbackDone,
          report:       formatImprovementReport(report),
          steps:        report.steps,
          new_code:     report.success ? report.newCode?.slice(0, 200) + "..." : null,
          backup_branch:report.backupBranch,
          message:      report.success
            ? `✅ Amélioration appliquée : ${args.improvement_title}`
            : report.blocked
            ? `🔒 Bloqué : ${report.steps.find(s=>s.status==="blocked")?.message}`
            : `❌ Échec : ${report.error}`,
        };
      }

      case "get_improvement_history": {
        const history = await getImprovementHistory(kv, args.limit || 20);
        return {
          ...history,
          message: history.success
            ? `${history.count} amélioration(s) dans le journal`
            : history.error,
        };
      }

      // ── Phase 9 : Agents spécialisés ─────────────────────

      case "agent_call": {
        const groqKey = process.env?.GROQ_API_KEY || "";
        if (!groqKey) return { success:false, error:"GROQ_API_KEY requise" };

        // Agents complets pour les types préconfigurés
        if (args.agent_type) {
          const ctx = args.context || {};
          let result;
          if (args.agent_type.startsWith("copywriter_")) {
            result = await agentCopywriter(groqKey, {
              type:     args.agent_type.replace("copywriter_",""),
              product:  ctx.product  || "",
              audience: ctx.audience || "",
              tone:     ctx.tone     || "professionnel",
              language: ctx.language || "fr",
              context:  args.task,
            });
          } else if (args.agent_type === "community_30days") {
            result = await agentCommunity(groqKey, {
              activity: ctx.activity || args.task,
              audience: ctx.audience || "",
              tone:     ctx.tone     || "inspirant",
              days:     ctx.days     || 30,
              language: ctx.language || "fr",
            });
          } else if (args.agent_type === "analyst_report") {
            result = await agentAnalyst(groqKey, {
              data:     ctx.data || {},
              question: args.task,
              period:   ctx.period || "30 jours",
            });
          } else if (args.agent_type === "support_ticket") {
            result = await agentSupport(groqKey, {
              ticket:        args.task,
              clientPlan:    ctx.client_plan    || "gratuit",
              clientHistory: ctx.client_history || [],
            });
          }
          if (result) return { success:true, agent:args.agent, type:args.agent_type, result:result.result, tokens:result.tokens };
        }

        // Agent léger générique
        const result = await callAgent(groqKey, args.agent, args.task, args.context || {});
        return {
          success: true,
          agent:   args.agent,
          task:    args.task,
          result:  result.result,
          tokens:  result.tokens,
          message: `Agent ${args.agent} → tâche accomplie (${result.tokens} tokens)`,
        };
      }

      case "orchestrate": {
        const groqKey = process.env?.GROQ_API_KEY || "";
        if (!groqKey) return { success:false, error:"GROQ_API_KEY requise" };

        const report = await orchestrate(groqKey, args.task, args.context || {});
        return {
          success:     report.success,
          agents_used: report.agentsUsed,
          tasks_count: report.tasksCount,
          final_answer:report.finalAnswer,
          details:     report.results.map(r => ({
            agent:  r.agent,
            type:   r.type,
            tokens: r.tokens,
            preview:r.result?.slice(0, 200) + (r.result?.length > 200 ? "..." : ""),
          })),
          errors:  report.errors,
          message: `Orchestration : ${report.agentsUsed.join("+")} → ${report.tasksCount} tâche(s)`,
        };
      }

      case "classify_request": {
        const agents = classifyRequest(args.text);
        return {
          success: true,
          agents,
          primary: agents[0],
          message: `Agents recommandés : ${agents.join(", ")}`,
          prompts: agents.reduce((acc, a) => {
            acc[a] = AGENT_PROMPTS[a]?.slice(0, 100) + "...";
            return acc;
          }, {}),
        };
      }

      // ── Images ───────────────────────────────────────────

      case "generate_image": {
        const imageType = args.image_type || classifyImageRequest(args.description);
        const useCF     = shouldUseCfAI(imageType) && !args.return_prompt_only;

        const result = await processImageRequest(
          useCF ? { AI: null } : {}, // En production Workers : env.AI
          {
            description:     args.description,
            imageType,
            palette:         args.palette      || "violet",
            platform:        args.platform     || "midjourney",
            style:           args.style,
            gender:          args.gender       || "woman",
            role:            args.role         || "",
            returnPromptOnly:args.return_prompt_only || !useCF,
          }
        );

        if (result.method === "cloudflare_ai" && result.success) {
          return {
            success:    true,
            method:     "cloudflare_ai",
            message:    `Image générée via Cloudflare AI (gratuit) — type: ${imageType}`,
            dataUrl:    result.dataUrl,
            prompt:     result.prompt,
            dimensions: result.dimensions,
            tip:        "Intègre cette image directement dans le HTML du site avec <img src='data:image/png;base64,...'>",
          };
        }

        // Résultat prompt
        return {
          success:      true,
          method:       "prompt",
          imageType,
          platform:     result.platform,
          style:        result.style,
          prompt:       result.prompt,
          instructions: result.instructions,
          cost:         result.estimatedCost,
          alternatives: result.alternatives,
          placeholder:  result.placeholder,
          message:      `Prompt ${result.platform} généré pour "${args.description.slice(0,40)}..."`,
          action_needed:`À faire : ${result.instructions?.[0] || "Utilise ce prompt sur " + result.platform}`,
        };
      }

      case "generate_image_batch": {
        const siteImageNeeds = {
          landing:  ["banner","person","background"],
          minisite: ["banner","product","background","illustration"],
          coach:    ["person","banner","background"],
          ecommerce:["product","banner","background"],
          systemeio:["banner","background"],
        };

        const needs    = siteImageNeeds[args.site_type] || ["banner","background"];
        const results  = [];
        const prompts  = [];

        for (const imgType of needs) {
          const desc = buildContextualDescription(imgType, args.context, args.role, args.gender);
          const res  = generateMidjourneyPrompt({
            description: desc,
            imageType:   imgType,
            palette:     args.palette,
            platform:    args.platform || "midjourney",
            gender:      args.gender   || "woman",
            role:        args.role     || "",
          });
          results.push({ type:imgType, ...res });
          prompts.push({ type:imgType, prompt:res.mainPrompt, params:res.parameters });
        }

        return {
          success:       true,
          site_type:     args.site_type,
          images_needed: needs.length,
          prompts,
          details:       results.map(r => ({
            type:         r.type,
            prompt:       r.prompt,
            instructions: r.instructions?.[0],
            cost:         r.estimatedCost,
          })),
          message: `${needs.length} prompts générés pour site ${args.site_type} — plateforme: ${args.platform||"midjourney"}`,
          total_cost: `~${(needs.length * 0.02).toFixed(2)}$ sur Midjourney (ou gratuit avec CF AI pour les ${results.filter(r=>shouldUseCfAI(r.type)).length} images basiques)`,
        };
      }

      case "generate_placeholder": {
        const svg = generatePlaceholder({
          type:   args.type,
          palette:args.palette || "violet",
          label:  args.label   || "",
          width:  args.width   || 1200,
          height: args.height  || 600,
        });
        return {
          success:  true,
          svg,
          dataUrl:  `data:image/svg+xml;base64,${btoa(svg)}`,
          htmlTag:  `<img src="data:image/svg+xml;base64,${btoa(svg)}" alt="${args.label||"Image"}" width="${args.width||1200}" height="${args.height||600}">`,
          message:  `Placeholder SVG ${args.type} généré (${args.width||1200}×${args.height||600}px)`,
        };
      }

      // ── Générateur de sites ───────────────────────────────

      case "generate_site_full": {
        if (!process.env?.GROQ_API_KEY && !kv) return { success:false, error:"GROQ_API_KEY requise" };

        const report = await runSiteGenerationPipeline({
          type:         args.type,
          prompt:       args.prompt,
          language:     args.language     || "fr",
          palette:      args.palette      || "violet",
          ownerName:    args.owner_name,
          productName:  args.product_name,
          price:        args.price,
          affiliateUrl: args.affiliate_url || "",
          clientEmail:  args.client_email,
          clientName:   args.client_name,
          clientDomain: args.client_domain,
          clientSlug:   args.client_slug,
          referrerId:   args.referrer_id,
        }, {
          GROQ_API_KEY: process.env?.GROQ_API_KEY || "",
          CF_API_TOKEN: process.env?.CF_API_TOKEN  || "",
          CF_ACCOUNT_ID:process.env?.CF_ACCOUNT_ID || "",
          DB: null, // env.DB en production Workers
        });

        const stepsOk = report.steps.filter(s => s.status === "success").length;
        return {
          success:      report.success,
          site_url:     report.siteUrl,
          affiliate_link: report.affiliateLink,
          dashboard:    report.affiliateDashboard,
          subdomain:    report.subdomain,
          html_preview: report.html?.slice(0, 500) + "...",
          html_length:  report.html?.length,
          steps:        report.steps.map(s => `${s.status === "success" ? "✓" : s.status === "warning" ? "⚠" : "✗"} ${s.step}${s.url ? " → " + s.url : s.error ? " : " + s.error : ""}`),
          message: report.success
            ? `✅ Site "${args.product_name || args.type}" généré et déployé${report.siteUrl ? " → " + report.siteUrl : ""}`
            : `⚠ Pipeline partiel (${stepsOk}/${report.steps.length} étapes) : ${report.error || "voir steps"}`,
        };
      }

      case "generate_site_preview": {
        const { html, type, palette } = await generateSite(
          process.env?.GROQ_API_KEY || "",
          {
            type:         args.type,
            prompt:       args.prompt,
            language:     args.language     || "fr",
            palette:      args.palette      || "violet",
            ownerName:    args.owner_name   || "",
            productName:  args.product_name || "",
            price:        args.price        || "",
            affiliateUrl: args.affiliate_url || "",
          }
        );
        return {
          success:     true,
          html,
          type,
          palette,
          lines:       html.split("\n").length,
          chars:       html.length,
          message:     `Site ${type} généré (${html.split("\n").length} lignes) — prêt à déployer ou copier`,
        };
      }

      case "resolve_subdomain": {
        const info = resolveSubdomain({ clientDomain:args.client_domain, clientSlug:args.client_slug });
        return { success:true, ...info };
      }

      case "list_palettes":
        return { success:true, palettes: Object.entries(PALETTES).map(([k,v]) => ({ key:k, primary:v.primary, font:v.font, bg:v.bg })) };

      // ── Sandbox ───────────────────────────────────────────

      case "sandbox_test": {
        const proj = args.project ? resolveCredentials(args.project) : null;
        const cfCreds = proj ? {
          token:      proj.cloudflare.token,
          accountId:  proj.cloudflare.accountId,
          workerName: args.worker_name || proj.cloudflare.worker,
        } : {};

        const result = await runSandboxMultiple(args.files, args.skip_dry_run ? {} : cfCreds);

        // Rapport formaté pour chaque fichier
        const reports = result.files.map(r => formatSandboxReport(r));

        return {
          success:    result.canDeploy,
          can_deploy: result.canDeploy,
          avg_score:  result.avgScore,
          summary:    result.summary,
          criticals:  result.criticals,
          reports,
          files:      result.files.map(r => ({
            filename:   r.filename,
            score:      r.score,
            passed:     r.passed,
            can_deploy: r.canDeploy,
            issues:     r.issues.filter(i => i.severity !== "info").length,
          })),
          message: result.canDeploy
            ? `✅ ${args.files.length} fichier(s) validés — score ${result.avgScore}/100. Tu peux déployer.`
            : `🚫 Déploiement bloqué — ${result.criticals} problème(s) critique(s). Corrige d'abord.`,
        };
      }

      case "sandbox_test_single": {
        const report = await runSandbox({
          code:     args.code,
          filename: args.filename || "code.js",
          fileType: args.file_type || "javascript",
        });
        return {
          success:    report.passed,
          can_deploy: report.canDeploy,
          score:      report.score,
          score_label:report.scoreLabel,
          report:     formatSandboxReport(report),
          issues:     report.issues,
          metrics:    report.metrics,
          message:    report.summary,
        };
      }

      // ── Phase 7 : D1 & Designer ──────────────────────────

      case "d1_query":
        return { success:true, sql:args.sql, params:args.params||[], message:`Requête prête pour binding "${args.db_binding||"DB"}"`, note:"Exécutée via env.DB dans ton Worker" };

      case "d1_list_tables":
        return { success:true, command:`npx wrangler d1 execute ${args.db_binding||"DB"} --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"` };

      case "d1_describe_table":
        return { success:true, sql:`PRAGMA table_info(${args.table});`, command:`npx wrangler d1 execute ${args.db_binding||"DB"} --command "PRAGMA table_info(${args.table})"` };

      case "d1_apply_schema": {
        const schema = SCHEMAS[args.schema_key];
        if (!schema) return { success:false, error:`Schéma inconnu : ${args.schema_key}` };
        return {
          success: true, schema:args.schema_key, description:schema.description,
          migrations: schema.migrations.map(m=>({version:m.version, name:m.name})),
          sql_ready:  schema.migrations.map(m=>m.sql).join("\n\n"),
          message:    `Schéma "${args.schema_key}" — ${schema.migrations.length} migration(s) prêtes`,
          steps: ["1. npx wrangler d1 create nom-de-ta-base", "2. Colle l'ID dans wrangler.toml", "3. Exécute le sql_ready via wrangler d1 execute", "4. npx wrangler deploy"],
        };
      }

      case "d1_generate_config":
        return { success:true, wrangler_config:generateWranglerD1Config(args.db_name,args.db_id), worker_code:args.with_code!==false?generateD1WorkerCode({dbBinding:"DB",projectName:args.db_name}):null, create_command:`npx wrangler d1 create ${args.db_name}`, message:`Config D1 générée pour "${args.db_name}"` };

      case "generate_systemeio_css": {
        let css, name;
        if (args.preset && CSS_PRESETS[args.preset]) { css=CSS_PRESETS[args.preset].css; name=CSS_PRESETS[args.preset].name; }
        else { css=generateProjectCSS({primaryColor:args.primary_color||"#7c3aed",secondaryColor:args.secondary_color||"#4f46e5",accentColor:args.accent_color||"#f59e0b",fontHeading:args.font_heading||"Syne",fontBody:args.font_body||"Inter",style:args.style||"premium"}); name="CSS sur mesure"; }
        return { success:true, name, css, howto:"Systeme.io → Paramètres de la page → CSS personnalisé", message:`CSS généré : "${name}"` };
      }

      case "generate_systemeio_html": {
        const block = HTML_BLOCKS[args.block_type];
        if (!block && args.block_type !== "custom") return { success:false, error:`Bloc inconnu : ${args.block_type}` };
        const html = block ? block.html.replace("2025-12-31T23:59:59", args.target_date||"2025-12-31T23:59:59") : `<div style="padding:24px;text-align:center">${args.custom_text||args.description||"Contenu"}</div>`;
        return { success:true, name:block?.name||"Bloc personnalisé", html, howto:"Systeme.io → Éditeur → Bloc HTML", message:`Bloc HTML généré` };
      }

      case "generate_systemeio_email": {
        const tpl = EMAIL_TEMPLATES[args.template];
        if (!tpl && args.template!=="custom") return { success:false, error:`Template inconnu : ${args.template}` };
        const vars = { name:"{{contact.first_name}}", affiliateLink:args.affiliate_link||"{{affiliate_link}}", dashboardUrl:args.dashboard_url||"#", companyName:args.company_name||"Publication-Web", date:new Date().toLocaleDateString("fr-CA"), ...(args.custom_vars||{}) };
        return { success:true, name:tpl?.name||"Email personnalisé", subject:tpl?.subject||args.description, html:tpl?tpl.html(vars):`<!-- ${args.description} -->`, howto:"Systeme.io → Emails → Nouveau email → Mode HTML", message:`Email généré : "${tpl?.name||args.description}"` };
      }

      case "list_systemeio_assets":
        return { success:true, css_presets:Object.entries(CSS_PRESETS).map(([k,v])=>({key:k,name:v.name,description:v.description})), html_blocks:Object.entries(HTML_BLOCKS).map(([k,v])=>({key:k,name:v.name,description:v.description})), email_templates:Object.entries(EMAIL_TEMPLATES).map(([k,v])=>({key:k,name:v.name,subject:v.subject})) };

      // ── Phase 6 : Notifications & Systeme.io ─────────────

      case "send_notification": {
        // Récupère la config notifs depuis le vault
        const notifConfig = {
          discordWebhook: kv ? await kv.get("nyxia:notify:discord").catch(()=>null) : null,
          emailTo:        kv ? await kv.get("nyxia:notify:email_to").catch(()=>null) : null,
          emailFrom:      kv ? await kv.get("nyxia:notify:email_from").catch(()=>null) : null,
        };

        if (!notifConfig.discordWebhook && !notifConfig.emailTo) {
          return { success:false, error:"Aucune destination configurée. Utilise configure_notifications d'abord." };
        }

        const result = await notify(notifConfig, args);
        return result;
      }

      case "configure_notifications": {
        if (!kv) return { success:false, error:"KV non disponible" };
        const saved = [];
        if (args.discord_webhook) { await kv.put("nyxia:notify:discord",    args.discord_webhook); saved.push("Discord"); }
        if (args.email_to)        { await kv.put("nyxia:notify:email_to",   args.email_to);        saved.push(`Email → ${args.email_to}`); }
        if (args.email_from)      { await kv.put("nyxia:notify:email_from", args.email_from);      saved.push(`Expéditeur: ${args.email_from}`); }
        return { success:true, message:`Notifications configurées : ${saved.join(", ")}` };
      }

      case "generate_systemeio_webhook": {
        const proj = args.project ? resolveCredentials(args.project) : null;
        const code = generateWebhookHandler({
          projectName:   args.project_name,
          webhookSecret: "REMPLACE_PAR_TON_SECRET",
          kvNamespace:   args.kv_namespace || "MY_KV",
          notifyDiscord: args.notify_discord !== false,
          notifyEmail:   args.notify_email !== false,
          events:        args.events || ["order.completed","subscription.created","affiliate.commission"],
        });
        return {
          success:  true,
          filename: `webhook-systemeio-${args.project_name.toLowerCase().replace(/\s+/g,"-")}.js`,
          code,
          message:  `Worker webhook Systeme.io généré pour "${args.project_name}"`,
          nextStep: "Utilise deploy_pipeline ou github_push_file pour le déployer, puis get_systemeio_guide pour l'intégration.",
        };
      }

      case "generate_webhook_secret": {
        const secret = generateWebhookSecret(args.length || 32);
        return {
          success: true,
          secret,
          message: `Clé secrète générée (${secret.length} chars). Configure-la avec : npx wrangler secret put SYSTEMEIO_SECRET`,
          warning: "Sauvegarde cette clé — elle ne sera plus affichée.",
        };
      }

      case "get_systemeio_guide": {
        const proj   = args.project ? resolveCredentials(args.project) : null;
        const secret = args.secret || "(génère une clé avec generate_webhook_secret)";
        const guide  = getIntegrationGuide(args.worker_url, secret);
        return { success:true, ...guide };
      }

      // ── Phase 5 : Mémoire ─────────────────────────────────

      case "update_profile": {
        const profile = await updateProfile(kv, secret, {
          name:        args.name,
          notes:       args.notes,
          preferences: args.preferences,
          style:       args.style,
        });
        return { success:true, message:`Profil mis à jour${args.name ? ` — Bonjour ${args.name} !` : ""}`, profile };
      }

      case "log_project_event": {
        const event = await logProjectEvent(kv, secret, args.project, {
          type:    args.type,
          summary: args.summary,
          details: args.details,
          file:    args.file,
          url:     args.url,
        });
        return { success:true, message:`Événement "${args.type}" enregistré pour ${args.project}`, event };
      }

      case "get_project_history": {
        const history = getProjectHistory(args.project, args.limit || 10);
        return { success:true, project:args.project, events:history, total:history.length };
      }

      case "get_memory_summary": {
        return { success:true, memory: buildMemoryContext() };
      }

      // ── Phase 4 : Auto-déploiement ────────────────────────

      case "deploy_pipeline": {
        const { github: gh, cloudflare: cf } = creds(args.project);
        if (!gh.token && !args.skip_github) return { success:false, error:"Token GitHub manquant" };
        if (!cf.token) return { success:false, error:"Token Cloudflare manquant" };

        const workerName = args.worker_name || cf.worker;
        if (!workerName) return { success:false, error:"Nom du Worker requis" };

        // ── SANDBOX OBLIGATOIRE avant tout déploiement ────
        const sandboxResult = await runSandboxMultiple(args.files, {
          token:      cf.token,
          accountId:  cf.accountId,
          workerName,
        });

        if (!sandboxResult.canDeploy) {
          return {
            success:    false,
            blocked:    true,
            reason:     "sandbox",
            sandbox:    sandboxResult.summary,
            criticals:  sandboxResult.criticals,
            reports:    sandboxResult.files.map(r => formatSandboxReport(r)),
            message:    `🚫 Déploiement annulé — le sandbox a détecté ${sandboxResult.criticals} problème(s) critique(s). Corrige le code et réessaie.`,
          };
        }

        // ── Sandbox OK → on déploie ───────────────────────
        const workerUrl = `https://${workerName}.${cf.accountId}.workers.dev`;

        const pipelineReport = await runDeployPipeline({
          github: args.skip_github ? null : { token:gh.token, owner:gh.owner, repo:gh.repo, branch: args.branch || gh.branch },
          cloudflare: { token:cf.token, accountId:cf.accountId, workerName },
          files: args.files,
          commitMessage: args.commit_message,
          healthCheckUrl: args.health_check_url || `${workerUrl}/api/status`,
          skipGithub: args.skip_github || false,
        });

        return {
          success:        pipelineReport.success,
          sandbox_score:  sandboxResult.avgScore,
          sandbox_passed: true,
          report:         formatReport(pipelineReport),
          steps:          pipelineReport.steps,
          error:          pipelineReport.error,
          message:        pipelineReport.success
            ? `✅ Sandbox ✓ (${sandboxResult.avgScore}/100) → Déploiement réussi`
            : `✗ Sandbox ✓ mais déploiement échoué : ${pipelineReport.error}`,
        };
      }

      case "health_check_url": {
        const result = await healthCheck(args.url, {
          maxRetries:     args.max_retries    || 5,
          expectedStatus: args.expected_status || 200,
        });
        return {
          success:  result.success,
          url:      args.url,
          latency:  result.latency ? `${result.latency}ms` : null,
          attempts: result.attempts,
          message:  result.success ? `✓ ${args.url} répond en ${result.latency}ms` : `✗ ${result.error}`,
        };
      }

      case "github_push_multiple": {
        const { github: gh } = creds(args.project);
        const branch = args.branch || gh.branch;
        const result = await githubPushMultipleFiles(gh.token, gh.owner, gh.repo, branch, args.files, args.commit_message);
        return {
          success: true,
          message: `${args.files.length} fichier(s) commités sur ${gh.owner}/${gh.repo}@${branch}`,
          commit: result.sha, url: result.url, files: result.files,
        };
      }

      case "get_worker_url": {
        const { cloudflare: cf } = creds(args.project);
        const wName = args.worker_name || cf.worker;
        if (!wName) return { success:false, error:"Nom du Worker requis" };
        // Format standard Cloudflare Workers
        const url = `https://${wName}.${cf.accountId}.workers.dev`;
        return { success:true, worker: wName, url, status_url: `${url}/api/status` };
      }

      case "cloudflare_worker_logs": {
        const { cloudflare: cf } = creds(args.project);
        const wName = args.worker_name || cf.worker;
        if (!wName) return { success:false, error:"Nom du Worker requis" };
        const res = await cfApiFetch(cf.token, cf.accountId, `/workers/scripts/${wName}`);
        if (!res.ok) return { success:false, error:`Worker "${wName}" introuvable (HTTP ${res.status})` };
        // L'API retourne le script — on lit juste les headers de métadonnées
        const modified = res.headers.get("last-modified") || "—";
        const size     = res.headers.get("content-length") || "—";
        return { success:true, worker:wName, last_modified:modified, size_bytes:size };
      }

      default:
        return { success:false, error:`Tool inconnu : ${name}` };
    }
  } catch(err) {
    return { success:false, error: err.message };
  }
}

// ── Helper : description contextuelle pour les images ──────
function buildContextualDescription(imageType, context, role, gender) {
  const g = gender === "man" ? "man" : "woman";
  const r = role || "entrepreneur";
  switch(imageType) {
    case "person":       return `${g} ${r}, ${context}, professional`;
    case "product":      return `digital product mockup for ${context}`;
    case "background":   return `abstract professional background for ${context} website`;
    case "banner":       return `wide hero banner for ${context}, professional, inspiring`;
    case "illustration": return `icon illustration for ${context}, flat design`;
    default:             return `professional image for ${context}`;
  }
}
