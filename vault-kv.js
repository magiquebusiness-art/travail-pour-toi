// ============================================================
//  VAULT KV — Stockage chiffré persistant (Cloudflare KV)
//  Phase 3 : les tokens survivent aux redémarrages
//
//  Chiffrement : AES-256-GCM via Web Crypto API
//  Clé dérivée de VAULT_SECRET (variable d'environnement)
//  Les tokens ne transitent JAMAIS en clair dans KV
// ============================================================

const ACCOUNTS_KEY = "nyxia:accounts";
const PROJECTS_KEY = "nyxia:projects";

// ── Cache mémoire pour la session courante ─────────────────
let _accounts = null;
let _projects  = null;

// ══════════════════════════════════════════════════════════
//  CHIFFREMENT AES-256-GCM (Web Crypto — natif sur Workers)
// ══════════════════════════════════════════════════════════

async function deriveKey(secret) {
  const enc     = new TextEncoder();
  const keyMat  = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("nyxia-vault-v1"), iterations: 100_000, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(data, secret) {
  const key = await deriveKey(secret);
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct  = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  // Combine iv + ciphertext en base64
  const buf = new Uint8Array(iv.byteLength + ct.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...buf));
}

async function decrypt(b64, secret) {
  const key = await deriveKey(secret);
  const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const iv  = buf.slice(0, 12);
  const ct  = buf.slice(12);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(dec));
}

// ══════════════════════════════════════════════════════════
//  LECTURE / ÉCRITURE KV
// ══════════════════════════════════════════════════════════

async function kvRead(kv, key, secret) {
  const raw = await kv.get(key);
  if (!raw) return {};
  try {
    return await decrypt(raw, secret);
  } catch (_) {
    return {}; // Données corrompues ou mauvaise clé
  }
}

async function kvWrite(kv, key, data, secret) {
  const encrypted = await encrypt(data, secret);
  await kv.put(key, encrypted);
}

// ══════════════════════════════════════════════════════════
//  API PUBLIQUE
// ══════════════════════════════════════════════════════════

// ── Charge le vault depuis KV (une fois par session) ───────
export async function loadVault(kv, secret) {
  if (_accounts && _projects) return; // déjà en cache
  _accounts = await kvRead(kv, ACCOUNTS_KEY, secret);
  _projects  = await kvRead(kv, PROJECTS_KEY, secret);
}

// ── Persiste le vault dans KV ──────────────────────────────
async function saveAccounts(kv, secret) { await kvWrite(kv, ACCOUNTS_KEY, _accounts, secret); }
async function saveProjects(kv, secret) { await kvWrite(kv, PROJECTS_KEY, _projects,  secret); }

// ── Comptes ────────────────────────────────────────────────
export async function setAccount(kv, secret, alias, cfg) {
  if (!_accounts[alias]) _accounts[alias] = {};
  if (cfg.github_token)  _accounts[alias].github    = { token: cfg.github_token,  owner: cfg.github_owner || "" };
  if (cfg.cf_token)      _accounts[alias].cloudflare = { token: cfg.cf_token, accountId: cfg.cf_account_id || "" };
  await saveAccounts(kv, secret);
  return _accounts[alias];
}

export function getAccount(alias) {
  return _accounts?.[alias] || null;
}

export function listAccounts() {
  return Object.entries(_accounts || {}).map(([alias, acc]) => ({
    alias,
    github:     acc.github     ? `✓ (${acc.github.owner || "?"})` : "—",
    cloudflare: acc.cloudflare ? `✓` : "—",
  }));
}

// ── Projets ────────────────────────────────────────────────
export async function setProject(kv, secret, key, cfg) {
  _projects[key] = {
    label:        cfg.label        || key,
    description:  cfg.description  || "",
    accountAlias: cfg.accountAlias || key,
    github: {
      owner:  cfg.github_owner  || "",
      repo:   cfg.github_repo   || "",
      branch: cfg.github_branch || "main",
    },
    cloudflare: {
      worker:        cfg.cf_worker || "",
      pages_project: cfg.cf_pages  || "",
      kv_namespace:  cfg.cf_kv     || "",
    },
    stack:  cfg.stack  || [],
    status: cfg.status || "en_cours",
  };
  await saveProjects(kv, secret);
  return _projects[key];
}

export function getProject(key) {
  return _projects?.[key] || null;
}

export function listProjects() {
  return Object.entries(_projects || {}).map(([k, p]) => ({
    key: k, label: p.label, status: p.status,
    account: p.accountAlias,
    repo: p.github.owner ? `${p.github.owner}/${p.github.repo}` : "non configuré",
    stack: p.stack,
  }));
}

// ── Résolution des credentials pour un projet ──────────────
export function resolveCredentials(projectKey) {
  const project = _projects?.[projectKey];
  if (!project) return null;
  const account = _accounts?.[project.accountAlias] || {};
  return {
    project,
    github: {
      token:  account.github?.token || "",
      owner:  project.github.owner  || account.github?.owner || "",
      repo:   project.github.repo,
      branch: project.github.branch,
    },
    cloudflare: {
      token:         account.cloudflare?.token     || "",
      accountId:     account.cloudflare?.accountId || "",
      worker:        project.cloudflare.worker,
      pages_project: project.cloudflare.pages_project,
      kv_namespace:  project.cloudflare.kv_namespace,
    },
  };
}

// ── Résumé pour le system prompt ───────────────────────────
export function stateSummary() {
  const accounts = listAccounts();
  const projects = listProjects();

  if (accounts.length === 0 && projects.length === 0) {
    return "Vault vide — aucun compte ni projet configuré. Demande à l'utilisateur ses tokens et infos de projets.";
  }

  const accLines = accounts.length > 0
    ? accounts.map(a => `  • [${a.alias}] GitHub:${a.github} | CF:${a.cloudflare}`).join("\n")
    : "  (aucun compte)";

  const projLines = projects.length > 0
    ? projects.map(p => `  • ${p.label} (clé:"${p.key}") | compte:"${p.account}" | repo:${p.repo} | statut:${p.status}`).join("\n")
    : "  (aucun projet)";

  return `COMPTES :\n${accLines}\n\nPROJETS :\n${projLines}`;
}
