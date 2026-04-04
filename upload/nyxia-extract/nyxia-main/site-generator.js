// ============================================================
//  SITE GENERATOR — NyXia
//  Génère des sites complets via Groq + déploie sur CF Pages
//
//  Types supportés :
//  • landing     — page de vente produit
//  • minisite    — mini-site affiliation multi-pages
//  • systemeio   — page style tunnel Systeme.io
//  • coach       — site coach / thérapeute / freelance
//  • ecommerce   — site e-commerce simple
//
//  Hébergement :
//  • Domaine client  → affiliation.leursite.com (CNAME CF)
//  • Sans domaine    → prenom.nyxiapublicationweb.com
// ============================================================

// ══════════════════════════════════════════════════════════
//  PROMPTS SYSTÈME PAR TYPE DE SITE
// ══════════════════════════════════════════════════════════

const SITE_PROMPTS = {

  landing: `Tu es un expert en copywriting et design de pages de vente haute conversion.
Génère une page de vente HTML complète, moderne et persuasive.
Structure obligatoire :
1. Hero section avec accroche puissante + CTA principal
2. Problème identifié (douleurs du prospect)
3. Solution présentée (le produit)
4. Bénéfices clés (3-5 points avec icônes SVG simples)
5. Preuve sociale (témoignages fictifs crédibles)
6. Offre + prix + bonus
7. Garantie
8. CTA final urgent
9. FAQ (3-5 questions)
Design : moderne, épuré, couleurs vibrantes, typographie impactante.
Le code doit être autonome (CSS inline + Google Fonts). AUCUN framework externe.`,

  minisite: `Tu es un expert en sites d'affiliation multi-pages.
Génère un mini-site HTML complet avec navigation entre pages.
Pages obligatoires :
- index.html : accueil avec présentation + liens affiliés
- produits.html : catalogue des produits recommandés
- apropos.html : page "À propos" crédibilisant l'auteur
- contact.html : formulaire de contact simple
Chaque page doit avoir header + footer cohérents.
Design : professionnel, confiance, personal branding fort.
Navigation mobile-friendly. CSS inline, autonome.`,

  systemeio: `Tu es un expert en tunnels de vente Systeme.io et copywriting francophone.
Génère une page de capture / squeeze page style Systeme.io.
Structure :
1. Header minimaliste (logo + accroche)
2. Titre accrocheur avec promesse claire
3. Vidéo placeholder (div stylisée avec play button)
4. Formulaire d'inscription (nom + email + bouton)
5. Bénéfices en puces (ce qu'ils vont recevoir)
6. Preuve sociale courte
7. Footer légal minimal
Design : épuré, focus sur la conversion, palette sobre.
Le formulaire pointe vers : https://systeme.io/[LIEN_SYSTEMEIO]`,

  coach: `Tu es un expert en sites web pour coachs, thérapeutes et freelances.
Génère un site personnel professionnel complet.
Sections obligatoires :
1. Hero : photo placeholder + tagline + CTA "Réserver un appel"
2. À propos : bio convaincante + valeurs + parcours
3. Services : 3 offres avec prix et descriptions
4. Témoignages : 3 avis clients détaillés et crédibles
5. Processus : comment ça marche (3 étapes)
6. Section prise de rendez-vous (lien Calendly placeholder)
7. Blog/Articles : 3 aperçus d'articles (titres accrocheurs)
8. Footer complet
Design : chaleureux, humain, professionnel. Tons doux.`,

  ecommerce: `Tu es un expert en boutiques en ligne simples et efficaces.
Génère une page boutique e-commerce HTML complète.
Sections obligatoires :
1. Header avec logo + navigation + panier (icône)
2. Hero banner promotionnel
3. Grille produits (6 produits avec image placeholder, nom, prix, bouton)
4. Bannière de confiance (livraison, retours, paiement sécurisé)
5. Section "Nouveautés" (3 produits)
6. Newsletter inscription
7. Footer avec liens légaux
Design : moderne, e-commerce professionnel. Inspiré Shopify.`,
};

// ══════════════════════════════════════════════════════════
//  CSS DE BASE COMMUN À TOUS LES SITES
// ══════════════════════════════════════════════════════════

