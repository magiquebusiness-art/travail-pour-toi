// ============================================================
//  CONFIG — Projets connus de NyXia
//  Ajoute ici tes repos GitHub et ressources Cloudflare
//  NyXia peut aussi recevoir un nouveau projet en cours de chat
// ============================================================

export const PROJECTS = {

  affiliationpro: {
    label:       "AffiliationPro",
    description: "Plateforme d'affiliation multi-niveaux 3 paliers (25/10/5%), dashboard admin/affiliés, intégration Systeme.io",
    github: {
      owner:  process.env.GITHUB_OWNER || "TON_USERNAME_GITHUB",
      repo:   process.env.REPO_AFFILIATIONPRO || "affiliationpro",
      branch: "main",
    },
    cloudflare: {
      // Worker principal (API backend)
      worker:       process.env.CF_WORKER_AFFILIATIONPRO || "affiliationpro-api",
      // Pages (frontend dashboard)
      pages_project: process.env.CF_PAGES_AFFILIATIONPRO || "affiliationpro",
      // KV namespace pour les sessions/cache
      kv_namespace:  process.env.CF_KV_AFFILIATIONPRO   || "",
    },
    stack: ["Node.js", "JavaScript", "Cloudflare Workers", "Cloudflare KV"],
    status: "en_cours", // en_cours | stable | archivé
  },

  publicationcashflow: {
    label:       "PublicationCashflow",
    description: "Générateur de sites d'affiliation IA en 60 secondes, community manager 30 jours, publication Facebook automatique multi-pages",
    github: {
      owner:  process.env.GITHUB_OWNER || "TON_USERNAME_GITHUB",
      repo:   process.env.REPO_PUBLICATIONCASHFLOW || "publicationcashflow",
      branch: "main",
    },
    cloudflare: {
      worker:        process.env.CF_WORKER_CASHFLOW || "cashflow-api",
      pages_project: process.env.CF_PAGES_CASHFLOW  || "publicationcashflow",
      kv_namespace:  process.env.CF_KV_CASHFLOW     || "",
    },
    stack: ["Node.js", "PHP", "JavaScript", "Cloudflare Workers", "Cloudflare Pages", "Cloudflare KV"],
    status: "stable",
  },

};

// ── Projet temporaire (donné en cours de chat) ─────────────
// NyXia peut recevoir un nouveau projet à la volée via le tool
// "set_active_project" sans redémarrer le serveur.
let _activeProject = null;
let _customProject = null;

export function setActiveProject(key) { _activeProject = key; }
export function getActiveProject()    { return _activeProject; }

export function setCustomProject(cfg) { _customProject = cfg; _activeProject = "__custom__"; }
export function getCustomProject()    { return _customProject; }

export function resolveProject(key) {
  if (key === "__custom__") return _customProject;
  return PROJECTS[key] || null;
}

// ── Résumé pour le system prompt ──────────────────────────
export function projectsSummary() {
  const lines = Object.entries(PROJECTS).map(([k, p]) =>
    `• ${p.label} (clé: "${k}") — ${p.description} | Statut: ${p.status} | Stack: ${p.stack.join(", ")} | Repo: ${p.github.owner}/${p.github.repo}`
  );
  if (_customProject) {
    lines.push(`• [Projet custom actif] ${_customProject.label} — repo: ${_customProject.github?.owner}/${_customProject.github?.repo}`);
  }
  return lines.join("\n");
}
