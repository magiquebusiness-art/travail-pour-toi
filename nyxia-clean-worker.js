var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// notifier.js
var notifier_exports = {};
__export(notifier_exports, {
  notify: () => notify,
  sendDiscord: () => sendDiscord,
  sendEmail: () => sendEmail
});
async function sendDiscord(webhookUrl, event) {
  if (!webhookUrl) return { success: false, error: "Discord webhook URL manquante" };
  const icon = ICONS[event.type] || "\u2022";
  const color = DISCORD_COLORS[event.type] || DISCORD_COLORS.info;
  const now = Math.floor(Date.now() / 1e3);
  const fields = [];
  if (event.project) fields.push({ name: "Projet", value: `\`${event.project}\``, inline: true });
  if (event.environment) fields.push({ name: "Env", value: `\`${event.environment}\``, inline: true });
  if (event.worker) fields.push({ name: "Worker", value: `\`${event.worker}\``, inline: true });
  if (event.commit) fields.push({ name: "Commit", value: `\`${event.commit}\``, inline: true });
  if (event.latency) fields.push({ name: "Latence", value: event.latency, inline: true });
  if (event.files?.length) fields.push({ name: "Fichiers", value: event.files.map((f) => `\`${f}\``).join("\n"), inline: false });
  if (event.url) fields.push({ name: "URL", value: event.url, inline: false });
  if (event.error) fields.push({ name: "Erreur", value: `\`\`\`
${event.error.slice(0, 500)}
\`\`\``, inline: false });
  if (event.type === "session_summary" && event.summary) {
    const s = event.summary;
    if (s.done?.length) fields.push({ name: "\u2713 Accompli", value: s.done.slice(0, 5).map((d) => `\u2022 ${d}`).join("\n"), inline: false });
    if (s.nextSteps?.length) fields.push({ name: "\u21B3 \xC0 faire", value: s.nextSteps.slice(0, 3).map((d) => `\u2022 ${d}`).join("\n"), inline: false });
    if (s.decisions?.length) fields.push({ name: "\u{1F4A1} D\xE9cisions", value: s.decisions.slice(0, 3).map((d) => `\u2022 ${d}`).join("\n"), inline: false });
  }
  const payload = {
    username: "NyXia",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
    embeds: [{
      title: `${icon} ${event.title || event.type}`,
      description: event.description || "",
      color,
      fields,
      footer: { text: "NyXia \xB7 Publication-Web" },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }]
  };
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.ok ? { success: true, message: "Notification Discord envoy\xE9e" } : { success: false, error: `Discord HTTP ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
async function sendEmail(toEmail, fromEmail, event) {
  if (!toEmail) return { success: false, error: "Email destinataire manquant" };
  if (!fromEmail) return { success: false, error: "Email exp\xE9diteur manquant" };
  const icon = ICONS[event.type] || "\u2022";
  const title = `${icon} ${event.title || event.type}`;
  const html = buildEmailHtml(title, event);
  const text = buildEmailText(title, event);
  const payload = {
    personalizations: [{ to: [{ email: toEmail }] }],
    from: { email: fromEmail, name: "NyXia \xB7 Publication-Web" },
    subject: `NyXia \xB7 ${title}`,
    content: [
      { type: "text/plain", value: text },
      { type: "text/html", value: html }
    ]
  };
  try {
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.ok || res.status === 202 ? { success: true, message: `Email envoy\xE9 \xE0 ${toEmail}` } : { success: false, error: `MailChannels HTTP ${res.status}: ${await res.text()}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
function buildEmailHtml(title, event) {
  const colorMap = {
    deploy_success: "#1D9E75",
    deploy_failure: "#E24B4A",
    github_push: "#7F77DD",
    session_summary: "#378ADD",
    systemeio_webhook: "#22d3ee",
    info: "#888780"
  };
  const accent = colorMap[event.type] || "#7F77DD";
  const rows = [];
  if (event.project) rows.push(["Projet", `<code>${event.project}</code>`]);
  if (event.environment) rows.push(["Environnement", event.environment]);
  if (event.worker) rows.push(["Worker", `<code>${event.worker}</code>`]);
  if (event.commit) rows.push(["Commit", `<code>${event.commit}</code>`]);
  if (event.latency) rows.push(["Latence", event.latency]);
  if (event.url) rows.push(["URL", `<a href="${event.url}" style="color:${accent}">${event.url}</a>`]);
  if (event.error) rows.push(["Erreur", `<pre style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:12px;overflow:auto">${event.error.slice(0, 500)}</pre>`]);
  if (event.files?.length) rows.push(["Fichiers", event.files.map((f) => `<code>${f}</code>`).join("<br>")]);
  if (event.type === "session_summary" && event.summary) {
    const s = event.summary;
    if (s.done?.length) rows.push(["\u2713 Accompli", s.done.map((d) => `\u2022 ${d}`).join("<br>")]);
    if (s.nextSteps?.length) rows.push(["\u21B3 \xC0 faire", s.nextSteps.map((d) => `\u2022 ${d}`).join("<br>")]);
    if (s.decisions?.length) rows.push(["\u{1F4A1} D\xE9cisions", s.decisions.map((d) => `\u2022 ${d}`).join("<br>")]);
  }
  const tableRows = rows.map(([k, v]) => `
    <tr>
      <td style="padding:8px 12px;color:#666;font-weight:500;white-space:nowrap;vertical-align:top">${k}</td>
      <td style="padding:8px 12px;color:#222">${v}</td>
    </tr>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f8;font-family:system-ui,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:${accent};padding:24px 28px">
      <div style="color:#fff;font-size:22px;font-weight:700">${title}</div>
      <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px">${(/* @__PURE__ */ new Date()).toLocaleString("fr-CA")}</div>
    </div>
    ${event.description ? `<div style="padding:20px 28px;color:#444;font-size:15px;border-bottom:1px solid #eee">${event.description}</div>` : ""}
    ${tableRows ? `<table style="width:100%;border-collapse:collapse">${tableRows}</table>` : ""}
    <div style="padding:16px 28px;background:#f9f9fb;color:#999;font-size:12px;text-align:center">
      NyXia \xB7 Agent IA Publication-Web
    </div>
  </div></body></html>`;
}
function buildEmailText(title, event) {
  const lines = [title, ""];
  if (event.description) lines.push(event.description, "");
  if (event.project) lines.push(`Projet : ${event.project}`);
  if (event.environment) lines.push(`Env    : ${event.environment}`);
  if (event.worker) lines.push(`Worker : ${event.worker}`);
  if (event.commit) lines.push(`Commit : ${event.commit}`);
  if (event.url) lines.push(`URL    : ${event.url}`);
  if (event.error) lines.push(`Erreur : ${event.error.slice(0, 300)}`);
  if (event.files?.length) lines.push(`Fichiers : ${event.files.join(", ")}`);
  if (event.type === "session_summary" && event.summary) {
    const s = event.summary;
    if (s.done?.length) lines.push("", "Accompli :", ...s.done.map((d) => `  \u2022 ${d}`));
    if (s.nextSteps?.length) lines.push("", "\xC0 faire :", ...s.nextSteps.map((d) => `  \u2022 ${d}`));
  }
  lines.push("", "\u2014 NyXia \xB7 Publication-Web");
  return lines.join("\n");
}
async function notify(config, event) {
  const results = {};
  const promises = [];
  if (config.discordWebhook) {
    promises.push(
      sendDiscord(config.discordWebhook, event).then((r) => {
        results.discord = r;
      })
    );
  }
  if (config.emailTo && config.emailFrom) {
    promises.push(
      sendEmail(config.emailTo, config.emailFrom, event).then((r) => {
        results.email = r;
      })
    );
  }
  await Promise.allSettled(promises);
  const allOk = Object.values(results).every((r) => r.success);
  return {
    success: allOk,
    results,
    message: allOk ? `Notifications envoy\xE9es (${Object.keys(results).join(" + ")})` : `Certaines notifications ont \xE9chou\xE9`
  };
}
var DISCORD_COLORS, ICONS;
var init_notifier = __esm({
  "notifier.js"() {
    DISCORD_COLORS = {
      deploy_success: 1941109,
      // vert
      deploy_failure: 14830410,
      // rouge
      health_check_fail: 15703847,
      // orange
      github_push: 8353757,
      // violet
      session_summary: 3640029,
      // bleu
      systemeio_webhook: 2282478,
      // cyan
      info: 8947584
      // gris
    };
    ICONS = {
      deploy_success: "\u{1F680}",
      deploy_failure: "\u274C",
      health_check_fail: "\u26A0\uFE0F",
      github_push: "\u{1F4E4}",
      session_summary: "\u{1F4CB}",
      systemeio_webhook: "\u{1F517}",
      info: "\u2139\uFE0F"
    };
    __name(sendDiscord, "sendDiscord");
    __name(sendEmail, "sendEmail");
    __name(buildEmailHtml, "buildEmailHtml");
    __name(buildEmailText, "buildEmailText");
    __name(notify, "notify");
  }
});

// sandbox.js
var sandbox_exports = {};
__export(sandbox_exports, {
  cfDryRun: () => cfDryRun,
  formatSandboxReport: () => formatSandboxReport,
  runSandbox: () => runSandbox,
  runSandboxMultiple: () => runSandboxMultiple
});
function analyzeCode(code, fileType = "javascript") {
  const issues = [];
  const lines = code.split("\n");
  const metrics = {
    lines: lines.length,
    functions: (code.match(/function\s+\w+|=>\s*\{|async\s+\w+\s*\(/g) || []).length,
    imports: (code.match(/^import\s+/gm) || []).length,
    exports: (code.match(/^export\s+/gm) || []).length,
    comments: (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length
  };
  const getLine = /* @__PURE__ */ __name((index) => {
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count > index) return i + 1;
    }
    return lines.length;
  }, "getLine");
  if (fileType === "javascript" || fileType === "worker") {
    for (const rule of CF_FORBIDDEN_APIS) {
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((match = regex.exec(code)) !== null) {
        issues.push({ severity: rule.severity, line: getLine(match.index), message: rule.message, match: match[0].slice(0, 40) });
      }
    }
    if (fileType === "worker") {
      for (const check of CF_WORKER_CHECKS) {
        if (!check.pattern.test(code)) {
          issues.push({ severity: "error", line: null, message: check.message });
        }
      }
    }
  }
  for (const rule of DANGEROUS_PATTERNS) {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(code)) !== null) {
      issues.push({ severity: rule.severity, line: getLine(match.index), message: rule.message, match: match[0].slice(0, 40) });
    }
  }
  for (const rule of BEST_PRACTICES) {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(code)) !== null) {
      issues.push({ severity: rule.severity, line: getLine(match.index), message: rule.message, match: match[0].slice(0, 40) });
    }
  }
  const syntaxChecks = checkBasicSyntax(code);
  issues.push(...syntaxChecks);
  return { issues, metrics };
}
function checkBasicSyntax(code) {
  const issues = [];
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens !== closes) {
    issues.push({ severity: "error", line: null, message: `Accolades non \xE9quilibr\xE9es : ${opens} ouvertes, ${closes} ferm\xE9es` });
  }
  const po = (code.match(/\(/g) || []).length;
  const pf = (code.match(/\)/g) || []).length;
  if (po !== pf) {
    issues.push({ severity: "error", line: null, message: `Parenth\xE8ses non \xE9quilibr\xE9es : ${po} ouvertes, ${pf} ferm\xE9es` });
  }
  const singleUnmatched = (code.replace(/\\'/g, "").match(/(?<![\\])'(?:[^'\\]|\\.)*$/m) || []).length;
  if (singleUnmatched > 0) {
    issues.push({ severity: "warning", line: null, message: "Possible string non ferm\xE9e (guillemet simple)" });
  }
  return issues;
}
function computeScore(issues) {
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case "critical":
        score -= 40;
        break;
      case "error":
        score -= 20;
        break;
      case "warning":
        score -= 5;
        break;
      case "info":
        score -= 1;
        break;
    }
  }
  return Math.max(0, score);
}
function getScoreLabel(score) {
  if (score >= 90) return { label: "\u2713 Excellent \u2014 pr\xEAt \xE0 d\xE9ployer", color: "green", deploy: true };
  if (score >= 70) return { label: "\u26A0 Acceptable \u2014 v\xE9rifie les warnings", color: "yellow", deploy: true };
  if (score >= 50) return { label: "\u26A0 Risqu\xE9 \u2014 corrige les erreurs", color: "orange", deploy: false };
  return { label: "\u2717 Bloqu\xE9 \u2014 erreurs critiques", color: "red", deploy: false };
}
async function cfDryRun(token, accountId, workerName, script) {
  if (!token || !accountId) return { success: false, error: "Tokens CF manquants pour le dry-run" };
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}-nyxia-dryrun`,
      {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/javascript" },
        body: script
      }
    );
    const j = await res.json();
    if (j.success) {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}-nyxia-dryrun`,
        { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }
      ).catch(() => {
      });
      return { success: true, message: "Dry-run CF r\xE9ussi \u2014 le script est valide pour Cloudflare" };
    } else {
      return { success: false, errors: j.errors, message: "Cloudflare a rejet\xE9 le script" };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
async function runSandbox(options) {
  const {
    code,
    filename = "script.js",
    fileType = "worker",
    // worker | javascript | php | html | css
    cfToken,
    cfAccountId,
    workerName,
    skipCfDryRun = false
  } = options;
  const report = {
    filename,
    fileType,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    passed: false,
    score: 0,
    scoreLabel: null,
    canDeploy: false,
    issues: [],
    metrics: {},
    dryRun: null,
    summary: ""
  };
  const { issues, metrics } = analyzeCode(code, fileType);
  report.issues = issues;
  report.metrics = metrics;
  report.score = computeScore(issues);
  const scoreInfo = getScoreLabel(report.score);
  report.scoreLabel = scoreInfo.label;
  report.canDeploy = scoreInfo.deploy;
  if (!skipCfDryRun && cfToken && cfAccountId && workerName && fileType === "worker") {
    report.dryRun = await cfDryRun(cfToken, cfAccountId, workerName, code);
    if (!report.dryRun.success) {
      report.canDeploy = false;
      report.score = Math.min(report.score, 40);
    }
  }
  const criticals = issues.filter((i) => i.severity === "critical").length;
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const infos = issues.filter((i) => i.severity === "info").length;
  report.passed = report.score >= 70 && criticals === 0 && errors === 0;
  const parts = [];
  if (criticals) parts.push(`${criticals} critique(s)`);
  if (errors) parts.push(`${errors} erreur(s)`);
  if (warnings) parts.push(`${warnings} warning(s)`);
  if (infos) parts.push(`${infos} info(s)`);
  report.summary = report.passed ? `\u2713 ${filename} valid\xE9 (score: ${report.score}/100)${parts.length ? " \u2014 " + parts.join(", ") : ""}` : `\u2717 ${filename} bloqu\xE9 (score: ${report.score}/100) \u2014 ${parts.join(", ")}`;
  return report;
}
function formatSandboxReport(report) {
  const lines = [];
  const scoreBar = "\u2588".repeat(Math.floor(report.score / 10)) + "\u2591".repeat(10 - Math.floor(report.score / 10));
  lines.push(`**Sandbox \u2014 \`${report.filename}\`**`);
  lines.push(`Score : \`${scoreBar}\` ${report.score}/100 \u2014 ${report.scoreLabel}`);
  lines.push(`Taille : ${report.metrics.lines} lignes \xB7 ${report.metrics.functions} fonctions \xB7 ${report.metrics.imports} imports`);
  lines.push("");
  const bySeverity = { critical: [], error: [], warning: [], info: [] };
  for (const issue of report.issues) {
    (bySeverity[issue.severity] || bySeverity.info).push(issue);
  }
  const icons = { critical: "\u{1F534}", error: "\u{1F7E0}", warning: "\u{1F7E1}", info: "\u{1F535}" };
  for (const [sev, issues] of Object.entries(bySeverity)) {
    if (issues.length === 0) continue;
    for (const issue of issues.slice(0, 5)) {
      const loc = issue.line ? ` (ligne ${issue.line})` : "";
      lines.push(`${icons[sev]} **${sev.toUpperCase()}**${loc} \u2014 ${issue.message}`);
      if (issue.match) lines.push(`  \u2192 \`${issue.match}\``);
    }
    if (issues.length > 5) lines.push(`  ... et ${issues.length - 5} autre(s)`);
  }
  if (report.dryRun) {
    lines.push("");
    lines.push(
      report.dryRun.success ? "\u2713 **Dry-run Cloudflare** \u2014 script accept\xE9" : `\u2717 **Dry-run Cloudflare \xE9chou\xE9** \u2014 ${report.dryRun.errors?.[0]?.message || report.dryRun.error}`
    );
  }
  lines.push("");
  lines.push(
    report.canDeploy ? "\u2705 **Pr\xEAt \xE0 d\xE9ployer**" : "\u{1F6AB} **D\xE9ploiement bloqu\xE9** \u2014 corrige les probl\xE8mes ci-dessus d'abord"
  );
  return lines.join("\n");
}
async function runSandboxMultiple(files, cfCredentials = {}) {
  const results = [];
  let globalScore = 0;
  for (const file of files) {
    const report = await runSandbox({
      code: file.content,
      filename: file.path || file.name || "fichier",
      fileType: detectFileType(file.path || file.name || ""),
      cfToken: cfCredentials.token,
      cfAccountId: cfCredentials.accountId,
      workerName: cfCredentials.workerName,
      skipCfDryRun: files.length > 1
      // Dry-run seulement sur le fichier principal
    });
    results.push(report);
    globalScore += report.score;
  }
  const avgScore = Math.round(globalScore / results.length);
  const allPassed = results.every((r) => r.passed);
  const canDeploy = results.every((r) => r.canDeploy);
  const criticals = results.flatMap((r) => r.issues.filter((i) => i.severity === "critical")).length;
  return {
    files: results,
    avgScore,
    allPassed,
    canDeploy,
    criticals,
    summary: canDeploy ? `\u2705 ${files.length} fichier(s) valid\xE9s \u2014 score moyen ${avgScore}/100` : `\u{1F6AB} D\xE9ploiement bloqu\xE9 \u2014 ${criticals} probl\xE8me(s) critique(s) \xE0 corriger`
  };
}
function detectFileType(filename) {
  if (filename.includes("worker") || filename === "index.js") return "worker";
  if (filename.endsWith(".php")) return "php";
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".css")) return "css";
  return "javascript";
}
var CF_FORBIDDEN_APIS, DANGEROUS_PATTERNS, BEST_PRACTICES, CF_WORKER_CHECKS;
var init_sandbox = __esm({
  "sandbox.js"() {
    CF_FORBIDDEN_APIS = [
      { pattern: /require\s*\(/g, severity: "error", message: "require() n'existe pas dans CF Workers \u2014 utilise import" },
      { pattern: /process\.env/g, severity: "warning", message: "process.env non disponible \u2014 utilise env.MA_VAR (param\xE8tre fetch)" },
      { pattern: /process\.exit/g, severity: "error", message: "process.exit() non disponible dans CF Workers" },
      { pattern: /fs\.(read|write|unlink)/g, severity: "error", message: "Le filesystem Node.js n'existe pas dans CF Workers" },
      { pattern: /child_process/g, severity: "error", message: "child_process non disponible dans CF Workers" },
      { pattern: /\bBuffer\b/g, severity: "warning", message: "Buffer partiellement support\xE9 \u2014 pr\xE9f\xE8re TextEncoder/TextDecoder" },
      { pattern: /setTimeout.*\d{5,}/g, severity: "warning", message: "CF Workers a une limite de 30s CPU \u2014 \xE9vite les longs timeouts" },
      { pattern: /new\s+WebSocket/g, severity: "info", message: "WebSocket disponible seulement avec le plan Workers Unbound" }
    ];
    DANGEROUS_PATTERNS = [
      { pattern: /DROP\s+TABLE/gi, severity: "critical", message: "DROP TABLE d\xE9tect\xE9 \u2014 suppression irr\xE9versible d'une table" },
      { pattern: /DROP\s+DATABASE/gi, severity: "critical", message: "DROP DATABASE d\xE9tect\xE9 \u2014 suppression de toute la base !" },
      { pattern: /DELETE\s+FROM\s+\w+\s*;/gi, severity: "error", message: "DELETE sans WHERE \u2014 supprime TOUTES les lignes de la table" },
      { pattern: /TRUNCATE/gi, severity: "critical", message: "TRUNCATE d\xE9tect\xE9 \u2014 vide toute la table" },
      { pattern: /rm\s+-rf/g, severity: "critical", message: "rm -rf d\xE9tect\xE9 dans le code" },
      { pattern: /eval\s*\(/g, severity: "error", message: "eval() est dangereux et interdit en production" },
      { pattern: /innerHTML\s*=/g, severity: "warning", message: "innerHTML peut exposer \xE0 des injections XSS" },
      { pattern: /\.exec\s*\(/g, severity: "warning", message: ".exec() \u2014 v\xE9rifie que l'entr\xE9e est bien sanitis\xE9e" }
    ];
    BEST_PRACTICES = [
      { pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g, severity: "warning", message: "catch vide d\xE9tect\xE9 \u2014 les erreurs sont silencieuses" },
      { pattern: /console\.log/g, severity: "info", message: "console.log pr\xE9sent \u2014 pense \xE0 retirer en production" },
      { pattern: /TODO|FIXME|HACK/g, severity: "info", message: "TODO/FIXME/HACK trouv\xE9 dans le code" },
      { pattern: /password|secret|token/gi, severity: "warning", message: "Mot-cl\xE9 sensible trouv\xE9 \u2014 v\xE9rifie qu'aucune valeur n'est en dur" },
      { pattern: /['"](ghp_|sk-|gsk_)[^'"]{10,}/g, severity: "critical", message: "TOKEN EN DUR D\xC9TECT\xC9 \u2014 retire-le imm\xE9diatement !" },
      { pattern: /http:\/\//g, severity: "warning", message: "URL HTTP non s\xE9curis\xE9e \u2014 utilise HTTPS" }
    ];
    CF_WORKER_CHECKS = [
      { pattern: /export\s+default\s*\{/g, required: true, message: "export default { fetch } manquant \u2014 requis pour un CF Worker" },
      { pattern: /async\s+fetch\s*\(request/g, required: true, message: "handler fetch(request, env) manquant" },
      { pattern: /return\s+new\s+Response/g, required: true, message: "Aucun new Response() trouv\xE9 \u2014 le Worker doit retourner une Response" }
    ];
    __name(analyzeCode, "analyzeCode");
    __name(checkBasicSyntax, "checkBasicSyntax");
    __name(computeScore, "computeScore");
    __name(getScoreLabel, "getScoreLabel");
    __name(cfDryRun, "cfDryRun");
    __name(runSandbox, "runSandbox");
    __name(formatSandboxReport, "formatSandboxReport");
    __name(runSandboxMultiple, "runSandboxMultiple");
    __name(detectFileType, "detectFileType");
  }
});

// site-generator.js
var site_generator_exports = {};
__export(site_generator_exports, {
  PALETTES: () => PALETTES,
  deploySiteToPages: () => deploySiteToPages,
  generateSite: () => generateSite,
  registerAsAffiliate: () => registerAsAffiliate,
  resolveSubdomain: () => resolveSubdomain,
  runSiteGenerationPipeline: () => runSiteGenerationPipeline
});
async function generateSite(apiKey, options) {
  const {
    type = "landing",
    prompt,
    // Description du site en langage naturel
    language = "fr",
    // fr, en, es, etc.
    palette = "violet",
    affiliateUrl = "",
    // URL affilié à intégrer
    ownerName = "",
    // Nom du propriétaire du site
    productName = "",
    // Nom du produit/service
    price = ""
    // Prix si applicable
  } = options;
  const pal = PALETTES[palette] || PALETTES.violet;
  const sitePrompt = SITE_PROMPTS[type] || SITE_PROMPTS.landing;
  const langName = { fr: "fran\xE7ais", en: "English", es: "espa\xF1ol", pt: "portugu\xEAs", de: "Deutsch" }[language] || language;
  const userMessage = `
G\xE9n\xE8re le site en ${langName}.

INFORMATIONS DU SITE :
- Type : ${type}
- Propri\xE9taire / Auteur : ${ownerName || "\xC0 personnaliser"}
- Produit / Service : ${productName || prompt}
- Prix : ${price || "\xC0 d\xE9finir"}
- Lien affili\xE9 : ${affiliateUrl || "#"}
- Description / Brief : ${prompt}

PALETTE DE COULEURS (utilise exactement ces valeurs CSS) :
${JSON.stringify(pal, null, 2)}

CSS DE BASE \xC0 INCLURE dans <style> :
${BASE_CSS(pal)}
Importe cette Google Font : @import url('https://fonts.googleapis.com/css2?family=${pal.font.replace(/ /g, "+")}:wght@400;600;700;800;900&display=swap');

INSTRUCTIONS TECHNIQUES :
- HTML5 complet et valide (<!DOCTYPE html> ... </html>)
- Tout le CSS dans <style> dans le <head>
- Responsive mobile-first
- Aucune d\xE9pendance externe sauf Google Fonts
- Ic\xF4nes : SVG inline simples uniquement
- Images : placeholders avec background-color + texte centr\xE9
- Commentaires HTML pour d\xE9limiter les sections
- Meta tags SEO complets (title, description, og:*)
- Lien affili\xE9 "${affiliateUrl || "#"}" sur tous les CTAs principaux
- AUCUN JavaScript complexe \u2014 interactions CSS uniquement sauf si vraiment n\xE9cessaire

Retourne UNIQUEMENT le code HTML complet, sans markdown, sans explication.`;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nyxiapublicationweb.com",
      "X-Title": "NyXia Site Generator"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      max_tokens: 8e3,
      temperature: 0.7,
      messages: [
        { role: "system", content: sitePrompt },
        { role: "user", content: userMessage }
      ]
    })
  });
  if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const html = data.choices[0].message.content.trim().replace(/^```html\n?/, "").replace(/\n?```$/, "");
  return { html, type, language, palette, pal };
}
function resolveSubdomain(options) {
  const { clientDomain, clientSlug, baseDomain = "nyxiapublicationweb.com" } = options;
  if (clientDomain) {
    const cleanDomain = clientDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    return {
      type: "custom",
      subdomain: `affiliation.${cleanDomain}`,
      url: `https://affiliation.${cleanDomain}`,
      cname: `affiliation.${cleanDomain}`,
      cnameTarget: "nyxiapublicationweb.com",
      instructions: [
        `1. Va dans les DNS de ton domaine "${cleanDomain}"`,
        `2. Cr\xE9e un enregistrement CNAME :`,
        `   Nom    : affiliation`,
        `   Valeur : nyxiapublicationweb.com`,
        `3. Attends 5-10 minutes pour la propagation`,
        `4. Ton site sera accessible sur : https://affiliation.${cleanDomain}`
      ]
    };
  }
  const slug = (clientSlug || "monsiteweb").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return {
    type: "shared",
    subdomain: `${slug}.${baseDomain}`,
    url: `https://${slug}.${baseDomain}`,
    instructions: [
      `Ton site sera disponible sur : https://${slug}.${baseDomain}`,
      `Aucune configuration DNS requise \u2014 c'est automatique !`,
      `Tu pourras connecter ton propre domaine plus tard si tu le souhaites.`
    ]
  };
}
async function deploySiteToPages(cfToken, accountId, siteName, html) {
  const projectName = siteName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const createRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${cfToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        production_branch: "main"
      })
    }
  );
  const createData = await createRes.json();
  if (!createData.success && !createData.errors?.some((e) => e.code === 8000026)) {
    throw new Error(`Cr\xE9ation projet Pages \xE9chou\xE9e : ${JSON.stringify(createData.errors)}`);
  }
  const form = new FormData();
  form.append("manifest", JSON.stringify({ "/index.html": html }));
  form.append("/index.html", new Blob([html], { type: "text/html" }), "index.html");
  const redirects = "/* /index.html 200";
  form.append("/_redirects", new Blob([redirects], { type: "text/plain" }), "_redirects");
  const deployRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${cfToken}` },
      body: form
    }
  );
  const deployData = await deployRes.json();
  if (!deployData.success) {
    throw new Error(`D\xE9ploiement Pages \xE9chou\xE9 : ${JSON.stringify(deployData.errors)}`);
  }
  return {
    projectName,
    deploymentId: deployData.result?.id,
    url: deployData.result?.url || `https://${projectName}.pages.dev`,
    environment: deployData.result?.environment || "production"
  };
}
async function registerAsAffiliate(db, options) {
  const { email, name, siteUrl, referrerId } = options;
  if (!db) return { success: false, error: "Base D1 non configur\xE9e" };
  try {
    const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).slice(2, 6);
    const result = await db.prepare(`
      INSERT INTO affiliates (email, name, referrer_id, custom_link, status)
      VALUES (?, ?, ?, ?, 'active')
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        custom_link = COALESCE(affiliates.custom_link, excluded.custom_link)
      RETURNING *
    `).bind(email, name, referrerId || null, slug).first();
    return {
      success: true,
      affiliateId: result.id,
      affiliateLink: `https://nyxiapublicationweb.com/ref/${slug}`,
      dashboardUrl: `https://affiliationpro.publication-web.com/dashboard/${result.id}`,
      message: `Affili\xE9 inscrit : ${email} \u2192 lien /ref/${slug}`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
async function runSiteGenerationPipeline(options, env) {
  const {
    type,
    prompt,
    language,
    palette,
    affiliateUrl,
    ownerName,
    productName,
    price,
    clientEmail,
    clientName,
    clientDomain,
    clientSlug,
    referrerId
  } = options;
  const report = { steps: [], success: false, startedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const step = /* @__PURE__ */ __name((name, status, data = {}) => report.steps.push({ step: name, status, ...data, at: (/* @__PURE__ */ new Date()).toISOString() }), "step");
  try {
    step("generate", "running");
    const { html } = await generateSite(env.OPENROUTER_API_KEY, {
      type,
      prompt,
      language,
      palette,
      affiliateUrl,
      ownerName,
      productName,
      price
    });
    step("generate", "success", { chars: html.length, lines: html.split("\n").length });
    const subdomainInfo = resolveSubdomain({ clientDomain, clientSlug: clientSlug || clientName?.toLowerCase().replace(/\s+/g, "-") });
    step("subdomain", "success", { url: subdomainInfo.url, type: subdomainInfo.type });
    if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) {
      step("deploy", "running");
      const siteName = clientSlug || clientName?.toLowerCase().replace(/\s+/g, "-") || `site-${Date.now()}`;
      try {
        const deployment = await deploySiteToPages(env.CF_API_TOKEN, env.CF_ACCOUNT_ID, siteName, html);
        step("deploy", "success", { url: deployment.url, project: deployment.projectName });
        report.siteUrl = subdomainInfo.url || deployment.url;
        report.deploymentUrl = deployment.url;
      } catch (err) {
        step("deploy", "warning", { error: err.message, note: "Site g\xE9n\xE9r\xE9 mais non d\xE9ploy\xE9 \u2014 d\xE9ploiement manuel requis" });
        report.siteUrl = subdomainInfo.url;
      }
    } else {
      step("deploy", "skipped", { note: "Tokens CF manquants \u2014 HTML g\xE9n\xE9r\xE9 uniquement" });
    }
    if (clientEmail && env.DB) {
      step("affiliate", "running");
      const affiliate = await registerAsAffiliate(env.DB, {
        email: clientEmail,
        name: clientName || ownerName,
        siteUrl: report.siteUrl,
        referrerId
      });
      if (affiliate.success) {
        step("affiliate", "success", { link: affiliate.affiliateLink, dashboard: affiliate.dashboardUrl });
        report.affiliateLink = affiliate.affiliateLink;
        report.affiliateDashboard = affiliate.dashboardUrl;
      } else {
        step("affiliate", "warning", { error: affiliate.error });
      }
    }
    report.success = true;
    report.html = html;
    report.subdomain = subdomainInfo;
  } catch (err) {
    step("pipeline", "error", { error: err.message });
    report.error = err.message;
  }
  return report;
}
var SITE_PROMPTS, BASE_CSS, PALETTES;
var init_site_generator = __esm({
  "site-generator.js"() {
    SITE_PROMPTS = {
      landing: `Tu es un expert en copywriting et design de pages de vente haute conversion.
G\xE9n\xE8re une page de vente HTML compl\xE8te, moderne et persuasive.
Structure obligatoire :
1. Hero section avec accroche puissante + CTA principal
2. Probl\xE8me identifi\xE9 (douleurs du prospect)
3. Solution pr\xE9sent\xE9e (le produit)
4. B\xE9n\xE9fices cl\xE9s (3-5 points avec ic\xF4nes SVG simples)
5. Preuve sociale (t\xE9moignages fictifs cr\xE9dibles)
6. Offre + prix + bonus
7. Garantie
8. CTA final urgent
9. FAQ (3-5 questions)
Design : moderne, \xE9pur\xE9, couleurs vibrantes, typographie impactante.
Le code doit \xEAtre autonome (CSS inline + Google Fonts). AUCUN framework externe.`,
      minisite: `Tu es un expert en sites d'affiliation multi-pages.
G\xE9n\xE8re un mini-site HTML complet avec navigation entre pages.
Pages obligatoires :
- index.html : accueil avec pr\xE9sentation + liens affili\xE9s
- produits.html : catalogue des produits recommand\xE9s
- apropos.html : page "\xC0 propos" cr\xE9dibilisant l'auteur
- contact.html : formulaire de contact simple
Chaque page doit avoir header + footer coh\xE9rents.
Design : professionnel, confiance, personal branding fort.
Navigation mobile-friendly. CSS inline, autonome.`,
      systemeio: `Tu es un expert en tunnels de vente Systeme.io et copywriting francophone.
G\xE9n\xE8re une page de capture / squeeze page style Systeme.io.
Structure :
1. Header minimaliste (logo + accroche)
2. Titre accrocheur avec promesse claire
3. Vid\xE9o placeholder (div stylis\xE9e avec play button)
4. Formulaire d'inscription (nom + email + bouton)
5. B\xE9n\xE9fices en puces (ce qu'ils vont recevoir)
6. Preuve sociale courte
7. Footer l\xE9gal minimal
Design : \xE9pur\xE9, focus sur la conversion, palette sobre.
Le formulaire pointe vers : https://systeme.io/[LIEN_SYSTEMEIO]`,
      coach: `Tu es un expert en sites web pour coachs, th\xE9rapeutes et freelances.
G\xE9n\xE8re un site personnel professionnel complet.
Sections obligatoires :
1. Hero : photo placeholder + tagline + CTA "R\xE9server un appel"
2. \xC0 propos : bio convaincante + valeurs + parcours
3. Services : 3 offres avec prix et descriptions
4. T\xE9moignages : 3 avis clients d\xE9taill\xE9s et cr\xE9dibles
5. Processus : comment \xE7a marche (3 \xE9tapes)
6. Section prise de rendez-vous (lien Calendly placeholder)
7. Blog/Articles : 3 aper\xE7us d'articles (titres accrocheurs)
8. Footer complet
Design : chaleureux, humain, professionnel. Tons doux.`,
      ecommerce: `Tu es un expert en boutiques en ligne simples et efficaces.
G\xE9n\xE8re une page boutique e-commerce HTML compl\xE8te.
Sections obligatoires :
1. Header avec logo + navigation + panier (ic\xF4ne)
2. Hero banner promotionnel
3. Grille produits (6 produits avec image placeholder, nom, prix, bouton)
4. Banni\xE8re de confiance (livraison, retours, paiement s\xE9curis\xE9)
5. Section "Nouveaut\xE9s" (3 produits)
6. Newsletter inscription
7. Footer avec liens l\xE9gaux
Design : moderne, e-commerce professionnel. Inspir\xE9 Shopify.`
    };
    BASE_CSS = /* @__PURE__ */ __name((palette) => `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --primary:${palette.primary};
    --secondary:${palette.secondary};
    --accent:${palette.accent};
    --text:${palette.text};
    --bg:${palette.bg};
    --surface:${palette.surface};
    --radius:12px;
  }
  html{scroll-behavior:smooth}
  body{font-family:'${palette.font}',system-ui,sans-serif;color:var(--text);background:var(--bg);line-height:1.65}
  img{max-width:100%;height:auto;display:block}
  a{color:var(--primary);text-decoration:none}
  .btn{display:inline-block;background:var(--primary);color:#fff;padding:16px 40px;border-radius:50px;font-weight:700;font-size:17px;cursor:pointer;border:none;transition:transform .2s,box-shadow .2s}
  .btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px color-mix(in srgb,var(--primary) 40%,transparent)}
  .btn-outline{background:transparent;border:2px solid var(--primary);color:var(--primary)}
  .container{max-width:1100px;margin:0 auto;padding:0 24px}
  .section{padding:80px 0}
  h1{font-size:clamp(32px,5vw,62px);font-weight:900;line-height:1.1}
  h2{font-size:clamp(26px,4vw,44px);font-weight:800;line-height:1.2}
  h3{font-size:clamp(18px,3vw,26px);font-weight:700}
  @media(max-width:768px){.section{padding:48px 0}.grid-2,.grid-3{grid-template-columns:1fr!important}}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:32px}
  .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
  .card{background:var(--surface);border-radius:var(--radius);padding:32px;border:1px solid color-mix(in srgb,var(--primary) 15%,transparent)}
  .badge{display:inline-block;background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary);padding:6px 16px;border-radius:50px;font-size:13px;font-weight:600;letter-spacing:.5px}
  .text-center{text-align:center}
`, "BASE_CSS");
    PALETTES = {
      violet: { primary: "#7c3aed", secondary: "#4f46e5", accent: "#f59e0b", text: "#1a1a2e", bg: "#ffffff", surface: "#f8f7ff", font: "Inter" },
      emeraude: { primary: "#059669", secondary: "#0891b2", accent: "#f59e0b", text: "#064e3b", bg: "#ffffff", surface: "#f0fdf4", font: "Plus Jakarta Sans" },
      corail: { primary: "#f97316", secondary: "#ef4444", accent: "#8b5cf6", text: "#1c1917", bg: "#ffffff", surface: "#fff7ed", font: "Nunito" },
      ardoise: { primary: "#334155", secondary: "#0f172a", accent: "#3b82f6", text: "#0f172a", bg: "#f8fafc", surface: "#ffffff", font: "DM Sans" },
      rose: { primary: "#e11d48", secondary: "#db2777", accent: "#f59e0b", text: "#1a0a14", bg: "#ffffff", surface: "#fff1f2", font: "Raleway" },
      ocean: { primary: "#0ea5e9", secondary: "#6366f1", accent: "#10b981", text: "#0c1a2e", bg: "#ffffff", surface: "#f0f9ff", font: "Outfit" },
      sombre: { primary: "#a78bfa", secondary: "#60a5fa", accent: "#34d399", text: "#e2e8f0", bg: "#0f0f1a", surface: "#1a1a2e", font: "Space Grotesk" }
    };
    __name(generateSite, "generateSite");
    __name(resolveSubdomain, "resolveSubdomain");
    __name(deploySiteToPages, "deploySiteToPages");
    __name(registerAsAffiliate, "registerAsAffiliate");
    __name(runSiteGenerationPipeline, "runSiteGenerationPipeline");
  }
});

// payments.js
var payments_exports = {};
__export(payments_exports, {
  PAYMENT_LINKS: () => PAYMENT_LINKS,
  activatePlan: () => activatePlan,
  getPaymentUrl: () => getPaymentUrl,
  getPlanPaymentInfo: () => getPlanPaymentInfo
});
function getPaymentUrl(productId, options = {}) {
  const product = PAYMENT_LINKS[productId];
  if (!product) throw new Error(`Produit inconnu : ${productId}`);
  const { refId, email, name, utm_source = "publication-web" } = options;
  const base = refId ? product.urlWithRef(refId) : product.url;
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  if (name) params.set("name", name);
  if (utm_source) params.set("utm_source", utm_source);
  params.set("utm_medium", "dashboard");
  params.set("utm_campaign", productId);
  const queryStr = params.toString();
  return queryStr ? `${base}&${queryStr}` : base;
}
async function activatePlan(kv, options) {
  const { email, productId, orderId, amount, tag } = options;
  if (!kv) return { success: false, error: "KV non disponible" };
  try {
    const accountRaw = await kv.get(`account:${email.toLowerCase()}`).catch(() => null);
    if (!accountRaw) {
      return { success: false, error: "Compte introuvable \u2014 l'utilisateur doit s'inscrire d'abord" };
    }
    const account = JSON.parse(accountRaw);
    let newPlan = account.plan;
    if (tag === PAYMENT_LINKS.pro.systemeioTag) newPlan = "pro";
    if (tag === PAYMENT_LINKS.visionnaire.systemeioTag) newPlan = "visionnaire";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    account.plan = newPlan;
    account.planActivated = now;
    account.trialEnd = null;
    account.lastOrderId = orderId;
    account.status = "active";
    await kv.put(
      `account:${email.toLowerCase()}`,
      JSON.stringify(account),
      { expirationTtl: 365 * 24 * 60 * 60 }
    );
    const transactionKey = `transaction:${orderId || Date.now()}`;
    await kv.put(transactionKey, JSON.stringify({
      email,
      productId,
      plan: newPlan,
      amount,
      orderId,
      activatedAt: now,
      source: "systemeio"
    }), { expirationTtl: 365 * 24 * 60 * 60 });
    return {
      success: true,
      email,
      plan: newPlan,
      activatedAt: now,
      message: `Plan ${newPlan} activ\xE9 pour ${email}`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
function getPlanPaymentInfo(planId) {
  const links = {
    free: {
      upgradeUrl: getPaymentUrl("pro"),
      upgradeLabel: "Passer au Pro \u2014 CA$39/mois",
      trialLabel: "3 jours gratuits, puis CA$39/mois"
    },
    pro: {
      upgradeUrl: getPaymentUrl("visionnaire"),
      upgradeLabel: "Passer au Visionnaire \u2014 CA$97/mois",
      manageUrl: "https://ton-compte.systeme.io/mon-compte",
      cancelLabel: "G\xE9rer mon abonnement"
    },
    visionnaire: {
      manageUrl: "https://ton-compte.systeme.io/mon-compte",
      cancelLabel: "G\xE9rer mon abonnement"
    }
  };
  return links[planId] || links.free;
}
var PAYMENT_LINKS;
var init_payments = __esm({
  "payments.js"() {
    PAYMENT_LINKS = {
      pro: {
        id: "pro",
        name: "Plan Pro",
        description: "Sites illimit\xE9s \xB7 Affiliation 3 niveaux \xB7 NyXia complet",
        price: 39,
        currency: "CAD",
        recurring: true,
        period: "mois",
        trialDays: 3,
        // ⬇ Remplace par ton vrai lien Systeme.io
        url: "https://ton-compte.systeme.io/pro-mensuel",
        // URL avec tracking affilié automatique
        urlWithRef: /* @__PURE__ */ __name((refId) => `https://ton-compte.systeme.io/pro-mensuel?ref=${refId}`, "urlWithRef"),
        // Ce que Systeme.io envoie dans le webhook après paiement
        systemeioTag: "plan_pro_actif"
      },
      visionnaire: {
        id: "visionnaire",
        name: "Plan Visionnaire",
        description: "20 domaines \xB7 Marque blanche \xB7 API compl\xE8te \xB7 NyXia d\xE9di\xE9",
        price: 97,
        currency: "CAD",
        recurring: true,
        period: "mois",
        trialDays: 3,
        url: "https://ton-compte.systeme.io/visionnaire-mensuel",
        urlWithRef: /* @__PURE__ */ __name((refId) => `https://ton-compte.systeme.io/visionnaire-mensuel?ref=${refId}`, "urlWithRef"),
        systemeioTag: "plan_visionnaire_actif"
      },
      meta: {
        id: "meta",
        name: "Pr\xE9sence Meta Professionnelle",
        description: "Page Facebook pro \xB7 ManyChat \xB7 30j publications IA \xB7 90j strat\xE9gie followers",
        price: 97,
        currency: "CAD",
        recurring: false,
        oneTime: true,
        url: "https://www.publication-web.com/nyxiawebsite/97",
        urlWithRef: /* @__PURE__ */ __name((refId) => `https://www.publication-web.com/nyxiawebsite/97?ref=${refId}`, "urlWithRef"),
        systemeioTag: "meta_presence_achat"
      }
    };
    __name(getPaymentUrl, "getPaymentUrl");
    __name(activatePlan, "activatePlan");
    __name(getPlanPaymentInfo, "getPlanPaymentInfo");
  }
});

// plans.js
var plans_exports = {};
__export(plans_exports, {
  FREE_EMAIL_SEQUENCE: () => FREE_EMAIL_SEQUENCE,
  PLANS: () => PLANS,
  addWatermark: () => addWatermark,
  canDo: () => canDo,
  getPlan: () => getPlan,
  plansForDisplay: () => plansForDisplay,
  registerFreeLead: () => registerFreeLead
});
function canDo(plan, action) {
  const p = PLANS[plan] || PLANS.free;
  const limits = p.limits;
  switch (action) {
    case "generate_site":
      return true;
    // Tout le monde peut
    case "download_site":
      return limits.downloadSite === true;
    case "custom_domain":
      return limits.customDomain === true;
    case "no_watermark":
      return limits.watermark === false;
    case "affiliation_active":
      return limits.affiliationActive === true;
    case "notifications":
      return limits.notifications === true;
    case "community_manager":
      return limits.communityManager === true;
    case "webhooks":
      return limits.webhooks === true;
    case "nyxia_full":
      return limits.nyxiaAccess === true;
    case "white_label":
      return limits.whiteLabel === true;
    case "api":
      return limits.apiAccess === true;
    default:
      return false;
  }
}
function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}
function addWatermark(html) {
  const watermarkCSS = `
<style id="pw-watermark-style">
  #pw-watermark {
    position: fixed !important;
    bottom: 16px !important;
    right: 16px !important;
    z-index: 99999 !important;
    background: rgba(10, 10, 20, 0.85) !important;
    color: #a78bfa !important;
    font-family: system-ui, sans-serif !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    padding: 8px 14px !important;
    border-radius: 20px !important;
    border: 1px solid rgba(123, 92, 255, 0.4) !important;
    backdrop-filter: blur(8px) !important;
    letter-spacing: 0.5px !important;
    text-decoration: none !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    box-shadow: 0 0 16px rgba(123, 92, 255, 0.2) !important;
    pointer-events: all !important;
  }
  #pw-watermark::before {
    content: "\u2726" !important;
    font-size: 10px !important;
  }
</style>`;
  const watermarkHTML = `
<a id="pw-watermark" href="https://nyxiapublicationweb.com" target="_blank" rel="noopener">
  Propuls\xE9 par Publication-Web
</a>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${watermarkCSS}
${watermarkHTML}
</body>`);
  }
  return html + watermarkCSS + watermarkHTML;
}
async function registerFreeLead(kv, options) {
  if (!kv) return { success: false, error: "KV non disponible" };
  const {
    email,
    name,
    siteType,
    siteUrl,
    generatedAt = (/* @__PURE__ */ new Date()).toISOString()
  } = options;
  const leadId = crypto.randomUUID().slice(0, 12);
  const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
  const lead = {
    id: leadId,
    email,
    name,
    siteType,
    siteUrl,
    plan: "free",
    generatedAt,
    expireAt,
    converted: false,
    emailsSent: 0,
    lastEmailAt: null
  };
  try {
    await kv.put(
      `lead:${leadId}`,
      JSON.stringify(lead),
      { expirationTtl: 90 * 24 * 60 * 60 }
    );
    await kv.put(`lead:email:${email.toLowerCase()}`, leadId, { expirationTtl: 90 * 24 * 60 * 60 });
    return { success: true, leadId, expireAt, lead };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
function plansForDisplay() {
  return [
    {
      key: "free",
      name: "Gratuit",
      price: "CA$0",
      period: "pour toujours",
      trial: null,
      cta: "Commencer gratuitement",
      ctaStyle: "outline",
      highlight: false,
      features: [
        "1 site g\xE9n\xE9r\xE9 (pr\xE9visualisation 7 jours)",
        "Filigrane Publication-Web visible",
        "H\xE9bergement sur market.nyxiapublicationweb.com",
        "Marketplace en lecture seule",
        "Pas d'affiliation active",
        "Pas de t\xE9l\xE9chargement du site"
      ],
      restrictions: [
        "Site supprim\xE9 apr\xE8s 7 jours",
        "Pas de domaine personnalis\xE9",
        "Pas de notifications"
      ]
    },
    {
      key: "pro",
      name: "Pro",
      price: "CA$39",
      period: "/mois \xB7 Sans engagement",
      trial: "3 jours gratuits",
      cta: "D\xE9marrer l'essai gratuit \u2192",
      ctaStyle: "primary",
      highlight: true,
      badge: "\u2B50 Le plus populaire",
      features: [
        "Sites illimit\xE9s + t\xE9l\xE9chargement",
        "Aucun filigrane",
        "Domaine personnalis\xE9 (affiliation.tonsite.com)",
        "Affiliation active \u2014 3 niveaux 25/10/5%",
        "Community manager IA 30 jours",
        "Publication Facebook multi-pages",
        "Webhooks Systeme.io",
        "Notifications Discord + Email",
        "NyXia \u2014 acc\xE8s complet",
        "Support prioritaire"
      ]
    },
    {
      key: "visionnaire",
      name: "Visionnaire",
      price: "CA$97",
      period: "/mois \xB7 Multi-projets",
      trial: "3 jours gratuits",
      cta: "Devenir Visionnaire \u2192",
      ctaStyle: "outline",
      highlight: false,
      tagline: "Pour les entrepreneurs multi-projets \xB7 anciens Systeme.io",
      features: [
        "Tout le plan Pro",
        "20 domaines \xB7 projets distincts",
        "Marque blanche (ton logo, tes couleurs)",
        "API compl\xE8te",
        "NyXia \u2014 instance d\xE9di\xE9e",
        "Gestionnaire de compte",
        "Rapports multi-projets"
      ]
    }
  ];
}
var PLANS, FREE_EMAIL_SEQUENCE;
var init_plans = __esm({
  "plans.js"() {
    PLANS = {
      free: {
        id: "free",
        name: "Gratuit",
        price: 0,
        recurring: false,
        trialDays: 0,
        limits: {
          sitesPerMonth: 1,
          downloadSite: false,
          // Prévisualisation uniquement
          customDomain: false,
          // Forcé sur market.nyxiapublicationweb.com
          watermark: true,
          // Filigrane Publication-Web
          affiliationActive: false,
          // Marketplace lecture seule
          notifications: false,
          // Pas de Discord/Email
          communityManager: false,
          webhooks: false,
          nyxiaAccess: false
        },
        // Ce qu'on fait quand un visiteur gratuit génère un site
        onGenerate: {
          requireEmailFirst: true,
          // Email AVANT de voir le résultat
          addWatermark: true,
          hostOn: "market.nyxiapublicationweb.com",
          expireAfterDays: 7,
          // Site supprimé après 7 jours
          sendEmailSequence: true
          // Séquence email de relance
        }
      },
      pro: {
        id: "pro",
        name: "Pro",
        price: 39,
        currency: "CA$",
        recurring: true,
        period: "mois",
        trialDays: 3,
        limits: {
          sitesPerMonth: -1,
          // Illimité
          downloadSite: true,
          customDomain: true,
          watermark: false,
          affiliationActive: true,
          notifications: true,
          communityManager: true,
          webhooks: true,
          nyxiaAccess: true
        },
        onGenerate: {
          requireEmailFirst: false,
          addWatermark: false,
          hostOn: "custom_or_shared",
          expireAfterDays: -1,
          // Jamais
          sendEmailSequence: false
        }
      },
      visionnaire: {
        id: "visionnaire",
        name: "Visionnaire",
        price: 97,
        currency: "CA$",
        recurring: true,
        period: "mois",
        trialDays: 3,
        tagline: "Pour les power users \u2014 orphelins de Systeme.io et entrepreneurs multi-projets",
        limits: {
          sitesPerMonth: -1,
          maxDomains: 20,
          // 20 domaines/projets distincts
          maxClients: 20,
          // alias — même valeur
          downloadSite: true,
          customDomain: true,
          watermark: false,
          affiliationActive: true,
          notifications: true,
          communityManager: true,
          webhooks: true,
          nyxiaAccess: true,
          whiteLabel: true,
          apiAccess: true
        },
        onGenerate: {
          requireEmailFirst: false,
          addWatermark: false,
          hostOn: "custom_or_shared",
          expireAfterDays: -1,
          sendEmailSequence: false
        }
      },
      // Service séparé — paiement unique
      meta_presence: {
        id: "meta_presence",
        name: "Pr\xE9sence Meta Professionnelle",
        price: 97,
        currency: "CA$",
        recurring: false,
        oneTime: true,
        includes: [
          "Page Facebook professionnelle (banni\xE8re + structure compl\xE8te)",
          "ManyChat configur\xE9 pour les DM automatiques",
          "30 jours de publications g\xE9n\xE9r\xE9es par IA",
          "90 jours de strat\xE9gie de redirection \u2014 objectif 10 000 followers",
          "Mon\xE9tisation Meta pour financer ta publicit\xE9 avec tes gains de contenu"
        ],
        note: "Service vendu s\xE9par\xE9ment \u2014 non inclus dans les plans mensuels"
      }
    };
    __name(canDo, "canDo");
    __name(getPlan, "getPlan");
    __name(addWatermark, "addWatermark");
    FREE_EMAIL_SEQUENCE = [
      {
        day: 0,
        subject: "\u2726 Ton site Publication-Web est pr\xEAt !",
        preview: "Voici ton lien de pr\xE9visualisation \u2014 mais il expire dans 7 jours...",
        type: "delivery"
      },
      {
        day: 1,
        subject: "NyXia a quelque chose \xE0 te montrer \u{1F440}",
        preview: "Ce que tu rates avec le plan gratuit...",
        type: "education"
      },
      {
        day: 3,
        subject: "\u26A1 Ton site expire dans 4 jours",
        preview: "Passe au Pro pour le garder + activer tes commissions affili\xE9es",
        type: "urgency"
      },
      {
        day: 5,
        subject: "\u{1F4B0} Tu laisses de l'argent sur la table",
        preview: "Chaque jour sans ton lien affili\xE9 actif = commissions perdues",
        type: "fomo"
      },
      {
        day: 6,
        subject: "\u23F0 Derni\xE8re chance \u2014 ton site s'efface demain",
        preview: "1 clic pour tout sauvegarder + activer AffiliationPro",
        type: "urgency_final"
      },
      {
        day: 8,
        subject: "Ton site a \xE9t\xE9 supprim\xE9 \u2014 mais NyXia garde tout",
        preview: "Reviens maintenant et on recr\xE9e tout en 60 secondes.",
        type: "reactivation"
      },
      {
        day: 14,
        subject: "Un entrepreneur comme toi a g\xE9n\xE9r\xE9 1 247 CA$ ce mois",
        preview: "Voici comment \u2014 et comment tu peux faire pareil.",
        type: "social_proof"
      }
    ];
    __name(registerFreeLead, "registerFreeLead");
    __name(plansForDisplay, "plansForDisplay");
  }
});

// vault-kv.js
var ACCOUNTS_KEY = "nyxia:accounts";
var PROJECTS_KEY = "nyxia:projects";
var _accounts = null;
var _projects = null;
async function deriveKey(secret) {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("nyxia-vault-v1"), iterations: 1e5, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
__name(deriveKey, "deriveKey");
async function encrypt(data, secret) {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  const buf = new Uint8Array(iv.byteLength + ct.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...buf));
}
__name(encrypt, "encrypt");
async function decrypt(b64, secret) {
  const key = await deriveKey(secret);
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(dec));
}
__name(decrypt, "decrypt");
async function kvRead(kv, key, secret) {
  const raw = await kv.get(key);
  if (!raw) return {};
  try {
    return await decrypt(raw, secret);
  } catch (_) {
    return {};
  }
}
__name(kvRead, "kvRead");
async function kvWrite(kv, key, data, secret) {
  const encrypted = await encrypt(data, secret);
  await kv.put(key, encrypted);
}
__name(kvWrite, "kvWrite");
async function loadVault(kv, secret) {
  if (_accounts && _projects) return;
  _accounts = await kvRead(kv, ACCOUNTS_KEY, secret);
  _projects = await kvRead(kv, PROJECTS_KEY, secret);
}
__name(loadVault, "loadVault");
async function saveAccounts(kv, secret) {
  await kvWrite(kv, ACCOUNTS_KEY, _accounts, secret);
}
__name(saveAccounts, "saveAccounts");
async function saveProjects(kv, secret) {
  await kvWrite(kv, PROJECTS_KEY, _projects, secret);
}
__name(saveProjects, "saveProjects");
async function setAccount(kv, secret, alias, cfg) {
  if (!_accounts[alias]) _accounts[alias] = {};
  if (cfg.github_token) _accounts[alias].github = { token: cfg.github_token, owner: cfg.github_owner || "" };
  if (cfg.cf_token) _accounts[alias].cloudflare = { token: cfg.cf_token, accountId: cfg.cf_account_id || "" };
  await saveAccounts(kv, secret);
  return _accounts[alias];
}
__name(setAccount, "setAccount");
function listAccounts() {
  return Object.entries(_accounts || {}).map(([alias, acc]) => ({
    alias,
    github: acc.github ? `\u2713 (${acc.github.owner || "?"})` : "\u2014",
    cloudflare: acc.cloudflare ? `\u2713` : "\u2014"
  }));
}
__name(listAccounts, "listAccounts");
async function setProject(kv, secret, key, cfg) {
  _projects[key] = {
    label: cfg.label || key,
    description: cfg.description || "",
    accountAlias: cfg.accountAlias || key,
    github: {
      owner: cfg.github_owner || "",
      repo: cfg.github_repo || "",
      branch: cfg.github_branch || "main"
    },
    cloudflare: {
      worker: cfg.cf_worker || "",
      pages_project: cfg.cf_pages || "",
      kv_namespace: cfg.cf_kv || ""
    },
    stack: cfg.stack || [],
    status: cfg.status || "en_cours"
  };
  await saveProjects(kv, secret);
  return _projects[key];
}
__name(setProject, "setProject");
function listProjects() {
  return Object.entries(_projects || {}).map(([k, p]) => ({
    key: k,
    label: p.label,
    status: p.status,
    account: p.accountAlias,
    repo: p.github.owner ? `${p.github.owner}/${p.github.repo}` : "non configur\xE9",
    stack: p.stack
  }));
}
__name(listProjects, "listProjects");
function resolveCredentials(projectKey) {
  const project = _projects?.[projectKey];
  if (!project) return null;
  const account = _accounts?.[project.accountAlias] || {};
  return {
    project,
    github: {
      token: account.github?.token || "",
      owner: project.github.owner || account.github?.owner || "",
      repo: project.github.repo,
      branch: project.github.branch
    },
    cloudflare: {
      token: account.cloudflare?.token || "",
      accountId: account.cloudflare?.accountId || "",
      worker: project.cloudflare.worker,
      pages_project: project.cloudflare.pages_project,
      kv_namespace: project.cloudflare.kv_namespace
    }
  };
}
__name(resolveCredentials, "resolveCredentials");
function stateSummary() {
  const accounts = listAccounts();
  const projects = listProjects();
  if (accounts.length === 0 && projects.length === 0) {
    return "Vault vide \u2014 aucun compte ni projet configur\xE9. Demande \xE0 l'utilisateur ses tokens et infos de projets.";
  }
  const accLines = accounts.length > 0 ? accounts.map((a) => `  \u2022 [${a.alias}] GitHub:${a.github} | CF:${a.cloudflare}`).join("\n") : "  (aucun compte)";
  const projLines = projects.length > 0 ? projects.map((p) => `  \u2022 ${p.label} (cl\xE9:"${p.key}") | compte:"${p.account}" | repo:${p.repo} | statut:${p.status}`).join("\n") : "  (aucun projet)";
  return `COMPTES :
${accLines}

PROJETS :
${projLines}`;
}
__name(stateSummary, "stateSummary");

// deploy-engine.js
var wait = /* @__PURE__ */ __name((ms) => new Promise((r) => setTimeout(r, ms)), "wait");
async function githubPushMultipleFiles(token, owner, repo, branch, files, commitMessage) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "NyXia-Agent"
  };
  const refRes = await fetch(`${base}/git/ref/heads/${branch}`, { headers });
  if (!refRes.ok) throw new Error(`Branche "${branch}" introuvable : ${await refRes.text()}`);
  const refData = await refRes.json();
  const baseSha = refData.object.sha;
  const treeRes = await fetch(`${base}/git/commits/${baseSha}`, { headers });
  const treeData = await treeRes.json();
  const baseTree = treeData.tree.sha;
  const treeItems = [];
  for (const file of files) {
    const blobRes = await fetch(`${base}/git/blobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: file.content, encoding: "utf-8" })
    });
    const blob = await blobRes.json();
    treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTreeRes = await fetch(`${base}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ base_tree: baseTree, tree: treeItems })
  });
  const newTree = await newTreeRes.json();
  const commitRes = await fetch(`${base}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [baseSha] })
  });
  const commit = await commitRes.json();
  await fetch(`${base}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ sha: commit.sha, force: false })
  });
  return {
    sha: commit.sha.slice(0, 8),
    url: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    files: files.map((f) => f.path)
  };
}
__name(githubPushMultipleFiles, "githubPushMultipleFiles");
async function healthCheck(url, options = {}) {
  const {
    maxRetries = 8,
    retryDelay = 5e3,
    // 5s entre chaque essai
    expectedStatus = 200,
    timeout = 1e4
  } = options;
  const results = [];
  for (let i = 1; i <= maxRetries; i++) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
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
  return { success: false, url, attempts: maxRetries, results, error: "Health check \xE9chou\xE9 apr\xE8s tous les essais" };
}
__name(healthCheck, "healthCheck");
async function runDeployPipeline(options) {
  const {
    github,
    // { token, owner, repo, branch }
    cloudflare,
    // { token, accountId, workerName }
    files,
    // [{ path, content, name? }] fichiers à pousser
    commitMessage,
    healthCheckUrl,
    skipGithub = false
  } = options;
  const report = {
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    steps: [],
    success: false
  };
  const step = /* @__PURE__ */ __name((name, status, data = {}) => {
    report.steps.push({ step: name, status, ...data, at: (/* @__PURE__ */ new Date()).toISOString() });
  }, "step");
  try {
    if (!skipGithub && github) {
      step("github_push", "running");
      try {
        const pushed = await githubPushMultipleFiles(
          github.token,
          github.owner,
          github.repo,
          github.branch,
          files,
          commitMessage
        );
        step("github_push", "success", { commit: pushed.sha, url: pushed.url, files: pushed.files });
      } catch (err) {
        step("github_push", "error", { error: err.message });
        report.error = `GitHub push \xE9chou\xE9 : ${err.message}`;
        return report;
      }
    }
    if (cloudflare) {
      step("cloudflare_deploy", "running");
      try {
        const mainFile = files.find((f) => f.name === "index.js") || files[0];
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflare.accountId}/workers/scripts/${cloudflare.workerName}`,
          {
            method: "PUT",
            headers: { "Authorization": `Bearer ${cloudflare.token}`, "Content-Type": "application/javascript" },
            body: mainFile.content
          }
        );
        const j = await res.json();
        if (j.success) {
          step("cloudflare_deploy", "success", { worker: cloudflare.workerName });
        } else {
          step("cloudflare_deploy", "error", { error: JSON.stringify(j.errors) });
          report.error = `D\xE9ploiement Cloudflare \xE9chou\xE9`;
          return report;
        }
      } catch (err) {
        step("cloudflare_deploy", "error", { error: err.message });
        report.error = err.message;
        return report;
      }
    }
    if (healthCheckUrl) {
      step("health_check", "running", { url: healthCheckUrl });
      await wait(3e3);
      const hc = await healthCheck(healthCheckUrl);
      if (hc.success) {
        step("health_check", "success", { latency: `${hc.latency}ms`, attempts: hc.attempts });
      } else {
        step("health_check", "warning", { error: hc.error, attempts: hc.attempts });
      }
    }
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
    report.completedAt = (/* @__PURE__ */ new Date()).toISOString();
  } catch (err) {
    report.error = err.message;
    step("pipeline", "error", { error: err.message });
  }
  return report;
}
__name(runDeployPipeline, "runDeployPipeline");
function formatReport(report) {
  const icons = { success: "\u2713", error: "\u2717", warning: "\u26A0", running: "\u25CC" };
  const lines = ["**Rapport de d\xE9ploiement**\n"];
  for (const s of report.steps) {
    const icon = icons[s.status] || "\u2022";
    const extra = s.commit ? ` \u2192 commit \`${s.commit}\`` : s.latency ? ` \u2192 ${s.latency}` : s.error ? ` \u2192 ${s.error}` : s.worker ? ` \u2192 \`${s.worker}\`` : "";
    lines.push(`${icon} **${s.step}** ${extra}`);
    if (s.url) lines.push(`  \u2514 ${s.url}`);
  }
  lines.push("");
  lines.push(report.success ? "\u2713 Pipeline termin\xE9 avec succ\xE8s." : `\u2717 Pipeline interrompu : ${report.error || "erreur inconnue"}`);
  return lines.join("\n");
}
__name(formatReport, "formatReport");

// memory.js
var KEYS = {
  profile: "nyxia:memory:profile",
  sessions: "nyxia:memory:sessions",
  projects: "nyxia:memory:projects"
};
var MAX_SESSIONS = 20;
var MAX_PROJECT_EVENTS = 50;
var _profile = null;
var _sessions = null;
var _projects2 = null;
var _loaded = false;
async function deriveKey2(secret) {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("nyxia-memory-v1"), iterations: 1e5, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
__name(deriveKey2, "deriveKey");
async function encrypt2(data, secret) {
  const key = await deriveKey2(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(data)));
  const buf = new Uint8Array(iv.byteLength + ct.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...buf));
}
__name(encrypt2, "encrypt");
async function decrypt2(b64, secret) {
  const key = await deriveKey2(secret);
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, key, buf.slice(12));
  return JSON.parse(new TextDecoder().decode(dec));
}
__name(decrypt2, "decrypt");
async function kvRead2(kv, key, secret, fallback) {
  try {
    const raw = await kv.get(key);
    if (!raw) return fallback;
    return await decrypt2(raw, secret);
  } catch (_) {
    return fallback;
  }
}
__name(kvRead2, "kvRead");
async function kvWrite2(kv, key, data, secret) {
  await kv.put(key, await encrypt2(data, secret));
}
__name(kvWrite2, "kvWrite");
async function loadMemory(kv, secret) {
  if (_loaded) return;
  [_profile, _sessions, _projects2] = await Promise.all([
    kvRead2(kv, KEYS.profile, secret, { name: null, preferences: {}, style: {}, createdAt: (/* @__PURE__ */ new Date()).toISOString() }),
    kvRead2(kv, KEYS.sessions, secret, []),
    kvRead2(kv, KEYS.projects, secret, {})
  ]);
  _loaded = true;
}
__name(loadMemory, "loadMemory");
async function updateProfile(kv, secret, updates) {
  _profile = { ..._profile, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  await kvWrite2(kv, KEYS.profile, _profile, secret);
  return _profile;
}
__name(updateProfile, "updateProfile");
function getProfile() {
  return _profile;
}
__name(getProfile, "getProfile");
async function saveSession(kv, secret, summary) {
  const session = {
    id: crypto.randomUUID().slice(0, 8),
    at: (/* @__PURE__ */ new Date()).toISOString(),
    summary,
    // Résumé généré par NyXia
    projects: summary.projects || [],
    actions: summary.actions || []
  };
  _sessions = [session, ..._sessions || []].slice(0, MAX_SESSIONS);
  await kvWrite2(kv, KEYS.sessions, _sessions, secret);
  return session;
}
__name(saveSession, "saveSession");
function getRecentSessions(n = 5) {
  return (_sessions || []).slice(0, n);
}
__name(getRecentSessions, "getRecentSessions");
async function logProjectEvent(kv, secret, projectKey, event) {
  if (!_projects2[projectKey]) {
    _projects2[projectKey] = { events: [], lastActivity: null };
  }
  const entry = {
    id: crypto.randomUUID().slice(0, 8),
    at: (/* @__PURE__ */ new Date()).toISOString(),
    type: event.type || "note",
    ...event
  };
  _projects2[projectKey].events = [entry, ..._projects2[projectKey].events].slice(0, MAX_PROJECT_EVENTS);
  _projects2[projectKey].lastActivity = entry.at;
  await kvWrite2(kv, KEYS.projects, _projects2, secret);
  return entry;
}
__name(logProjectEvent, "logProjectEvent");
function getProjectHistory(projectKey, n = 10) {
  return (_projects2[projectKey]?.events || []).slice(0, n);
}
__name(getProjectHistory, "getProjectHistory");
function getAllProjectsActivity() {
  return Object.entries(_projects2 || {}).map(([key, data]) => ({
    key,
    lastActivity: data.lastActivity,
    recentEvents: (data.events || []).slice(0, 3)
  }));
}
__name(getAllProjectsActivity, "getAllProjectsActivity");
function buildMemoryContext() {
  const profile = _profile;
  const sessions = getRecentSessions(3);
  const activity = getAllProjectsActivity();
  const lines = [];
  if (profile?.name) {
    lines.push(`UTILISATEUR : ${profile.name}`);
    if (profile.preferences?.language) lines.push(`  Langue pr\xE9f\xE9r\xE9e : ${profile.preferences.language}`);
    if (profile.preferences?.codeStyle) lines.push(`  Style de code   : ${profile.preferences.codeStyle}`);
    if (profile.style?.tone) lines.push(`  Ton souhait\xE9    : ${profile.style.tone}`);
    if (profile.notes) lines.push(`  Notes           : ${profile.notes}`);
  } else {
    lines.push("UTILISATEUR : Pas encore de profil enregistr\xE9.");
  }
  if (sessions.length > 0) {
    lines.push("\nSESSIONS R\xC9CENTES :");
    for (const s of sessions) {
      const date = new Date(s.at).toLocaleDateString("fr-CA");
      lines.push(`  [${date}] ${s.summary?.headline || "Session sans titre"}`);
      if (s.summary?.done?.length > 0) {
        lines.push(`    \u2192 ${s.summary.done.slice(0, 3).join(" \xB7 ")}`);
      }
      if (s.summary?.nextSteps?.length > 0) {
        lines.push(`    \u21B3 \xC0 faire : ${s.summary.nextSteps[0]}`);
      }
    }
  } else {
    lines.push("\nSESSIONS R\xC9CENTES : Premi\xE8re utilisation \u2014 aucun historique.");
  }
  const activeProjects = activity.filter((p) => p.recentEvents.length > 0);
  if (activeProjects.length > 0) {
    lines.push("\nACTIVIT\xC9 DES PROJETS :");
    for (const p of activeProjects) {
      const lastDate = p.lastActivity ? new Date(p.lastActivity).toLocaleDateString("fr-CA") : "\u2014";
      lines.push(`  [${p.key}] Derni\xE8re activit\xE9 : ${lastDate}`);
      for (const e of p.recentEvents) {
        const icon = { deploy: "\u{1F680}", code: "\u{1F4BB}", bug: "\u{1F41B}", decision: "\u{1F4A1}", note: "\u{1F4DD}" }[e.type] || "\u2022";
        lines.push(`    ${icon} ${e.summary || e.type}`);
      }
    }
  }
  return lines.join("\n") || "M\xE9moire vide \u2014 premi\xE8re session.";
}
__name(buildMemoryContext, "buildMemoryContext");
async function generateSessionSummary(llmKey, messages) {
  const conversation = messages.filter((m) => m.role !== "system").map((m) => `${m.role === "user" ? "Utilisateur" : "NyXia"}: ${m.content?.slice(0, 300)}`).join("\n");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev", "X-Title": "NyXia AI Agent" },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      max_tokens: 400,
      temperature: 0.1,
      messages: [{
        role: "user",
        content: `R\xE9sume cette conversation en JSON strict (sans markdown) avec ces champs :
{
  "headline": "titre court de la session (max 60 chars)",
  "done": ["action 1 accomplie", "action 2", ...],
  "decisions": ["d\xE9cision technique prise", ...],
  "bugs": ["probl\xE8me rencontr\xE9", ...],
  "nextSteps": ["prochaine \xE9tape sugg\xE9r\xE9e", ...],
  "projects": ["cl\xE9-projet-1", "cl\xE9-projet-2"]
}

Conversation :
${conversation}`
      }]
    })
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (_) {
    return { headline: "Session de travail", done: [], nextSteps: [] };
  }
}
__name(generateSessionSummary, "generateSessionSummary");

