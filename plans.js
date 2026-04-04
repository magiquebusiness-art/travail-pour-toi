// ============================================================
//  PLANS — Publication-Web
//  Gestion des plans, restrictions et capture email
// ============================================================

// ══════════════════════════════════════════════════════════
//  DÉFINITION DES PLANS
// ══════════════════════════════════════════════════════════

export const PLANS = {

  free: {
    id:          "free",
    name:        "Gratuit",
    price:       0,
    recurring:   false,
    trialDays:   0,
    limits: {
      sitesPerMonth:    1,
      downloadSite:     false,   // Prévisualisation uniquement
      customDomain:     false,   // Forcé sur market.nyxiapublicationweb.com
      watermark:        true,    // Filigrane Publication-Web
      affiliationActive:false,   // Marketplace lecture seule
      notifications:    false,   // Pas de Discord/Email
      communityManager: false,
      webhooks:         false,
      nyxiaAccess:      false,
    },
    // Ce qu'on fait quand un visiteur gratuit génère un site
    onGenerate: {
      requireEmailFirst: true,   // Email AVANT de voir le résultat
      addWatermark:      true,
      hostOn:            "market.nyxiapublicationweb.com",
      expireAfterDays:   7,      // Site supprimé après 7 jours
      sendEmailSequence: true,   // Séquence email de relance
    },
  },

  pro: {
    id:        "pro",
    name:      "Pro",
    price:     39,
    currency:  "CA$",
    recurring: true,
    period:    "mois",
    trialDays: 3,
    limits: {
      sitesPerMonth:    -1,      // Illimité
      downloadSite:     true,
      customDomain:     true,
      watermark:        false,
      affiliationActive:true,
      notifications:    true,
      communityManager: true,
      webhooks:         true,
      nyxiaAccess:      true,
    },
    onGenerate: {
      requireEmailFirst: false,
      addWatermark:      false,
      hostOn:            "custom_or_shared",
      expireAfterDays:   -1,     // Jamais
      sendEmailSequence: false,
    },
  },

  visionnaire: {
    id:        "visionnaire",
    name:      "Visionnaire",
    price:     97,
    currency:  "CA$",
    recurring: true,
    period:    "mois",
    trialDays: 3,
    tagline:   "Pour les power users — orphelins de Systeme.io et entrepreneurs multi-projets",
    limits: {
      sitesPerMonth:    -1,
      maxDomains:       20,    // 20 domaines/projets distincts
      maxClients:       20,    // alias — même valeur
      downloadSite:     true,
      customDomain:     true,
      watermark:        false,
      affiliationActive:true,
      notifications:    true,
      communityManager: true,
      webhooks:         true,
      nyxiaAccess:      true,
      whiteLabel:       true,
      apiAccess:        true,
    },
    onGenerate: {
      requireEmailFirst: false,
      addWatermark:      false,
      hostOn:            "custom_or_shared",
      expireAfterDays:   -1,
      sendEmailSequence: false,
    },
  },

  // Service séparé — paiement unique
  meta_presence: {
    id:        "meta_presence",
    name:      "Présence Meta Professionnelle",
    price:     97,
    currency:  "CA$",
    recurring: false,
    oneTime:   true,
    includes: [
      "Page Facebook professionnelle (bannière + structure complète)",
      "ManyChat configuré pour les DM automatiques",
      "30 jours de publications générées par IA",
      "90 jours de stratégie de redirection — objectif 10 000 followers",
      "Monétisation Meta pour financer ta publicité avec tes gains de contenu",
    ],
    note: "Service vendu séparément — non inclus dans les plans mensuels",
  },
};

// ══════════════════════════════════════════════════════════
//  VÉRIFICATION DES DROITS
// ══════════════════════════════════════════════════════════

export function canDo(plan, action) {
  const p = PLANS[plan] || PLANS.free;
  const limits = p.limits;

  switch(action) {
    case "generate_site":       return true; // Tout le monde peut
    case "download_site":       return limits.downloadSite     === true;
    case "custom_domain":       return limits.customDomain     === true;
    case "no_watermark":        return limits.watermark        === false;
    case "affiliation_active":  return limits.affiliationActive === true;
    case "notifications":       return limits.notifications    === true;
    case "community_manager":   return limits.communityManager === true;
    case "webhooks":            return limits.webhooks         === true;
    case "nyxia_full":          return limits.nyxiaAccess      === true;
    case "white_label":         return limits.whiteLabel       === true;
    case "api":                 return limits.apiAccess        === true;
    default:                    return false;
  }
}

export function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

// ══════════════════════════════════════════════════════════
//  AJOUT DU FILIGRANE AU HTML GÉNÉRÉ
// ══════════════════════════════════════════════════════════

export function addWatermark(html) {
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
    content: "✦" !important;
    font-size: 10px !important;
  }
</style>`;

  const watermarkHTML = `
<a id="pw-watermark" href="https://nyxiapublicationweb.com" target="_blank" rel="noopener">
  Propulsé par Publication-Web
