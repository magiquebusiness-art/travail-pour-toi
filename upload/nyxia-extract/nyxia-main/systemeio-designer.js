// ============================================================
//  SYSTEME.IO DESIGNER — NyXia Phase 7
//  Génère du CSS, HTML et emails pour Systeme.io
//
//  Tout est conçu pour être copié-collé directement
//  dans l'éditeur Systeme.io (pas d'API nécessaire)
// ============================================================

// ══════════════════════════════════════════════════════════
//  STYLES CSS — Pages de vente Systeme.io
// ══════════════════════════════════════════════════════════

export const CSS_PRESETS = {

  // ── Boutons ──────────────────────────────────────────────
  button_glow: {
    name:        "Bouton lumineux animé",
    description: "Bouton CTA avec effet de halo pulsant — idéal pour les pages de vente",
    css: `/* Bouton CTA lumineux — colle dans CSS personnalisé Systeme.io */
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
}`,
  },

  button_fire: {
    name:        "Bouton rouge urgence",
    description: "Bouton rouge vif avec animation de flamme — pour créer l'urgence",
    css: `/* Bouton urgence — colle dans CSS personnalisé Systeme.io */
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
}`,
  },

  // ── Sections ─────────────────────────────────────────────
  hero_gradient: {
    name:        "Hero section dégradé violet",
    description: "Section héro avec fond dégradé sombre et texte blanc — look premium",
    css: `/* Hero gradient — colle dans CSS personnalisé Systeme.io */
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
}`,
  },

  testimonials: {
    name:        "Blocs témoignages stylisés",
    description: "Cartes témoignages avec bordure gauche colorée et étoiles",
    css: `/* Témoignages — colle dans CSS personnalisé Systeme.io */
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
  content: "★★★★★" !important;
  color: #f59e0b !important;
  font-size: 16px !important;
  display: block !important;
  margin-bottom: 12px !important;
}`,
  },

  countdown_banner: {
    name:        "Bandeau urgence/offre limitée",
    description: "Bandeau sticky en haut avec compte à rebours — booste les conversions",
    css: `/* Bandeau urgence — colle dans CSS personnalisé Systeme.io */
body::before {
  content: "⚡ OFFRE LIMITÉE — Plus que quelques places disponibles !" !important;
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
}`,
  },

  // ── Typographie ───────────────────────────────────────────
  typography_premium: {
    name:        "Typographie premium",
    description: "Police Google Fonts + hiérarchie typographique soignée",
    css: `/* Typographie premium — colle dans CSS personnalisé Systeme.io */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;900&family=Inter:wght@400;500;600&display=swap');

body, p, li, span { font-family: 'Inter', sans-serif !important; }
h1, h2, h3        { font-family: 'Syne', sans-serif !important; font-weight: 900 !important; }

h1 { font-size: clamp(36px, 5vw, 64px) !important; line-height: 1.1 !important; }
h2 { font-size: clamp(28px, 4vw, 48px) !important; line-height: 1.2 !important; }
p  { font-size: 17px !important; line-height: 1.75 !important; color: #374151 !important; }`,
  },
};

// ══════════════════════════════════════════════════════════
//  BLOCS HTML — À coller dans l'éditeur Systeme.io
// ══════════════════════════════════════════════════════════

