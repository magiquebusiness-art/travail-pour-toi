// ============================================================
//  PAYMENTS — Publication-Web
//  Liens de paiement via Systeme.io
//  Pas de Stripe — tout passe par ton écosystème Systeme.io
// ============================================================

// ══════════════════════════════════════════════════════════
//  PRODUITS & LIENS DE PAIEMENT
//  Remplace les URLs par tes vraies pages Systeme.io
// ══════════════════════════════════════════════════════════

export const PAYMENT_LINKS = {

  pro: {
    id:          "pro",
    name:        "Plan Pro",
    description: "Sites illimités · Affiliation 3 niveaux · NyXia complet",
    price:       39,
    currency:    "CAD",
    recurring:   true,
    period:      "mois",
    trialDays:   3,
    // ⬇ Remplace par ton vrai lien Systeme.io
    url:         "https://ton-compte.systeme.io/pro-mensuel",
    // URL avec tracking affilié automatique
    urlWithRef:  (refId) => `https://ton-compte.systeme.io/pro-mensuel?ref=${refId}`,
    // Ce que Systeme.io envoie dans le webhook après paiement
    systemeioTag: "plan_pro_actif",
  },

  visionnaire: {
    id:          "visionnaire",
    name:        "Plan Visionnaire",
    description: "20 domaines · Marque blanche · API complète · NyXia dédié",
    price:       97,
    currency:    "CAD",
    recurring:   true,
    period:      "mois",
    trialDays:   3,
    url:         "https://ton-compte.systeme.io/visionnaire-mensuel",
    urlWithRef:  (refId) => `https://ton-compte.systeme.io/visionnaire-mensuel?ref=${refId}`,
    systemeioTag: "plan_visionnaire_actif",
  },

  meta: {
    id:          "meta",
    name:        "Présence Meta Professionnelle",
    description: "Page Facebook pro · ManyChat · 30j publications IA · 90j stratégie followers",
    price:       97,
    currency:    "CAD",
    recurring:   false,
    oneTime:     true,
    url:         "https://ton-compte.systeme.io/presence-meta-97",
    urlWithRef:  (refId) => `https://ton-compte.systeme.io/presence-meta-97?ref=${refId}`,
    systemeioTag: "meta_presence_achat",
  },
};

// ══════════════════════════════════════════════════════════
//  GÉNÈRE L'URL DE PAIEMENT
//  Avec tracking affilié si le client vient d'un lien affilié
// ══════════════════════════════════════════════════════════

export function getPaymentUrl(productId, options = {}) {
  const product = PAYMENT_LINKS[productId];
  if (!product) throw new Error(`Produit inconnu : ${productId}`);

  const { refId, email, name, utm_source = "publication-web" } = options;

  // Construit l'URL avec les paramètres UTM et de tracking
  const base = refId ? product.urlWithRef(refId) : product.url;
  const params = new URLSearchParams();

  if (email)      params.set("email", email);
  if (name)       params.set("name",  name);
  if (utm_source) params.set("utm_source", utm_source);
  params.set("utm_medium", "dashboard");
  params.set("utm_campaign", productId);

  const queryStr = params.toString();
  return queryStr ? `${base}&${queryStr}` : base;
}

// ══════════════════════════════════════════════════════════
//  MISE À JOUR DU PLAN APRÈS PAIEMENT SYSTEME.IO
//  Appelé par le webhook Systeme.io (voir systemeio.js)
// ══════════════════════════════════════════════════════════

export async function activatePlan(kv, options) {
  const { email, productId, orderId, amount, tag } = options;

  if (!kv) return { success: false, error: "KV non disponible" };

  try {
    // Récupère le compte client
    const accountRaw = await kv.get(`account:${email.toLowerCase()}`).catch(() => null);
    if (!accountRaw) {
      // Crée un compte minimal si pas encore inscrit
      return { success: false, error: "Compte introuvable — l'utilisateur doit s'inscrire d'abord" };
    }

    const account = JSON.parse(accountRaw);

    // Détermine le nouveau plan selon le tag Systeme.io
    let newPlan = account.plan;
    if (tag === PAYMENT_LINKS.pro.systemeioTag)          newPlan = "pro";
    if (tag === PAYMENT_LINKS.visionnaire.systemeioTag)  newPlan = "visionnaire";

    const now = new Date().toISOString();

    // Met à jour le compte
    account.plan          = newPlan;
    account.planActivated = now;
    account.trialEnd      = null; // L'essai est terminé, c'est maintenant payant
    account.lastOrderId   = orderId;
    account.status        = "active";

    await kv.put(
      `account:${email.toLowerCase()}`,
      JSON.stringify(account),
      { expirationTtl: 365 * 24 * 60 * 60 }
    );

    // Enregistre la transaction
    const transactionKey = `transaction:${orderId || Date.now()}`;
    await kv.put(transactionKey, JSON.stringify({
      email, productId, plan: newPlan,
      amount, orderId, activatedAt: now,
      source: "systemeio",
    }), { expirationTtl: 365 * 24 * 60 * 60 });

    return {
      success:    true,
      email,
      plan:       newPlan,
      activatedAt: now,
      message:    `Plan ${newPlan} activé pour ${email}`,
    };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ══════════════════════════════════════════════════════════
//  INFOS PLAN POUR L'AFFICHAGE (dashboard client)
// ══════════════════════════════════════════════════════════

export function getPlanPaymentInfo(planId) {
  const links = {
    free: {
      upgradeUrl:   getPaymentUrl("pro"),
      upgradeLabel: "Passer au Pro — CA$39/mois",
      trialLabel:   "3 jours gratuits, puis CA$39/mois",
    },
    pro: {
      upgradeUrl:   getPaymentUrl("visionnaire"),
      upgradeLabel: "Passer au Visionnaire — CA$97/mois",
      manageUrl:    "https://ton-compte.systeme.io/mon-compte",
      cancelLabel:  "Gérer mon abonnement",
    },
    visionnaire: {
      manageUrl:  "https://ton-compte.systeme.io/mon-compte",
      cancelLabel:"Gérer mon abonnement",
    },
  };
  return links[planId] || links.free;
}
