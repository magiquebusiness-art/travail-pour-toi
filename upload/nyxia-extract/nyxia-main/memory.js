// ============================================================
//  MEMORY — NyXia Phase 5
//  Mémoire long terme chiffrée dans Cloudflare KV
//
//  Trois couches de mémoire :
//  1. Profil utilisateur    — préférences, style, habitudes
//  2. Journal de sessions   — résumés des conversations passées
//  3. Journal des projets   — décisions, bugs, déploiements
// ============================================================

const KEYS = {
  profile:  "nyxia:memory:profile",
  sessions: "nyxia:memory:sessions",
  projects: "nyxia:memory:projects",
};

const MAX_SESSIONS = 20;      // Nombre max de sessions gardées
const MAX_PROJECT_EVENTS = 50; // Événements max par projet

// ── Cache session courante ─────────────────────────────────
let _profile  = null;
let _sessions = null;
let _projects = null;
let _loaded   = false;

// ══════════════════════════════════════════════════════════
//  CHIFFREMENT (réutilise la même logique que vault-kv.js)
// ══════════════════════════════════════════════════════════

async function deriveKey(secret) {
  const enc    = new TextEncoder();
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt:enc.encode("nyxia-memory-v1"), iterations:100_000, hash:"SHA-256" },
    keyMat, { name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]
  );
}

async function encrypt(data, secret) {
  const key = await deriveKey(secret);
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const ct  = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(data)));
  const buf = new Uint8Array(iv.byteLength + ct.byteLength);
  buf.set(iv, 0); buf.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...buf));
}

async function decrypt(b64, secret) {
  const key = await deriveKey(secret);
  const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const dec = await crypto.subtle.decrypt({ name:"AES-GCM", iv:buf.slice(0,12) }, key, buf.slice(12));
  return JSON.parse(new TextDecoder().decode(dec));
}

async function kvRead(kv, key, secret, fallback) {
  try {
    const raw = await kv.get(key);
    if (!raw) return fallback;
    return await decrypt(raw, secret);
  } catch(_) { return fallback; }
}

async function kvWrite(kv, key, data, secret) {
  await kv.put(key, await encrypt(data, secret));
}

// ══════════════════════════════════════════════════════════
//  CHARGEMENT
// ══════════════════════════════════════════════════════════

export async function loadMemory(kv, secret) {
  if (_loaded) return;
  [_profile, _sessions, _projects] = await Promise.all([
    kvRead(kv, KEYS.profile,  secret, { name: null, preferences: {}, style: {}, createdAt: new Date().toISOString() }),
    kvRead(kv, KEYS.sessions, secret, []),
    kvRead(kv, KEYS.projects, secret, {}),
  ]);
  _loaded = true;
}

// ══════════════════════════════════════════════════════════
//  PROFIL UTILISATEUR
// ══════════════════════════════════════════════════════════

export async function updateProfile(kv, secret, updates) {
  _profile = { ..._profile, ...updates, updatedAt: new Date().toISOString() };
  await kvWrite(kv, KEYS.profile, _profile, secret);
  return _profile;
}

export function getProfile() { return _profile; }

// ══════════════════════════════════════════════════════════
//  SESSIONS
// ══════════════════════════════════════════════════════════

/**
 * Sauvegarde un résumé de la session courante
 * Appelé automatiquement à la fin de chaque conversation
 */
export async function saveSession(kv, secret, summary) {
  const session = {
    id:        crypto.randomUUID().slice(0, 8),
    at:        new Date().toISOString(),
    summary,   // Résumé généré par NyXia
    projects:  summary.projects || [],
    actions:   summary.actions  || [],
  };

  _sessions = [session, ...(_sessions || [])].slice(0, MAX_SESSIONS);
  await kvWrite(kv, KEYS.sessions, _sessions, secret);
  return session;
}

export function getRecentSessions(n = 5) {
  return (_sessions || []).slice(0, n);
}

// ══════════════════════════════════════════════════════════
//  JOURNAL DES PROJETS
// ══════════════════════════════════════════════════════════

/**
 * Ajoute un événement au journal d'un projet
 * type: "deploy" | "code" | "bug" | "decision" | "note"
 */
export async function logProjectEvent(kv, secret, projectKey, event) {
  if (!_projects[projectKey]) {
    _projects[projectKey] = { events: [], lastActivity: null };
  }

  const entry = {
    id:   crypto.randomUUID().slice(0, 8),
    at:   new Date().toISOString(),
    type: event.type || "note",
    ...event,
  };

  _projects[projectKey].events = [entry, ..._projects[projectKey].events].slice(0, MAX_PROJECT_EVENTS);
  _projects[projectKey].lastActivity = entry.at;

  await kvWrite(kv, KEYS.projects, _projects, secret);
  return entry;
}

