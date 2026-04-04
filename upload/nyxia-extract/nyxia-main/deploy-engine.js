// ============================================================
//  DEPLOY ENGINE — NyXia Phase 4
//  NyXia peut se déployer elle-même et vérifier son état
//
//  Flux complet en une commande :
//  1. Push du code sur GitHub (branche feature ou main)
//  2. Déclenchement du déploiement Cloudflare
//  3. Health check automatique après déploiement
//  4. Rapport de statut complet à l'utilisateur
// ============================================================

// ── Délai utilitaire ───────────────────────────────────────
const wait = ms => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════
//  GITHUB — Push d'un lot de fichiers en un seul commit
// ══════════════════════════════════════════════════════════

/**
 * Push plusieurs fichiers en un seul commit (Git Tree API)
 * Beaucoup plus propre que N commits séparés
 */
export async function githubPushMultipleFiles(token, owner, repo, branch, files, commitMessage) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept":        "application/vnd.github+json",
    "Content-Type":  "application/json",
    "User-Agent":    "NyXia-Agent",
  };

  // 1. SHA de la branche actuelle
  const refRes  = await fetch(`${base}/git/ref/heads/${branch}`, { headers });
  if (!refRes.ok) throw new Error(`Branche "${branch}" introuvable : ${await refRes.text()}`);
  const refData = await refRes.json();
  const baseSha = refData.object.sha;

  // 2. Tree actuel
  const treeRes  = await fetch(`${base}/git/commits/${baseSha}`, { headers });
  const treeData = await treeRes.json();
  const baseTree = treeData.tree.sha;

  // 3. Créer les blobs pour chaque fichier
  const treeItems = [];
  for (const file of files) {
    const blobRes = await fetch(`${base}/git/blobs`, {
      method: "POST", headers,
      body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
    });
    const blob = await blobRes.json();
    treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  // 4. Créer le nouveau tree
  const newTreeRes  = await fetch(`${base}/git/trees`, {
    method: "POST", headers,
    body: JSON.stringify({ base_tree: baseTree, tree: treeItems }),
  });
  const newTree = await newTreeRes.json();

  // 5. Créer le commit
  const commitRes  = await fetch(`${base}/git/commits`, {
    method: "POST", headers,
    body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [baseSha] }),
  });
  const commit = await commitRes.json();

  // 6. Mettre à jour la référence de branche
  await fetch(`${base}/git/refs/heads/${branch}`, {
    method: "PATCH", headers,
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return {
    sha: commit.sha.slice(0, 8),
    url: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    files: files.map(f => f.path),
  };
}

// ══════════════════════════════════════════════════════════
//  CLOUDFLARE — Déploiement multi-format
// ══════════════════════════════════════════════════════════

/**
 * Déploie un Worker Cloudflare avec support multipart
 * (nécessaire pour les Workers avec plusieurs modules)
 */
export async function deployWorkerMultipart(token, accountId, workerName, files) {
  const formData = new FormData();

  // Metadata
  formData.append("metadata", JSON.stringify({
    main_module: files[0].name,
    bindings: [],
    compatibility_date: new Date().toISOString().split("T")[0],
  }), { type: "application/json" });

  // Fichiers du Worker
  for (const file of files) {
    formData.append(file.name, new Blob([file.content], { type: "application/javascript+module" }), file.name);
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
    { method: "PUT", headers: { "Authorization": `Bearer ${token}` }, body: formData }
  );
  const j = await res.json();
  return j.success
    ? { success: true, message: `Worker "${workerName}" déployé`, id: j.result?.id }
    : { success: false, error: JSON.stringify(j.errors) };
}

// ══════════════════════════════════════════════════════════
//  HEALTH CHECK — Vérification post-déploiement
// ══════════════════════════════════════════════════════════

/**
 * Vérifie qu'un endpoint répond correctement après déploiement
 * Réessaie jusqu'à maxRetries fois (le déploiement prend ~10-30s)
 */
export async function healthCheck(url, options = {}) {
  const {
    maxRetries    = 8,
    retryDelay    = 5000,   // 5s entre chaque essai
    expectedStatus = 200,
    timeout       = 10000,
  } = options;

  const results = [];

  for (let i = 1; i <= maxRetries; i++) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer      = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      const latency = Date.now() - start;
      const ok = res.status === expectedStatus;

      results.push({ attempt: i, status: res.status, latency, ok });

      if (ok) {
        return { success: true, url, attempts: i, latency, results };
      }
    } catch (err) {
      results.push({ attempt: i, error: err.message, ok: false });
    }

    if (i < maxRetries) await wait(retryDelay);
  }

  return { success: false, url, attempts: maxRetries, results, error: "Health check échoué après tous les essais" };
}