</a>`;

  // Injecte avant </body>
  if (html.includes("</body>")) {
    return html.replace("</body>", `${watermarkCSS}\n${watermarkHTML}\n</body>`);
  }
  return html + watermarkCSS + watermarkHTML;
}

// ══════════════════════════════════════════════════════════
//  SÉQUENCE EMAIL DE RELANCE (plan gratuit)
//  7 emails sur 14 jours après la génération gratuite
// ══════════════════════════════════════════════════════════

export const FREE_EMAIL_SEQUENCE = [
  {
    day:     0,
    subject: "✦ Ton site Publication-Web est prêt !",
    preview: "Voici ton lien de prévisualisation — mais il expire dans 7 jours...",
    type:    "delivery",
  },
  {
    day:     1,
    subject: "NyXia a quelque chose à te montrer 👀",
    preview: "Ce que tu rates avec le plan gratuit...",
    type:    "education",
  },
  {
    day:     3,
    subject: "⚡ Ton site expire dans 4 jours",
    preview: "Passe au Pro pour le garder + activer tes commissions affiliées",
    type:    "urgency",
  },
  {
    day:     5,
    subject: "💰 Tu laisses de l'argent sur la table",
    preview: "Chaque jour sans ton lien affilié actif = commissions perdues",
    type:    "fomo",
  },
  {
    day:     6,
    subject: "⏰ Dernière chance — ton site s'efface demain",
    preview: "1 clic pour tout sauvegarder + activer AffiliationPro",
    type:    "urgency_final",
  },
  {
    day:     8,
    subject: "Ton site a été supprimé — mais NyXia garde tout",
    preview: "Reviens maintenant et on recrée tout en 60 secondes.",
    type:    "reactivation",
  },
  {
    day:    14,
    subject: "Un entrepreneur comme toi a généré 1 247 CA$ ce mois",
    preview: "Voici comment — et comment tu peux faire pareil.",
    type:    "social_proof",
  },
];

// ══════════════════════════════════════════════════════════
//  ENREGISTREMENT D'UN LEAD GRATUIT DANS KV
// ══════════════════════════════════════════════════════════

export async function registerFreeLead(kv, options) {
  if (!kv) return { success: false, error: "KV non disponible" };

  const {
    email,
    name,
    siteType,
    siteUrl,
    generatedAt = new Date().toISOString(),
  } = options;

  const leadId  = crypto.randomUUID().slice(0, 12);
  const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const lead = {
    id: leadId,
    email,
    name,
    siteType,
    siteUrl,
    plan:        "free",
    generatedAt,
    expireAt,
    converted:   false,
    emailsSent:  0,
    lastEmailAt: null,
  };

  try {
    // Stocke le lead avec TTL de 90 jours (séquence email)
    await kv.put(
      `lead:${leadId}`,
      JSON.stringify(lead),
      { expirationTtl: 90 * 24 * 60 * 60 }
    );

    // Index par email pour éviter les doublons
    await kv.put(`lead:email:${email.toLowerCase()}`, leadId, { expirationTtl: 90 * 24 * 60 * 60 });

    return { success: true, leadId, expireAt, lead };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

// ══════════════════════════════════════════════════════════
//  RÉSUMÉ DES PLANS POUR L'AFFICHAGE
// ══════════════════════════════════════════════════════════

export function plansForDisplay() {
  return [
    {
      key:        "free",
      name:       "Gratuit",
      price:      "CA$0",
      period:     "pour toujours",
      trial:      null,
      cta:        "Commencer gratuitement",
      ctaStyle:   "outline",
      highlight:  false,
      features: [
        "1 site généré (prévisualisation 7 jours)",
        "Filigrane Publication-Web visible",
        "Hébergement sur market.nyxiapublicationweb.com",
        "Marketplace en lecture seule",
        "Pas d'affiliation active",
        "Pas de téléchargement du site",
      ],
      restrictions: [
        "Site supprimé après 7 jours",
        "Pas de domaine personnalisé",
        "Pas de notifications",
      ],
    },
    {
      key:       "pro",
      name:      "Pro",
      price:     "CA$39",
      period:    "/mois · Sans engagement",
      trial:     "3 jours gratuits",
      cta:       "Démarrer l'essai gratuit →",
      ctaStyle:  "primary",
      highlight: true,
      badge:     "⭐ Le plus populaire",
      features: [
        "Sites illimités + téléchargement",
        "Aucun filigrane",
        "Domaine personnalisé (affiliation.tonsite.com)",
        "Affiliation active — 3 niveaux 25/10/5%",
        "Community manager IA 30 jours",
        "Publication Facebook multi-pages",
        "Webhooks Systeme.io",
        "Notifications Discord + Email",
        "NyXia — accès complet",
        "Support prioritaire",
      ],
    },
    {
      key:       "visionnaire",
      name:      "Visionnaire",
      price:     "CA$97",
      period:    "/mois · Multi-projets",
      trial:     "3 jours gratuits",
      cta:       "Devenir Visionnaire →",
      ctaStyle:  "outline",
      highlight: false,
      tagline:   "Pour les entrepreneurs multi-projets · anciens Systeme.io",
      features: [
        "Tout le plan Pro",
        "20 domaines · projets distincts",
        "Marque blanche (ton logo, tes couleurs)",
        "API complète",
        "NyXia — instance dédiée",
        "Gestionnaire de compte",
        "Rapports multi-projets",
      ],
    },
  ];
}