const BASE_CSS = (palette) => `
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
`;

// ══════════════════════════════════════════════════════════
//  PALETTES DE COULEURS
// ══════════════════════════════════════════════════════════

export const PALETTES = {
  violet:    { primary:"#7c3aed", secondary:"#4f46e5", accent:"#f59e0b", text:"#1a1a2e", bg:"#ffffff", surface:"#f8f7ff", font:"Inter" },
  emeraude:  { primary:"#059669", secondary:"#0891b2", accent:"#f59e0b", text:"#064e3b", bg:"#ffffff", surface:"#f0fdf4", font:"Plus Jakarta Sans" },
  corail:    { primary:"#f97316", secondary:"#ef4444", accent:"#8b5cf6", text:"#1c1917", bg:"#ffffff", surface:"#fff7ed", font:"Nunito" },
  ardoise:   { primary:"#334155", secondary:"#0f172a", accent:"#3b82f6", text:"#0f172a", bg:"#f8fafc", surface:"#ffffff", font:"DM Sans" },
  rose:      { primary:"#e11d48", secondary:"#db2777", accent:"#f59e0b", text:"#1a0a14", bg:"#ffffff", surface:"#fff1f2", font:"Raleway" },
  ocean:     { primary:"#0ea5e9", secondary:"#6366f1", accent:"#10b981", text:"#0c1a2e", bg:"#ffffff", surface:"#f0f9ff", font:"Outfit" },
  sombre:    { primary:"#a78bfa", secondary:"#60a5fa", accent:"#34d399", text:"#e2e8f0", bg:"#0f0f1a", surface:"#1a1a2e", font:"Space Grotesk" },
};

// ══════════════════════════════════════════════════════════
//  GÉNÉRATION PRINCIPALE (via OpenRouter)
// ══════════════════════════════════════════════════════════