// ══════════════════════════════════════════════════════════
//  PIPELINE COMPLET — Push → Deploy → Verify
// ══════════════════════════════════════════════════════════

/**
 * Pipeline d'auto-déploiement complet
 * Retourne un rapport détaillé étape par étape
 */
export async function runDeployPipeline(options) {
  const {
    github,       // { token, owner, repo, branch }
    cloudflare,   // { token, accountId, workerName }
    files,        // [{ path, content, name? }] fichiers à pousser
    commitMessage,
    healthCheckUrl,
    skipGithub = false,
  } = options;

  const report = {
    startedAt: new Date().toISOString(),
    steps: [],
    success: false,
  };

  const step = (name, status, data = {}) => {
    report.steps.push({ step: name, status, ...data, at: new Date().toISOString() });
  };

  try {
    // ── Étape 1 : Push GitHub ──────────────────────────────
    if (!skipGithub && github) {
      step("github_push", "running");
      try {
        const pushed = await githubPushMultipleFiles(
          github.token, github.owner, github.repo, github.branch,
          files, commitMessage
        );
        step("github_push", "success", { commit: pushed.sha, url: pushed.url, files: pushed.files });
      } catch (err) {
        step("github_push", "error", { error: err.message });
        report.error = `GitHub push échoué : ${err.message}`;
        return report;
      }
    }

    // ── Étape 2 : Déploiement Cloudflare ──────────────────
    if (cloudflare) {
      step("cloudflare_deploy", "running");
      try {
        // Simple deploy (script unique)
        const mainFile = files.find(f => f.name === "index.js") || files[0];
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflare.accountId}/workers/scripts/${cloudflare.workerName}`,
          {
            method: "PUT",
            headers: { "Authorization": `Bearer ${cloudflare.token}`, "Content-Type": "application/javascript" },
            body: mainFile.content,
          }
        );
        const j = await res.json();
        if (j.success) {
          step("cloudflare_deploy", "success", { worker: cloudflare.workerName });
        } else {
          step("cloudflare_deploy", "error", { error: JSON.stringify(j.errors) });
          report.error = `Déploiement Cloudflare échoué`;
          return report;
        }
      } catch (err) {
        step("cloudflare_deploy", "error", { error: err.message });
        report.error = err.message;
        return report;
      }
    }

    // ── Étape 3 : Health Check ─────────────────────────────
    if (healthCheckUrl) {
      step("health_check", "running", { url: healthCheckUrl });
      await wait(3000); // Laisse Cloudflare propager

      const hc = await healthCheck(healthCheckUrl);
      if (hc.success) {
        step("health_check", "success", { latency: `${hc.latency}ms`, attempts: hc.attempts });
      } else {
        step("health_check", "warning", { error: hc.error, attempts: hc.attempts });
        // On ne bloque pas — le déploiement a réussi même si le health check est lent
      }
    }

    // ── Étape 4 : Vérification du statut du Worker ─────────
    if (cloudflare) {
      step("verify_worker", "running");
      try {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflare.accountId}/workers/scripts/${cloudflare.workerName}`,
          { headers: { "Authorization": `Bearer ${cloudflare.token}` } }
        );
        step("verify_worker", res.ok ? "success" : "warning", { status: res.status });
      } catch (err) {
        step("verify_worker", "warning", { error: err.message });
      }
    }

    report.success = true;
    report.completedAt = new Date().toISOString();

  } catch (err) {
    report.error = err.message;
    step("pipeline", "error", { error: err.message });
  }

  return report;
}

// ── Formate le rapport en texte lisible ───────────────────
export function formatReport(report) {
  const icons = { success: "✓", error: "✗", warning: "⚠", running: "◌" };
  const lines = ["**Rapport de déploiement**\n"];

  for (const s of report.steps) {
    const icon  = icons[s.status] || "•";
    const extra = s.commit  ? ` → commit \`${s.commit}\`` :
                  s.latency ? ` → ${s.latency}` :
                  s.error   ? ` → ${s.error}` :
                  s.worker  ? ` → \`${s.worker}\`` : "";
    lines.push(`${icon} **${s.step}** ${extra}`);
    if (s.url) lines.push(`  └ ${s.url}`);
  }

  lines.push("");
  lines.push(report.success
    ? "✓ Pipeline terminé avec succès."
    : `✗ Pipeline interrompu : ${report.error || "erreur inconnue"}`);

  return lines.join("\n");
}