export const HTML_BLOCKS = {

  guarantee_badge: {
    name:        "Badge garantie 30 jours",
    description: "Bloc de garantie avec icône bouclier — rassure les prospects",
    html: `<!-- Badge garantie — colle dans un bloc HTML Systeme.io -->
<div style="display:flex;align-items:center;gap:20px;background:#f0fdf4;border:2px solid #16a34a;border-radius:16px;padding:24px 32px;max-width:500px;margin:0 auto">
  <div style="font-size:48px;flex-shrink:0">🛡️</div>
  <div>
    <div style="font-size:20px;font-weight:800;color:#15803d;margin-bottom:4px">Garantie 30 jours sans risque</div>
    <div style="color:#166534;font-size:15px;line-height:1.5">Si tu n'es pas satisfait(e), on te rembourse intégralement. Sans question, sans délai.</div>
  </div>
</div>`,
  },

  countdown_timer: {
    name:        "Compte à rebours JavaScript",
    description: "Timer dynamique avec date cible — crée l'urgence",
    html: `<!-- Compte à rebours — colle dans un bloc HTML Systeme.io -->
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
</script>`,
  },

  social_proof_bar: {
    name:        "Barre de preuve sociale animée",
    description: "Bandeau défilant avec logos de partenaires/médias",
    html: `<!-- Barre logos défilante — colle dans un bloc HTML Systeme.io -->
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
</style>`,
  },
};

// ══════════════════════════════════════════════════════════
//  TEMPLATES EMAIL — Systeme.io
// ══════════════════════════════════════════════════════════