export function getProjectHistory(projectKey, n = 10) {
  return (_projects[projectKey]?.events || []).slice(0, n);
}

export function getAllProjectsActivity() {
  return Object.entries(_projects || {}).map(([key, data]) => ({
    key,
    lastActivity: data.lastActivity,
    recentEvents: (data.events || []).slice(0, 3),
  }));
}

// ══════════════════════════════════════════════════════════
//  CONTEXTE MÉMOIRE — injecté dans le system prompt
// ══════════════════════════════════════════════════════════

export function buildMemoryContext() {
  const profile   = _profile;
  const sessions  = getRecentSessions(3);
  const activity  = getAllProjectsActivity();
  const lines     = [];

  // ── Profil ──────────────────────────────────────────────
  if (profile?.name) {
    lines.push(`UTILISATEUR : ${profile.name}`);
    if (profile.preferences?.language)  lines.push(`  Langue préférée : ${profile.preferences.language}`);
    if (profile.preferences?.codeStyle) lines.push(`  Style de code   : ${profile.preferences.codeStyle}`);
    if (profile.style?.tone)            lines.push(`  Ton souhaité    : ${profile.style.tone}`);
    if (profile.notes)                  lines.push(`  Notes           : ${profile.notes}`);
  } else {
    lines.push("UTILISATEUR : Pas encore de profil enregistré.");
  }

  // ── Sessions récentes ───────────────────────────────────
  if (sessions.length > 0) {
    lines.push("\nSESSIONS RÉCENTES :");
    for (const s of sessions) {
      const date = new Date(s.at).toLocaleDateString("fr-CA");
      lines.push(`  [${date}] ${s.summary?.headline || "Session sans titre"}`);
      if (s.summary?.done?.length > 0) {
        lines.push(`    → ${s.summary.done.slice(0, 3).join(" · ")}`);
      }
      if (s.summary?.nextSteps?.length > 0) {
        lines.push(`    ↳ À faire : ${s.summary.nextSteps[0]}`);
      }
    }
  } else {
    lines.push("\nSESSIONS RÉCENTES : Première utilisation — aucun historique.");
  }

  // ── Activité récente par projet ─────────────────────────
  const activeProjects = activity.filter(p => p.recentEvents.length > 0);
  if (activeProjects.length > 0) {
    lines.push("\nACTIVITÉ DES PROJETS :");
    for (const p of activeProjects) {
      const lastDate = p.lastActivity ? new Date(p.lastActivity).toLocaleDateString("fr-CA") : "—";
      lines.push(`  [${p.key}] Dernière activité : ${lastDate}`);
      for (const e of p.recentEvents) {
        const icon = { deploy:"🚀", code:"💻", bug:"🐛", decision:"💡", note:"📝" }[e.type] || "•";
        lines.push(`    ${icon} ${e.summary || e.type}`);
      }
    }
  }

  return lines.join("\n") || "Mémoire vide — première session.";
}

// ══════════════════════════════════════════════════════════
//  GÉNÉRATION DU RÉSUMÉ DE FIN DE SESSION (via OpenRouter)
// ══════════════════════════════════════════════════════════

/**
 * Demande à l'IA de résumer la conversation pour la mémoire
 * Appelé depuis l'endpoint /api/save-session
 */
export async function generateSessionSummary(llmKey, messages) {
  const conversation = messages
    .filter(m => m.role !== "system")
    .map(m => `${m.role === "user" ? "Utilisateur" : "NyXia"}: ${m.content?.slice(0, 300)}`)
    .join("\n");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev", "X-Title": "NyXia AI Agent" },
    body: JSON.stringify({
      model:      "meta-llama/llama-3.3-70b-instruct",
      max_tokens: 400,
      temperature: 0.1,
      messages: [{
        role: "user",
        content: `Résume cette conversation en JSON strict (sans markdown) avec ces champs :
{
  "headline": "titre court de la session (max 60 chars)",
  "done": ["action 1 accomplie", "action 2", ...],
  "decisions": ["décision technique prise", ...],
  "bugs": ["problème rencontré", ...],
  "nextSteps": ["prochaine étape suggérée", ...],
  "projects": ["clé-projet-1", "clé-projet-2"]
}

Conversation :
${conversation}`,
      }],
    }),
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch(_) {
    return { headline: "Session de travail", done: [], nextSteps: [] };
  }
}