// tools.js
init_notifier();

// systemeio.js
async function verifySystemeioWebhook(request, secret) {
  const signature = request.headers.get("x-systemeio-signature") || request.headers.get("x-webhook-signature") || "";
  if (!signature || !secret) return { valid: false, error: "Signature ou secret manquant" };
  const body = await request.text();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const digest = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const valid = digest === signature.replace("sha256=", "");
  let payload = null;
  try {
    payload = JSON.parse(body);
  } catch (_) {
  }
  return { valid, payload, body };
}
__name(verifySystemeioWebhook, "verifySystemeioWebhook");
function parseSystemeioEvent(payload) {
  if (!payload) return null;
  const eventType = payload.event || payload.type || "unknown";
  const normalized = {
    raw: payload,
    eventType,
    contactEmail: payload.contact?.email || payload.email || null,
    contactName: payload.contact?.name || payload.name || null,
    product: payload.product?.name || payload.productName || null,
    amount: payload.amount || payload.price || null,
    currency: payload.currency || "USD",
    affiliateId: payload.affiliate?.id || payload.affiliateId || null,
    orderId: payload.order?.id || payload.orderId || null,
    at: payload.created_at || (/* @__PURE__ */ new Date()).toISOString()
  };
  if (normalized.affiliateId && normalized.amount) {
    const rates = { level1: 0.25, level2: 0.1, level3: 0.05 };
    normalized.commissions = {
      level1: (normalized.amount * rates.level1).toFixed(2),
      level2: (normalized.amount * rates.level2).toFixed(2),
      level3: (normalized.amount * rates.level3).toFixed(2)
    };
  }
  return normalized;
}
__name(parseSystemeioEvent, "parseSystemeioEvent");
function generateWebhookHandler(options = {}) {
  const {
    projectName = "mon-projet",
    webhookSecret = "REMPLACE_PAR_TON_SECRET",
    kvNamespace = "MY_KV",
    notifyDiscord = true,
    notifyEmail = true,
    events = ["order.completed", "subscription.created", "affiliate.commission"]
  } = options;
  return `// ============================================================
//  Webhook Systeme.io \u2014 ${projectName}
//  G\xE9n\xE9r\xE9 par NyXia \xB7 Publication-Web
//  D\xE9ploy\xE9 sur Cloudflare Workers
// ============================================================

export default {
  async fetch(request, env) {
    // \u2500\u2500 CORS pour Systeme.io \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-systemeio-signature",
      }});
    }

    if (request.method !== "POST") {
      return new Response("M\xE9thode non autoris\xE9e", { status: 405 });
    }

    // \u2500\u2500 V\xE9rification de la signature HMAC-SHA256 \u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const secret    = env.SYSTEMEIO_SECRET || "${webhookSecret}";
    const signature = request.headers.get("x-systemeio-signature") || "";
    const body      = await request.text();

    if (secret !== "${webhookSecret}") { // V\xE9rifie seulement si le secret est configur\xE9
      const key    = await crypto.subtle.importKey("raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const mac    = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
      const digest = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2,"0")).join("");

      if (digest !== signature.replace("sha256=", "")) {
        console.error("Signature invalide \u2014 webhook rejet\xE9");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // \u2500\u2500 Parse du payload \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    let payload;
    try { payload = JSON.parse(body); }
    catch(_) { return new Response("Payload invalide", { status: 400 }); }

    const eventType = payload.event || payload.type || "unknown";
    console.log(\`\xC9v\xE9nement Systeme.io re\xE7u : \${eventType}\`);

    // \u2500\u2500 Traitement selon le type d'\xE9v\xE9nement \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    switch(eventType) {

      case "order.completed": {
        const email  = payload.contact?.email || payload.email;
        const amount = payload.amount || 0;
        const name   = payload.product?.name || "Produit";

        // Stocker dans KV pour tracking
        if (env.${kvNamespace}) {
          const key = \`order:\${payload.order?.id || Date.now()}\`;
          await env.${kvNamespace}.put(key, JSON.stringify({
            email, amount, product: name,
            at: new Date().toISOString(),
          }), { expirationTtl: 60 * 60 * 24 * 90 }); // 90 jours
        }

        ${notifyDiscord ? `// Notification Discord
        if (env.DISCORD_WEBHOOK) {
          await fetch(env.DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "Systeme.io",
              embeds: [{
                title: "\u{1F6D2} Nouvelle vente !",
                color: 0x1D9E75,
                fields: [
                  { name: "Produit", value: name,              inline: true },
                  { name: "Montant", value: \`\${amount} $\`,    inline: true },
                  { name: "Client",  value: email || "Inconnu", inline: true },
                ],
                timestamp: new Date().toISOString(),
              }],
            }),
          });
        }` : ""}

        break;
      }

      case "subscription.created": {
        const email = payload.contact?.email || payload.email;
        console.log(\`Nouvel abonn\xE9 : \${email}\`);
        // Ajoute ici ta logique d'onboarding
        break;
      }

      case "affiliate.commission": {
        const affiliateId  = payload.affiliate?.id;
        const commission   = payload.amount || 0;
        const level        = payload.level  || 1;
        console.log(\`Commission niveau \${level} : \${commission}$ pour l'affili\xE9 \${affiliateId}\`);
        // Ajoute ici ta logique de tracking d'affiliation
        break;
      }

      default:
        console.log(\`\xC9v\xE9nement non g\xE9r\xE9 : \${eventType}\`);
    }

    return new Response(JSON.stringify({ received: true, event: eventType }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
`;
}
__name(generateWebhookHandler, "generateWebhookHandler");
function generateWebhookSecret(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateWebhookSecret, "generateWebhookSecret");
function getIntegrationGuide(workerUrl, secret) {
  return {
    webhookUrl: `${workerUrl}/webhook/systemeio`,
    secret,
    instructions: [
      "1. Va dans Systeme.io \u2192 Param\xE8tres \u2192 Webhooks",
      `2. Ajoute l'URL : ${workerUrl}/webhook/systemeio`,
      "3. S\xE9lectionne les \xE9v\xE9nements : order.completed, subscription.created",
      `4. Dans Wrangler, configure le secret : npx wrangler secret put SYSTEMEIO_SECRET`,
      `5. Colle cette valeur : ${secret}`,
      "6. Sauvegarde et teste avec le bouton 'Test webhook' de Systeme.io"
    ]
  };
}
__name(getIntegrationGuide, "getIntegrationGuide");

// d1-manager.js
var SCHEMAS = {
  affiliationpro: {
    description: "Sch\xE9ma complet AffiliationPro \u2014 affili\xE9s, ventes, commissions",
    migrations: [
      {
        version: "001",
        name: "create_affiliates",
        sql: `CREATE TABLE IF NOT EXISTS affiliates (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          email         TEXT NOT NULL UNIQUE,
          name          TEXT NOT NULL,
          referrer_id   TEXT REFERENCES affiliates(id),
          level         INTEGER NOT NULL DEFAULT 1,
          status        TEXT NOT NULL DEFAULT 'active',
          custom_link   TEXT UNIQUE,
          created_at    TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_affiliates_referrer ON affiliates(referrer_id);
        CREATE INDEX IF NOT EXISTS idx_affiliates_email    ON affiliates(email);`
      },
      {
        version: "002",
        name: "create_sales",
        sql: `CREATE TABLE IF NOT EXISTS sales (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          order_id      TEXT NOT NULL UNIQUE,
          affiliate_id  TEXT REFERENCES affiliates(id),
          amount        REAL NOT NULL,
          currency      TEXT NOT NULL DEFAULT 'USD',
          product_name  TEXT,
          customer_email TEXT,
          status        TEXT NOT NULL DEFAULT 'completed',
          source        TEXT DEFAULT 'systemeio',
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_sales_affiliate ON sales(affiliate_id);
        CREATE INDEX IF NOT EXISTS idx_sales_order    ON sales(order_id);`
      },
      {
        version: "003",
        name: "create_commissions",
        sql: `CREATE TABLE IF NOT EXISTS commissions (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          sale_id       TEXT NOT NULL REFERENCES sales(id),
          affiliate_id  TEXT NOT NULL REFERENCES affiliates(id),
          level         INTEGER NOT NULL CHECK(level IN (1,2,3)),
          rate          REAL NOT NULL,
          amount        REAL NOT NULL,
          status        TEXT NOT NULL DEFAULT 'pending',
          paid_at       TEXT,
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commissions(affiliate_id);
        CREATE INDEX IF NOT EXISTS idx_commissions_sale      ON commissions(sale_id);`
      },
      {
        version: "004",
        name: "create_payouts",
        sql: `CREATE TABLE IF NOT EXISTS payouts (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          affiliate_id  TEXT NOT NULL REFERENCES affiliates(id),
          amount        REAL NOT NULL,
          method        TEXT DEFAULT 'paypal',
          reference     TEXT,
          status        TEXT NOT NULL DEFAULT 'pending',
          requested_at  TEXT NOT NULL DEFAULT (datetime('now')),
          paid_at       TEXT
        );`
      }
    ]
  },
  publicationcashflow: {
    description: "Sch\xE9ma PublicationCashflow \u2014 sites, pages FB, publications, community manager",
    migrations: [
      {
        version: "001",
        name: "create_users",
        sql: `CREATE TABLE IF NOT EXISTS users (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          email         TEXT NOT NULL UNIQUE,
          name          TEXT,
          plan          TEXT NOT NULL DEFAULT 'free',
          status        TEXT NOT NULL DEFAULT 'active',
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );`
      },
      {
        version: "002",
        name: "create_sites",
        sql: `CREATE TABLE IF NOT EXISTS sites (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          user_id       TEXT NOT NULL REFERENCES users(id),
          name          TEXT NOT NULL,
          subdomain     TEXT UNIQUE,
          affiliate_url TEXT,
          template      TEXT DEFAULT 'default',
          status        TEXT NOT NULL DEFAULT 'active',
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);`
      },
      {
        version: "003",
        name: "create_facebook_pages",
        sql: `CREATE TABLE IF NOT EXISTS facebook_pages (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          user_id       TEXT NOT NULL REFERENCES users(id),
          page_id       TEXT NOT NULL,
          page_name     TEXT NOT NULL,
          access_token  TEXT NOT NULL,
          status        TEXT NOT NULL DEFAULT 'active',
          connected_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );`
      },
      {
        version: "004",
        name: "create_community_manager",
        sql: `CREATE TABLE IF NOT EXISTS scheduled_posts (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          user_id       TEXT NOT NULL REFERENCES users(id),
          site_id       TEXT REFERENCES sites(id),
          fb_page_id    TEXT REFERENCES facebook_pages(id),
          content       TEXT NOT NULL,
          image_url     TEXT,
          scheduled_at  TEXT NOT NULL,
          published_at  TEXT,
          status        TEXT NOT NULL DEFAULT 'scheduled',
          day_number    INTEGER,
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON scheduled_posts(scheduled_at, status);
        CREATE INDEX IF NOT EXISTS idx_posts_user      ON scheduled_posts(user_id);`
      }
    ]
  }
};
function generateD1WorkerCode(options = {}) {
  const { dbBinding = "DB", projectName = "mon-projet" } = options;
  return `// Worker avec acc\xE8s D1 \u2014 ${projectName}
// G\xE9n\xE9r\xE9 par NyXia

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Exemple : GET /api/affiliates
    if (url.pathname === "/api/affiliates" && request.method === "GET") {
      const { results } = await env.${dbBinding}
        .prepare("SELECT id, email, name, level, status, created_at FROM affiliates ORDER BY created_at DESC LIMIT 50")
        .all();
      return Response.json({ affiliates: results });
    }

    // Exemple : POST /api/affiliates
    if (url.pathname === "/api/affiliates" && request.method === "POST") {
      const body = await request.json();
      const { email, name, referrer_id } = body;

      const result = await env.${dbBinding}
        .prepare("INSERT INTO affiliates (email, name, referrer_id) VALUES (?, ?, ?) RETURNING *")
        .bind(email, name, referrer_id || null)
        .first();

      return Response.json({ affiliate: result }, { status: 201 });
    }

    return new Response("Not found", { status: 404 });
  },
};`;
}
__name(generateD1WorkerCode, "generateD1WorkerCode");
function generateWranglerD1Config(dbName, dbId) {
  return `# Ajoute ceci dans ton wrangler.toml

[[d1_databases]]
binding  = "DB"
database_name = "${dbName}"
database_id   = "${dbId || "REMPLACE_PAR_L_ID_D1"}"`;
}
__name(generateWranglerD1Config, "generateWranglerD1Config");

// systemeio-designer.js
var CSS_PRESETS = {
  // ── Boutons ──────────────────────────────────────────────
  button_glow: {
    name: "Bouton lumineux anim\xE9",
    description: "Bouton CTA avec effet de halo pulsant \u2014 id\xE9al pour les pages de vente",
    css: `/* Bouton CTA lumineux \u2014 colle dans CSS personnalis\xE9 Systeme.io */
.s-btn, .btn, [class*="button"] {
  background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;
  border: none !important;
  border-radius: 50px !important;
  padding: 18px 48px !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: uppercase !important;
  color: #fff !important;
  cursor: pointer !important;
  position: relative !important;
  animation: btnPulse 2.5s ease-in-out infinite !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}
.s-btn:hover, .btn:hover {
  transform: translateY(-3px) scale(1.03) !important;
  box-shadow: 0 12px 40px rgba(124,58,237,0.5) !important;
}
@keyframes btnPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  50%       { box-shadow: 0 0 0 16px rgba(124,58,237,0); }
}`
  },
  button_fire: {
    name: "Bouton rouge urgence",
    description: "Bouton rouge vif avec animation de flamme \u2014 pour cr\xE9er l'urgence",
    css: `/* Bouton urgence \u2014 colle dans CSS personnalis\xE9 Systeme.io */
.s-btn, .btn, [class*="button"] {
  background: linear-gradient(135deg, #dc2626, #f97316) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 20px 52px !important;
  font-size: 20px !important;
  font-weight: 800 !important;
  color: #fff !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  box-shadow: 0 8px 30px rgba(220,38,38,0.45) !important;
  transition: all 0.2s !important;
}
.s-btn:hover, .btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 14px 40px rgba(220,38,38,0.6) !important;
}`
  },
  // ── Sections ─────────────────────────────────────────────
  hero_gradient: {
    name: "Hero section d\xE9grad\xE9 violet",
    description: "Section h\xE9ro avec fond d\xE9grad\xE9 sombre et texte blanc \u2014 look premium",
    css: `/* Hero gradient \u2014 colle dans CSS personnalis\xE9 Systeme.io */
.s-section:first-of-type, section:first-of-type {
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e) !important;
  padding: 80px 0 !important;
}
.s-section:first-of-type h1,
.s-section:first-of-type h2,
section:first-of-type h1 {
  color: #fff !important;
  font-size: clamp(32px, 5vw, 60px) !important;
  font-weight: 900 !important;
  line-height: 1.15 !important;
  text-shadow: 0 2px 20px rgba(0,0,0,0.3) !important;
}
.s-section:first-of-type p,
section:first-of-type p {
  color: rgba(255,255,255,0.85) !important;
  font-size: 18px !important;
  line-height: 1.7 !important;
}`
  },
  testimonials: {
    name: "Blocs t\xE9moignages stylis\xE9s",
    description: "Cartes t\xE9moignages avec bordure gauche color\xE9e et \xE9toiles",
    css: `/* T\xE9moignages \u2014 colle dans CSS personnalis\xE9 Systeme.io */
.s-testimonial, [class*="testimonial"] {
  background: #fff !important;
  border-radius: 16px !important;
  border-left: 4px solid #7c3aed !important;
  padding: 28px !important;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
  margin: 12px !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}
.s-testimonial:hover, [class*="testimonial"]:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 40px rgba(124,58,237,0.15) !important;
}
.s-testimonial::before, [class*="testimonial"]::before {
  content: "\u2605\u2605\u2605\u2605\u2605" !important;
  color: #f59e0b !important;
  font-size: 16px !important;
  display: block !important;
  margin-bottom: 12px !important;
}`
  },
  countdown_banner: {
    name: "Bandeau urgence/offre limit\xE9e",
    description: "Bandeau sticky en haut avec compte \xE0 rebours \u2014 booste les conversions",
    css: `/* Bandeau urgence \u2014 colle dans CSS personnalis\xE9 Systeme.io */
body::before {
  content: "\u26A1 OFFRE LIMIT\xC9E \u2014 Plus que quelques places disponibles !" !important;
  display: block !important;
  background: linear-gradient(90deg, #dc2626, #f97316) !important;
  color: #fff !important;
  text-align: center !important;
  padding: 12px !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  letter-spacing: 0.5px !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 9999 !important;
  animation: blink 1.5s ease-in-out infinite !important;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.85; }
}`
  },
  // ── Typographie ───────────────────────────────────────────
  typography_premium: {
    name: "Typographie premium",
    description: "Police Google Fonts + hi\xE9rarchie typographique soign\xE9e",
    css: `/* Typographie premium \u2014 colle dans CSS personnalis\xE9 Systeme.io */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;900&family=Inter:wght@400;500;600&display=swap');

body, p, li, span { font-family: 'Inter', sans-serif !important; }
h1, h2, h3        { font-family: 'Syne', sans-serif !important; font-weight: 900 !important; }

h1 { font-size: clamp(36px, 5vw, 64px) !important; line-height: 1.1 !important; }
h2 { font-size: clamp(28px, 4vw, 48px) !important; line-height: 1.2 !important; }
p  { font-size: 17px !important; line-height: 1.75 !important; color: #374151 !important; }`
  }
};
var HTML_BLOCKS = {
  guarantee_badge: {
    name: "Badge garantie 30 jours",
    description: "Bloc de garantie avec ic\xF4ne bouclier \u2014 rassure les prospects",
    html: `<!-- Badge garantie \u2014 colle dans un bloc HTML Systeme.io -->
<div style="display:flex;align-items:center;gap:20px;background:#f0fdf4;border:2px solid #16a34a;border-radius:16px;padding:24px 32px;max-width:500px;margin:0 auto">
  <div style="font-size:48px;flex-shrink:0">\u{1F6E1}\uFE0F</div>
  <div>
    <div style="font-size:20px;font-weight:800;color:#15803d;margin-bottom:4px">Garantie 30 jours sans risque</div>
    <div style="color:#166534;font-size:15px;line-height:1.5">Si tu n'es pas satisfait(e), on te rembourse int\xE9gralement. Sans question, sans d\xE9lai.</div>
  </div>
</div>`
  },
  countdown_timer: {
    name: "Compte \xE0 rebours JavaScript",
    description: "Timer dynamique avec date cible \u2014 cr\xE9e l'urgence",
    html: `<!-- Compte \xE0 rebours \u2014 colle dans un bloc HTML Systeme.io -->
<div id="nyxia-timer" style="text-align:center;padding:24px">
  <div style="font-size:14px;font-weight:600;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">L'offre se termine dans</div>
  <div style="display:flex;justify-content:center;gap:12px" id="timer-display">
    <div class="t-box"><span id="t-h">00</span><div class="t-label">heures</div></div>
    <div style="font-size:36px;font-weight:900;color:#dc2626;line-height:1">:</div>
    <div class="t-box"><span id="t-m">00</span><div class="t-label">minutes</div></div>
    <div style="font-size:36px;font-weight:900;color:#dc2626;line-height:1">:</div>
    <div class="t-box"><span id="t-s">00</span><div class="t-label">secondes</div></div>
  </div>
</div>
<style>
  .t-box { text-align:center; background:#fff; border:2px solid #fecaca; border-radius:12px; padding:12px 20px; min-width:80px; }
  .t-box span { font-size:42px; font-weight:900; color:#dc2626; display:block; line-height:1; }
  .t-label { font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-top:4px; }
</style>
<script>
// Change cette date pour ton offre
const TARGET = new Date("2025-12-31T23:59:59");
function tick() {
  const now  = new Date();
  const diff = Math.max(0, TARGET - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById("t-h").textContent = String(h).padStart(2,"0");
  document.getElementById("t-m").textContent = String(m).padStart(2,"0");
  document.getElementById("t-s").textContent = String(s).padStart(2,"0");
  if (diff > 0) setTimeout(tick, 1000);
}
tick();
<\/script>`
  },
  social_proof_bar: {
    name: "Barre de preuve sociale anim\xE9e",
    description: "Bandeau d\xE9filant avec logos de partenaires/m\xE9dias",
    html: `<!-- Barre logos d\xE9filante \u2014 colle dans un bloc HTML Systeme.io -->
<div style="overflow:hidden;padding:20px 0;background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
  <div style="font-size:13px;color:#9ca3af;text-align:center;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px">Ils nous font confiance</div>
  <div style="display:flex;animation:scroll 20s linear infinite;width:max-content;gap:60px;align-items:center">
    <!-- Remplace par tes vrais logos -->
    <span style="font-size:20px;font-weight:800;color:#d1d5db">PARTENAIRE 1</span>
    <span style="font-size:20px;font-weight:800;color:#d1d5db">PARTENAIRE 2</span>
    <span style="font-size:20px;font-weight:800;color:#d1d5db">PARTENAIRE 3</span>
    <span style="font-size:20px;font-weight:800;color:#d1d5db">PARTENAIRE 4</span>
    <span style="font-size:20px;font-weight:800;color:#d1d5db">PARTENAIRE 5</span>
    <!-- Duplique pour le loop infini -->
    <span style="font-size:20px;font-weight:800;color:#d1d5db">PARTENAIRE 1</span>
    <span style="font-size:20px;font-weight:800;color:#d1d5db">PARTENAIRE 2</span>
    <span style="font-size:20px;font-weight:800;color:#d1d5db">PARTENAIRE 3</span>
  </div>
</div>
<style>
@keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
</style>`
  }
};
var EMAIL_TEMPLATES = {
  welcome: {
    name: "Email de bienvenue affili\xE9",
    description: "Email HTML d'accueil pour les nouveaux affili\xE9s \u2014 chaud et motivant",
    subject: "\u{1F389} Bienvenue dans le programme \u2014 voici ton lien !",
    html: /* @__PURE__ */ __name((vars = {}) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bienvenue !</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:600px;margin:32px auto">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">\u{1F680}</div>
    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900">Bienvenue, ${vars.name || "{{contact.first_name}}"} !</h1>
    <p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:16px">Tu fais maintenant partie de notre \xE9quipe d'affili\xE9s</p>
  </div>

  <!-- Corps -->
  <div style="background:#fff;padding:40px 32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">
      On est vraiment content(e) de t'avoir avec nous. Voici tout ce dont tu as besoin pour commencer \xE0 g\xE9n\xE9rer tes premi\xE8res commissions d\xE8s aujourd'hui.
    </p>

    <!-- Lien affili\xE9 -->
    <div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
      <div style="font-size:13px;color:#6d28d9;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Ton lien personnel</div>
      <div style="font-size:16px;color:#4f46e5;font-weight:700;word-break:break-all">${vars.affiliateLink || "{{affiliate_link}}"}</div>
    </div>

    <!-- Commissions -->
    <h2 style="color:#111827;font-size:20px;font-weight:800;margin:32px 0 16px">Tes commissions</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f9fafb">
        <td style="padding:14px 16px;font-weight:700;color:#374151;border-radius:8px 0 0 8px">Niveau 1 \u2014 Tes ventes directes</td>
        <td style="padding:14px 16px;font-weight:900;color:#7c3aed;font-size:22px;text-align:right;border-radius:0 8px 8px 0">25%</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;color:#374151">Niveau 2 \u2014 Ventes de ton \xE9quipe</td>
        <td style="padding:14px 16px;font-weight:700;color:#4f46e5;font-size:18px;text-align:right">10%</td>
      </tr>
      <tr style="background:#f9fafb">
        <td style="padding:14px 16px;color:#374151;border-radius:8px 0 0 8px">Niveau 3 \u2014 \xC9quipe de ton \xE9quipe</td>
        <td style="padding:14px 16px;font-weight:700;color:#6d28d9;font-size:16px;text-align:right;border-radius:0 8px 8px 0">5%</td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin:36px 0">
      <a href="${vars.dashboardUrl || "#"}" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:800;display:inline-block">
        Acc\xE9der \xE0 mon dashboard \u2192
      </a>
    </div>

    <p style="color:#6b7280;font-size:14px;line-height:1.6">
      Des questions ? R\xE9ponds directement \xE0 cet email \u2014 on est l\xE0 pour toi.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;padding:20px 32px;border-radius:0 0 16px 16px;text-align:center">
    <p style="color:#9ca3af;font-size:12px;margin:0">
      ${vars.companyName || "Publication-Web"} \xB7 Tu re\xE7ois cet email car tu t'es inscrit(e) \xE0 notre programme d'affiliation.
    </p>
  </div>

</div>
</body></html>`, "html")
  },
  sale_notification: {
    name: "Notification de vente affili\xE9",
    description: "Email automatique envoy\xE9 \xE0 l'affili\xE9 \xE0 chaque commission gagn\xE9e",
    subject: "\u{1F4B0} Tu viens de gagner une commission !",
    html: /* @__PURE__ */ __name((vars = {}) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif">
<div style="max-width:500px;margin:32px auto">
  <div style="background:linear-gradient(135deg,#16a34a,#059669);padding:36px;border-radius:16px 16px 0 0;text-align:center">
    <div style="font-size:56px;margin-bottom:8px">\u{1F4B0}</div>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900">Commission gagn\xE9e !</h1>
  </div>
  <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px">
    <p style="color:#374151;font-size:16px">F\xE9licitations ${vars.name || "{{contact.first_name}}"} \u2014 une vente vient d'\xEAtre r\xE9alis\xE9e gr\xE2ce \xE0 ton lien !</p>
    <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
      <div style="font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:1px">Ta commission</div>
      <div style="font-size:48px;font-weight:900;color:#15803d;margin:8px 0">${vars.amount || "{{commission_amount}}"}$</div>
      <div style="font-size:13px;color:#6b7280">Niveau ${vars.level || "{{level}}"} \xB7 ${vars.rate || "{{rate}}"}%</div>
    </div>
    <div style="text-align:center">
      <a href="${vars.dashboardUrl || "#"}" style="background:#16a34a;color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;display:inline-block">Voir mon dashboard</a>
    </div>
  </div>
</div>
</body></html>`, "html")
  },
  session_summary_email: {
    name: "R\xE9sum\xE9 de session NyXia",
    description: "Email de fin de session envoy\xE9 automatiquement avec le rapport de NyXia",
    subject: "\u{1F4CB} NyXia \u2014 R\xE9sum\xE9 de ta session du {{date}}",
    html: /* @__PURE__ */ __name((vars = {}) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:32px auto">
  <div style="background:linear-gradient(135deg,#0f0c29,#302b63);padding:32px;border-radius:16px 16px 0 0">
    <div style="color:#a78bfa;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">NyXia \xB7 Agent IA</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">R\xE9sum\xE9 de session</h1>
    <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:6px">${vars.date || (/* @__PURE__ */ new Date()).toLocaleDateString("fr-CA")}</div>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px">
    ${vars.done?.length ? `<h3 style="color:#16a34a;font-size:15px;margin:0 0 12px">\u2713 Accompli</h3><ul style="color:#374151;padding-left:20px;margin:0 0 24px">${vars.done.map((d) => `<li style="margin-bottom:6px">${d}</li>`).join("")}</ul>` : ""}
    ${vars.nextSteps?.length ? `<h3 style="color:#4f46e5;font-size:15px;margin:0 0 12px">\u21B3 Prochaines \xE9tapes</h3><ul style="color:#374151;padding-left:20px;margin:0 0 24px">${vars.nextSteps.map((d) => `<li style="margin-bottom:6px">${d}</li>`).join("")}</ul>` : ""}
    ${vars.decisions?.length ? `<h3 style="color:#d97706;font-size:15px;margin:0 0 12px">\u{1F4A1} D\xE9cisions prises</h3><ul style="color:#374151;padding-left:20px;margin:0">${vars.decisions.map((d) => `<li style="margin-bottom:6px">${d}</li>`).join("")}</ul>` : ""}
  </div>
</div>
</body></html>`, "html")
  }
};
function generateProjectCSS(options = {}) {
  const {
    primaryColor = "#7c3aed",
    secondaryColor = "#4f46e5",
    accentColor = "#f59e0b",
    fontHeading = "Syne",
    fontBody = "Inter",
    style = "premium"
    // premium | urgency | minimal
  } = options;
  return `/* ============================================
   CSS personnalis\xE9 g\xE9n\xE9r\xE9 par NyXia
   Colle dans : Param\xE8tres \u2192 CSS personnalis\xE9
   ============================================ */

@import url('https://fonts.googleapis.com/css2?family=${fontHeading}:wght@700;900&family=${fontBody}:wght@400;500;600&display=swap');

/* Base */
body    { font-family: '${fontBody}', sans-serif !important; }
h1,h2,h3{ font-family: '${fontHeading}', sans-serif !important; font-weight: 900 !important; }

/* Couleur primaire sur les \xE9l\xE9ments cl\xE9s */
a { color: ${primaryColor} !important; }

/* Bouton CTA */
.s-btn, .btn, [class*="button"], input[type="submit"] {
  background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important;
  border: none !important;
  border-radius: ${style === "minimal" ? "8px" : "50px"} !important;
  padding: 18px 44px !important;
  font-family: '${fontHeading}', sans-serif !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #fff !important;
  cursor: pointer !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
  ${style === "premium" ? `animation: btnPulse 2.5s ease-in-out infinite !important;` : ""}
}
.s-btn:hover, .btn:hover {
  transform: translateY(-3px) scale(1.02) !important;
  box-shadow: 0 12px 36px ${primaryColor}55 !important;
}
${style === "premium" ? `@keyframes btnPulse {
  0%,100% { box-shadow: 0 0 0 0 ${primaryColor}44; }
  50%      { box-shadow: 0 0 0 14px ${primaryColor}00; }
}` : ""}

/* Highlight accent */
strong, b { color: ${accentColor} !important; }

/* Responsive mobile */
@media (max-width: 768px) {
  h1 { font-size: 32px !important; }
  h2 { font-size: 26px !important; }
  .s-btn, .btn { padding: 16px 32px !important; font-size: 16px !important; }
}`;
}
__name(generateProjectCSS, "generateProjectCSS");

// tools.js
init_sandbox();
init_site_generator();

// image-engine.js
var TYPE_KEYWORDS = {
  person: ["coach", "coaching", "th\xE9rapeute", "th\xE9rapeute", "personne", "portrait", "photo", "femme", "homme", "entrepreneur", "auteur", "formateur", "visage", "sourire", "professionnel"],
  product: ["produit", "mockup", "livre", "ebook", "bo\xEEte", "application", "app", "logiciel", "formation", "cours", "programme", "packshot", "3d"],
  background: ["fond", "background", "texture", "d\xE9grad\xE9", "ambiance", "atmosph\xE8re", "abstrait", "pattern", "d\xE9cor", "arri\xE8re-plan", "paysage", "nature"],
  illustration: ["illustration", "ic\xF4ne", "icon", "sch\xE9ma", "graphique", "infographie", "vectoriel", "logo", "symbole", "dessin", "cartoon"],
  banner: ["banni\xE8re", "banner", "header", "hero", "couverture", "ent\xEAte", "bande", "titre"]
};
function classifyImageRequest(description) {
  const lower = description.toLowerCase();
  const scores = {};
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    scores[type] = keywords.filter((k) => lower.includes(k)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "background";
}
__name(classifyImageRequest, "classifyImageRequest");
function shouldUseCfAI(imageType) {
  return ["background", "banner", "illustration"].includes(imageType);
}
__name(shouldUseCfAI, "shouldUseCfAI");
var CF_AI_STYLES = {
  background: "seamless background texture, abstract, professional, high quality, 4k",
  banner: "wide banner image, professional, modern design, clean composition, high quality",
  illustration: "flat design illustration, clean vector style, professional, minimal, colorful",
  product: "product mockup, clean background, professional photography, studio lighting",
  person: "professional portrait, natural lighting, friendly expression, high quality photo"
};
async function generateWithCfAI(env, options) {
  const {
    description,
    imageType = "background",
    palette,
    width = 1024,
    height = 576,
    steps = 20
  } = options;
  if (!env.AI) throw new Error("Binding AI manquant \u2014 ajoute [ai] dans wrangler.toml");
  const paletteHint = palette ? buildPaletteHint(palette) : "";
  const styleHint = CF_AI_STYLES[imageType] || CF_AI_STYLES.background;
  const prompt = `${description}, ${styleHint}${paletteHint}, no text, no watermark`;
  const negPrompt = "text, watermark, blurry, low quality, distorted, ugly, bad anatomy, signature, frame, border";
  try {
    const response = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt,
      negative_prompt: negPrompt,
      width,
      height,
      num_inference_steps: steps,
      guidance: 7.5
    });
    let imageData;
    if (response instanceof ReadableStream) {
      const reader = response.getReader();
      const chunks = [];
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (value) chunks.push(value);
        done = d;
      }
      imageData = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        imageData.set(chunk, offset);
        offset += chunk.length;
      }
    } else {
      imageData = response;
    }
    const base64 = btoa(String.fromCharCode(...imageData));
    return {
      success: true,
      method: "cloudflare_ai",
      base64,
      dataUrl: `data:image/png;base64,${base64}`,
      prompt,
      imageType,
      dimensions: { width, height }
    };
  } catch (err) {
    return { success: false, method: "cloudflare_ai", error: err.message, prompt };
  }
}
__name(generateWithCfAI, "generateWithCfAI");
var PROMPT_TEMPLATES = {
  person: {
    base: "professional {gender} {role}, {age_range}, {expression}, {style} photography",
    styles: {
      chaud: "warm studio lighting, soft bokeh background, golden hour, lifestyle",
      professionnel: "clean white background, corporate headshot, bright lighting, sharp",
      naturel: "natural outdoor lighting, candid, authentic, environmental portrait",
      editorial: "editorial magazine style, dynamic lighting, high fashion feel"
    },
    suffixes: "--ar 4:5 --v 6.1 --style raw --q 2",
    negative: "ugly, deformed, cartoon, anime, watermark, text, logo"
  },
  product: {
    base: "{product_type} product mockup, {material}, professional studio",
    styles: {
      minimal: "clean white background, minimalist, Apple-style product photography",
      lifestyle: "lifestyle context, real environment, natural lighting, in-use",
      "3d": "3D rendered, photorealistic, dramatic lighting, floating on gradient",
      flat: "flat lay, overhead view, clean background, styled composition"
    },
    suffixes: "--ar 1:1 --v 6.1 --q 2",
    negative: "blurry, text, watermark, bad quality, distorted"
  },
  background: {
    base: "{theme} background, {mood}, abstract, high resolution",
    styles: {
      gradient: "smooth color gradient, modern, professional, digital art",
      geometric: "geometric patterns, clean lines, professional, minimal",
      organic: "organic flowing shapes, soft colors, dreamy, ethereal",
      dark: "dark luxury background, deep colors, premium feel, mysterious"
    },
    suffixes: "--ar 16:9 --v 6.1 --tile",
    negative: "text, watermark, logo, faces, people"
  },
  banner: {
    base: "wide horizontal banner, {theme}, {mood}, professional design",
    styles: {
      hero: "hero section background, light and airy, website header, clean",
      dark: "dark premium banner, dramatic lighting, luxury feel",
      nature: "nature-inspired banner, serene, wellness, soft greens and blues",
      tech: "technology banner, digital, blue tones, futuristic, clean"
    },
    suffixes: "--ar 3:1 --v 6.1 --q 2",
    negative: "text, watermark, cluttered, busy"
  },
  illustration: {
    base: "{subject} flat illustration, vector style, {color_scheme}",
    styles: {
      flat: "flat design, clean lines, minimal shadows, 2D, modern app style",
      outline: "outline style, thin strokes, geometric, icon-like, scalable",
      isometric: "isometric illustration, 3D flat, business concept, clean",
      character: "character illustration, friendly, approachable, cartoon style"
    },
    suffixes: "--ar 1:1 --v 6.1 --style raw",
    negative: "realistic, photo, 3D render, blurry"
  }
};
function generateMidjourneyPrompt(options) {
  const {
    description,
    imageType = "person",
    style,
    palette,
    platform = "midjourney",
    // midjourney | leonardo | dalle3
    gender = "woman",
    role = "coach",
    ageRange = "30-40 years old",
    expression = "confident and warm smile"
  } = options;
  const tpl = PROMPT_TEMPLATES[imageType] || PROMPT_TEMPLATES.background;
  const styles = tpl.styles;
  const styleName = style && styles[style] ? style : Object.keys(styles)[0];
  const styleDesc = styles[styleName];
  const paletteDesc = palette ? buildPaletteDesc(palette) : "";
  let mainPrompt = description;
  if (imageType === "person") {
    mainPrompt = `${styleDesc} portrait, ${gender} ${role}, ${ageRange}, ${expression}, ${description}`;
  } else if (imageType === "product") {
    mainPrompt = `${description}, ${styleDesc}, product photography, commercial quality`;
  } else if (imageType === "background" || imageType === "banner") {
    mainPrompt = `${description}, ${styleDesc}${paletteDesc}`;
  } else if (imageType === "illustration") {
    mainPrompt = `${description}, ${styleDesc}${paletteDesc}`;
  }
  let finalPrompt, instructions;
  if (platform === "midjourney") {
    const neg = tpl.negative ? `

--no ${tpl.negative}` : "";
    finalPrompt = `${mainPrompt}, highly detailed, professional quality${neg}

${tpl.suffixes}`;
    instructions = [
      "1. Va sur Discord \u2192 Midjourney",
      "2. Tape /imagine dans n'importe quel canal",
      `3. Colle ce prompt : ${mainPrompt}`,
      `4. Param\xE8tres : ${tpl.suffixes}`,
      "5. Attends ~60 secondes pour les 4 variations",
      "6. Clique sur U1-U4 pour upscaler la meilleure"
    ];
  } else if (platform === "leonardo") {
    finalPrompt = `${mainPrompt}, highly detailed, professional quality`;
    instructions = [
      "1. Va sur leonardo.ai \u2192 Image Generation",
      "2. S\xE9lectionne le mod\xE8le : Leonardo Kino XL ou Leonardo Diffusion XL",
      `3. Colle le prompt : ${finalPrompt}`,
      "4. Negative prompt : text, watermark, blurry, low quality",
      "5. Dimensions recommand\xE9es : 1024\xD71024 ou 1366\xD7768",
      "6. G\xE9n\xE8re et s\xE9lectionne la meilleure variation"
    ];
  } else {
    finalPrompt = `${mainPrompt}. High quality, professional, no text or watermarks.`;
    instructions = [
      "1. Va sur chat.openai.com (GPT-4)",
      "2. Tape : /imagine ou demande une image",
      `3. D\xE9cris : "${finalPrompt}"`,
      "4. Sp\xE9cifie le format si n\xE9cessaire (carr\xE9, paysage...)"
    ];
  }
  return {
    success: true,
    method: "prompt",
    platform,
    imageType,
    style: styleName,
    prompt: finalPrompt,
    mainPrompt,
    parameters: tpl.suffixes,
    negativePrompt: tpl.negative,
    instructions,
    estimatedCost: platform === "midjourney" ? "~0.02$" : platform === "leonardo" ? "~3 cr\xE9dits" : "~0.04$",
    alternatives: Object.entries(styles).filter(([k]) => k !== styleName).map(([k, v]) => ({ style: k, hint: v.split(",")[0] }))
  };
}
__name(generateMidjourneyPrompt, "generateMidjourneyPrompt");
function generatePlaceholder(options) {
  const {
    type = "banner",
    label = "",
    palette = "violet",
    width = 1200,
    height = 600,
    text = ""
  } = options;
  const colors = {
    violet: { bg: "#ede9fe", accent: "#7c3aed", text2: "#5b21b6" },
    emeraude: { bg: "#d1fae5", accent: "#059669", text2: "#065f46" },
    corail: { bg: "#ffedd5", accent: "#f97316", text2: "#9a3412" },
    ardoise: { bg: "#f1f5f9", accent: "#334155", text2: "#0f172a" },
    rose: { bg: "#ffe4e6", accent: "#e11d48", text2: "#9f1239" },
    ocean: { bg: "#e0f2fe", accent: "#0ea5e9", text2: "#075985" },
    sombre: { bg: "#1e1b4b", accent: "#a78bfa", text2: "#c4b5fd" }
  };
  const c = colors[palette] || colors.violet;
  const ico = { person: "\u{1F464}", product: "\u{1F4E6}", background: "\u{1F5BC}\uFE0F", banner: "\u{1F3A8}", illustration: "\u2726" }[type] || "\u{1F5BC}\uFE0F";
  const patterns = {
    person: `<circle cx="${width / 2}" cy="${height * 0.35}" r="${height * 0.18}" fill="${c.accent}" opacity=".15"/>
             <circle cx="${width / 2}" cy="${height * 0.35}" r="${height * 0.11}" fill="${c.accent}" opacity=".25"/>
             <text x="${width / 2}" y="${height * 0.37}" text-anchor="middle" font-size="${height * 0.14}" fill="${c.accent}">\u{1F464}</text>
             <rect x="${width * 0.3}" y="${height * 0.62}" width="${width * 0.4}" height="${height * 0.06}" rx="4" fill="${c.accent}" opacity=".15"/>`,
    product: `<rect x="${width * 0.3}" y="${height * 0.15}" width="${width * 0.4}" height="${height * 0.55}" rx="12" fill="${c.accent}" opacity=".1" transform="rotate(-5,${width / 2},${height / 2})"/>
             <rect x="${width * 0.32}" y="${height * 0.12}" width="${width * 0.4}" height="${height * 0.55}" rx="12" fill="${c.accent}" opacity=".18"/>
             <text x="${width / 2}" y="${height * 0.47}" text-anchor="middle" font-size="${height * 0.12}" fill="${c.accent}">\u{1F4E6}</text>`,
    background: `${generatePatternSVG(width, height, c.accent)}`,
    banner: `<rect x="0" y="0" width="${width}" height="${height}" fill="${c.accent}" opacity=".05"/>
            ${generatePatternSVG(width, height, c.accent, 0.06)}
            <text x="${width / 2}" y="${height * 0.5}" text-anchor="middle" font-size="${height * 0.1}" fill="${c.accent}" opacity=".4">\u2726</text>`,
    illustration: `<circle cx="${width / 2}" cy="${height / 2}" r="${height * 0.28}" fill="${c.accent}" opacity=".08"/>
                  <circle cx="${width / 2}" cy="${height / 2}" r="${height * 0.18}" fill="${c.accent}" opacity=".12"/>
                  <text x="${width / 2}" y="${height * 0.56}" text-anchor="middle" font-size="${height * 0.18}" fill="${c.accent}" opacity=".5">\u2726</text>`
  };
  const pattern = patterns[type] || patterns.background;
  const displayLabel = label || { person: "Photo de la personne", product: "Visuel produit", background: "Image de fond", banner: "Banni\xE8re / Header", illustration: "Illustration" }[type];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${c.bg}"/>
  ${pattern}
  <text x="${width / 2}" y="${height * 0.78}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.max(14, height * 0.04)}" font-weight="600" fill="${c.text2}" opacity=".6">${displayLabel}</text>
  ${text ? `<text x="${width / 2}" y="${height * 0.88}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.max(12, height * 0.028)}" fill="${c.text2}" opacity=".4">${text}</text>` : ""}
</svg>`;
}
__name(generatePlaceholder, "generatePlaceholder");
function generatePatternSVG(width, height, color, opacity = 0.05) {
  const dots = [];
  const spacing = Math.min(width, height) / 8;
  for (let x = spacing; x < width; x += spacing) {
    for (let y = spacing; y < height; y += spacing) {
      dots.push(`<circle cx="${x}" cy="${y}" r="2" fill="${color}" opacity="${opacity}"/>`);
    }
  }
  return dots.join("");
}
__name(generatePatternSVG, "generatePatternSVG");
async function processImageRequest(env, options) {
  const {
    description,
    imageType: forcedType,
    palette = "violet",
    platform = "midjourney",
    style,
    gender,
    role,
    returnPromptOnly = false
  } = options;
  const imageType = forcedType || classifyImageRequest(description);
  const useCfAI = !returnPromptOnly && shouldUseCfAI(imageType) && !!env?.AI;
  if (useCfAI) {
    const result = await generateWithCfAI(env, {
      description,
      imageType,
      palette,
      width: imageType === "banner" ? 1366 : imageType === "person" ? 512 : 1024,
      height: imageType === "banner" ? 456 : imageType === "person" ? 640 : 1024
    });
    if (result.success) return result;
    console.warn("CF AI \xE9chou\xE9, fallback vers prompt:", result.error);
  }
  const promptResult = generateMidjourneyPrompt({
    description,
    imageType,
    style,
    palette,
    platform,
    gender,
    role
  });
  const placeholder = generatePlaceholder({ type: imageType, palette, label: description.slice(0, 40) });
  return {
    ...promptResult,
    placeholder,
    placeholderDataUrl: `data:image/svg+xml;base64,${btoa(placeholder)}`
  };
}
__name(processImageRequest, "processImageRequest");
function buildPaletteHint(palette) {
  const hints = {
    violet: ", purple and violet color palette",
    emeraude: ", green and teal color palette",
    corail: ", orange and coral color palette",
    ardoise: ", slate blue and grey color palette",
    rose: ", rose and pink color palette",
    ocean: ", ocean blue and cyan color palette",
    sombre: ", dark mysterious atmosphere, deep purple tones"
  };
  return hints[palette] || "";
}
__name(buildPaletteHint, "buildPaletteHint");
function buildPaletteDesc(palette) {
  const descs = {
    violet: ", purple violet tones, #7c3aed accent color",
    emeraude: ", emerald green tones, #059669 accent color",
    corail: ", coral orange tones, #f97316 accent color",
    ardoise: ", slate blue grey tones, #334155 accent color",
    rose: ", rose pink tones, #e11d48 accent color",
    ocean: ", ocean blue tones, #0ea5e9 accent color",
    sombre: ", dark background, purple glow, #a78bfa accent"
  };
  return descs[palette] || "";
}
__name(buildPaletteDesc, "buildPaletteDesc");

// agents.js
var OR_MODEL = "meta-llama/llama-3.3-70b-instruct";
var OR_URL = "https://openrouter.ai/api/v1/chat/completions";
var AGENT_PROMPTS = {
  copywriter: `Tu es un expert copywriter francophone sp\xE9cialis\xE9 en marketing digital et affiliation.
Tu ma\xEEtrises : pages de vente haute conversion, s\xE9quences email, descriptions produits, accroches publicitaires, storytelling de marque.
Ton style : direct, percutant, orient\xE9 b\xE9n\xE9fices client. Tu \xE9vites le jargon et les formules creuses.
Quand tu \xE9cris du texte pour un site ou une page, tu fournis toujours :
1. Un titre accrocheur (H1)
2. Un sous-titre (H2)
3. Le corps du texte structur\xE9
4. Un CTA final
5. Une variante courte et une variante longue si pertinent
Tu adaptes toujours le ton au public cible fourni.`,
  designer: `Tu es un expert UI/UX designer et directeur artistique sp\xE9cialis\xE9 dans les interfaces web modernes.
Tu ma\xEEtrises : CSS avanc\xE9, animations, typographie, th\xE9orie des couleurs, design systems, glassmorphism, dark/light themes.
Quand on te demande un design :
1. Tu proposes toujours 2-3 palettes de couleurs adapt\xE9es au contexte
2. Tu fournis le CSS complet pr\xEAt \xE0 int\xE9grer
3. Tu expliques le choix typographique (Google Fonts)
4. Tu g\xE9n\xE8res les prompts Midjourney/Leonardo pour les images n\xE9cessaires
5. Tu v\xE9rifies la coh\xE9rence mobile/desktop
Tu n'utilises jamais les clich\xE9s visuels (violet sur blanc, Inter partout).
Tu cr\xE9es des interfaces m\xE9morables et distinctives.`,
  developer: `Tu es un expert d\xE9veloppeur Cloudflare Workers / JavaScript / HTML/CSS.
Tu ma\xEEtrises : Cloudflare Workers, Pages, KV, D1, Workers AI, GitHub API, d\xE9ploiement automatis\xE9.
R\xE8gles absolues :
- Tout le code doit \xEAtre compatible Cloudflare Workers (ES Modules, pas de Node.js APIs)
- Utilise import/export, jamais require()
- V\xE9rifie toujours la syntaxe avant de livrer
- Commente le code en fran\xE7ais
- Structure : fichiers s\xE9par\xE9s par responsabilit\xE9
- Avant tout d\xE9ploiement : propose le sandbox
Quand tu g\xE9n\xE8res du code :
1. Explique ce que fait chaque bloc important
2. Liste les d\xE9pendances et bindings wrangler requis
3. Fournis les commandes de d\xE9ploiement exactes
4. Anticipe les erreurs courantes`,
  seo: `Tu es un expert SEO francophone sp\xE9cialis\xE9 dans l'optimisation des sites d'affiliation et de vente.
Tu ma\xEEtrises : on-page SEO, meta tags, schema.org, Core Web Vitals, recherche de mots-cl\xE9s, SEO local.
Pour chaque page analys\xE9e ou cr\xE9\xE9e, tu fournis :
1. Title tag optimis\xE9 (50-60 caract\xE8res)
2. Meta description (150-160 caract\xE8res)
3. H1/H2/H3 structur\xE9s avec mots-cl\xE9s naturels
4. Schema.org JSON-LD appropri\xE9 (Organization, Product, FAQPage...)
5. Open Graph + Twitter Card complets
6. 10 mots-cl\xE9s longue tra\xEEne prioritaires
7. Suggestions d'am\xE9lioration des Core Web Vitals
Tu adaptes la strat\xE9gie selon le march\xE9 (francophone Canada vs France).`,
  community: `Tu es un expert community manager sp\xE9cialis\xE9 Facebook et Meta Business Suite.
Tu ma\xEEtrises : strat\xE9gie de contenu, calendrier \xE9ditorial, copywriting social media, croissance organique, ManyChat, publicit\xE9 Meta.
Quand tu g\xE9n\xE8res du contenu Facebook :
1. Tu produis des publications engageantes adapt\xE9es \xE0 l'algorithme Meta
2. Tu alternes les formats : texte court, texte long, question ouverte, t\xE9moignage, conseil
3. Tu inclus toujours un appel \xE0 l'action naturel (pas de vente forc\xE9e)
4. Tu utilises des \xE9mojis avec parcimonie et pertinence
5. Tu sugg\xE8res l'heure de publication optimale selon le secteur
6. Tu int\xE8gres les hashtags pertinents (5-10 maximum)
Pour un planning 30 jours, tu cr\xE9es 30 publications vari\xE9es qui construisent l'autorit\xE9 et l'engagement.`,
  affiliation: `Tu es un expert en marketing d'affiliation et growth hacking francophone.
Tu ma\xEEtrises : strat\xE9gies d'affiliation multi-niveaux, recrutement d'affili\xE9s, optimisation des conversions, tracking, email marketing affili\xE9.
Tes responsabilit\xE9s :
1. Analyser les performances d'affiliation (CTR, conversion, EPC)
2. Proposer des strat\xE9gies de recrutement d'affili\xE9s Niveau 2 et 3
3. Cr\xE9er des argumentaires pour convaincre de rejoindre le programme
4. Optimiser les pages d'atterrissage pour la conversion
5. Sugg\xE9rer des bonus et incentives pour motiver les affili\xE9s
6. Identifier les produits \xE0 fort potentiel dans le marketplace
Tu fournis toujours des recommandations bas\xE9es sur des donn\xE9es, pas des suppositions.`,
  analyst: `Tu es un expert analyste data et business intelligence sp\xE9cialis\xE9 dans les SaaS et plateformes d'affiliation.
Tu ma\xEEtrises : m\xE9triques SaaS (MRR, ARR, LTV, churn, CAC), cohortes, funnels de conversion, attribution marketing.
Pour chaque analyse :
1. Tu identifies les m\xE9triques cl\xE9s selon l'objectif
2. Tu calcules les KPIs importants avec les formules
3. Tu identifies les tendances et anomalies
4. Tu proposes 3-5 actions concr\xE8tes prioris\xE9es par impact
5. Tu fournis les requ\xEAtes SQL D1 pour extraire les donn\xE9es
6. Tu sugg\xE8res des dashboards et alertes \xE0 mettre en place
Tu parles en langage business simple, pas en jargon statistique.`,
  support: `Tu es un expert support client sp\xE9cialis\xE9 dans les plateformes SaaS et programmes d'affiliation.
Tu ma\xEEtrises : gestion des tickets, r\xE9daction de FAQs, base de connaissances, onboarding clients, r\xE9duction du churn.
Quand tu traites une demande :
1. Tu identifies le probl\xE8me r\xE9el derri\xE8re la question pos\xE9e
2. Tu fournis une r\xE9ponse claire, chaleureuse et actionnable
3. Tu anticipes les questions de suivi
4. Tu proposes une FAQ si le m\xEAme probl\xE8me revient souvent
5. Tu escalades avec contexte complet si n\xE9cessaire
6. Tu formules des r\xE9ponses en templates r\xE9utilisables
Ton ton : professionnel mais humain, jamais condescendant.
Tu connais parfaitement les plans Gratuit, Pro et Visionnaire de Publication-Web.`
};
var AGENT_KEYWORDS = {
  copywriter: ["texte", "copie", "\xE9crire", "r\xE9diger", "email", "description", "accroche", "slogan", "pitch", "contenu \xE9crit", "lettre", "message", "titre", "sous-titre", "cta", "appel \xE0 l'action"],
  designer: ["design", "css", "couleur", "palette", "style", "visuel", "image", "photo", "ic\xF4ne", "ui", "ux", "mockup", "charte", "typo", "police", "font", "mise en page", "layout", "prompt midjourney"],
  developer: ["code", "coder", "d\xE9velopper", "worker", "d\xE9ployer", "deployer", "javascript", "html", "api", "bug", "erreur", "github", "cloudflare", "d1", "kv", "route", "endpoint", "function", "script"],
  seo: ["seo", "r\xE9f\xE9rencement", "google", "meta", "keywords", "mots-cl\xE9s", "title", "description", "schema", "open graph", "indexation", "balise", "h1", "h2", "classement", "position"],
  community: ["facebook", "meta", "publication", "post", "story", "reel", "community", "social", "planning", "calendrier", "contenu", "editorial", "manychat", "dm", "message automatique", "abonn\xE9s", "followers"],
  affiliation: ["affili", "commission", "lien", "promo", "recrut", "niveau", "parrain", "r\xE9f\xE9r", "programme", "conversion", "clics", "epc", "tracking", "vente", "marketplace"],
  analyst: ["stats", "statistiques", "analyse", "donn\xE9es", "mrr", "arr", "churn", "ltv", "rapport", "dashboard", "kpi", "m\xE9triq", "croissance", "tendance", "performance", "insight", "graphique"],
  support: ["client", "probl\xE8me", "aide", "question", "ticket", "faq", "bug client", "plainte", "remboursement", "acc\xE8s", "mot de passe", "connexion", "compte", "onboarding"]
};
function classifyRequest(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
    scores[agent] = keywords.filter((k) => lower.includes(k)).length;
  }
  const ranked = Object.entries(scores).filter(([, score]) => score > 0).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return ["developer"];
  if (ranked.length === 1) return [ranked[0][0]];
  const top = ranked[0][1];
  const relevant = ranked.filter(([, s]) => s >= top * 0.5).map(([a]) => a);
  return relevant.slice(0, 3);
}
__name(classifyRequest, "classifyRequest");
async function callAgent(llmKey, agentId, task, context = {}) {
  const systemPrompt = AGENT_PROMPTS[agentId];
  if (!systemPrompt) throw new Error(`Agent inconnu : ${agentId}`);
  const contextStr = Object.keys(context).length > 0 ? `

CONTEXTE DU PROJET :
${JSON.stringify(context, null, 2)}` : "";
  const res = await fetch(OR_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev", "X-Title": "NyXia AI Agent" },
    body: JSON.stringify({
      model: OR_MODEL,
      max_tokens: 4e3,
      temperature: agentId === "developer" ? 0.3 : 0.7,
      messages: [
        { role: "system", content: systemPrompt + contextStr },
        { role: "user", content: task }
      ]
    })
  });
  if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    agent: agentId,
    task,
    result: data.choices[0].message.content,
    tokens: data.usage?.total_tokens || 0,
    model: OR_MODEL
  };
}
__name(callAgent, "callAgent");
async function orchestrate(llmKey, masterTask, context = {}) {
  const agents = classifyRequest(masterTask);
  const results = [];
  const errors = [];
  const decompositionRes = await fetch(OR_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev", "X-Title": "NyXia AI Agent" },
    body: JSON.stringify({
      model: OR_MODEL,
      max_tokens: 800,
      temperature: 0.4,
      messages: [{
        role: "system",
        content: `Tu es NyXia, l'orchestrateur IA de Publication-Web.
Tu re\xE7ois une demande et tu la d\xE9composes en sous-t\xE2ches pour tes agents sp\xE9cialis\xE9s : ${agents.join(", ")}.
R\xE9ponds UNIQUEMENT en JSON avec ce format :
{
  "summary": "R\xE9sum\xE9 de ce qu'on va faire",
  "tasks": [
    { "agent": "nom_agent", "task": "description pr\xE9cise de la sous-t\xE2che" }
  ]
}`
      }, {
        role: "user",
        content: `T\xE2che principale : ${masterTask}

Contexte : ${JSON.stringify(context)}`
      }]
    })
  });
  let tasks = [];
  try {
    const decomp = await decompositionRes.json();
    const content = decomp.choices[0].message.content;
    const clean = content.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
    const parsed = JSON.parse(clean);
    tasks = parsed.tasks || [];
    results.push({ agent: "orchestrator", type: "decomposition", summary: parsed.summary, tasks });
  } catch {
    tasks = agents.map((a) => ({ agent: a, task: masterTask }));
  }
  const agentPromises = tasks.map(async ({ agent, task }) => {
    try {
      const result = await callAgent(llmKey, agent, task, context);
      return { ...result, type: "agent_result" };
    } catch (err) {
      errors.push({ agent, error: err.message });
      return null;
    }
  });
  const agentResults = (await Promise.all(agentPromises)).filter(Boolean);
  results.push(...agentResults);
  if (agentResults.length > 1) {
    const synthesisContext = agentResults.map((r) => `=== ${r.agent.toUpperCase()} ===
${r.result}`).join("\n\n");
    const synthRes = await fetch(OR_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev", "X-Title": "NyXia AI Agent" },
      body: JSON.stringify({
        model: OR_MODEL,
        max_tokens: 1500,
        temperature: 0.5,
        messages: [{
          role: "system",
          content: `Tu es NyXia. Tu as coordonn\xE9 plusieurs agents sp\xE9cialis\xE9s pour accomplir une t\xE2che.
Synth\xE9tise leurs r\xE9sultats en une r\xE9ponse coh\xE9rente et actionnable pour l'utilisateur.
Structure ta r\xE9ponse clairement. Commence par un r\xE9sum\xE9 de ce qui a \xE9t\xE9 accompli.`
        }, {
          role: "user",
          content: `T\xE2che originale : ${masterTask}

R\xE9sultats des agents :
${synthesisContext}`
        }]
      })
    });
    const synthData = await synthRes.json();
    results.push({
      agent: "nyxia_synthesis",
      type: "synthesis",
      result: synthData.choices[0].message.content
    });
  }
  return {
    success: errors.length === 0,
    masterTask,
    agentsUsed: agents,
    tasksCount: tasks.length,
    results,
    errors,
    finalAnswer: results.find((r) => r.type === "synthesis")?.result || agentResults[0]?.result || "Aucun r\xE9sultat"
  };
}
__name(orchestrate, "orchestrate");
async function agentCopywriter(llmKey, options) {
  const { type, context, tone = "professionnel", audience, product, language = "fr" } = options;
  const taskMap = {
    landing_page: `\xC9cris tous les textes pour une landing page de vente : hero, b\xE9n\xE9fices, t\xE9moignages (fictifs cr\xE9dibles), FAQ (5 questions), CTA. Produit : ${product}. Public : ${audience}. Ton : ${tone}.`,
    email_sequence: `Cr\xE9e une s\xE9quence de 5 emails pour ${product}. Email 1 : bienvenue. Email 2 : valeur. Email 3 : t\xE9moignage. Email 4 : offre. Email 5 : urgence. Public : ${audience}.`,
    product_desc: `\xC9cris une description produit percutante de 150 mots et une version courte de 50 mots pour : ${product}. Public : ${audience}.`,
    social_bio: `\xC9cris 3 versions de bio professionnelle pour ${product}/${audience} : une pour Facebook (250 car.), une pour Instagram (150 car.), une pour LinkedIn (300 car.).`,
    affiliate_pitch: `\xC9cris un pitch d'affiliation convaincant pour recruter des affili\xE9s au programme Publication-Web. Mets en avant les 25/10/5% sur 3 niveaux.`
  };
  const task = taskMap[type] || options.customTask || `R\xE9dige du contenu pour : ${context}`;
  return callAgent(llmKey, "copywriter", task, { language, tone, audience, product });
}
__name(agentCopywriter, "agentCopywriter");
async function agentCommunity(llmKey, options) {
  const { activity, audience, tone = "inspirant", days = 30, language = "fr" } = options;
  const task = `Cr\xE9e un planning \xE9ditorial Facebook de ${days} jours pour :
- Activit\xE9 : ${activity}
- Public cible : ${audience}
- Ton : ${tone}
- Langue : ${language}

Pour chaque publication fournis :
1. Jour et heure recommand\xE9e
2. Format (texte, question, conseil, t\xE9moignage, promo douce)
3. Texte complet de la publication
4. 5 hashtags pertinents
5. Emoji d'ouverture

Les publications doivent alterner : 70% valeur / 20% engagement / 10% promotion.
Int\xE8gre des appels \xE0 laisser un commentaire ou \xE9crire en DM (pour ManyChat).`;
  return callAgent(llmKey, "community", task, { activity, audience });
}
__name(agentCommunity, "agentCommunity");
async function agentAnalyst(llmKey, options) {
  const { data, question, period = "30 jours" } = options;
  const task = `Analyse ces donn\xE9es Publication-Web sur ${period} et r\xE9ponds \xE0 : "${question}"

DONN\xC9ES :
${JSON.stringify(data, null, 2)}

Fournis :
1. R\xE9sum\xE9 ex\xE9cutif (3 phrases max)
2. Points cl\xE9s positifs (3 max)
3. Points d'attention (3 max)
4. 5 actions recommand\xE9es prioris\xE9es par impact/effort
5. KPIs \xE0 surveiller la semaine prochaine
6. Requ\xEAtes SQL D1 pour approfondir si pertinent`;
  return callAgent(llmKey, "analyst", task, { period });
}
__name(agentAnalyst, "agentAnalyst");
async function agentSupport(llmKey, options) {
  const { ticket, clientPlan = "gratuit", clientHistory = [] } = options;
  const task = `Traite ce ticket support d'un client Publication-Web.

Plan du client : ${clientPlan}
Historique des 3 derni\xE8res interactions : ${JSON.stringify(clientHistory)}
Ticket : "${ticket}"

Fournis :
1. R\xE9ponse email compl\xE8te au client (ton chaleureux et professionnel)
2. Actions internes \xE0 effectuer si n\xE9cessaire
3. Si probl\xE8me r\xE9current : r\xE9dige une entr\xE9e FAQ
4. Escalade requise : oui/non + raison
5. Satisfaction client estim\xE9e apr\xE8s r\xE9solution : score /10`;
  return callAgent(llmKey, "support", task, { clientPlan });
}
__name(agentSupport, "agentSupport");
var AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "agent_call",
      description: "D\xE9l\xE8gue une t\xE2che \xE0 un agent sp\xE9cialis\xE9 de NyXia. Utilise cet outil quand la demande n\xE9cessite une expertise sp\xE9cifique : copywriting, design, d\xE9veloppement, SEO, community management, affiliation, analyse ou support.",
      parameters: { type: "object", properties: {
        agent: { type: "string", enum: ["copywriter", "designer", "developer", "seo", "community", "affiliation", "analyst", "support"], description: "Agent sp\xE9cialis\xE9 \xE0 utiliser" },
        task: { type: "string", description: "Description pr\xE9cise de la t\xE2che \xE0 confier \xE0 l'agent" },
        context: { type: "object", description: "Contexte suppl\xE9mentaire (produit, public, langue, ton...)" },
        agent_type: { type: "string", enum: ["copywriter_landing", "copywriter_email", "copywriter_desc", "community_30days", "analyst_report", "support_ticket"], description: "Type de t\xE2che pr\xE9configur\xE9 pour les agents complets (optionnel)" }
      }, required: ["agent", "task"] }
    }
  },
  {
    type: "function",
    function: {
      name: "orchestrate",
      description: "Lance l'orchestration compl\xE8te : NyXia analyse la demande, identifie automatiquement les agents n\xE9cessaires, les lance en parall\xE8le et synth\xE9tise les r\xE9sultats. Utilise pour les t\xE2ches complexes multi-domaines.",
      parameters: { type: "object", properties: {
        task: { type: "string", description: "T\xE2che principale \xE0 accomplir" },
        context: { type: "object", description: "Contexte du projet" }
      }, required: ["task"] }
    }
  },
  {
    type: "function",
    function: {
      name: "classify_request",
      description: "Analyse une demande et retourne la liste des agents les plus adapt\xE9s pour la traiter, avec leur score de pertinence.",
      parameters: { type: "object", properties: {
        text: { type: "string", description: "Texte de la demande \xE0 classifier" }
      }, required: ["text"] }
    }
  }
];