export const EMAIL_TEMPLATES = {

  welcome: {
    name:        "Email de bienvenue affilié",
    description: "Email HTML d'accueil pour les nouveaux affiliés — chaud et motivant",
    subject:     "🎉 Bienvenue dans le programme — voici ton lien !",
    html: (vars = {}) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bienvenue !</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:600px;margin:32px auto">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🚀</div>
    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900">Bienvenue, ${vars.name || "{{contact.first_name}}"} !</h1>
    <p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:16px">Tu fais maintenant partie de notre équipe d'affiliés</p>
  </div>

  <!-- Corps -->
  <div style="background:#fff;padding:40px 32px">
    <p style="color:#374151;font-size:16px;line-height:1.7">
      On est vraiment content(e) de t'avoir avec nous. Voici tout ce dont tu as besoin pour commencer à générer tes premières commissions dès aujourd'hui.
    </p>

    <!-- Lien affilié -->
    <div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
      <div style="font-size:13px;color:#6d28d9;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Ton lien personnel</div>
      <div style="font-size:16px;color:#4f46e5;font-weight:700;word-break:break-all">${vars.affiliateLink || "{{affiliate_link}}"}</div>
    </div>

    <!-- Commissions -->
    <h2 style="color:#111827;font-size:20px;font-weight:800;margin:32px 0 16px">Tes commissions</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f9fafb">
        <td style="padding:14px 16px;font-weight:700;color:#374151;border-radius:8px 0 0 8px">Niveau 1 — Tes ventes directes</td>
        <td style="padding:14px 16px;font-weight:900;color:#7c3aed;font-size:22px;text-align:right;border-radius:0 8px 8px 0">25%</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;color:#374151">Niveau 2 — Ventes de ton équipe</td>
        <td style="padding:14px 16px;font-weight:700;color:#4f46e5;font-size:18px;text-align:right">10%</td>
      </tr>
      <tr style="background:#f9fafb">
        <td style="padding:14px 16px;color:#374151;border-radius:8px 0 0 8px">Niveau 3 — Équipe de ton équipe</td>
        <td style="padding:14px 16px;font-weight:700;color:#6d28d9;font-size:16px;text-align:right;border-radius:0 8px 8px 0">5%</td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin:36px 0">
      <a href="${vars.dashboardUrl || "#"}" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:800;display:inline-block">
        Accéder à mon dashboard →
      </a>
    </div>

    <p style="color:#6b7280;font-size:14px;line-height:1.6">
      Des questions ? Réponds directement à cet email — on est là pour toi.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;padding:20px 32px;border-radius:0 0 16px 16px;text-align:center">
    <p style="color:#9ca3af;font-size:12px;margin:0">
      ${vars.companyName || "Publication-Web"} · Tu reçois cet email car tu t'es inscrit(e) à notre programme d'affiliation.
    </p>
  </div>

</div>
</body></html>`,
  },

  sale_notification: {
    name:        "Notification de vente affilié",
    description: "Email automatique envoyé à l'affilié à chaque commission gagnée",
    subject:     "💰 Tu viens de gagner une commission !",
    html: (vars = {}) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif">
<div style="max-width:500px;margin:32px auto">
  <div style="background:linear-gradient(135deg,#16a34a,#059669);padding:36px;border-radius:16px 16px 0 0;text-align:center">
    <div style="font-size:56px;margin-bottom:8px">💰</div>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900">Commission gagnée !</h1>
  </div>
  <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px">
    <p style="color:#374151;font-size:16px">Félicitations ${vars.name || "{{contact.first_name}}"} — une vente vient d'être réalisée grâce à ton lien !</p>
    <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
      <div style="font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:1px">Ta commission</div>
      <div style="font-size:48px;font-weight:900;color:#15803d;margin:8px 0">${vars.amount || "{{commission_amount}}"}$</div>
      <div style="font-size:13px;color:#6b7280">Niveau ${vars.level || "{{level}}"} · ${vars.rate || "{{rate}}"}%</div>
    </div>
    <div style="text-align:center">
      <a href="${vars.dashboardUrl || "#"}" style="background:#16a34a;color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;display:inline-block">Voir mon dashboard</a>
    </div>
  </div>
</div>
</body></html>`,
  },

  session_summary_email: {
    name:        "Résumé de session NyXia",
    description: "Email de fin de session envoyé automatiquement avec le rapport de NyXia",
    subject:     "📋 NyXia — Résumé de ta session du {{date}}",
    html: (vars = {}) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:32px auto">
  <div style="background:linear-gradient(135deg,#0f0c29,#302b63);padding:32px;border-radius:16px 16px 0 0">
    <div style="color:#a78bfa;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">NyXia · Agent IA</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Résumé de session</h1>
    <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:6px">${vars.date || new Date().toLocaleDateString("fr-CA")}</div>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px">
    ${vars.done?.length ? `<h3 style="color:#16a34a;font-size:15px;margin:0 0 12px">✓ Accompli</h3><ul style="color:#374151;padding-left:20px;margin:0 0 24px">${vars.done.map(d=>`<li style="margin-bottom:6px">${d}</li>`).join("")}</ul>` : ""}
    ${vars.nextSteps?.length ? `<h3 style="color:#4f46e5;font-size:15px;margin:0 0 12px">↳ Prochaines étapes</h3><ul style="color:#374151;padding-left:20px;margin:0 0 24px">${vars.nextSteps.map(d=>`<li style="margin-bottom:6px">${d}</li>`).join("")}</ul>` : ""}
    ${vars.decisions?.length ? `<h3 style="color:#d97706;font-size:15px;margin:0 0 12px">💡 Décisions prises</h3><ul style="color:#374151;padding-left:20px;margin:0">${vars.decisions.map(d=>`<li style="margin-bottom:6px">${d}</li>`).join("")}</ul>` : ""}
  </div>
</div>
</body></html>`,
  },
};

// ── Génère le CSS personnalisé complet pour un projet ─────

export function generateProjectCSS(options = {}) {
  const {
    primaryColor   = "#7c3aed",
    secondaryColor = "#4f46e5",
    accentColor    = "#f59e0b",
    fontHeading    = "Syne",
    fontBody       = "Inter",
    style          = "premium", // premium | urgency | minimal
  } = options;

  return `/* ============================================
   CSS personnalisé généré par NyXia
   Colle dans : Paramètres → CSS personnalisé
   ============================================ */

@import url('https://fonts.googleapis.com/css2?family=${fontHeading}:wght@700;900&family=${fontBody}:wght@400;500;600&display=swap');

/* Base */
body    { font-family: '${fontBody}', sans-serif !important; }
h1,h2,h3{ font-family: '${fontHeading}', sans-serif !important; font-weight: 900 !important; }

/* Couleur primaire sur les éléments clés */
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
