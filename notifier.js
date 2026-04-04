// ============================================================
//  NOTIFIER — NyXia Phase 6
//  Notifications Discord (webhook) + Email (MailChannels)
//  MailChannels est natif sur Cloudflare Workers — zéro config
//
//  Événements supportés :
//  • deploy_success   — Déploiement réussi
//  • deploy_failure   — Déploiement échoué
//  • github_push      — Fichier(s) poussé(s) sur GitHub
//  • session_summary  — Résumé de fin de session
//  • systemeio_webhook — Webhook Systeme.io reçu
// ============================================================

// ── Couleurs Discord par type d'événement ─────────────────
const DISCORD_COLORS = {
  deploy_success:    0x1D9E75, // vert
  deploy_failure:    0xE24B4A, // rouge
  health_check_fail: 0xEF9F27, // orange
  github_push:       0x7F77DD, // violet
  session_summary:   0x378ADD, // bleu
  systemeio_webhook: 0x22d3ee, // cyan
  info:              0x888780, // gris
};

const ICONS = {
  deploy_success:    "🚀",
  deploy_failure:    "❌",
  health_check_fail: "⚠️",
  github_push:       "📤",
  session_summary:   "📋",
  systemeio_webhook: "🔗",
  info:              "ℹ️",
};

// ══════════════════════════════════════════════════════════
//  DISCORD
// ══════════════════════════════════════════════════════════