export async function generateSite(apiKey, options) {
  const {
    type         = "landing",
    prompt,              // Description du site en langage naturel
    language     = "fr", // fr, en, es, etc.
    palette      = "violet",
    affiliateUrl = "",   // URL affilié à intégrer
    ownerName    = "",   // Nom du propriétaire du site
    productName  = "",   // Nom du produit/service
    price        = "",   // Prix si applicable
  } = options;

  const pal       = PALETTES[palette] || PALETTES.violet;
  const sitePrompt = SITE_PROMPTS[type] || SITE_PROMPTS.landing;
  const langName  = { fr:"français", en:"English", es:"español", pt:"português", de:"Deutsch" }[language] || language;

  const userMessage = `
Génère le site en ${langName}.

INFORMATIONS DU SITE :
- Type : ${type}
- Propriétaire / Auteur : ${ownerName || "À personnaliser"}
- Produit / Service : ${productName || prompt}
- Prix : ${price || "À définir"}
- Lien affilié : ${affiliateUrl || "#"}
- Description / Brief : ${prompt}

PALETTE DE COULEURS (utilise exactement ces valeurs CSS) :
${JSON.stringify(pal, null, 2)}

CSS DE BASE À INCLURE dans <style> :
${BASE_CSS(pal)}
Importe cette Google Font : @import url('https://fonts.googleapis.com/css2?family=${pal.font.replace(/ /g,"+")}:wght@400;600;700;800;900&display=swap');

INSTRUCTIONS TECHNIQUES :
- HTML5 complet et valide (<!DOCTYPE html> ... </html>)
- Tout le CSS dans <style> dans le <head>
- Responsive mobile-first
- Aucune dépendance externe sauf Google Fonts
- Icônes : SVG inline simples uniquement
- Images : placeholders avec background-color + texte centré
- Commentaires HTML pour délimiter les sections
- Meta tags SEO complets (title, description, og:*)
- Lien affilié "${affiliateUrl || "#"}" sur tous les CTAs principaux
- AUCUN JavaScript complexe — interactions CSS uniquement sauf si vraiment nécessaire

Retourne UNIQUEMENT le code HTML complet, sans markdown, sans explication.`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nyxiapublicationweb.com",
      "X-Title": "NyXia Site Generator",
    },
    body: JSON.stringify({
      model:       "meta-llama/llama-3.3-70b-instruct",
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        { role: "system", content: sitePrompt },
        { role: "user",   content: userMessage },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const html = data.choices[0].message.content.trim()
    .replace(/^```html\n?/, "").replace(/\n?```$/, ""); // Nettoie les backticks si présents

  return { html, type, language, palette, pal };
}

// ══════════════════════════════════════════════════════════
//  GESTION DES SOUS-DOMAINES
// ══════════════════════════════════════════════════════════

/**
 * Résout le sous-domaine selon la situation du client
 *
 * Cas 1 : client a son domaine sur Systeme.io ou ailleurs
 *   → affiliation.sondomaine.com (il doit créer un CNAME)
 *
 * Cas 2 : client n'a rien
 *   → sonprenom.nyxiapublicationweb.com
 */
export function resolveSubdomain(options) {
  const { clientDomain, clientSlug, baseDomain = "nyxiapublicationweb.com" } = options;

  if (clientDomain) {
    // Client a son propre domaine
    const cleanDomain = clientDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    return {
      type:       "custom",
      subdomain:  `affiliation.${cleanDomain}`,
      url:        `https://affiliation.${cleanDomain}`,
      cname:      `affiliation.${cleanDomain}`,
      cnameTarget:"nyxiapublicationweb.com",
      instructions: [
        `1. Va dans les DNS de ton domaine "${cleanDomain}"`,
        `2. Crée un enregistrement CNAME :`,
        `   Nom    : affiliation`,
        `   Valeur : nyxiapublicationweb.com`,
        `3. Attends 5-10 minutes pour la propagation`,
        `4. Ton site sera accessible sur : https://affiliation.${cleanDomain}`,
      ],
    };
  }

  // Client sans domaine
  const slug = (clientSlug || "monsiteweb").toLowerCase()
    .replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  return {
    type:      "shared",
    subdomain: `${slug}.${baseDomain}`,
    url:       `https://${slug}.${baseDomain}`,
    instructions: [
      `Ton site sera disponible sur : https://${slug}.${baseDomain}`,
      `Aucune configuration DNS requise — c'est automatique !`,
      `Tu pourras connecter ton propre domaine plus tard si tu le souhaites.`,
    ],
  };
}

// ══════════════════════════════════════════════════════════
//  DÉPLOIEMENT SUR CLOUDFLARE PAGES
// ══════════════════════════════════════════════════════════

/**
 * Déploie un site HTML sur Cloudflare Pages via l'API directe
 * Crée un nouveau projet Pages ou met à jour un existant
 */
export async function deploySiteToPages(cfToken, accountId, siteName, html) {
  const projectName = siteName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

  // Crée le projet Pages s'il n'existe pas
  const createRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      method:  "POST",
      headers: { "Authorization": `Bearer ${cfToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name:              projectName,
        production_branch: "main",
      }),
    }
  );

  const createData = await createRes.json();
  // Ignore l'erreur si le projet existe déjà (code 8000026)
  if (!createData.success && !createData.errors?.some(e => e.code === 8000026)) {
    throw new Error(`Création projet Pages échouée : ${JSON.stringify(createData.errors)}`);
  }

  // Upload du site via FormData (déploiement direct)
  const form = new FormData();
  form.append("manifest", JSON.stringify({ "/index.html": html }));
  form.append("/index.html", new Blob([html], { type: "text/html" }), "index.html");

  // Fichier _redirects pour SPA behavior
  const redirects = "/* /index.html 200";
  form.append("/_redirects", new Blob([redirects], { type: "text/plain" }), "_redirects");

  const deployRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method:  "POST",
      headers: { "Authorization": `Bearer ${cfToken}` },
      body: form,
    }
  );

  const deployData = await deployRes.json();
  if (!deployData.success) {
    throw new Error(`Déploiement Pages échoué : ${JSON.stringify(deployData.errors)}`);
  }

  return {
    projectName,
    deploymentId: deployData.result?.id,
    url:          deployData.result?.url || `https://${projectName}.pages.dev`,
    environment:  deployData.result?.environment || "production",
  };
}

// ══════════════════════════════════════════════════════════
//  INSCRIPTION AUTO AFFILIATIONPRO
// ══════════════════════════════════════════════════════════

/**
 * Inscrit automatiquement le client dans AffiliationPro
 * après la génération de son site
 */
export async function registerAsAffiliate(db, options) {
  const { email, name, siteUrl, referrerId } = options;

  if (!db) return { success: false, error: "Base D1 non configurée" };

  try {
    // Génère un lien affilié personnalisé
    const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") +
                 Math.random().toString(36).slice(2, 6);

    const result = await db.prepare(`
      INSERT INTO affiliates (email, name, referrer_id, custom_link, status)
      VALUES (?, ?, ?, ?, 'active')
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        custom_link = COALESCE(affiliates.custom_link, excluded.custom_link)
      RETURNING *
    `).bind(email, name, referrerId || null, slug).first();

    return {
      success:      true,
      affiliateId:  result.id,
      affiliateLink:`https://nyxiapublicationweb.com/ref/${slug}`,
      dashboardUrl: `https://affiliationpro.publication-web.com/dashboard/${result.id}`,
      message:      `Affilié inscrit : ${email} → lien /ref/${slug}`,
    };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

// ══════════════════════════════════════════════════════════
//  PIPELINE COMPLET : Générer → Tester → Déployer → Affilier
// ══════════════════════════════════════════════════════════

export async function runSiteGenerationPipeline(options, env) {
  const {
    type, prompt, language, palette,
    affiliateUrl, ownerName, productName, price,
    clientEmail, clientName,
    clientDomain, clientSlug,
    referrerId,
  } = options;

  const report = { steps: [], success: false, startedAt: new Date().toISOString() };
  const step   = (name, status, data = {}) => report.steps.push({ step:name, status, ...data, at:new Date().toISOString() });

  try {
    // ── 1. Génération du HTML ──────────────────────────────
    step("generate", "running");
    const { html } = await generateSite(env.OPENROUTER_API_KEY, {
      type, prompt, language, palette,
      affiliateUrl, ownerName, productName, price,
    });
    step("generate", "success", { chars: html.length, lines: html.split("\n").length });

    // ── 2. Résolution du sous-domaine ──────────────────────
    const subdomainInfo = resolveSubdomain({ clientDomain, clientSlug: clientSlug || clientName?.toLowerCase().replace(/\s+/g,"-") });
    step("subdomain", "success", { url: subdomainInfo.url, type: subdomainInfo.type });

    // ── 3. Déploiement Cloudflare Pages ───────────────────
    if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) {
      step("deploy", "running");
      const siteName = clientSlug || clientName?.toLowerCase().replace(/\s+/g,"-") || `site-${Date.now()}`;
      try {
        const deployment = await deploySiteToPages(env.CF_API_TOKEN, env.CF_ACCOUNT_ID, siteName, html);
        step("deploy", "success", { url: deployment.url, project: deployment.projectName });
        report.siteUrl = subdomainInfo.url || deployment.url;
        report.deploymentUrl = deployment.url;
      } catch(err) {
        step("deploy", "warning", { error: err.message, note: "Site généré mais non déployé — déploiement manuel requis" });
        report.siteUrl = subdomainInfo.url;
      }
    } else {
      step("deploy", "skipped", { note: "Tokens CF manquants — HTML généré uniquement" });
    }

    // ── 4. Inscription AffiliationPro ──────────────────────
    if (clientEmail && env.DB) {
      step("affiliate", "running");
      const affiliate = await registerAsAffiliate(env.DB, {
        email: clientEmail, name: clientName || ownerName,
        siteUrl: report.siteUrl, referrerId,
      });
      if (affiliate.success) {
        step("affiliate", "success", { link: affiliate.affiliateLink, dashboard: affiliate.dashboardUrl });
        report.affiliateLink    = affiliate.affiliateLink;
        report.affiliateDashboard = affiliate.dashboardUrl;
      } else {
        step("affiliate", "warning", { error: affiliate.error });
      }
    }

    report.success  = true;
    report.html     = html;
    report.subdomain = subdomainInfo;

  } catch(err) {
    step("pipeline", "error", { error: err.message });
    report.error = err.message;
  }

  return report;
}