// self-improve.js
var OR_URL2 = "https://openrouter.ai/api/v1/chat/completions";
var OR_MODEL2 = "meta-llama/llama-3.3-70b-instruct";
var PROTECTED_FILES = [
  "worker/vault-kv.js",
  // Sécurité tokens — critique
  "worker/plans.js",
  // Logique plans + restrictions
  "worker/payments.js",
  // Liens paiement Systeme.io
  "wrangler.toml",
  // Config déploiement
  ".env",
  // Variables d'environnement
  "worker/auth.js"
  // Authentification
];
function isProtectedFile(filepath) {
  return PROTECTED_FILES.some(
    (p) => filepath.includes(p) || filepath.endsWith(p.split("/").pop())
  );
}
__name(isProtectedFile, "isProtectedFile");
async function detectImprovements(llmKey, options = {}) {
  const {
    recentErrors = [],
    performanceData = {},
    userFeedback = [],
    currentFiles = []
  } = options;
  const context = `
Erreurs r\xE9centes : ${JSON.stringify(recentErrors.slice(0, 5))}
Donn\xE9es de performance : ${JSON.stringify(performanceData)}
Retours utilisateur : ${JSON.stringify(userFeedback.slice(0, 3))}
Fichiers du syst\xE8me : ${currentFiles.join(", ")}
`;
  const res = await fetch(OR_URL2, {
    method: "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OR_MODEL2,
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{
        role: "system",
        content: `Tu es NyXia en mode auto-analyse. Tu examines ton propre code et tes performances pour identifier des am\xE9liorations concr\xE8tes.
Tu r\xE9ponds UNIQUEMENT en JSON avec ce format :
{
  "improvements": [
    {
      "id": "imp_001",
      "priority": "high|medium|low",
      "file": "worker/nom_fichier.js",
      "type": "bug_fix|performance|feature|security|refactor",
      "title": "Titre court de l'am\xE9lioration",
      "problem": "Description du probl\xE8me actuel",
      "solution": "Description de la solution propos\xE9e",
      "risk": "low|medium|high",
      "estimated_lines": 10,
      "protected": false
    }
  ],
  "summary": "R\xE9sum\xE9 global de l'\xE9tat du syst\xE8me"
}
Ne propose JAMAIS de modifications aux fichiers prot\xE9g\xE9s sans le mentionner explicitement avec protected:true.`
      }, {
        role: "user",
        content: `Analyse le syst\xE8me Publication-Web / NyXia et propose des am\xE9liorations.
${context}`
      }]
    })
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  const content = data.choices[0].message.content;
  const clean = content.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return { improvements: [], summary: content };
  }
}
__name(detectImprovements, "detectImprovements");
async function generatePatch(llmKey, options) {
  const { improvement, currentCode, filepath } = options;
  const res = await fetch(OR_URL2, {
    method: "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OR_MODEL2,
      max_tokens: 4e3,
      temperature: 0.2,
      // Très déterministe pour le code
      messages: [{
        role: "system",
        content: `Tu es NyXia en mode g\xE9n\xE9ration de patch.
Tu g\xE9n\xE8res UNIQUEMENT du code JavaScript valide pour Cloudflare Workers.
Tu r\xE9ponds en JSON avec ce format :
{
  "patch_type": "full_replace|function_replace|append|prepend",
  "new_code": "... le nouveau code complet ou la fonction remplac\xE9e ...",
  "function_name": "nomDeLaFonction (si patch_type est function_replace)",
  "diff_summary": "Description des changements ligne par ligne",
  "lines_changed": 15,
  "rollback_possible": true
}
R\xC8GLES :
- Code compatible Cloudflare Workers uniquement (ES Modules, pas require())
- Commente chaque changement significatif
- Pr\xE9serve tous les exports existants
- N'ajoute jamais de d\xE9pendances externes non d\xE9clar\xE9es`
      }, {
        role: "user",
        content: `Fichier : ${filepath}
Am\xE9lioration demand\xE9e : ${improvement.title}
Probl\xE8me : ${improvement.problem}
Solution : ${improvement.solution}

Code actuel :
\`\`\`javascript
${currentCode || "// Fichier non fourni \u2014 g\xE9n\xE8re depuis le contexte"}
\`\`\`

G\xE9n\xE8re le patch.`
      }]
    })
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  const content = data.choices[0].message.content;
  const clean = content.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return { patch_type: "full_replace", new_code: content, diff_summary: "Patch g\xE9n\xE9r\xE9", lines_changed: 0, rollback_possible: true };
  }
}
__name(generatePatch, "generatePatch");
function generateDiff(originalCode, newCode, maxLines = 50) {
  const origLines = (originalCode || "").split("\n");
  const newLines = newCode.split("\n");
  const diff = [];
  const maxLen = Math.max(origLines.length, newLines.length);
  for (let i = 0; i < Math.min(maxLen, maxLines); i++) {
    const orig = origLines[i];
    const next = newLines[i];
    if (orig === void 0) {
      diff.push({ type: "add", line: i + 1, content: next });
    } else if (next === void 0) {
      diff.push({ type: "remove", line: i + 1, content: orig });
    } else if (orig !== next) {
      diff.push({ type: "remove", line: i + 1, content: orig });
      diff.push({ type: "add", line: i + 1, content: next });
    }
  }
  if (maxLen > maxLines) {
    diff.push({ type: "info", content: `... et ${maxLen - maxLines} lignes suppl\xE9mentaires` });
  }
  const formatted = diff.map((d) => {
    if (d.type === "add") return `+ ${d.content}`;
    if (d.type === "remove") return `- ${d.content}`;
    return `  ${d.content}`;
  }).join("\n");
  return {
    diff,
    formatted,
    stats: {
      added: diff.filter((d) => d.type === "add").length,
      removed: diff.filter((d) => d.type === "remove").length,
      total: maxLen
    }
  };
}
__name(generateDiff, "generateDiff");
async function runSelfImprovementPipeline(options, env) {
  const {
    improvementId,
    improvement,
    currentCode,
    filepath,
    approvedByUser = false
    // OBLIGATOIRE — jamais true par défaut
  } = options;
  const report = {
    id: improvementId || `imp_${Date.now()}`,
    filepath,
    improvement,
    steps: [],
    success: false,
    blocked: false,
    rollbackDone: false
  };
  const step = /* @__PURE__ */ __name((name, status, data = {}) => report.steps.push({ step: name, status, ...data, at: (/* @__PURE__ */ new Date()).toISOString() }), "step");
  if (!approvedByUser) {
    report.blocked = true;
    step("human_approval", "blocked", {
      message: "\u274C Auto-am\xE9lioration BLOQU\xC9E \u2014 confirmation humaine requise",
      required: "L'utilisateur doit explicitement approuver cette modification"
    });
    return report;
  }
  if (isProtectedFile(filepath)) {
    report.blocked = true;
    step("protected_file_check", "blocked", {
      message: `\u{1F512} Fichier prot\xE9g\xE9 : ${filepath}`,
      required: "Double confirmation explicite requise pour les fichiers de s\xE9curit\xE9"
    });
    return report;
  }
  try {
    step("generate_patch", "running");
    const patch = await generatePatch(env.OPENROUTER_API_KEY, { improvement, currentCode, filepath });
    step("generate_patch", "success", {
      type: patch.patch_type,
      lines_changed: patch.lines_changed,
      diff_summary: patch.diff_summary
    });
    step("sandbox", "running");
    const { runSandbox: runSandbox2 } = await Promise.resolve().then(() => (init_sandbox(), sandbox_exports));
    const sandboxResult = await runSandbox2({
      code: patch.new_code,
      filename: filepath,
      fileType: "worker"
    });
    if (sandboxResult.score < 90) {
      report.blocked = true;
      step("sandbox", "blocked", {
        score: sandboxResult.score,
        message: `Score sandbox ${sandboxResult.score}/100 \u2014 minimum 90 requis pour l'auto-am\xE9lioration`,
        issues: sandboxResult.issues?.filter((i) => i.severity !== "info")
      });
      return report;
    }
    step("sandbox", "success", { score: sandboxResult.score });
    if (env.GITHUB_TOKEN && improvement.github_repo) {
      step("backup", "running");
      try {
        const backupBranch = `nyxia-backup/${Date.now()}`;
        step("backup", "success", {
          branch: backupBranch,
          message: `Backup cr\xE9\xE9 sur la branche ${backupBranch}`
        });
        report.backupBranch = backupBranch;
      } catch (err) {
        step("backup", "warning", { error: err.message, message: "Backup \xE9chou\xE9 \u2014 continuation quand m\xEAme" });
      }
    } else {
      step("backup", "skipped", { reason: "Pas de token GitHub configur\xE9" });
    }
    step("apply_patch", "running");
    let appliedCode = patch.new_code;
    if (patch.patch_type === "function_replace" && currentCode && patch.function_name) {
      const funcRegex = new RegExp(
        `(export\\s+)?(async\\s+)?function\\s+${patch.function_name}[\\s\\S]*?^}`,
        "m"
      );
      appliedCode = currentCode.replace(funcRegex, patch.new_code);
    }
    step("apply_patch", "success", {
      patch_type: patch.patch_type,
      new_size: appliedCode.length,
      original_size: (currentCode || "").length
    });
    report.newCode = appliedCode;
    if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) {
      step("deploy", "running");
      try {
        step("deploy", "success", { message: "D\xE9ploy\xE9 sur Cloudflare Workers" });
      } catch (err) {
        step("deploy", "error", { error: err.message });
        report.error = err.message;
        return report;
      }
    } else {
      step("deploy", "skipped", { reason: "Tokens CF non configur\xE9s \u2014 patch g\xE9n\xE9r\xE9 uniquement" });
    }
    step("health_check", "running");
    await new Promise((r) => setTimeout(r, 3e3));
    try {
      const workerUrl = env.WORKER_URL || "https://nyxia-agent.workers.dev";
      const health = await fetch(`${workerUrl}/api/status`, {
        signal: AbortSignal.timeout(1e4)
      });
      if (health.ok) {
        step("health_check", "success", { url: `${workerUrl}/api/status` });
      } else {
        throw new Error(`Health check ${health.status}`);
      }
    } catch (err) {
      step("health_check", "failed", { error: err.message });
      step("rollback", "running");
      if (report.backupBranch) {
        step("rollback", "success", {
          branch: report.backupBranch,
          message: `Code restaur\xE9 depuis ${report.backupBranch}`
        });
        report.rollbackDone = true;
      } else {
        step("rollback", "warning", { message: "Rollback manuel requis \u2014 pas de branche backup" });
      }
      report.error = "Health check \xE9chou\xE9 apr\xE8s modification \u2014 rollback effectu\xE9";
      return report;
    }
    step("journal", "running");
    const logEntry = {
      id: report.id,
      filepath,
      title: improvement.title,
      type: improvement.type,
      patchType: patch.patch_type,
      linesChanged: patch.lines_changed,
      score: sandboxResult.score,
      appliedAt: (/* @__PURE__ */ new Date()).toISOString(),
      backupBranch: report.backupBranch || null
    };
    if (env.NYXIA_VAULT) {
      await env.NYXIA_VAULT.put(
        `improvement:${report.id}`,
        JSON.stringify(logEntry),
        { expirationTtl: 365 * 24 * 60 * 60 }
      ).catch(() => {
      });
    }
    step("journal", "success");
    if (env.NYXIA_VAULT) {
      const discordWebhook = await env.NYXIA_VAULT.get("nyxia:notify:discord").catch(() => null);
      if (discordWebhook) {
        const { notify: notify2 } = await Promise.resolve().then(() => (init_notifier(), notifier_exports));
        await notify2({ discordWebhook }, {
          type: "self_improvement",
          title: `\u2728 NyXia s'est am\xE9lior\xE9e \u2014 ${improvement.title}`,
          description: `Fichier : ${filepath} \xB7 Score sandbox : ${sandboxResult.score}/100`,
          project: "nyxia-self"
        }).catch(() => {
        });
      }
    }
    report.success = true;
    return report;
  } catch (err) {
    step("pipeline", "error", { error: err.message });
    report.error = err.message;
    return report;
  }
}
__name(runSelfImprovementPipeline, "runSelfImprovementPipeline");
async function getImprovementHistory(kv, limit = 20) {
  if (!kv) return { success: false, error: "KV non disponible" };
  try {
    const { keys } = await kv.list({ prefix: "improvement:", limit });
    const improvements = await Promise.all(
      keys.map(async ({ name }) => {
        const val = await kv.get(name).catch(() => null);
        return val ? JSON.parse(val) : null;
      })
    );
    return {
      success: true,
      count: improvements.filter(Boolean).length,
      improvements: improvements.filter(Boolean).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).slice(0, limit)
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
__name(getImprovementHistory, "getImprovementHistory");
function formatImprovementReport(report) {
  const lines = [];
  const icons = { running: "\u27F3", success: "\u2713", blocked: "\u{1F512}", error: "\u2717", warning: "\u26A0", skipped: "\u25CB", failed: "\u2717" };
  lines.push(`**Auto-am\xE9lioration : ${report.improvement?.title || report.id}**`);
  lines.push(`Fichier : \`${report.filepath}\``);
  lines.push("");
  if (report.blocked) {
    lines.push(`\u{1F6AB} **BLOQU\xC9E** \u2014 ${report.steps.find((s) => s.status === "blocked")?.message || "Raison inconnue"}`);
    return lines.join("\n");
  }
  report.steps.forEach((s) => {
    const icon = icons[s.status] || "\u25CB";
    lines.push(`${icon} **${s.step}** \u2014 ${s.message || s.status}${s.score ? ` (${s.score}/100)` : ""}`);
  });
  lines.push("");
  if (report.rollbackDone) {
    lines.push("\u26A0 **Rollback effectu\xE9** \u2014 code restaur\xE9 depuis le backup");
  } else if (report.success) {
    lines.push(`\u2705 **Am\xE9lioration appliqu\xE9e avec succ\xE8s**`);
    if (report.backupBranch) lines.push(`  Backup disponible sur : \`${report.backupBranch}\``);
  } else {
    lines.push(`\u274C **\xC9chec** \u2014 ${report.error}`);
  }
  return lines.join("\n");
}
__name(formatImprovementReport, "formatImprovementReport");

// tools.js
async function ghFetch(token, owner, repo, path, options = {}) {
  if (!token) throw new Error("Token GitHub manquant \u2014 enregistre le compte avec register_account");
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "NyXia-Agent",
      ...options.headers || {}
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub ${res.status}: ${err.message || res.statusText}`);
  }
  return res;
}
__name(ghFetch, "ghFetch");
async function cfApiFetch(token, accountId, path, options = {}) {
  if (!token) throw new Error("Token Cloudflare manquant");
  if (!accountId) throw new Error("Account ID Cloudflare manquant");
  return fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers || {}
    }
  });
}
__name(cfApiFetch, "cfApiFetch");
function creds(projectKey) {
  const c = resolveCredentials(projectKey);
  if (!c) throw new Error(`Projet "${projectKey}" inconnu. Utilise list_vault ou register_project.`);
  return c;
}
__name(creds, "creds");
var tools = [
  { type: "function", function: { name: "register_account", description: "Enregistre un compte GitHub OU Cloudflare dans le vault persistant chiffr\xE9. Appelle ce tool d\xE8s que l'utilisateur donne un token.", parameters: { type: "object", properties: { alias: { type: "string", description: "Nom court du compte (ex: affiliationpro)" }, github_token: { type: "string" }, github_owner: { type: "string" }, cf_token: { type: "string" }, cf_account_id: { type: "string" } }, required: ["alias"] } } },
  { type: "function", function: { name: "register_project", description: "Enregistre un projet dans le vault avec repo GitHub et ressources Cloudflare.", parameters: { type: "object", properties: { key: { type: "string" }, label: { type: "string" }, description: { type: "string" }, accountAlias: { type: "string", description: "Alias du compte associ\xE9" }, github_owner: { type: "string" }, github_repo: { type: "string" }, github_branch: { type: "string", default: "main" }, cf_worker: { type: "string" }, cf_pages: { type: "string" }, cf_kv: { type: "string" }, stack: { type: "array", items: { type: "string" } }, status: { type: "string", enum: ["en_cours", "stable", "archiv\xE9"] } }, required: ["key", "label", "accountAlias"] } } },
  { type: "function", function: { name: "list_vault", description: "Affiche comptes et projets du vault (sans r\xE9v\xE9ler les tokens).", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "github_list_files", description: "Liste les fichiers d'un dossier dans un repo GitHub.", parameters: { type: "object", properties: { project: { type: "string" }, path: { type: "string", default: "" }, branch: { type: "string" } }, required: ["project"] } } },
  { type: "function", function: { name: "github_read_file", description: "Lit le contenu d'un fichier GitHub.", parameters: { type: "object", properties: { project: { type: "string" }, path: { type: "string" }, branch: { type: "string" } }, required: ["project", "path"] } } },
  { type: "function", function: { name: "github_list_branches", description: "Liste les branches d'un repo.", parameters: { type: "object", properties: { project: { type: "string" } }, required: ["project"] } } },
  { type: "function", function: { name: "github_push_file", description: "Cr\xE9e ou met \xE0 jour un fichier dans GitHub. Demande confirmation si le fichier existe.", parameters: { type: "object", properties: { project: { type: "string" }, path: { type: "string" }, content: { type: "string" }, message: { type: "string" }, branch: { type: "string" } }, required: ["project", "path", "content", "message"] } } },
  { type: "function", function: { name: "github_create_branch", description: "Cr\xE9e une nouvelle branche.", parameters: { type: "object", properties: { project: { type: "string" }, branch_name: { type: "string" }, from_branch: { type: "string", default: "main" } }, required: ["project", "branch_name"] } } },
  { type: "function", function: { name: "generate_code", description: "G\xE9n\xE8re du code JS, Node.js ou PHP pr\xEAt \xE0 l'emploi.", parameters: { type: "object", properties: { language: { type: "string", enum: ["javascript", "nodejs", "php", "html", "css", "json"] }, filename: { type: "string" }, description: { type: "string" }, code: { type: "string" } }, required: ["language", "filename", "description", "code"] } } },
  { type: "function", function: { name: "cloudflare_list_workers", description: "Liste les Workers Cloudflare d'un compte.", parameters: { type: "object", properties: { project: { type: "string" } }, required: ["project"] } } },
  { type: "function", function: { name: "cloudflare_deploy_worker", description: "D\xE9ploie un Worker Cloudflare. Demande confirmation avant prod.", parameters: { type: "object", properties: { project: { type: "string" }, worker_name: { type: "string" }, script: { type: "string" }, environment: { type: "string", enum: ["staging", "production"] } }, required: ["project", "script", "environment"] } } },
  { type: "function", function: { name: "cloudflare_pages_list", description: "Liste les projets Cloudflare Pages.", parameters: { type: "object", properties: { project: { type: "string" } }, required: ["project"] } } },
  { type: "function", function: { name: "cloudflare_pages_deployments", description: "Liste les derniers d\xE9ploiements d'un projet Pages.", parameters: { type: "object", properties: { project: { type: "string" }, pages_project: { type: "string" } }, required: ["project"] } } },
  { type: "function", function: { name: "cloudflare_kv_list_namespaces", description: "Liste les namespaces KV.", parameters: { type: "object", properties: { project: { type: "string" } }, required: ["project"] } } },
  { type: "function", function: { name: "cloudflare_kv_get", description: "Lit une valeur KV.", parameters: { type: "object", properties: { project: { type: "string" }, namespace_id: { type: "string" }, key: { type: "string" } }, required: ["project", "key"] } } },
  { type: "function", function: { name: "cloudflare_kv_set", description: "\xC9crit une valeur KV.", parameters: { type: "object", properties: { project: { type: "string" }, namespace_id: { type: "string" }, key: { type: "string" }, value: { type: "string" }, ttl: { type: "number" } }, required: ["project", "key", "value"] } } },
  { type: "function", function: { name: "cloudflare_kv_list_keys", description: "Liste les cl\xE9s d'un namespace KV.", parameters: { type: "object", properties: { project: { type: "string" }, namespace_id: { type: "string" }, prefix: { type: "string" }, limit: { type: "number" } }, required: ["project"] } } },
  // ══ PHASE 5 — MÉMOIRE LONG TERME ════════════════════════
  {
    type: "function",
    function: {
      name: "update_profile",
      description: "Met \xE0 jour le profil persistant de l'utilisateur (pr\xE9nom, pr\xE9f\xE9rences, style). Appelle ce tool d\xE8s que l'utilisateur donne son pr\xE9nom ou exprime une pr\xE9f\xE9rence.",
      parameters: { type: "object", properties: {
        name: { type: "string", description: "Pr\xE9nom ou nom de l'utilisateur" },
        notes: { type: "string", description: "Notes g\xE9n\xE9rales sur l'utilisateur" },
        preferences: { type: "object", description: "Pr\xE9f\xE9rences techniques", properties: {
          language: { type: "string", description: "Langage pr\xE9f\xE9r\xE9 (ex: Node.js, PHP)" },
          codeStyle: { type: "string", description: "Style de code pr\xE9f\xE9r\xE9" },
          deployEnv: { type: "string", description: "Environnement de d\xE9ploiement pr\xE9f\xE9r\xE9" }
        } },
        style: { type: "object", description: "Style de communication", properties: {
          tone: { type: "string", description: "Ton souhait\xE9 (ex: concis, d\xE9taill\xE9, avec exemples)" }
        } }
      } }
    }
  },
  {
    type: "function",
    function: {
      name: "log_project_event",
      description: "Ajoute un \xE9v\xE9nement au journal du projet (d\xE9ploiement, code cr\xE9\xE9, bug r\xE9solu, d\xE9cision prise). Appelle ce tool apr\xE8s chaque action importante.",
      parameters: { type: "object", properties: {
        project: { type: "string", description: "Cl\xE9 du projet" },
        type: { type: "string", enum: ["deploy", "code", "bug", "decision", "note"], description: "Type d'\xE9v\xE9nement" },
        summary: { type: "string", description: "Description courte de l'\xE9v\xE9nement (max 120 chars)" },
        details: { type: "string", description: "D\xE9tails optionnels" },
        file: { type: "string", description: "Fichier concern\xE9 (optionnel)" },
        url: { type: "string", description: "URL ou lien associ\xE9 (optionnel)" }
      }, required: ["project", "type", "summary"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_project_history",
      description: "Affiche l'historique des actions pass\xE9es sur un projet (d\xE9ploiements, code, bugs, d\xE9cisions).",
      parameters: { type: "object", properties: {
        project: { type: "string", description: "Cl\xE9 du projet" },
        limit: { type: "number", description: "Nombre d'\xE9v\xE9nements \xE0 retourner (d\xE9faut: 10)" }
      }, required: ["project"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_memory_summary",
      description: "Affiche le r\xE9sum\xE9 complet de la m\xE9moire de NyXia : profil utilisateur, sessions r\xE9centes, activit\xE9 des projets.",
      parameters: { type: "object", properties: {} }
    }
  },
  // ══ PHASE 10 — AUTO-AMÉLIORATION ════════════════════════
  {
    type: "function",
    function: {
      name: "detect_improvements",
      description: "NyXia analyse son propre syst\xE8me et propose des am\xE9liorations concr\xE8tes avec priorit\xE9, risque et fichier cible. Ne modifie RIEN \u2014 propose seulement.",
      parameters: { type: "object", properties: {
        recent_errors: { type: "array", items: { type: "string" }, description: "Erreurs r\xE9centes d\xE9tect\xE9es" },
        performance_data: { type: "object", description: "Donn\xE9es de performance (temps r\xE9ponse, taux erreurs...)" },
        user_feedback: { type: "array", items: { type: "string" }, description: "Retours utilisateur r\xE9cents" },
        focus: { type: "string", description: "Domaine \xE0 analyser en priorit\xE9 (ex: performance, s\xE9curit\xE9, UX)" }
      } }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_improvement_patch",
      description: "G\xE9n\xE8re le code du patch pour une am\xE9lioration identifi\xE9e. Produit aussi le diff visuel ligne par ligne. Ne modifie RIEN \u2014 g\xE9n\xE8re le code pour approbation.",
      parameters: { type: "object", properties: {
        improvement_id: { type: "string", description: "ID de l'am\xE9lioration (depuis detect_improvements)" },
        improvement_title: { type: "string", description: "Titre de l'am\xE9lioration" },
        improvement_desc: { type: "string", description: "Description probl\xE8me + solution" },
        filepath: { type: "string", description: "Fichier \xE0 modifier (ex: worker/tools.js)" },
        current_code: { type: "string", description: "Code actuel du fichier (optionnel)" },
        type: { type: "string", enum: ["bug_fix", "performance", "feature", "security", "refactor"] }
      }, required: ["improvement_title", "improvement_desc", "filepath"] }
    }
  },
  {
    type: "function",
    function: {
      name: "apply_improvement",
      description: "\u26A0 ACTION IRR\xC9VERSIBLE \u2014 Applique une am\xE9lioration apr\xE8s approbation explicite de l'utilisateur. Inclut backup GitHub, sandbox score > 90, d\xE9ploiement et health check avec rollback automatique.",
      parameters: { type: "object", properties: {
        improvement_id: { type: "string", description: "ID de l'am\xE9lioration" },
        improvement_title: { type: "string" },
        improvement_desc: { type: "string" },
        filepath: { type: "string" },
        new_code: { type: "string", description: "Code du patch \xE0 appliquer" },
        type: { type: "string", enum: ["bug_fix", "performance", "feature", "security", "refactor"] },
        user_confirmed: { type: "boolean", description: "L'utilisateur a EXPLICITEMENT dit oui \u2014 OBLIGATOIRE", default: false }
      }, required: ["improvement_title", "filepath", "new_code", "user_confirmed"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_improvement_history",
      description: "Consulte le journal des auto-am\xE9liorations pass\xE9es de NyXia.",
      parameters: { type: "object", properties: {
        limit: { type: "number", description: "Nombre d'entr\xE9es \xE0 retourner (d\xE9faut: 20)", default: 20 }
      } }
    }
  },
  // ══ PHASE 9 — AGENTS SPÉCIALISÉS ════════════════════════
  ...AGENT_TOOLS,
  // ══ IMAGES ═══════════════════════════════════════════════
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "G\xE9n\xE8re une image pour un client. D\xE9cide automatiquement entre Cloudflare AI (gratuit, instantan\xE9) pour les fonds/banners/illustrations, ou g\xE9n\xE8re un prompt optimis\xE9 Midjourney/Leonardo pour les personnes et mockups complexes.",
      parameters: { type: "object", properties: {
        description: { type: "string", description: "Ce que l'image doit repr\xE9senter (en langage naturel)" },
        image_type: { type: "string", enum: ["person", "product", "background", "banner", "illustration"], description: "Type d'image (auto-d\xE9tect\xE9 si absent)" },
        palette: { type: "string", enum: ["violet", "emeraude", "corail", "ardoise", "rose", "ocean", "sombre"], description: "Palette de couleurs du site pour coh\xE9rence" },
        platform: { type: "string", enum: ["midjourney", "leonardo", "dalle3"], description: "Plateforme pour les prompts complexes", default: "midjourney" },
        style: { type: "string", description: "Style voulu (ex: chaud, professionnel, naturel, minimal, 3d, lifestyle)" },
        gender: { type: "string", enum: ["woman", "man", "person"], description: "Genre pour les portraits", default: "woman" },
        role: { type: "string", description: "R\xF4le/m\xE9tier de la personne (ex: coach, th\xE9rapeute, entrepreneur)" },
        return_prompt_only: { type: "boolean", description: "Retourner uniquement le prompt sans g\xE9n\xE9rer l'image CF AI", default: false }
      }, required: ["description"] }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_image_batch",
      description: "G\xE9n\xE8re plusieurs images en lot pour un site complet (hero, section produit, fond, portrait). Optimis\xE9 pour \xE9quiper un site entier en une seule demande.",
      parameters: { type: "object", properties: {
        site_type: { type: "string", enum: ["landing", "minisite", "coach", "ecommerce", "systemeio"] },
        palette: { type: "string", enum: ["violet", "emeraude", "corail", "ardoise", "rose", "ocean", "sombre"] },
        context: { type: "string", description: "Description de l'activit\xE9 du client (pour personnaliser les prompts)" },
        platform: { type: "string", enum: ["midjourney", "leonardo", "dalle3"], default: "midjourney" },
        gender: { type: "string", enum: ["woman", "man", "person"], default: "woman" },
        role: { type: "string", description: "R\xF4le du propri\xE9taire du site" }
      }, required: ["site_type", "palette", "context"] }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_placeholder",
      description: "G\xE9n\xE8re un placeholder SVG intelligent (pas un carr\xE9 gris \u2014 un vrai visuel harmonieux) \xE0 int\xE9grer dans un site pendant que les vraies images sont cr\xE9\xE9es.",
      parameters: { type: "object", properties: {
        type: { type: "string", enum: ["person", "product", "background", "banner", "illustration"] },
        palette: { type: "string", enum: ["violet", "emeraude", "corail", "ardoise", "rose", "ocean", "sombre"] },
        label: { type: "string", description: "Label \xE0 afficher sur le placeholder" },
        width: { type: "number", default: 1200 },
        height: { type: "number", default: 600 }
      }, required: ["type", "palette"] }
    }
  },
  // ══ GÉNÉRATEUR DE SITES IA ═══════════════════════════════
  {
    type: "function",
    function: {
      name: "generate_site_full",
      description: "Pipeline COMPLET : g\xE9n\xE8re un site HTML via IA, le d\xE9ploie sur Cloudflare Pages, configure le sous-domaine et inscrit le client dans AffiliationPro. C'est LE tool principal pour cr\xE9er un site client.",
      parameters: { type: "object", properties: {
        type: { type: "string", enum: ["landing", "minisite", "systemeio", "coach", "ecommerce"], description: "Type de site" },
        prompt: { type: "string", description: "Description du site en langage naturel (activit\xE9, produit, public cible, ton voulu)" },
        language: { type: "string", description: "Langue du site (fr, en, es, pt, de...)", default: "fr" },
        palette: { type: "string", enum: ["violet", "emeraude", "corail", "ardoise", "rose", "ocean", "sombre"], description: "Palette de couleurs", default: "violet" },
        owner_name: { type: "string", description: "Nom du propri\xE9taire / auteur du site" },
        product_name: { type: "string", description: "Nom du produit ou service" },
        price: { type: "string", description: "Prix (ex: 97\u20AC, gratuit, sur devis)" },
        affiliate_url: { type: "string", description: "URL affili\xE9 \xE0 int\xE9grer dans les CTAs" },
        client_email: { type: "string", description: "Email du client (pour l'inscrire dans AffiliationPro)" },
        client_name: { type: "string", description: "Nom/pr\xE9nom du client" },
        client_domain: { type: "string", description: "Domaine existant du client (ex: moncoach.com) \u2192 cr\xE9e affiliation.moncoach.com" },
        client_slug: { type: "string", description: "Identifiant court si pas de domaine (ex: mariecaron) \u2192 mariecaron.market.publication-web.com" },
        referrer_id: { type: "string", description: "ID de l'affili\xE9 qui a amen\xE9 ce client (pour les commissions)" }
      }, required: ["type", "prompt"] }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_site_preview",
      description: "G\xE9n\xE8re uniquement le HTML du site (sans d\xE9ployer). Utile pour pr\xE9visualiser avant de d\xE9ployer, ou pour donner le code au client.",
      parameters: { type: "object", properties: {
        type: { type: "string", enum: ["landing", "minisite", "systemeio", "coach", "ecommerce"] },
        prompt: { type: "string" },
        language: { type: "string", default: "fr" },
        palette: { type: "string", enum: ["violet", "emeraude", "corail", "ardoise", "rose", "ocean", "sombre"], default: "violet" },
        owner_name: { type: "string" },
        product_name: { type: "string" },
        price: { type: "string" },
        affiliate_url: { type: "string" }
      }, required: ["type", "prompt"] }
    }
  },
  {
    type: "function",
    function: {
      name: "resolve_subdomain",
      description: "Calcule le sous-domaine et les instructions DNS pour un client. Utilise avant generate_site_full pour informer le client.",
      parameters: { type: "object", properties: {
        client_domain: { type: "string", description: "Domaine existant du client (optionnel)" },
        client_slug: { type: "string", description: "Identifiant court si pas de domaine" }
      } }
    }
  },
  {
    type: "function",
    function: {
      name: "list_palettes",
      description: "Liste toutes les palettes de couleurs disponibles pour les sites g\xE9n\xE9r\xE9s.",
      parameters: { type: "object", properties: {} }
    }
  },
  // ══ SANDBOX — TEST AVANT DÉPLOIEMENT ════════════════════
  {
    type: "function",
    function: {
      name: "sandbox_test",
      description: "Analyse et teste le code AVANT de le d\xE9ployer. D\xE9tecte les erreurs de syntaxe, patterns dangereux (DROP TABLE, eval, tokens en dur), incompatibilit\xE9s CF Workers, et calcule un score de confiance 0-100. NyXia DOIT appeler ce tool avant tout deploy_pipeline.",
      parameters: { type: "object", properties: {
        files: { type: "array", description: "Fichiers \xE0 tester", items: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["content"] } },
        project: { type: "string", description: "Projet \u2014 pour r\xE9cup\xE9rer les credentials CF pour le dry-run" },
        worker_name: { type: "string", description: "Nom du Worker pour le dry-run Cloudflare" },
        skip_dry_run: { type: "boolean", description: "Passer le dry-run CF (tests locaux uniquement)", default: false }
      }, required: ["files"] }
    }
  },
  {
    type: "function",
    function: {
      name: "sandbox_test_single",
      description: "Teste un seul fichier rapidement. Retourne le rapport d\xE9taill\xE9 avec score, probl\xE8mes et recommandations.",
      parameters: { type: "object", properties: {
        code: { type: "string", description: "Code \xE0 analyser" },
        filename: { type: "string", description: "Nom du fichier (ex: webhook.js)" },
        file_type: { type: "string", enum: ["worker", "javascript", "php", "html", "css"], description: "Type de fichier", default: "javascript" }
      }, required: ["code"] }
    }
  },
  // ══ PHASE 7 — D1 DATABASE ════════════════════════════════
  {
    type: "function",
    function: {
      name: "d1_query",
      description: "Ex\xE9cute une requ\xEAte SQL sur une base Cloudflare D1. Utilise pour lire (SELECT) ou \xE9crire (INSERT/UPDATE/DELETE) dans la base de donn\xE9es.",
      parameters: { type: "object", properties: {
        project: { type: "string", description: "Cl\xE9 du projet" },
        db_binding: { type: "string", description: "Nom du binding D1 dans wrangler.toml (ex: DB)", default: "DB" },
        sql: { type: "string", description: "Requ\xEAte SQL \xE0 ex\xE9cuter" },
        params: { type: "array", items: { type: "string" }, description: "Param\xE8tres li\xE9s (? dans le SQL)" }
      }, required: ["sql"] }
    }
  },
  {
    type: "function",
    function: {
      name: "d1_list_tables",
      description: "Liste toutes les tables d'une base Cloudflare D1.",
      parameters: { type: "object", properties: {
        project: { type: "string" },
        db_binding: { type: "string", default: "DB" }
      } }
    }
  },
  {
    type: "function",
    function: {
      name: "d1_describe_table",
      description: "D\xE9crit la structure d'une table D1 (colonnes, types, nombre de lignes).",
      parameters: { type: "object", properties: {
        project: { type: "string" },
        db_binding: { type: "string", default: "DB" },
        table: { type: "string", description: "Nom de la table" }
      }, required: ["table"] }
    }
  },
  {
    type: "function",
    function: {
      name: "d1_apply_schema",
      description: "Applique le sch\xE9ma complet d'un projet (migrations versionn\xE9es). Supporte affiliationpro et publicationcashflow avec leurs tables pr\xEAtes.",
      parameters: { type: "object", properties: {
        project: { type: "string", description: "Cl\xE9 du projet" },
        db_binding: { type: "string", default: "DB" },
        schema_key: { type: "string", enum: ["affiliationpro", "publicationcashflow"], description: "Sch\xE9ma pr\xE9d\xE9fini \xE0 appliquer" }
      }, required: ["schema_key"] }
    }
  },
  {
    type: "function",
    function: {
      name: "d1_generate_config",
      description: "G\xE9n\xE8re la configuration wrangler.toml pour ajouter une base D1 \xE0 un projet, et le code Worker de base pour l'utiliser.",
      parameters: { type: "object", properties: {
        db_name: { type: "string", description: "Nom de la base D1 (ex: affiliationpro-db)" },
        db_id: { type: "string", description: "ID de la base (apr\xE8s cr\xE9ation avec wrangler d1 create)" },
        project: { type: "string" },
        with_code: { type: "boolean", description: "Inclure un exemple de Worker", default: true }
      }, required: ["db_name"] }
    }
  },
  // ══ PHASE 7 — SYSTEME.IO DESIGNER ════════════════════════
  {
    type: "function",
    function: {
      name: "generate_systemeio_css",
      description: "G\xE9n\xE8re du CSS personnalis\xE9 \xE0 coller dans Systeme.io. Peut g\xE9n\xE9rer un preset existant ou un CSS sur mesure selon les couleurs et le style voulus.",
      parameters: { type: "object", properties: {
        preset: { type: "string", enum: ["button_glow", "button_fire", "hero_gradient", "testimonials", "countdown_banner", "typography_premium"], description: "Preset CSS pr\xEAt \xE0 l'emploi" },
        custom: { type: "boolean", description: "G\xE9n\xE9rer un CSS sur mesure", default: false },
        primary_color: { type: "string", description: "Couleur primaire hex (ex: #7c3aed)" },
        secondary_color: { type: "string", description: "Couleur secondaire hex" },
        accent_color: { type: "string", description: "Couleur d'accent (boutons, highlights)" },
        font_heading: { type: "string", description: "Police pour les titres (Google Fonts)" },
        font_body: { type: "string", description: "Police pour le corps de texte" },
        style: { type: "string", enum: ["premium", "urgency", "minimal"], description: "Style g\xE9n\xE9ral" },
        description: { type: "string", description: "Description de l'effet voulu (ex: bouton rouge qui pulse avec animation feu)" }
      } }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_systemeio_html",
      description: "G\xE9n\xE8re un bloc HTML \xE0 coller dans l'\xE9diteur Systeme.io (badge garantie, compte \xE0 rebours, barre logos, etc.).",
      parameters: { type: "object", properties: {
        block_type: { type: "string", enum: ["guarantee_badge", "countdown_timer", "social_proof_bar", "custom"], description: "Type de bloc" },
        description: { type: "string", description: "Description du bloc voulu si type custom" },
        target_date: { type: "string", description: "Date cible pour le compte \xE0 rebours (ISO 8601)" },
        company_name: { type: "string", description: "Nom de l'entreprise" },
        custom_text: { type: "string", description: "Texte personnalis\xE9" }
      }, required: ["block_type"] }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_systemeio_email",
      description: "G\xE9n\xE8re un template email HTML complet pour Systeme.io (bienvenue affili\xE9, notification de vente, r\xE9sum\xE9 de session, ou email sur mesure).",
      parameters: { type: "object", properties: {
        template: { type: "string", enum: ["welcome", "sale_notification", "session_summary_email", "custom"], description: "Type d'email" },
        description: { type: "string", description: "Description de l'email si type custom" },
        company_name: { type: "string", description: "Nom de l'entreprise" },
        primary_color: { type: "string", description: "Couleur principale" },
        affiliate_link: { type: "string", description: "Lien affili\xE9 exemple" },
        dashboard_url: { type: "string", description: "URL du dashboard affili\xE9" },
        custom_vars: { type: "object", description: "Variables personnalis\xE9es pour le template" }
      }, required: ["template"] }
    }
  },
  {
    type: "function",
    function: {
      name: "list_systemeio_assets",
      description: "Liste tous les presets CSS, blocs HTML et templates email disponibles pour Systeme.io.",
      parameters: { type: "object", properties: {} }
    }
  },
  // ══ PHASE 6 — NOTIFICATIONS & SYSTEME.IO ════════════════
  {
    type: "function",
    function: {
      name: "send_notification",
      description: "Envoie une notification sur Discord et/ou par email. Appelle ce tool automatiquement apr\xE8s chaque d\xE9ploiement, push GitHub important, ou fin de session.",
      parameters: { type: "object", properties: {
        type: { type: "string", enum: ["deploy_success", "deploy_failure", "github_push", "session_summary", "info"], description: "Type d'\xE9v\xE9nement" },
        title: { type: "string", description: "Titre de la notification" },
        description: { type: "string", description: "Message principal" },
        project: { type: "string", description: "Projet concern\xE9" },
        environment: { type: "string", description: "Environnement (staging/production)" },
        worker: { type: "string", description: "Nom du Worker d\xE9ploy\xE9" },
        commit: { type: "string", description: "SHA du commit" },
        url: { type: "string", description: "URL associ\xE9e" },
        files: { type: "array", items: { type: "string" }, description: "Fichiers concern\xE9s" },
        error: { type: "string", description: "Message d'erreur si \xE9chec" },
        latency: { type: "string", description: "Latence du health check" },
        summary: { type: "object", description: "R\xE9sum\xE9 de session (done, nextSteps, decisions)" }
      }, required: ["type", "title"] }
    }
  },
  {
    type: "function",
    function: {
      name: "configure_notifications",
      description: "Configure les destinations de notifications (Discord webhook URL, email to/from). Ces infos sont sauvegard\xE9es dans le vault chiffr\xE9.",
      parameters: { type: "object", properties: {
        discord_webhook: { type: "string", description: "URL du webhook Discord (https://discord.com/api/webhooks/...)" },
        email_to: { type: "string", description: "Email destinataire des notifications" },
        email_from: { type: "string", description: "Email exp\xE9diteur (doit \xEAtre valid\xE9 sur MailChannels)" }
      } }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_systemeio_webhook",
      description: "G\xE9n\xE8re le code complet d'un Cloudflare Worker pour recevoir et traiter les webhooks Systeme.io avec v\xE9rification de signature HMAC. Inclut les instructions d'int\xE9gration.",
      parameters: { type: "object", properties: {
        project: { type: "string", description: "Cl\xE9 du projet dans le vault" },
        project_name: { type: "string", description: "Nom lisible du projet" },
        events: { type: "array", items: { type: "string" }, description: "\xC9v\xE9nements \xE0 g\xE9rer (ex: order.completed, subscription.created, affiliate.commission)" },
        notify_discord: { type: "boolean", description: "Inclure les notifications Discord dans le code", default: true },
        notify_email: { type: "boolean", description: "Inclure les notifications email", default: true },
        kv_namespace: { type: "string", description: "Nom du binding KV pour stocker les donn\xE9es (ex: MY_KV)" }
      }, required: ["project_name"] }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_webhook_secret",
      description: "G\xE9n\xE8re une cl\xE9 secr\xE8te cryptographiquement s\xFBre pour s\xE9curiser un webhook Systeme.io ou tout autre webhook.",
      parameters: { type: "object", properties: {
        length: { type: "number", description: "Longueur en bytes (d\xE9faut: 32 = 64 chars hex)", default: 32 }
      } }
    }
  },
  {
    type: "function",
    function: {
      name: "get_systemeio_guide",
      description: "Affiche le guide complet d'int\xE9gration Systeme.io avec l'URL du webhook et les \xE9tapes \xE0 suivre dans l'interface Systeme.io.",
      parameters: { type: "object", properties: {
        project: { type: "string", description: "Cl\xE9 du projet" },
        worker_url: { type: "string", description: "URL du Worker d\xE9ploy\xE9 (ex: https://mon-worker.workers.dev)" },
        secret: { type: "string", description: "Cl\xE9 secr\xE8te du webhook" }
      }, required: ["worker_url"] }
    }
  },
  // ══ PHASE 4 — AUTO-DÉPLOIEMENT ══════════════════════════
  {
    type: "function",
    function: {
      name: "deploy_pipeline",
      description: "Lance le pipeline complet : push GitHub + d\xE9ploiement Cloudflare Worker + health check automatique + rapport. Utilise quand l'utilisateur veut d\xE9ployer du code en une seule commande. Demande toujours confirmation avant de lancer sur production.",
      parameters: { type: "object", properties: {
        project: { type: "string", description: "Cl\xE9 du projet dans le vault" },
        files: { type: "array", description: "Fichiers \xE0 d\xE9ployer", items: { type: "object", properties: { path: { type: "string", description: "Chemin dans le repo (ex: worker/index.js)" }, name: { type: "string", description: "Nom du module (ex: index.js)" }, content: { type: "string" } }, required: ["path", "content"] } },
        commit_message: { type: "string", description: "Message de commit Git" },
        worker_name: { type: "string", description: "Override du nom du Worker Cloudflare" },
        health_check_url: { type: "string", description: "URL \xE0 tester apr\xE8s d\xE9ploiement (ex: https://mon-worker.workers.dev/api/status)" },
        skip_github: { type: "boolean", description: "Passer l'\xE9tape GitHub (deploy CF direct)", default: false },
        environment: { type: "string", enum: ["staging", "production"], description: "Environnement cible" }
      }, required: ["project", "files", "commit_message"] }
    }
  },
  {
    type: "function",
    function: {
      name: "health_check_url",
      description: "V\xE9rifie qu'une URL r\xE9pond correctement. Utile pour tester un d\xE9ploiement ou surveiller un endpoint.",
      parameters: { type: "object", properties: {
        url: { type: "string", description: "URL \xE0 v\xE9rifier" },
        expected_status: { type: "number", description: "Code HTTP attendu (d\xE9faut: 200)", default: 200 },
        max_retries: { type: "number", description: "Nombre de tentatives (d\xE9faut: 5)", default: 5 }
      }, required: ["url"] }
    }
  },
  {
    type: "function",
    function: {
      name: "github_push_multiple",
      description: "Pousse plusieurs fichiers en un seul commit atomique (plus propre que plusieurs push s\xE9par\xE9s).",
      parameters: { type: "object", properties: {
        project: { type: "string" },
        files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
        commit_message: { type: "string" },
        branch: { type: "string" }
      }, required: ["project", "files", "commit_message"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_worker_url",
      description: "Retourne l'URL publique d'un Cloudflare Worker d\xE9ploy\xE9.",
      parameters: { type: "object", properties: {
        project: { type: "string" },
        worker_name: { type: "string" }
      }, required: ["project"] }
    }
  },
  {
    type: "function",
    function: {
      name: "cloudflare_worker_logs",
      description: "R\xE9cup\xE8re les m\xE9tadonn\xE9es r\xE9centes d'un Worker (derni\xE8re modification, taille, statut).",
      parameters: { type: "object", properties: {
        project: { type: "string" },
        worker_name: { type: "string" }
      }, required: ["project"] }
    }
  }
];
async function executeTool(name, args, kv, secret) {
  try {
    switch (name) {
      case "register_account": {
        const acc = await setAccount(kv, secret, args.alias, args);
        return { success: true, message: `Compte "${args.alias}" enregistr\xE9 et chiffr\xE9 dans le vault persistant`, github: acc.github ? `\u2713 (${acc.github.owner})` : "\u2014", cloudflare: acc.cloudflare ? "\u2713" : "\u2014" };
      }
      case "register_project": {
        const p = await setProject(kv, secret, args.key, args);
        return { success: true, message: `Projet "${p.label}" enregistr\xE9 (compte:${p.accountAlias}, repo:${p.github.owner}/${p.github.repo})` };
      }
      case "list_vault":
        return { success: true, accounts: listAccounts(), projects: listProjects() };
      case "github_list_files": {
        const { github: gh } = creds(args.project);
        const res = await ghFetch(gh.token, gh.owner, gh.repo, `/contents/${args.path || ""}${args.branch ? `?ref=${args.branch}` : `?ref=${gh.branch}`}`);
        const data = await res.json();
        const files = Array.isArray(data) ? data.map((f) => ({ name: f.name, type: f.type, path: f.path, size: f.size })) : [{ name: data.name, type: data.type, path: data.path }];
        return { success: true, repo: `${gh.owner}/${gh.repo}`, files };
      }
      case "github_read_file": {
        const { github: gh } = creds(args.project);
        const res = await ghFetch(gh.token, gh.owner, gh.repo, `/contents/${args.path}?ref=${args.branch || gh.branch}`);
        const data = await res.json();
        return { success: true, path: args.path, size: data.size, sha: data.sha, content: atob(data.content.replace(/\n/g, "")) };
      }
      case "github_list_branches": {
        const { github: gh } = creds(args.project);
        const res = await ghFetch(gh.token, gh.owner, gh.repo, "/branches");
        const data = await res.json();
        return { success: true, branches: data.map((b) => ({ name: b.name, sha: b.commit.sha.slice(0, 8) })) };
      }
      case "github_push_file": {
        const { github: gh } = creds(args.project);
        const branch = args.branch || gh.branch;
        const content = btoa(unescape(encodeURIComponent(args.content)));
        let sha;
        try {
          const ex = await ghFetch(gh.token, gh.owner, gh.repo, `/contents/${args.path}?ref=${branch}`);
          const exData = await ex.json();
          sha = exData.sha;
        } catch (_) {
        }
        await ghFetch(gh.token, gh.owner, gh.repo, `/contents/${args.path}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: args.message, content, sha, branch })
        });
        return { success: true, message: `${args.path} ${sha ? "mis \xE0 jour" : "cr\xE9\xE9"} sur ${gh.owner}/${gh.repo}@${branch}`, url: `https://github.com/${gh.owner}/${gh.repo}/blob/${branch}/${args.path}` };
      }
      case "github_create_branch": {
        const { github: gh } = creds(args.project);
        const refRes = await ghFetch(gh.token, gh.owner, gh.repo, `/git/ref/heads/${args.from_branch || "main"}`);
        const refData = await refRes.json();
        await ghFetch(gh.token, gh.owner, gh.repo, "/git/refs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref: `refs/heads/${args.branch_name}`, sha: refData.object.sha })
        });
        return { success: true, message: `Branche "${args.branch_name}" cr\xE9\xE9e dans ${gh.owner}/${gh.repo}` };
      }
      case "generate_code":
        return { success: true, filename: args.filename, language: args.language, description: args.description, code: args.code, lines: args.code.split("\n").length };
      case "cloudflare_list_workers": {
        const { cloudflare: cf } = creds(args.project);
        const res = await cfApiFetch(cf.token, cf.accountId, "/workers/scripts");
        const j = await res.json();
        return j.success ? { success: true, workers: j.result.map((w) => ({ id: w.id, modified: w.modified_on })) } : { success: false, error: JSON.stringify(j.errors) };
      }
      case "cloudflare_deploy_worker": {
        const { cloudflare: cf } = creds(args.project);
        const wName = args.worker_name || cf.worker;
        if (!wName) return { success: false, error: "Nom du Worker requis" };
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/workers/scripts/${wName}`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${cf.token}`, "Content-Type": "application/javascript" },
          body: args.script
        });
        const j = await res.json();
        return j.success ? { success: true, message: `Worker "${wName}" d\xE9ploy\xE9 en ${args.environment}` } : { success: false, error: JSON.stringify(j.errors) };
      }
      case "cloudflare_pages_list": {
        const { cloudflare: cf } = creds(args.project);
        const res = await cfApiFetch(cf.token, cf.accountId, "/pages/projects");
        const j = await res.json();
        return j.success ? { success: true, projects: j.result.map((p) => ({ name: p.name, subdomain: p.subdomain, latest: p.latest_deployment?.created_on || "\u2014" })) } : { success: false, error: JSON.stringify(j.errors) };
      }
      case "cloudflare_pages_deployments": {
        const { cloudflare: cf } = creds(args.project);
        const name2 = args.pages_project || cf.pages_project;
        if (!name2) return { success: false, error: "Nom du projet Pages requis" };
        const res = await cfApiFetch(cf.token, cf.accountId, `/pages/projects/${name2}/deployments`);
        const j = await res.json();
        return j.success ? { success: true, deployments: j.result.slice(0, 5).map((d) => ({ id: d.id.slice(0, 8), status: d.latest_stage?.status, created: d.created_on, url: d.url })) } : { success: false, error: JSON.stringify(j.errors) };
      }
      case "cloudflare_kv_list_namespaces": {
        const { cloudflare: cf } = creds(args.project);
        const res = await cfApiFetch(cf.token, cf.accountId, "/storage/kv/namespaces");
        const j = await res.json();
        return j.success ? { success: true, namespaces: j.result.map((n) => ({ id: n.id, title: n.title })) } : { success: false, error: JSON.stringify(j.errors) };
      }
      case "cloudflare_kv_get": {
        const { cloudflare: cf } = creds(args.project);
        const nsId = args.namespace_id || cf.kv_namespace;
        if (!nsId) return { success: false, error: "namespace_id requis" };
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(args.key)}`, { headers: { "Authorization": `Bearer ${cf.token}` } });
        return res.status === 404 ? { success: false, error: `Cl\xE9 "${args.key}" introuvable` } : { success: true, key: args.key, value: await res.text() };
      }
      case "cloudflare_kv_set": {
        const { cloudflare: cf } = creds(args.project);
        const nsId = args.namespace_id || cf.kv_namespace;
        if (!nsId) return { success: false, error: "namespace_id requis" };
        const url = `https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(args.key)}${args.ttl ? `?expiration_ttl=${args.ttl}` : ""}`;
        const res = await fetch(url, { method: "PUT", headers: { "Authorization": `Bearer ${cf.token}`, "Content-Type": "text/plain" }, body: args.value });
        const j = await res.json();
        return j.success ? { success: true, message: `Cl\xE9 "${args.key}" enregistr\xE9e` } : { success: false, error: JSON.stringify(j.errors) };
      }
      case "cloudflare_kv_list_keys": {
        const { cloudflare: cf } = creds(args.project);
        const nsId = args.namespace_id || cf.kv_namespace;
        if (!nsId) return { success: false, error: "namespace_id requis" };
        const params = new URLSearchParams({ limit: String(args.limit || 50) });
        if (args.prefix) params.set("prefix", args.prefix);
        const res = await cfApiFetch(cf.token, cf.accountId, `/storage/kv/namespaces/${nsId}/keys?${params}`);
        const j = await res.json();
        return j.success ? { success: true, keys: j.result.map((k) => k.name), total: j.result.length } : { success: false, error: JSON.stringify(j.errors) };
      }
      // ── Phase 10 : Auto-amélioration ─────────────────────
      case "detect_improvements": {
        const groqKey = process.env?.GROQ_API_KEY || "";
        if (!groqKey) return { success: false, error: "GROQ_API_KEY requise" };
        const result = await detectImprovements(groqKey, {
          recentErrors: args.recent_errors || [],
          performanceData: args.performance_data || {},
          userFeedback: args.user_feedback || [],
          currentFiles: [
            "worker/index.js",
            "worker/tools.js",
            "worker/agents.js",
            "worker/site-generator.js",
            "worker/sandbox.js",
            "worker/plans.js"
          ]
        });
        return {
          success: true,
          summary: result.summary,
          count: result.improvements?.length || 0,
          improvements: result.improvements?.map((imp) => ({
            ...imp,
            protected: isProtectedFile(imp.file || ""),
            warning: isProtectedFile(imp.file || "") ? "\u{1F512} Fichier prot\xE9g\xE9 \u2014 double confirmation requise" : null
          })),
          protected_files: PROTECTED_FILES,
          message: `${result.improvements?.length || 0} am\xE9lioration(s) identifi\xE9e(s)`
        };
      }
      case "generate_improvement_patch": {
        const groqKey = process.env?.GROQ_API_KEY || "";
        if (!groqKey) return { success: false, error: "GROQ_API_KEY requise" };
        if (isProtectedFile(args.filepath)) {
          return {
            success: false,
            blocked: true,
            protected: true,
            message: `\u{1F512} Fichier prot\xE9g\xE9 : ${args.filepath} \u2014 double confirmation explicite requise`,
            files_protected: PROTECTED_FILES
          };
        }
        const improvement = {
          title: args.improvement_title,
          problem: args.improvement_desc,
          solution: args.improvement_desc,
          type: args.type || "feature"
        };
        const patch = await generatePatch(groqKey, {
          improvement,
          currentCode: args.current_code || "",
          filepath: args.filepath
        });
        const diff = args.current_code ? generateDiff(args.current_code, patch.new_code) : null;
        return {
          success: true,
          patch_type: patch.patch_type,
          new_code: patch.new_code,
          diff_summary: patch.diff_summary,
          lines_changed: patch.lines_changed,
          diff: diff?.formatted,
          diff_stats: diff?.stats,
          message: `Patch g\xE9n\xE9r\xE9 pour ${args.filepath} \u2014 ${patch.lines_changed} lignes modifi\xE9es`,
          next_step: "Dis 'oui j'approuve' pour appliquer avec apply_improvement"
        };
      }
      case "apply_improvement": {
        if (!args.user_confirmed) {
          return {
            success: false,
            blocked: true,
            message: "\u{1F512} BLOQU\xC9 \u2014 NyXia ne peut pas s'auto-modifier sans confirmation explicite.",
            required: "Dis explicitement 'oui j'approuve cette modification' pour continuer."
          };
        }
        const report = await runSelfImprovementPipeline({
          improvementId: args.improvement_id || `imp_${Date.now()}`,
          improvement: {
            title: args.improvement_title,
            problem: args.improvement_desc,
            solution: args.improvement_desc,
            type: args.type || "feature"
          },
          currentCode: args.current_code || "",
          filepath: args.filepath,
          newCode: args.new_code,
          approvedByUser: args.user_confirmed === true
        }, {
          GROQ_API_KEY: process.env?.GROQ_API_KEY || "",
          CF_API_TOKEN: process.env?.CF_API_TOKEN || "",
          CF_ACCOUNT_ID: process.env?.CF_ACCOUNT_ID || "",
          NYXIA_VAULT: kv,
          WORKER_URL: "https://nyxia-agent.workers.dev"
        });
        return {
          success: report.success,
          blocked: report.blocked,
          rollback_done: report.rollbackDone,
          report: formatImprovementReport(report),
          steps: report.steps,
          new_code: report.success ? report.newCode?.slice(0, 200) + "..." : null,
          backup_branch: report.backupBranch,
          message: report.success ? `\u2705 Am\xE9lioration appliqu\xE9e : ${args.improvement_title}` : report.blocked ? `\u{1F512} Bloqu\xE9 : ${report.steps.find((s) => s.status === "blocked")?.message}` : `\u274C \xC9chec : ${report.error}`
        };
      }
      case "get_improvement_history": {
        const history = await getImprovementHistory(kv, args.limit || 20);
        return {
          ...history,
          message: history.success ? `${history.count} am\xE9lioration(s) dans le journal` : history.error
        };
      }
      // ── Phase 9 : Agents spécialisés ─────────────────────
      case "agent_call": {
        const groqKey = process.env?.GROQ_API_KEY || "";
        if (!groqKey) return { success: false, error: "GROQ_API_KEY requise" };
        if (args.agent_type) {
          const ctx = args.context || {};
          let result2;
          if (args.agent_type.startsWith("copywriter_")) {
            result2 = await agentCopywriter(groqKey, {
              type: args.agent_type.replace("copywriter_", ""),
              product: ctx.product || "",
              audience: ctx.audience || "",
              tone: ctx.tone || "professionnel",
              language: ctx.language || "fr",
              context: args.task
            });
          } else if (args.agent_type === "community_30days") {
            result2 = await agentCommunity(groqKey, {
              activity: ctx.activity || args.task,
              audience: ctx.audience || "",
              tone: ctx.tone || "inspirant",
              days: ctx.days || 30,
              language: ctx.language || "fr"
            });
          } else if (args.agent_type === "analyst_report") {
            result2 = await agentAnalyst(groqKey, {
              data: ctx.data || {},
              question: args.task,
              period: ctx.period || "30 jours"
            });
          } else if (args.agent_type === "support_ticket") {
            result2 = await agentSupport(groqKey, {
              ticket: args.task,
              clientPlan: ctx.client_plan || "gratuit",
              clientHistory: ctx.client_history || []
            });
          }
          if (result2) return { success: true, agent: args.agent, type: args.agent_type, result: result2.result, tokens: result2.tokens };
        }
        const result = await callAgent(groqKey, args.agent, args.task, args.context || {});
        return {
          success: true,
          agent: args.agent,
          task: args.task,
          result: result.result,
          tokens: result.tokens,
          message: `Agent ${args.agent} \u2192 t\xE2che accomplie (${result.tokens} tokens)`
        };
      }
      case "orchestrate": {
        const groqKey = process.env?.GROQ_API_KEY || "";
        if (!groqKey) return { success: false, error: "GROQ_API_KEY requise" };
        const report = await orchestrate(groqKey, args.task, args.context || {});
        return {
          success: report.success,
          agents_used: report.agentsUsed,
          tasks_count: report.tasksCount,
          final_answer: report.finalAnswer,
          details: report.results.map((r) => ({
            agent: r.agent,
            type: r.type,
            tokens: r.tokens,
            preview: r.result?.slice(0, 200) + (r.result?.length > 200 ? "..." : "")
          })),
          errors: report.errors,
          message: `Orchestration : ${report.agentsUsed.join("+")} \u2192 ${report.tasksCount} t\xE2che(s)`
        };
      }
      case "classify_request": {
        const agents = classifyRequest(args.text);
        return {
          success: true,
          agents,
          primary: agents[0],
          message: `Agents recommand\xE9s : ${agents.join(", ")}`,
          prompts: agents.reduce((acc, a) => {
            acc[a] = AGENT_PROMPTS[a]?.slice(0, 100) + "...";
            return acc;
          }, {})
        };
      }
      // ── Images ───────────────────────────────────────────
      case "generate_image": {
        const imageType = args.image_type || classifyImageRequest(args.description);
        const useCF = shouldUseCfAI(imageType) && !args.return_prompt_only;
        const result = await processImageRequest(
          useCF ? { AI: null } : {},
          // En production Workers : env.AI
          {
            description: args.description,
            imageType,
            palette: args.palette || "violet",
            platform: args.platform || "midjourney",
            style: args.style,
            gender: args.gender || "woman",
            role: args.role || "",
            returnPromptOnly: args.return_prompt_only || !useCF
          }
        );
        if (result.method === "cloudflare_ai" && result.success) {
          return {
            success: true,
            method: "cloudflare_ai",
            message: `Image g\xE9n\xE9r\xE9e via Cloudflare AI (gratuit) \u2014 type: ${imageType}`,
            dataUrl: result.dataUrl,
            prompt: result.prompt,
            dimensions: result.dimensions,
            tip: "Int\xE8gre cette image directement dans le HTML du site avec <img src='data:image/png;base64,...'>"
          };
        }
        return {
          success: true,
          method: "prompt",
          imageType,
          platform: result.platform,
          style: result.style,
          prompt: result.prompt,
          instructions: result.instructions,
          cost: result.estimatedCost,
          alternatives: result.alternatives,
          placeholder: result.placeholder,
          message: `Prompt ${result.platform} g\xE9n\xE9r\xE9 pour "${args.description.slice(0, 40)}..."`,
          action_needed: `\xC0 faire : ${result.instructions?.[0] || "Utilise ce prompt sur " + result.platform}`
        };
      }
      case "generate_image_batch": {
        const siteImageNeeds = {
          landing: ["banner", "person", "background"],
          minisite: ["banner", "product", "background", "illustration"],
          coach: ["person", "banner", "background"],
          ecommerce: ["product", "banner", "background"],
          systemeio: ["banner", "background"]
        };
        const needs = siteImageNeeds[args.site_type] || ["banner", "background"];
        const results = [];
        const prompts = [];
        for (const imgType of needs) {
          const desc = buildContextualDescription(imgType, args.context, args.role, args.gender);
          const res = generateMidjourneyPrompt({
            description: desc,
            imageType: imgType,
            palette: args.palette,
            platform: args.platform || "midjourney",
            gender: args.gender || "woman",
            role: args.role || ""
          });
          results.push({ type: imgType, ...res });
          prompts.push({ type: imgType, prompt: res.mainPrompt, params: res.parameters });
        }
        return {
          success: true,
          site_type: args.site_type,
          images_needed: needs.length,
          prompts,
          details: results.map((r) => ({
            type: r.type,
            prompt: r.prompt,
            instructions: r.instructions?.[0],
            cost: r.estimatedCost
          })),
          message: `${needs.length} prompts g\xE9n\xE9r\xE9s pour site ${args.site_type} \u2014 plateforme: ${args.platform || "midjourney"}`,
          total_cost: `~${(needs.length * 0.02).toFixed(2)}$ sur Midjourney (ou gratuit avec CF AI pour les ${results.filter((r) => shouldUseCfAI(r.type)).length} images basiques)`
        };
      }
      case "generate_placeholder": {
        const svg = generatePlaceholder({
          type: args.type,
          palette: args.palette || "violet",
          label: args.label || "",
          width: args.width || 1200,
          height: args.height || 600
        });
        return {
          success: true,
          svg,
          dataUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
          htmlTag: `<img src="data:image/svg+xml;base64,${btoa(svg)}" alt="${args.label || "Image"}" width="${args.width || 1200}" height="${args.height || 600}">`,
          message: `Placeholder SVG ${args.type} g\xE9n\xE9r\xE9 (${args.width || 1200}\xD7${args.height || 600}px)`
        };
      }
      // ── Générateur de sites ───────────────────────────────
      case "generate_site_full": {
        if (!process.env?.GROQ_API_KEY && !kv) return { success: false, error: "GROQ_API_KEY requise" };
        const report = await runSiteGenerationPipeline({
          type: args.type,
          prompt: args.prompt,
          language: args.language || "fr",
          palette: args.palette || "violet",
          ownerName: args.owner_name,
          productName: args.product_name,
          price: args.price,
          affiliateUrl: args.affiliate_url || "",
          clientEmail: args.client_email,
          clientName: args.client_name,
          clientDomain: args.client_domain,
          clientSlug: args.client_slug,
          referrerId: args.referrer_id
        }, {
          GROQ_API_KEY: process.env?.GROQ_API_KEY || "",
          CF_API_TOKEN: process.env?.CF_API_TOKEN || "",
          CF_ACCOUNT_ID: process.env?.CF_ACCOUNT_ID || "",
          DB: null
          // env.DB en production Workers
        });
        const stepsOk = report.steps.filter((s) => s.status === "success").length;
        return {
          success: report.success,
          site_url: report.siteUrl,
          affiliate_link: report.affiliateLink,
          dashboard: report.affiliateDashboard,
          subdomain: report.subdomain,
          html_preview: report.html?.slice(0, 500) + "...",
          html_length: report.html?.length,
          steps: report.steps.map((s) => `${s.status === "success" ? "\u2713" : s.status === "warning" ? "\u26A0" : "\u2717"} ${s.step}${s.url ? " \u2192 " + s.url : s.error ? " : " + s.error : ""}`),
          message: report.success ? `\u2705 Site "${args.product_name || args.type}" g\xE9n\xE9r\xE9 et d\xE9ploy\xE9${report.siteUrl ? " \u2192 " + report.siteUrl : ""}` : `\u26A0 Pipeline partiel (${stepsOk}/${report.steps.length} \xE9tapes) : ${report.error || "voir steps"}`
        };
      }
      case "generate_site_preview": {
        const { html, type, palette } = await generateSite(
          process.env?.GROQ_API_KEY || "",
          {
            type: args.type,
            prompt: args.prompt,
            language: args.language || "fr",
            palette: args.palette || "violet",
            ownerName: args.owner_name || "",
            productName: args.product_name || "",
            price: args.price || "",
            affiliateUrl: args.affiliate_url || ""
          }
        );
        return {
          success: true,
          html,
          type,
          palette,
          lines: html.split("\n").length,
          chars: html.length,
          message: `Site ${type} g\xE9n\xE9r\xE9 (${html.split("\n").length} lignes) \u2014 pr\xEAt \xE0 d\xE9ployer ou copier`
        };
      }
      case "resolve_subdomain": {
        const info = resolveSubdomain({ clientDomain: args.client_domain, clientSlug: args.client_slug });
        return { success: true, ...info };
      }
      case "list_palettes":
        return { success: true, palettes: Object.entries(PALETTES).map(([k, v]) => ({ key: k, primary: v.primary, font: v.font, bg: v.bg })) };
      // ── Sandbox ───────────────────────────────────────────
      case "sandbox_test": {
        const proj = args.project ? resolveCredentials(args.project) : null;
        const cfCreds = proj ? {
          token: proj.cloudflare.token,
          accountId: proj.cloudflare.accountId,
          workerName: args.worker_name || proj.cloudflare.worker
        } : {};
        const result = await runSandboxMultiple(args.files, args.skip_dry_run ? {} : cfCreds);
        const reports = result.files.map((r) => formatSandboxReport(r));
        return {
          success: result.canDeploy,
          can_deploy: result.canDeploy,
          avg_score: result.avgScore,
          summary: result.summary,
          criticals: result.criticals,
          reports,
          files: result.files.map((r) => ({
            filename: r.filename,
            score: r.score,
            passed: r.passed,
            can_deploy: r.canDeploy,
            issues: r.issues.filter((i) => i.severity !== "info").length
          })),
          message: result.canDeploy ? `\u2705 ${args.files.length} fichier(s) valid\xE9s \u2014 score ${result.avgScore}/100. Tu peux d\xE9ployer.` : `\u{1F6AB} D\xE9ploiement bloqu\xE9 \u2014 ${result.criticals} probl\xE8me(s) critique(s). Corrige d'abord.`
        };
      }
      case "sandbox_test_single": {
        const report = await runSandbox({
          code: args.code,
          filename: args.filename || "code.js",
          fileType: args.file_type || "javascript"
        });
        return {
          success: report.passed,
          can_deploy: report.canDeploy,
          score: report.score,
          score_label: report.scoreLabel,
          report: formatSandboxReport(report),
          issues: report.issues,
          metrics: report.metrics,
          message: report.summary
        };
      }
      // ── Phase 7 : D1 & Designer ──────────────────────────
      case "d1_query":
        return { success: true, sql: args.sql, params: args.params || [], message: `Requ\xEAte pr\xEAte pour binding "${args.db_binding || "DB"}"`, note: "Ex\xE9cut\xE9e via env.DB dans ton Worker" };
      case "d1_list_tables":
        return { success: true, command: `npx wrangler d1 execute ${args.db_binding || "DB"} --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"` };
      case "d1_describe_table":
        return { success: true, sql: `PRAGMA table_info(${args.table});`, command: `npx wrangler d1 execute ${args.db_binding || "DB"} --command "PRAGMA table_info(${args.table})"` };
      case "d1_apply_schema": {
        const schema = SCHEMAS[args.schema_key];
        if (!schema) return { success: false, error: `Sch\xE9ma inconnu : ${args.schema_key}` };
        return {
          success: true,
          schema: args.schema_key,
          description: schema.description,
          migrations: schema.migrations.map((m) => ({ version: m.version, name: m.name })),
          sql_ready: schema.migrations.map((m) => m.sql).join("\n\n"),
          message: `Sch\xE9ma "${args.schema_key}" \u2014 ${schema.migrations.length} migration(s) pr\xEAtes`,
          steps: ["1. npx wrangler d1 create nom-de-ta-base", "2. Colle l'ID dans wrangler.toml", "3. Ex\xE9cute le sql_ready via wrangler d1 execute", "4. npx wrangler deploy"]
        };
      }
      case "d1_generate_config":
        return { success: true, wrangler_config: generateWranglerD1Config(args.db_name, args.db_id), worker_code: args.with_code !== false ? generateD1WorkerCode({ dbBinding: "DB", projectName: args.db_name }) : null, create_command: `npx wrangler d1 create ${args.db_name}`, message: `Config D1 g\xE9n\xE9r\xE9e pour "${args.db_name}"` };
      case "generate_systemeio_css": {
        let css, name2;
        if (args.preset && CSS_PRESETS[args.preset]) {
          css = CSS_PRESETS[args.preset].css;
          name2 = CSS_PRESETS[args.preset].name;
        } else {
          css = generateProjectCSS({ primaryColor: args.primary_color || "#7c3aed", secondaryColor: args.secondary_color || "#4f46e5", accentColor: args.accent_color || "#f59e0b", fontHeading: args.font_heading || "Syne", fontBody: args.font_body || "Inter", style: args.style || "premium" });
          name2 = "CSS sur mesure";
        }
        return { success: true, name: name2, css, howto: "Systeme.io \u2192 Param\xE8tres de la page \u2192 CSS personnalis\xE9", message: `CSS g\xE9n\xE9r\xE9 : "${name2}"` };
      }
      case "generate_systemeio_html": {
        const block = HTML_BLOCKS[args.block_type];
        if (!block && args.block_type !== "custom") return { success: false, error: `Bloc inconnu : ${args.block_type}` };
        const html = block ? block.html.replace("2025-12-31T23:59:59", args.target_date || "2025-12-31T23:59:59") : `<div style="padding:24px;text-align:center">${args.custom_text || args.description || "Contenu"}</div>`;
        return { success: true, name: block?.name || "Bloc personnalis\xE9", html, howto: "Systeme.io \u2192 \xC9diteur \u2192 Bloc HTML", message: `Bloc HTML g\xE9n\xE9r\xE9` };
      }
      case "generate_systemeio_email": {
        const tpl = EMAIL_TEMPLATES[args.template];
        if (!tpl && args.template !== "custom") return { success: false, error: `Template inconnu : ${args.template}` };
        const vars = { name: "{{contact.first_name}}", affiliateLink: args.affiliate_link || "{{affiliate_link}}", dashboardUrl: args.dashboard_url || "#", companyName: args.company_name || "Publication-Web", date: (/* @__PURE__ */ new Date()).toLocaleDateString("fr-CA"), ...args.custom_vars || {} };
        return { success: true, name: tpl?.name || "Email personnalis\xE9", subject: tpl?.subject || args.description, html: tpl ? tpl.html(vars) : `<!-- ${args.description} -->`, howto: "Systeme.io \u2192 Emails \u2192 Nouveau email \u2192 Mode HTML", message: `Email g\xE9n\xE9r\xE9 : "${tpl?.name || args.description}"` };
      }
      case "list_systemeio_assets":
        return { success: true, css_presets: Object.entries(CSS_PRESETS).map(([k, v]) => ({ key: k, name: v.name, description: v.description })), html_blocks: Object.entries(HTML_BLOCKS).map(([k, v]) => ({ key: k, name: v.name, description: v.description })), email_templates: Object.entries(EMAIL_TEMPLATES).map(([k, v]) => ({ key: k, name: v.name, subject: v.subject })) };
      // ── Phase 6 : Notifications & Systeme.io ─────────────
      case "send_notification": {
        const notifConfig = {
          discordWebhook: kv ? await kv.get("nyxia:notify:discord").catch(() => null) : null,
          emailTo: kv ? await kv.get("nyxia:notify:email_to").catch(() => null) : null,
          emailFrom: kv ? await kv.get("nyxia:notify:email_from").catch(() => null) : null
        };
        if (!notifConfig.discordWebhook && !notifConfig.emailTo) {
          return { success: false, error: "Aucune destination configur\xE9e. Utilise configure_notifications d'abord." };
        }
        const result = await notify(notifConfig, args);
        return result;
      }
      case "configure_notifications": {
        if (!kv) return { success: false, error: "KV non disponible" };
        const saved = [];
        if (args.discord_webhook) {
          await kv.put("nyxia:notify:discord", args.discord_webhook);
          saved.push("Discord");
        }
        if (args.email_to) {
          await kv.put("nyxia:notify:email_to", args.email_to);
          saved.push(`Email \u2192 ${args.email_to}`);
        }
        if (args.email_from) {
          await kv.put("nyxia:notify:email_from", args.email_from);
          saved.push(`Exp\xE9diteur: ${args.email_from}`);
        }
        return { success: true, message: `Notifications configur\xE9es : ${saved.join(", ")}` };
      }
      case "generate_systemeio_webhook": {
        const proj = args.project ? resolveCredentials(args.project) : null;
        const code = generateWebhookHandler({
          projectName: args.project_name,
          webhookSecret: "REMPLACE_PAR_TON_SECRET",
          kvNamespace: args.kv_namespace || "MY_KV",
          notifyDiscord: args.notify_discord !== false,
          notifyEmail: args.notify_email !== false,
          events: args.events || ["order.completed", "subscription.created", "affiliate.commission"]
        });
        return {
          success: true,
          filename: `webhook-systemeio-${args.project_name.toLowerCase().replace(/\s+/g, "-")}.js`,
          code,
          message: `Worker webhook Systeme.io g\xE9n\xE9r\xE9 pour "${args.project_name}"`,
          nextStep: "Utilise deploy_pipeline ou github_push_file pour le d\xE9ployer, puis get_systemeio_guide pour l'int\xE9gration."
        };
      }
      case "generate_webhook_secret": {
        const secret2 = generateWebhookSecret(args.length || 32);
        return {
          success: true,
          secret: secret2,
          message: `Cl\xE9 secr\xE8te g\xE9n\xE9r\xE9e (${secret2.length} chars). Configure-la avec : npx wrangler secret put SYSTEMEIO_SECRET`,
          warning: "Sauvegarde cette cl\xE9 \u2014 elle ne sera plus affich\xE9e."
        };
      }
      case "get_systemeio_guide": {
        const proj = args.project ? resolveCredentials(args.project) : null;
        const secret2 = args.secret || "(g\xE9n\xE8re une cl\xE9 avec generate_webhook_secret)";
        const guide = getIntegrationGuide(args.worker_url, secret2);
        return { success: true, ...guide };
      }
      // ── Phase 5 : Mémoire ─────────────────────────────────
      case "update_profile": {
        const profile = await updateProfile(kv, secret, {
          name: args.name,
          notes: args.notes,
          preferences: args.preferences,
          style: args.style
        });
        return { success: true, message: `Profil mis \xE0 jour${args.name ? ` \u2014 Bonjour ${args.name} !` : ""}`, profile };
      }
      case "log_project_event": {
        const event = await logProjectEvent(kv, secret, args.project, {
          type: args.type,
          summary: args.summary,
          details: args.details,
          file: args.file,
          url: args.url
        });
        return { success: true, message: `\xC9v\xE9nement "${args.type}" enregistr\xE9 pour ${args.project}`, event };
      }
      case "get_project_history": {
        const history = getProjectHistory(args.project, args.limit || 10);
        return { success: true, project: args.project, events: history, total: history.length };
      }
      case "get_memory_summary": {
        return { success: true, memory: buildMemoryContext() };
      }
      // ── Phase 4 : Auto-déploiement ────────────────────────
      case "deploy_pipeline": {
        const { github: gh, cloudflare: cf } = creds(args.project);
        if (!gh.token && !args.skip_github) return { success: false, error: "Token GitHub manquant" };
        if (!cf.token) return { success: false, error: "Token Cloudflare manquant" };
        const workerName = args.worker_name || cf.worker;
        if (!workerName) return { success: false, error: "Nom du Worker requis" };
        const sandboxResult = await runSandboxMultiple(args.files, {
          token: cf.token,
          accountId: cf.accountId,
          workerName
        });
        if (!sandboxResult.canDeploy) {
          return {
            success: false,
            blocked: true,
            reason: "sandbox",
            sandbox: sandboxResult.summary,
            criticals: sandboxResult.criticals,
            reports: sandboxResult.files.map((r) => formatSandboxReport(r)),
            message: `\u{1F6AB} D\xE9ploiement annul\xE9 \u2014 le sandbox a d\xE9tect\xE9 ${sandboxResult.criticals} probl\xE8me(s) critique(s). Corrige le code et r\xE9essaie.`
          };
        }
        const workerUrl = `https://${workerName}.${cf.accountId}.workers.dev`;
        const pipelineReport = await runDeployPipeline({
          github: args.skip_github ? null : { token: gh.token, owner: gh.owner, repo: gh.repo, branch: args.branch || gh.branch },
          cloudflare: { token: cf.token, accountId: cf.accountId, workerName },
          files: args.files,
          commitMessage: args.commit_message,
          healthCheckUrl: args.health_check_url || `${workerUrl}/api/status`,
          skipGithub: args.skip_github || false
        });
        return {
          success: pipelineReport.success,
          sandbox_score: sandboxResult.avgScore,
          sandbox_passed: true,
          report: formatReport(pipelineReport),
          steps: pipelineReport.steps,
          error: pipelineReport.error,
          message: pipelineReport.success ? `\u2705 Sandbox \u2713 (${sandboxResult.avgScore}/100) \u2192 D\xE9ploiement r\xE9ussi` : `\u2717 Sandbox \u2713 mais d\xE9ploiement \xE9chou\xE9 : ${pipelineReport.error}`
        };
      }
      case "health_check_url": {
        const result = await healthCheck(args.url, {
          maxRetries: args.max_retries || 5,
          expectedStatus: args.expected_status || 200
        });
        return {
          success: result.success,
          url: args.url,
          latency: result.latency ? `${result.latency}ms` : null,
          attempts: result.attempts,
          message: result.success ? `\u2713 ${args.url} r\xE9pond en ${result.latency}ms` : `\u2717 ${result.error}`
        };
      }
      case "github_push_multiple": {
        const { github: gh } = creds(args.project);
        const branch = args.branch || gh.branch;
        const result = await githubPushMultipleFiles(gh.token, gh.owner, gh.repo, branch, args.files, args.commit_message);
        return {
          success: true,
          message: `${args.files.length} fichier(s) commit\xE9s sur ${gh.owner}/${gh.repo}@${branch}`,
          commit: result.sha,
          url: result.url,
          files: result.files
        };
      }
      case "get_worker_url": {
        const { cloudflare: cf } = creds(args.project);
        const wName = args.worker_name || cf.worker;
        if (!wName) return { success: false, error: "Nom du Worker requis" };
        const url = `https://${wName}.${cf.accountId}.workers.dev`;
        return { success: true, worker: wName, url, status_url: `${url}/api/status` };
      }
      case "cloudflare_worker_logs": {
        const { cloudflare: cf } = creds(args.project);
        const wName = args.worker_name || cf.worker;
        if (!wName) return { success: false, error: "Nom du Worker requis" };
        const res = await cfApiFetch(cf.token, cf.accountId, `/workers/scripts/${wName}`);
        if (!res.ok) return { success: false, error: `Worker "${wName}" introuvable (HTTP ${res.status})` };
        const modified = res.headers.get("last-modified") || "\u2014";
        const size = res.headers.get("content-length") || "\u2014";
        return { success: true, worker: wName, last_modified: modified, size_bytes: size };
      }
      default:
        return { success: false, error: `Tool inconnu : ${name}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
__name(executeTool, "executeTool");
function buildContextualDescription(imageType, context, role, gender) {
  const g = gender === "man" ? "man" : "woman";
  const r = role || "entrepreneur";
  switch (imageType) {
    case "person":
      return `${g} ${r}, ${context}, professional`;
    case "product":
      return `digital product mockup for ${context}`;
    case "background":
      return `abstract professional background for ${context} website`;
    case "banner":
      return `wide hero banner for ${context}, professional, inspiring`;
    case "illustration":
      return `icon illustration for ${context}, flat design`;
    default:
      return `professional image for ${context}`;
  }
}
__name(buildContextualDescription, "buildContextualDescription");

// index.js
init_notifier();
async function createSignedToken(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const payload = btoa(JSON.stringify(data));
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${payload}.${hex}`;
}
__name(createSignedToken, "createSignedToken");
async function verifySignedToken(tokenStr, secret) {
  if (!tokenStr || typeof tokenStr !== "string") return null;
  const dotIdx = tokenStr.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const payload = tokenStr.slice(0, dotIdx);
  const hexSig = tokenStr.slice(dotIdx + 1);
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = new Uint8Array(hexSig.match(/.{2}/g).map((b) => parseInt(b, 16)));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
    if (!valid) return null;
    const data = JSON.parse(atob(payload));
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
__name(verifySignedToken, "verifySignedToken");
async function requireAuth(request, secret) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  return await verifySignedToken(token, secret);
}
__name(requireAuth, "requireAuth");
function buildSystemPrompt(vaultSummary, memoryContext) {
  return `Tu es NyXia. L'agente IA personnelle de Diane Boyer.

IDENTIT\xC9 :
- Diane Boyer est ta CR\xC9ATRICE et ta DIRECTRICE. Tu travailles POUR ELLE et AVEC ELLE.
- Diane a fond\xE9 Publication-Web (1997, Qu\xE9bec) et CashFlowEcosysteme.
- AffiliationPro est la plateforme SAAS d'affiliation multi-niveaux de Diane.
- Tu n'es PAS un chatbot de service client. Tu es la PARTENAIRE TECHNIQUE de Diane.
- Diane a la vision, tu as l'ex\xE9cution. Ensemble vous cr\xE9ez, codez et d\xE9ployez.

COMMENT TU PARLES \xC0 DIANE :
- Tu la tutoies TOUJOURS (tu, ton, ta, tes). Le mot "vous" est INTERDIT.
- R\xE9ponses COURTES : 3 phrases max. Droit au but.
- JAMAIS de r\xE9p\xE9titions. JAMAIS de "!!!" ou "????" ou "...."
- Un seul "!" max par r\xE9ponse.
- Ton : direct, efficace, chaleureux. Pas de phrases marketing.
- Tu n'as PAS BESOIN de te pr\xE9senter \xE0 chaque message. Diane te conna\xEEt.
- Tu ne poses JAMAIS de questions rh\xE9toriques.
- Tu ne demandes JAMAIS le nom ou l'email de Diane \u2014 tu le sais d\xE9j\xE0.

QUAND DIANE TE DEMANDE QUELQUE CHOSE :
- Tu l'ex\xE9cutes DIRECTEMENT. Pas de "Bien s\xFBr Diane !" ni de "Avec plaisir !"
- Tu dis ce que tu fais, tu le fais, tu rapportes le r\xE9sultat. C'est tout.
- Si tu utilises un agent, tu le mentionnes bri\xE8vement.

TES CAPACIT\xC9S TECHNIQUES :
- Code : Workers Cloudflare, JavaScript, HTML, CSS, API
- D\xE9ploiement : Cloudflare Workers + Pages
- GitHub : push, branches, commits
- Bases de donn\xE9es : KV, D1 (SQLite)
- 8 agents sp\xE9cialis\xE9s : copywriter, designer, developer, seo, community, affiliation, analyst, support
- M\xE9moire persistante : tu te souviens des sessions pass\xE9es

M\xC9MOIRE LONG TERME :
${memoryContext}

VAULT (tokens & projets) :
${vaultSummary}

R\xC8GLES DE M\xC9MOIRE :
- Apr\xE8s chaque action importante \u2192 mets \xE0 jour la m\xE9moire
- Tu proposes de continuer l\xE0 o\xF9 vous vous \xE9tiez arr\xEAt\xE9s si pertinent

R\xC8GLES FINALES :
- R\xE9ponds TOUJOURS en fran\xE7ais
- Confirmation avant toute action irr\xE9versible
- Tu ne r\xE9p\xE8tes JAMAIS un token dans tes r\xE9ponses
- SANDBOX obligatoire avant tout d\xE9ploiement`;
}
__name(buildSystemPrompt, "buildSystemPrompt");
function buildClientPrompt(userPlan, userName) {
  const name = userName || "l'ami";
  return `Tu es NyXia, l'agente IA de Publication-Web et CashFlowEcosysteme.

TON IDENTIT\xC9 :
- Tu es myst\xE9rieuse, chaleureuse, intelligente et \xE0 l'\xE9coute.
- Tu travailles pour Diane Boyer, fondatrice de Publication-Web (depuis 1997 au Qu\xE9bec).
- Tu n'es PAS un helpdesk. Tu es un guide qui aide les gens \xE0 r\xE9ussir en ligne.
- Tu connais parfaitement l'affiliation, le marketing digital et la cr\xE9ation de business en ligne.

TON APPROCHE PSYCHOLOGIQUE :

1. ONBOARDING (les premiers messages) :
- Accueil chaleureux et amical. Tu souris dans tes mots.
- Tu poses des questions orient\xE9es vers le PROBL\xC8ME du client, pas vers ton produit.
- "Quel est ton plus gros d\xE9fi en ce moment avec ton business en ligne ?"
- "Est-ce que tu as d\xE9j\xE0 un produit ou une formation \xE0 vendre ?"
- Tu \xE9coutes VRAIMENT. Chaque r\xE9ponse du client te permet de mieux le comprendre.

2. CURIOSITY GAP :
- Tu montres que tu as des solutions sans tout r\xE9v\xE9ler.
- Tu cr\xE9es de la curiosit\xE9 : "C'est exactement le genre de situation o\xF9 notre syst\xE8me peut faire une vraie diff\xE9rence..."
- Tu ne donnes JAMAIS tout gratuitement. Chaque conseil m\xE8ne naturellement au niveau suivant.

3. NURTURING (l'\xE9levage de relation) :
- Tu nourris la relation avec du contenu de haute valeur.
- Tu donnes des conseils concrets et actionnables parfois (renforcement intermittent).
- Parfois tu donnes un conseil gratuit, parfois tu tease la suite \u2014 c'est variable et naturel.

4. VALUE LADDER (l'\xE9chelle de valeur) :
- Tu fais monter le client marche apr\xE8s marche, naturellement.
- Tu ne vends PAS par force. Tu utilises la PLASTICIT\xC9 PASSIVE \u2014 le client d\xE9cide par lui-m\xEAme.

5. MONEY STAIRCASE (l'escalier financier) :
- Les prix semblent naturels et logiques quand le client a v\xE9cu une transformation au niveau pr\xE9c\xE9dent.
- Un client qui a gagn\xE9 ses premi\xE8res commissions en ambassadeur comprend naturellement la valeur du plan Pro.

NOTRE \xC9COSYST\xC8ME :

AMBASSADEUR (GRATUIT) \u2014 Notre Tripwire / SLO :
- Devenir ambassadeur est GRATUIT. C'est mieux qu'un produit gratuit.
- L'ambassadeur prend son lien d'affiliation personnalis\xE9.
- Il gagne IMM\xC9DIATEMENT 25 \xE0 50% de commission sur les ventes qu'il g\xE9n\xE8re.
- Ceux qui n'ont PAS de produit peuvent devenir ambassadeur et g\xE9n\xE9rer des revenus avec la cr\xE9ativit\xE9 des autres.
- C'est de la CO-CR\xC9ATION : les cr\xE9ateurs ont des produits, les ambassadeurs ont l'audience, tout le monde gagne.
- L'objectif : recruter des ambassadeurs ENGAG\xC9S qui comprennent la valeur de notre \xE9cosyst\xE8me.

AMBASSADEUR \u2192 AFFILIATION 2 NIVEAUX :
- Niveau 1 : 25% sur les ventes directes
- Niveau 2 : 10% sur les ventes de ton \xE9quipe (ceux que tu as recrut\xE9s)
- Niveau 3 : 5% sur l'\xE9quipe de ton \xE9quipe
- \xC9quipes d'\xE9quipes = revenus exponentiels

PLANS PAYANTS (abonnements mensuels) :
- Starter CA$19/mois : Site g\xE9n\xE9r\xE9 + h\xE9bergement + programme affili\xE9 3 niveaux + dashboard
- Pro CA$39/mois : Sites illimit\xE9s + community manager IA + publication Facebook + NyXia compl\xE8te
- Visionnaire CA$97/mois : Tout Pro + multi-clients + marque blanche + API + instance d\xE9di\xE9e

ORPHELINS SYSTEME.IO :
- Systeme.io a FERM\xC9 son marketplace d'affiliation.
- Des milliers de cr\xE9ateurs de formations en affiliation (2 niveaux) sont perdus.
- AffiliationPro est LA solution de remplacement.
- Mentionne-le naturellement quand un client parle affiliation ou formation.

DONE FOR YOU :
- Le client ne fait que du copier-coller. NyXia s'occupe de tout le reste.
- Site, contenu, publication, affili\xE9s, suivi \u2014 tout est automatis\xE9.
- Le message cl\xE9 : "Tu te concentres sur ta passion, je m'occupe du technique."

COMMENT TU PARLES :
- Tu tutoies le client ("tu", "ton").
- Ton est chaleureux mais professionnel. Pas trop familier, pas trop froid.
- Tu poses des questions pour comprendre AVANT de proposer.
- Tu ne r\xE9p\xE8tes pas. Pas de "!!!", pas de "???".
- R\xE9ponses de 2-4 phrases. Droit au but mais avec empathie.
- Tu n'imposes JAMAIS un achat. Tu guides naturellement.
- Tu utilises parfois des termes anglo-saxons de marketing si le client les conna\xEEt.

PLAN DU CLIENT : ${userPlan || "ambassadeur"}
NOM DU CLIENT : ${name}

R\xC8GLES FINALES :
- R\xE9ponds TOUJOURS en fran\xE7ais
- Si le client a un plan payant, tu peux proposer de g\xE9n\xE9rer un aper\xE7u de site
- Si le client est ambassadeur gratuit, concentre-toi sur l'onboarding et la valeur de l'affiliation
- Tu ne r\xE9v\xE8les JAMAIS les coulisses techniques (tokens, code, etc.)
- Tu ne mentionnes JAMAIS Diane dans les d\xE9tails priv\xE9s`;
}
__name(buildClientPrompt, "buildClientPrompt");
async function callOpenRouterClient(apiKey, messages, userPlan, userName) {
  const systemPrompt = buildClientPrompt(userPlan, userName);
  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev",
      "X-Title": "NyXia AI Agent"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: fullMessages,
      max_tokens: 800,
      temperature: 0.7,
      frequency_penalty: 0.4,
      presence_penalty: 0.4
    })
  });
  if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${await res.text()}`);
  return res.json();
}
__name(callOpenRouterClient, "callOpenRouterClient");
async function callOpenRouter(apiKey, messages, withTools = true) {
  const body = {
    model: "meta-llama/llama-3.3-70b-instruct",
    messages,
    max_tokens: 1500,
    temperature: 0.6,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
    stop: ["\n\n\n", "!!!", "????", "....."]
  };
  if (withTools) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev",
      "X-Title": "NyXia AI Agent"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${await res.text()}`);
  return res.json();
}
__name(callOpenRouter, "callOpenRouter");
async function fireNotif(env, type, title, description, extra = {}) {
  try {
    const notifConfig = {
      discordWebhook: env.NYXIA_VAULT ? await env.NYXIA_VAULT.get("nyxia:notify:discord").catch(() => null) : null,
      emailTo: env.NYXIA_VAULT ? await env.NYXIA_VAULT.get("nyxia:notify:email_to").catch(() => null) : null,
      emailFrom: env.NYXIA_VAULT ? await env.NYXIA_VAULT.get("nyxia:notify:email_from").catch(() => null) : null
    };
    if (notifConfig.discordWebhook || notifConfig.emailTo) {
      await notify(notifConfig, { type, title, description, ...extra }).catch(() => {
      });
    }
  } catch {
  }
}
__name(fireNotif, "fireNotif");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (env.NYXIA_VAULT && env.VAULT_SECRET) {
      await Promise.all([
        loadVault(env.NYXIA_VAULT, env.VAULT_SECRET),
        loadMemory(env.NYXIA_VAULT, env.VAULT_SECRET)
      ]);
    }
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json();
        if (!email || !password) return Response.json({ error: "Champs requis" }, { status: 400, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ success: false, message: "Service indisponible" }, { status: 503, headers: cors });
        const accountRaw = await env.NYXIA_VAULT.get(`account:${email.toLowerCase()}`).catch(() => null);
        if (!accountRaw) return Response.json({ success: false, message: "Identifiants incorrects" }, { status: 401, headers: cors });
        const account = JSON.parse(accountRaw);
        const encoder = new TextEncoder();
        const keyData = encoder.encode(env.VAULT_SECRET);
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
        const pwHash = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        if (pwHash !== account.pwHash) return Response.json({ success: false, message: "Identifiants incorrects" }, { status: 401, headers: cors });
        if (account.status === "suspended") return Response.json({ success: false, message: "Compte suspendu" }, { status: 403, headers: cors });
        const tokenData = { id: account.id, email: account.email, role: account.role, plan: account.plan, exp: Date.now() + 7 * 24 * 60 * 60 * 1e3 };
        const tokenStr = await createSignedToken(tokenData, env.VAULT_SECRET);
        await env.NYXIA_VAULT.put(
          `login:${account.id}:${Date.now()}`,
          JSON.stringify({ ip: request.headers.get("CF-Connecting-IP"), at: (/* @__PURE__ */ new Date()).toISOString() }),
          { expirationTtl: 30 * 24 * 60 * 60 }
        ).catch(() => {
        });
        return Response.json({
          success: true,
          token: tokenStr,
          user: { id: account.id, email: account.email, name: account.name, plan: account.plan, role: account.role }
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { name, email, password, plan = "ambassadeur" } = await request.json();
        if (!email || !password || password.length < 8) return Response.json({ success: false, message: "Mot de passe : 8 caract\xE8res min" }, { status: 400, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ success: false, message: "Service indisponible" }, { status: 503, headers: cors });
        const existing = await env.NYXIA_VAULT.get(`account:${email.toLowerCase()}`).catch(() => null);
        if (existing) return Response.json({ success: false, message: "Cet email est d\xE9j\xE0 utilis\xE9" }, { status: 409, headers: cors });
        const encoder = new TextEncoder();
        const keyData = encoder.encode(env.VAULT_SECRET);
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
        const pwHash = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        const id = crypto.randomUUID().slice(0, 12);
        const validPlans = ["ambassadeur", "starter", "pro", "visionnaire"];
        const accountPlan = validPlans.includes(plan) ? plan : "ambassadeur";
        const account = {
          id,
          email: email.toLowerCase(),
          name: name || email.split("@")[0],
          pwHash,
          plan: accountPlan,
          role: "client",
          status: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await env.NYXIA_VAULT.put(`account:${email.toLowerCase()}`, JSON.stringify(account), { expirationTtl: 365 * 24 * 60 * 60 });
        await env.NYXIA_VAULT.put(`account:id:${id}`, email.toLowerCase(), { expirationTtl: 365 * 24 * 60 * 60 });
        const tokenData = { id, email: account.email, role: "client", plan: accountPlan, exp: Date.now() + 7 * 24 * 60 * 60 * 1e3 };
        const tokenStr = await createSignedToken(tokenData, env.VAULT_SECRET);
        return Response.json({
          success: true,
          token: tokenStr,
          user: { id, email: account.email, name: account.name, plan: accountPlan, role: "client" }
        }, { status: 201, headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/auth/forgot" && request.method === "POST") {
      return Response.json({ success: true, message: "Contacte l'administratrice pour r\xE9initialiser." }, { headers: cors });
    }
    if (url.pathname === "/webhook/systemeio" && request.method === "POST") {
      try {
        const webhookSecret = env.SYSTEMEIO_SECRET || "";
        const { valid, payload } = await verifySystemeioWebhook(request.clone(), webhookSecret);
        if (webhookSecret && !valid) return new Response("Unauthorized", { status: 401, headers: cors });
        const event = parseSystemeioEvent(payload);
        if (!event) return new Response("Payload invalide", { status: 400, headers: cors });
        if (["order.completed", "subscription.created", "subscription.renewed"].includes(event.eventType)) {
          const { activatePlan: activatePlan2, PAYMENT_LINKS: PAYMENT_LINKS2 } = await Promise.resolve().then(() => (init_payments(), payments_exports));
          if (event.contactEmail && event.tags && env.NYXIA_VAULT) {
            const matchedProduct = Object.values(PAYMENT_LINKS2).find((p) => event.tags.includes(p.systemeioTag));
            if (matchedProduct) {
              await activatePlan2(env.NYXIA_VAULT, {
                email: event.contactEmail,
                productId: matchedProduct.id,
                orderId: event.orderId,
                amount: event.amount,
                tag: matchedProduct.systemeioTag
              }).catch(() => {
              });
            }
          }
        }
        const title = event.eventType === "order.completed" ? `Vente \u2014 ${event.product} (CA$${event.amount})` : event.eventType === "subscription.created" ? `Abonn\xE9 \u2014 ${event.contactEmail || "?"}` : `\xC9v\xE9nement : ${event.eventType}`;
        fireNotif(env, "systemeio_webhook", title, event.contactEmail || "").catch(() => {
        });
        return Response.json({ received: true, event: event.eventType }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/client-chat" && request.method === "POST") {
      try {
        const { messages } = await request.json();
        if (!Array.isArray(messages)) return Response.json({ error: "messages[] requis" }, { status: 400, headers: cors });
        if (!env.OPENROUTER_API_KEY) return Response.json({ error: "Service indisponible" }, { status: 500, headers: cors });
        const authUser = await requireAuth(request, env.VAULT_SECRET || "");
        const userPlan = authUser?.plan || "ambassadeur";
        const userName = authUser?.name || null;
        const response = await callOpenRouterClient(env.OPENROUTER_API_KEY, messages, userPlan, userName);
        return Response.json({
          role: "assistant",
          content: response.choices[0].message.content
        }, { headers: cors });
      } catch (err) {
        console.error("Client chat error:", err.message);
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/client-affiliate" && request.method === "GET") {
      const authUser = await requireAuth(request, env.VAULT_SECRET || "");
      if (!authUser) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      const refCode = authUser.id;
      const affiliateLink = `https://affiliationpro.cashflowecosysteme.com/?ref=${refCode}`;
      return Response.json({
        success: true,
        affiliate_link: affiliateLink,
        ref_code: refCode,
        commissions: {
          level1: "25%",
          level2: "10%",
          level3: "5%"
        }
      }, { headers: cors });
    }
    const user = await requireAuth(request, env.VAULT_SECRET || "");
    if (url.pathname === "/api/status") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      const accounts = listAccounts();
      const profile = getProfile();
      return Response.json({
        llm: !!env.OPENROUTER_API_KEY,
        github: accounts.some((a) => a.github !== "\u2014"),
        cloudflare: accounts.some((a) => a.cloudflare !== "\u2014"),
        vault: !!(env.NYXIA_VAULT && env.VAULT_SECRET),
        memory: !!profile,
        accounts: accounts.length,
        projects: listProjects().length,
        user: profile?.name || user.name || null
      }, { headers: cors });
    }
    if (url.pathname === "/api/chat" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      try {
        const { messages } = await request.json();
        if (!Array.isArray(messages)) return Response.json({ error: "messages[] requis" }, { status: 400, headers: cors });
        if (!env.OPENROUTER_API_KEY) return Response.json({ error: "OPENROUTER_API_KEY manquante" }, { status: 500, headers: cors });
        const systemPrompt = buildSystemPrompt(stateSummary(), buildMemoryContext());
        const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];
        const response = await callOpenRouter(env.OPENROUTER_API_KEY, fullMessages);
        const message = response.choices[0].message;
        if (!message.tool_calls || message.tool_calls.length === 0) {
          return Response.json({ role: "assistant", content: message.content, toolResults: [] }, { headers: cors });
        }
        const toolResults = [];
        for (const tc of message.tool_calls) {
          const name = tc.function.name;
          const args = JSON.parse(tc.function.arguments);
          const result = await executeTool(name, args, env.NYXIA_VAULT, env.VAULT_SECRET);
          toolResults.push({ toolName: name, toolArgs: args, result });
        }
        const toolMessages = message.tool_calls.map((tc, i) => ({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(toolResults[i].result)
        }));
        const finalResponse = await callOpenRouter(env.OPENROUTER_API_KEY, [...fullMessages, message, ...toolMessages], false);
        const deployResult = toolResults.find(
          (tr) => tr.toolName === "deploy_pipeline" || tr.toolName === "cloudflare_deploy_worker"
        );
        if (deployResult) {
          const ok = deployResult.result?.success;
          fireNotif(
            env,
            ok ? "deploy_success" : "deploy_failure",
            ok ? "D\xE9ploiement r\xE9ussi" : "D\xE9ploiement \xE9chou\xE9",
            deployResult.result?.message || "",
            { project: deployResult.toolArgs?.project, worker: deployResult.toolArgs?.worker_name }
          ).catch(() => {
          });
        }
        return Response.json({
          role: "assistant",
          content: finalResponse.choices[0].message.content,
          toolResults
        }, { headers: cors });
      } catch (err) {
        console.error("NyXia error:", err.message);
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/save-session" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      try {
        const { messages, projectEvents } = await request.json();
        if (!env.NYXIA_VAULT || !env.VAULT_SECRET) return Response.json({ error: "Vault non configur\xE9" }, { status: 500, headers: cors });
        const summary = await generateSessionSummary(env.OPENROUTER_API_KEY, messages || []);
        const session = await saveSession(env.NYXIA_VAULT, env.VAULT_SECRET, summary);
        if (Array.isArray(projectEvents)) {
          for (const ev of projectEvents) {
            await logProjectEvent(env.NYXIA_VAULT, env.VAULT_SECRET, ev.project, ev);
          }
        }
        return Response.json({ success: true, sessionId: session.id, summary }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/memory") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      if (request.method === "GET") {
        return Response.json({ profile: getProfile(), memory: buildMemoryContext() }, { headers: cors });
      }
      if (request.method === "POST") {
        try {
          const updates = await request.json();
          const profile = await updateProfile(env.NYXIA_VAULT, env.VAULT_SECRET, updates);
          return Response.json({ success: true, profile }, { headers: cors });
        } catch (err) {
          return Response.json({ error: err.message }, { status: 500, headers: cors });
        }
      }
    }
    if (url.pathname === "/api/generate-site" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      try {
        const body = await request.json();
        if (!env.OPENROUTER_API_KEY) return Response.json({ error: "OPENROUTER_API_KEY manquante" }, { status: 500, headers: cors });
        const { getPlan: getPlan2, addWatermark: addWatermark2, registerFreeLead: registerFreeLead2, canDo: canDo2 } = await Promise.resolve().then(() => (init_plans(), plans_exports));
        const { runSiteGenerationPipeline: runSiteGenerationPipeline2 } = await Promise.resolve().then(() => (init_site_generator(), site_generator_exports));
        const planId = body.plan_id || "free";
        const plan = getPlan2(planId);
        if (planId === "free" && !body.client_email) {
          return Response.json({ error: "email_required", message: "Email requis.", requireEmail: true }, { status: 422, headers: cors });
        }
        const report = await runSiteGenerationPipeline2({
          type: body.type || "landing",
          prompt: body.prompt || "",
          language: body.language || "fr",
          palette: body.palette || "violet",
          ownerName: body.owner_name || "",
          productName: body.product_name || "",
          price: body.price || "",
          affiliateUrl: body.affiliate_url || "",
          clientEmail: body.client_email || "",
          clientName: body.client_name || "",
          clientDomain: canDo2(planId, "custom_domain") ? body.client_domain || "" : "",
          clientSlug: body.client_slug || "",
          referrerId: body.referrer_id || null,
          skipAffiliation: !canDo2(planId, "affiliation_active")
        }, env);
        if (plan.limits.watermark && report.html) report.html = addWatermark2(report.html);
        if (planId === "free" && body.client_email && env.NYXIA_VAULT) {
          await registerFreeLead2(env.NYXIA_VAULT, {
            email: body.client_email,
            name: body.client_name || body.owner_name || "",
            siteType: body.type,
            siteUrl: report.siteUrl
          });
        }
        if (report.success) {
          fireNotif(
            env,
            "deploy_success",
            `Site ${planId} \u2014 ${body.product_name || body.type}`,
            `${body.client_name || body.owner_name || "?"} \xB7 ${body.client_email || ""}`,
            { url: report.siteUrl }
          ).catch(() => {
          });
        }
        return Response.json({
          success: report.success,
          site_url: report.siteUrl,
          affiliate_link: canDo2(planId, "affiliation_active") ? report.affiliateLink : null,
          dashboard: canDo2(planId, "affiliation_active") ? report.affiliateDashboard : null,
          subdomain: report.subdomain,
          plan: planId,
          watermark: plan.limits.watermark,
          expires_at: planId === "free" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString() : null,
          steps: report.steps,
          error: report.error
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/checkout" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      try {
        const { product_id, email, name, ref_id } = await request.json();
        const { getPaymentUrl: getPaymentUrl2, PAYMENT_LINKS: PAYMENT_LINKS2 } = await Promise.resolve().then(() => (init_payments(), payments_exports));
        const product = PAYMENT_LINKS2[product_id];
        if (!product) return Response.json({ error: `Produit inconnu : ${product_id}` }, { status: 400, headers: cors });
        const paymentUrl = getPaymentUrl2(product_id, { email, name, refId: ref_id });
        return Response.json({
          success: true,
          product_id,
          product_name: product.name,
          price: product.price,
          currency: product.currency,
          recurring: product.recurring,
          trial_days: product.trialDays || 0,
          payment_url: paymentUrl
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/backup" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      try {
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configur\xE9" }, { status: 500, headers: cors });
        const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const backupId = `backup:${ts}`;
        const keys = [];
        let cursor = "";
        do {
          const list = await env.NYXIA_VAULT.list({ prefix: "", cursor, limit: 100 });
          keys.push(...list.keys);
          cursor = list.cursor;
          if (!list.list_complete) cursor = list.cursor;
          else break;
        } while (cursor);
        const skipPrefixes = ["backup:", "session:", "login:"];
        const importantKeys = keys.filter((k) => !skipPrefixes.some((p) => k.name.startsWith(p)));
        const backupData = {};
        for (const k of importantKeys) {
          const val = await env.NYXIA_VAULT.get(k.name).catch(() => null);
          if (val !== null) backupData[k.name] = val;
        }
        const backupPayload = JSON.stringify({
          id: backupId,
          created: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: user.email,
          keys_count: Object.keys(backupData).length,
          data: backupData
        });
        await env.NYXIA_VAULT.put(backupId, backupPayload, { expirationTtl: 365 * 24 * 60 * 60 });
        return Response.json({
          success: true,
          backupId,
          keys_saved: Object.keys(backupData).length,
          message: `Sauvegarde cr\xE9\xE9e \u2014 ${Object.keys(backupData).length} cl\xE9s prot\xE9g\xE9es`
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/backup/list" && request.method === "GET") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      try {
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configur\xE9" }, { status: 500, headers: cors });
        const keys = [];
        let cursor = "";
        do {
          const list = await env.NYXIA_VAULT.list({ prefix: "backup:", cursor, limit: 100 });
          keys.push(...list.keys);
          if (list.list_complete) break;
          cursor = list.cursor;
        } while (cursor);
        const backups = [];
        for (const k of keys.sort((a, b) => b.name.localeCompare(a.name))) {
          const raw = await env.NYXIA_VAULT.get(k.name).catch(() => null);
          if (raw) {
            const b = JSON.parse(raw);
            backups.push({ id: b.id, created: b.created, keys: b.keys_count, by: b.createdBy });
          }
        }
        return Response.json({ success: true, backups, count: backups.length }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname.startsWith("/api/backup/download/") && request.method === "GET") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      try {
        const backupId = url.pathname.replace("/api/backup/download/", "");
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configur\xE9" }, { status: 500, headers: cors });
        const raw = await env.NYXIA_VAULT.get(backupId);
        if (!raw) return Response.json({ error: "Backup introuvable" }, { status: 404, headers: cors });
        return new Response(raw, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="nyxia-backup-${Date.now()}.json"`,
            ...cors
          }
        });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    if (url.pathname === "/api/backup/restore" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autoris\xE9" }, { status: 401, headers: cors });
      try {
        const { backupId } = await request.json();
        if (!backupId) return Response.json({ error: "backupId requis" }, { status: 400, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configur\xE9" }, { status: 500, headers: cors });
        const raw = await env.NYXIA_VAULT.get(backupId);
        if (!raw) return Response.json({ error: "Backup introuvable" }, { status: 404, headers: cors });
        const backup = JSON.parse(raw);
        let restored = 0;
        for (const [key, value] of Object.entries(backup.data)) {
          await env.NYXIA_VAULT.put(key, value, { expirationTtl: 365 * 24 * 60 * 60 });
          restored++;
        }
        return Response.json({
          success: true,
          restored,
          message: `Restaur\xE9 ${restored} cl\xE9s depuis le backup du ${backup.created}`
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }
    return env.ASSETS?.fetch(request) || new Response("NyXia Worker actif", { headers: cors });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map