export async function sendDiscord(webhookUrl, event) {
  if (!webhookUrl) return { success: false, error: "Discord webhook URL manquante" };

  const icon    = ICONS[event.type]    || "•";
  const color   = DISCORD_COLORS[event.type] || DISCORD_COLORS.info;
  const now     = Math.floor(Date.now() / 1000);

  // Construction des fields
  const fields = [];
  if (event.project)    fields.push({ name: "Projet",      value: `\`${event.project}\``,   inline: true });
  if (event.environment) fields.push({ name: "Env",        value: `\`${event.environment}\``, inline: true });
  if (event.worker)     fields.push({ name: "Worker",      value: `\`${event.worker}\``,    inline: true });
  if (event.commit)     fields.push({ name: "Commit",      value: `\`${event.commit}\``,    inline: true });
  if (event.latency)    fields.push({ name: "Latence",     value: event.latency,             inline: true });
  if (event.files?.length) fields.push({ name: "Fichiers", value: event.files.map(f => `\`${f}\``).join("\n"), inline: false });
  if (event.url)        fields.push({ name: "URL",         value: event.url,                 inline: false });
  if (event.error)      fields.push({ name: "Erreur",      value: `\`\`\`\n${event.error.slice(0, 500)}\n\`\`\``, inline: false });

  // Résumé de session : format spécial
  if (event.type === "session_summary" && event.summary) {
    const s = event.summary;
    if (s.done?.length)      fields.push({ name: "✓ Accompli",    value: s.done.slice(0,5).map(d=>`• ${d}`).join("\n"),      inline: false });
    if (s.nextSteps?.length) fields.push({ name: "↳ À faire",     value: s.nextSteps.slice(0,3).map(d=>`• ${d}`).join("\n"), inline: false });
    if (s.decisions?.length) fields.push({ name: "💡 Décisions",  value: s.decisions.slice(0,3).map(d=>`• ${d}`).join("\n"), inline: false });
  }

  const payload = {
    username:   "NyXia",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
    embeds: [{
      title:       `${icon} ${event.title || event.type}`,
      description: event.description || "",
      color,
      fields,
      footer:      { text: "NyXia · Publication-Web" },
      timestamp:   new Date().toISOString(),
    }],
  };

  try {
    const res = await fetch(webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    return res.ok
      ? { success: true, message: "Notification Discord envoyée" }
      : { success: false, error: `Discord HTTP ${res.status}` };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

// ══════════════════════════════════════════════════════════
//  EMAIL (MailChannels — natif Cloudflare Workers)
// ══════════════════════════════════════════════════════════

export async function sendEmail(toEmail, fromEmail, event) {
  if (!toEmail)   return { success: false, error: "Email destinataire manquant" };
  if (!fromEmail) return { success: false, error: "Email expéditeur manquant" };

  const icon  = ICONS[event.type] || "•";
  const title = `${icon} ${event.title || event.type}`;

  // Template HTML de l'email
  const html = buildEmailHtml(title, event);
  const text = buildEmailText(title, event);

  const payload = {
    personalizations: [{ to: [{ email: toEmail }] }],
    from:    { email: fromEmail, name: "NyXia · Publication-Web" },
    subject: `NyXia · ${title}`,
    content: [
      { type: "text/plain", value: text },
      { type: "text/html",  value: html },
    ],
  };

  try {
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    return res.ok || res.status === 202
      ? { success: true, message: `Email envoyé à ${toEmail}` }
      : { success: false, error: `MailChannels HTTP ${res.status}: ${await res.text()}` };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

// ── Template email HTML ───────────────────────────────────

function buildEmailHtml(title, event) {
  const colorMap = {
    deploy_success: "#1D9E75", deploy_failure: "#E24B4A",
    github_push: "#7F77DD",    session_summary: "#378ADD",
    systemeio_webhook: "#22d3ee", info: "#888780",
  };
  const accent = colorMap[event.type] || "#7F77DD";

  const rows = [];
  if (event.project)     rows.push(["Projet",      `<code>${event.project}</code>`]);
  if (event.environment) rows.push(["Environnement", event.environment]);
  if (event.worker)      rows.push(["Worker",       `<code>${event.worker}</code>`]);
  if (event.commit)      rows.push(["Commit",       `<code>${event.commit}</code>`]);
  if (event.latency)     rows.push(["Latence",      event.latency]);
  if (event.url)         rows.push(["URL",          `<a href="${event.url}" style="color:${accent}">${event.url}</a>`]);
  if (event.error)       rows.push(["Erreur",       `<pre style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:12px;overflow:auto">${event.error.slice(0,500)}</pre>`]);
  if (event.files?.length) rows.push(["Fichiers",   event.files.map(f=>`<code>${f}</code>`).join("<br>")]);

  if (event.type === "session_summary" && event.summary) {
    const s = event.summary;
    if (s.done?.length)      rows.push(["✓ Accompli",   s.done.map(d=>`• ${d}`).join("<br>")]);
    if (s.nextSteps?.length) rows.push(["↳ À faire",    s.nextSteps.map(d=>`• ${d}`).join("<br>")]);
    if (s.decisions?.length) rows.push(["💡 Décisions", s.decisions.map(d=>`• ${d}`).join("<br>")]);
  }

  const tableRows = rows.map(([k,v]) => `
    <tr>
      <td style="padding:8px 12px;color:#666;font-weight:500;white-space:nowrap;vertical-align:top">${k}</td>
      <td style="padding:8px 12px;color:#222">${v}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f8;font-family:system-ui,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:${accent};padding:24px 28px">
      <div style="color:#fff;font-size:22px;font-weight:700">${title}</div>
      <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px">${new Date().toLocaleString("fr-CA")}</div>
    </div>
    ${event.description ? `<div style="padding:20px 28px;color:#444;font-size:15px;border-bottom:1px solid #eee">${event.description}</div>` : ""}
    ${tableRows ? `<table style="width:100%;border-collapse:collapse">${tableRows}</table>` : ""}
    <div style="padding:16px 28px;background:#f9f9fb;color:#999;font-size:12px;text-align:center">
      NyXia · Agent IA Publication-Web
    </div>
  </div></body></html>`;
}

function buildEmailText(title, event) {
  const lines = [title, ""];
  if (event.description) lines.push(event.description, "");
  if (event.project)     lines.push(`Projet : ${event.project}`);
  if (event.environment) lines.push(`Env    : ${event.environment}`);
  if (event.worker)      lines.push(`Worker : ${event.worker}`);
  if (event.commit)      lines.push(`Commit : ${event.commit}`);
  if (event.url)         lines.push(`URL    : ${event.url}`);
  if (event.error)       lines.push(`Erreur : ${event.error.slice(0, 300)}`);
  if (event.files?.length) lines.push(`Fichiers : ${event.files.join(", ")}`);

  if (event.type === "session_summary" && event.summary) {
    const s = event.summary;
    if (s.done?.length)      lines.push("", "Accompli :", ...s.done.map(d=>`  • ${d}`));
    if (s.nextSteps?.length) lines.push("", "À faire :", ...s.nextSteps.map(d=>`  • ${d}`));
  }

  lines.push("", "— NyXia · Publication-Web");
  return lines.join("\n");
}

// ══════════════════════════════════════════════════════════
//  ENVOI GROUPÉ — Discord + Email en parallèle
// ══════════════════════════════════════════════════════════

export async function notify(config, event) {
  const results = {};
  const promises = [];

  if (config.discordWebhook) {
    promises.push(
      sendDiscord(config.discordWebhook, event)
        .then(r => { results.discord = r; })
    );
  }

  if (config.emailTo && config.emailFrom) {
    promises.push(
      sendEmail(config.emailTo, config.emailFrom, event)
        .then(r => { results.email = r; })
    );
  }

  await Promise.allSettled(promises);

  const allOk = Object.values(results).every(r => r.success);
  return {
    success: allOk,
    results,
    message: allOk
      ? `Notifications envoyées (${Object.keys(results).join(" + ")})`
      : `Certaines notifications ont échoué`,
  };
}
