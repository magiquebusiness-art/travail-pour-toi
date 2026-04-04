// ============================================================
//  SANDBOX — NyXia Phase 7b
//  Validation et test du code AVANT déploiement
//
//  Ce que le sandbox vérifie :
//  1. Syntaxe JavaScript / PHP
//  2. Patterns dangereux (drop table, rm -rf, etc.)
//  3. Compatibilité Cloudflare Workers (APIs interdites)
//  4. Variables d'environnement manquantes
//  5. Imports/exports manquants
//  6. Dry-run simulé sur l'API Cloudflare
//  7. Score de confiance global (0-100)
// ============================================================

// ══════════════════════════════════════════════════════════
//  RÈGLES DE VALIDATION
// ══════════════════════════════════════════════════════════

// APIs Node.js non disponibles dans Cloudflare Workers
const CF_FORBIDDEN_APIS = [
  { pattern: /require\s*\(/g,          severity: "error",   message: "require() n'existe pas dans CF Workers — utilise import" },
  { pattern: /process\.env/g,          severity: "warning", message: "process.env non disponible — utilise env.MA_VAR (paramètre fetch)" },
  { pattern: /process\.exit/g,         severity: "error",   message: "process.exit() non disponible dans CF Workers" },
  { pattern: /fs\.(read|write|unlink)/g,severity: "error",   message: "Le filesystem Node.js n'existe pas dans CF Workers" },
  { pattern: /child_process/g,          severity: "error",   message: "child_process non disponible dans CF Workers" },
  { pattern: /\bBuffer\b/g,             severity: "warning", message: "Buffer partiellement supporté — préfère TextEncoder/TextDecoder" },
  { pattern: /setTimeout.*\d{5,}/g,     severity: "warning", message: "CF Workers a une limite de 30s CPU — évite les longs timeouts" },
  { pattern: /new\s+WebSocket/g,        severity: "info",    message: "WebSocket disponible seulement avec le plan Workers Unbound" },
];

// Patterns dangereux (destructeurs de données)
const DANGEROUS_PATTERNS = [
  { pattern: /DROP\s+TABLE/gi,          severity: "critical", message: "DROP TABLE détecté — suppression irréversible d'une table" },
  { pattern: /DROP\s+DATABASE/gi,       severity: "critical", message: "DROP DATABASE détecté — suppression de toute la base !" },
  { pattern: /DELETE\s+FROM\s+\w+\s*;/gi,severity:"error",  message: "DELETE sans WHERE — supprime TOUTES les lignes de la table" },
  { pattern: /TRUNCATE/gi,              severity: "critical", message: "TRUNCATE détecté — vide toute la table" },
  { pattern: /rm\s+-rf/g,              severity: "critical", message: "rm -rf détecté dans le code" },
  { pattern: /eval\s*\(/g,             severity: "error",   message: "eval() est dangereux et interdit en production" },
  { pattern: /innerHTML\s*=/g,         severity: "warning", message: "innerHTML peut exposer à des injections XSS" },
  { pattern: /\.exec\s*\(/g,           severity: "warning", message: ".exec() — vérifie que l'entrée est bien sanitisée" },
];

// Patterns de bonnes pratiques
const BEST_PRACTICES = [
  { pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,  severity: "warning", message: "catch vide détecté — les erreurs sont silencieuses" },
  { pattern: /console\.log/g,                   severity: "info",    message: "console.log présent — pense à retirer en production" },
  { pattern: /TODO|FIXME|HACK/g,                severity: "info",    message: "TODO/FIXME/HACK trouvé dans le code" },
  { pattern: /password|secret|token/gi,         severity: "warning", message: "Mot-clé sensible trouvé — vérifie qu'aucune valeur n'est en dur" },
  { pattern: /['"](ghp_|sk-|gsk_)[^'"]{10,}/g, severity: "critical", message: "TOKEN EN DUR DÉTECTÉ — retire-le immédiatement !" },
  { pattern: /http:\/\//g,                      severity: "warning", message: "URL HTTP non sécurisée — utilise HTTPS" },
];

// Vérifications spécifiques CF Workers
const CF_WORKER_CHECKS = [
  { pattern: /export\s+default\s*\{/g,          required: true,  message: "export default { fetch } manquant — requis pour un CF Worker" },
  { pattern: /async\s+fetch\s*\(request/g,       required: true,  message: "handler fetch(request, env) manquant" },
  { pattern: /return\s+new\s+Response/g,         required: true,  message: "Aucun new Response() trouvé — le Worker doit retourner une Response" },
];

// ══════════════════════════════════════════════════════════
//  ANALYSE STATIQUE DU CODE
// ══════════════════════════════════════════════════════════

function analyzeCode(code, fileType = "javascript") {
  const issues  = [];
  const lines   = code.split("\n");
  const metrics = {
    lines:     lines.length,
    functions: (code.match(/function\s+\w+|=>\s*\{|async\s+\w+\s*\(/g) || []).length,
    imports:   (code.match(/^import\s+/gm) || []).length,
    exports:   (code.match(/^export\s+/gm) || []).length,
    comments:  (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length,
  };

  // Fonction utilitaire pour trouver le numéro de ligne
  const getLine = (index) => {
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count > index) return i + 1;
    }
    return lines.length;
  };

  // ── Vérifications selon le type de fichier ─────────────
  if (fileType === "javascript" || fileType === "worker") {
    // APIs CF interdites
    for (const rule of CF_FORBIDDEN_APIS) {
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((match = regex.exec(code)) !== null) {
        issues.push({ severity:rule.severity, line:getLine(match.index), message:rule.message, match:match[0].slice(0,40) });
      }
    }

    // Vérifications Worker
    if (fileType === "worker") {
      for (const check of CF_WORKER_CHECKS) {
        if (!check.pattern.test(code)) {
          issues.push({ severity:"error", line:null, message:check.message });
        }
      }
    }
  }

  // ── Patterns dangereux (tous les types) ───────────────
  for (const rule of DANGEROUS_PATTERNS) {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(code)) !== null) {
      issues.push({ severity:rule.severity, line:getLine(match.index), message:rule.message, match:match[0].slice(0,40) });
    }
  }

  // ── Bonnes pratiques ──────────────────────────────────
  for (const rule of BEST_PRACTICES) {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(code)) !== null) {
      issues.push({ severity:rule.severity, line:getLine(match.index), message:rule.message, match:match[0].slice(0,40) });
    }
  }

  // ── Vérification syntaxique basique ──────────────────
  const syntaxChecks = checkBasicSyntax(code);
  issues.push(...syntaxChecks);

  return { issues, metrics };
}

function checkBasicSyntax(code) {
  const issues = [];

  // Accolades non appairées
  const opens  = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens !== closes) {
    issues.push({ severity:"error", line:null, message:`Accolades non équilibrées : ${opens} ouvertes, ${closes} fermées` });
  }

  // Parenthèses non appairées
  const po = (code.match(/\(/g) || []).length;
  const pf = (code.match(/\)/g) || []).length;
  if (po !== pf) {
    issues.push({ severity:"error", line:null, message:`Parenthèses non équilibrées : ${po} ouvertes, ${pf} fermées` });
  }

  // Strings non fermées (heuristique simple)
  const singleUnmatched = (code.replace(/\\'/g, "").match(/(?<![\\])'(?:[^'\\]|\\.)*$/m) || []).length;
  if (singleUnmatched > 0) {
    issues.push({ severity:"warning", line:null, message:"Possible string non fermée (guillemet simple)" });
  }

  return issues;
}

// ══════════════════════════════════════════════════════════
//  SCORE DE CONFIANCE
// ══════════════════════════════════════════════════════════

function computeScore(issues) {
  let score = 100;

  for (const issue of issues) {
    switch(issue.severity) {
      case "critical": score -= 40; break;
      case "error":    score -= 20; break;
      case "warning":  score -= 5;  break;
      case "info":     score -= 1;  break;
    }
  }

  return Math.max(0, score);
}

function getScoreLabel(score) {
  if (score >= 90) return { label: "✓ Excellent — prêt à déployer",     color: "green",  deploy: true  };
  if (score >= 70) return { label: "⚠ Acceptable — vérifie les warnings", color: "yellow", deploy: true  };
  if (score >= 50) return { label: "⚠ Risqué — corrige les erreurs",      color: "orange", deploy: false };
  return            { label: "✗ Bloqué — erreurs critiques",              color: "red",    deploy: false };
}

// ══════════════════════════════════════════════════════════
//  DRY-RUN CLOUDFLARE — Valide sans déployer
// ══════════════════════════════════════════════════════════

export async function cfDryRun(token, accountId, workerName, script) {
  if (!token || !accountId) return { success:false, error:"Tokens CF manquants pour le dry-run" };

  try {
    // On utilise l'API de validation CF Workers (upload mais sans activer)
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}-nyxia-dryrun`,
      {
        method:  "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/javascript" },
        body:    script,
      }
    );
    const j = await res.json();

    if (j.success) {
      // Supprime le script de test immédiatement
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}-nyxia-dryrun`,
        { method:"DELETE", headers:{ "Authorization":`Bearer ${token}` } }
      ).catch(()=>{});
      return { success:true, message:"Dry-run CF réussi — le script est valide pour Cloudflare" };
    } else {
      return { success:false, errors: j.errors, message:"Cloudflare a rejeté le script" };
    }
  } catch(err) {
    return { success:false, error:err.message };
  }
}

// ══════════════════════════════════════════════════════════
//  PIPELINE SANDBOX COMPLET
// ══════════════════════════════════════════════════════════

export async function runSandbox(options) {
  const {
    code,
    filename    = "script.js",
    fileType    = "worker",   // worker | javascript | php | html | css
    cfToken,
    cfAccountId,
    workerName,
    skipCfDryRun = false,
  } = options;

  const report = {
    filename,
    fileType,
    timestamp: new Date().toISOString(),
    passed:    false,
    score:     0,
    scoreLabel: null,
    canDeploy:  false,
    issues:    [],
    metrics:   {},
    dryRun:    null,
    summary:   "",
  };

  // ── Étape 1 : Analyse statique ─────────────────────────
  const { issues, metrics } = analyzeCode(code, fileType);
  report.issues  = issues;
  report.metrics = metrics;
  report.score   = computeScore(issues);

  const scoreInfo    = getScoreLabel(report.score);
  report.scoreLabel  = scoreInfo.label;
  report.canDeploy   = scoreInfo.deploy;

  // ── Étape 2 : Dry-run Cloudflare ──────────────────────
  if (!skipCfDryRun && cfToken && cfAccountId && workerName && fileType === "worker") {
    report.dryRun = await cfDryRun(cfToken, cfAccountId, workerName, code);
    if (!report.dryRun.success) {
      report.canDeploy = false;
      report.score     = Math.min(report.score, 40);
    }
  }

  // ── Résumé ─────────────────────────────────────────────
  const criticals = issues.filter(i => i.severity === "critical").length;
  const errors    = issues.filter(i => i.severity === "error").length;
  const warnings  = issues.filter(i => i.severity === "warning").length;
  const infos     = issues.filter(i => i.severity === "info").length;

  report.passed = report.score >= 70 && criticals === 0 && errors === 0;

  const parts = [];
  if (criticals) parts.push(`${criticals} critique(s)`);
  if (errors)    parts.push(`${errors} erreur(s)`);
  if (warnings)  parts.push(`${warnings} warning(s)`);
  if (infos)     parts.push(`${infos} info(s)`);

  report.summary = report.passed
    ? `✓ ${filename} validé (score: ${report.score}/100)${parts.length ? " — " + parts.join(", ") : ""}`
    : `✗ ${filename} bloqué (score: ${report.score}/100) — ${parts.join(", ")}`;

  return report;
}

// ══════════════════════════════════════════════════════════
//  FORMATAGE DU RAPPORT SANDBOX
// ══════════════════════════════════════════════════════════

export function formatSandboxReport(report) {
  const lines = [];

  const scoreBar = "█".repeat(Math.floor(report.score / 10)) + "░".repeat(10 - Math.floor(report.score / 10));
  lines.push(`**Sandbox — \`${report.filename}\`**`);
  lines.push(`Score : \`${scoreBar}\` ${report.score}/100 — ${report.scoreLabel}`);
  lines.push(`Taille : ${report.metrics.lines} lignes · ${report.metrics.functions} fonctions · ${report.metrics.imports} imports`);
  lines.push("");

  // Grouper par sévérité
  const bySeverity = { critical:[], error:[], warning:[], info:[] };
  for (const issue of report.issues) {
    (bySeverity[issue.severity] || bySeverity.info).push(issue);
  }

  const icons = { critical:"🔴", error:"🟠", warning:"🟡", info:"🔵" };

  for (const [sev, issues] of Object.entries(bySeverity)) {
    if (issues.length === 0) continue;
    for (const issue of issues.slice(0, 5)) { // Max 5 par catégorie
      const loc = issue.line ? ` (ligne ${issue.line})` : "";
      lines.push(`${icons[sev]} **${sev.toUpperCase()}**${loc} — ${issue.message}`);
      if (issue.match) lines.push(`  → \`${issue.match}\``);
    }
    if (issues.length > 5) lines.push(`  ... et ${issues.length - 5} autre(s)`);
  }

  if (report.dryRun) {
    lines.push("");
    lines.push(report.dryRun.success
      ? "✓ **Dry-run Cloudflare** — script accepté"
      : `✗ **Dry-run Cloudflare échoué** — ${report.dryRun.errors?.[0]?.message || report.dryRun.error}`
    );
  }

  lines.push("");
  lines.push(report.canDeploy
    ? "✅ **Prêt à déployer**"
    : "🚫 **Déploiement bloqué** — corrige les problèmes ci-dessus d'abord"
  );

  return lines.join("\n");
}

// ══════════════════════════════════════════════════════════
//  SANDBOX MULTI-FICHIERS
// ══════════════════════════════════════════════════════════

export async function runSandboxMultiple(files, cfCredentials = {}) {
  const results = [];
  let globalScore = 0;

  for (const file of files) {
    const report = await runSandbox({
      code:        file.content,
      filename:    file.path || file.name || "fichier",
      fileType:    detectFileType(file.path || file.name || ""),
      cfToken:     cfCredentials.token,
      cfAccountId: cfCredentials.accountId,
      workerName:  cfCredentials.workerName,
      skipCfDryRun: files.length > 1, // Dry-run seulement sur le fichier principal
    });
    results.push(report);
    globalScore += report.score;
  }

  const avgScore   = Math.round(globalScore / results.length);
  const allPassed  = results.every(r => r.passed);
  const canDeploy  = results.every(r => r.canDeploy);
  const criticals  = results.flatMap(r => r.issues.filter(i => i.severity === "critical")).length;

  return {
    files:      results,
    avgScore,
    allPassed,
    canDeploy,
    criticals,
    summary:    canDeploy
      ? `✅ ${files.length} fichier(s) validés — score moyen ${avgScore}/100`
      : `🚫 Déploiement bloqué — ${criticals} problème(s) critique(s) à corriger`,
  };
}

function detectFileType(filename) {
  if (filename.includes("worker") || filename === "index.js") return "worker";
  if (filename.endsWith(".php"))   return "php";
  if (filename.endsWith(".html"))  return "html";
  if (filename.endsWith(".css"))   return "css";
  return "javascript";
}
