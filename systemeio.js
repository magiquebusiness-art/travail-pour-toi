// ============================================================
//  SYSTEME.IO — NyXia Phase 6
//  Support complet : webhooks entrants + clés secrètes
//  Génération de code webhook pour les projets Systeme.io
// ============================================================

// ══════════════════════════════════════════════════════════
//  VÉRIFICATION DE SIGNATURE WEBHOOK
//  Systeme.io signe ses webhooks avec HMAC-SHA256
// ══════════════════════════════════════════════════════════

export async function verifySystemeioWebhook(request, secret) {
  const signature = request.headers.get("x-systemeio-signature") ||
                    request.headers.get("x-webhook-signature")   || "";
  if (!signature || !secret) return { valid: false, error: "Signature ou secret manquant" };

  const body = await request.text();

  // Calcul HMAC-SHA256
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac    = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const digest = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2,"0")).join("");

  const valid = digest === signature.replace("sha256=", "");

  let payload = null;
  try { payload = JSON.parse(body); } catch(_) {}

  return { valid, payload, body };
}

// ══════════════════════════════════════════════════════════
//  PARSE D'UN ÉVÉNEMENT SYSTEME.IO
//  Transforme le payload brut en objet normalisé
// ══════════════════════════════════════════════════════════

export function parseSystemeioEvent(payload) {
  if (!payload) return null;

  // Types d'événements Systeme.io courants
  const eventType = payload.event || payload.type || "unknown";

  const normalized = {
    raw:       payload,
    eventType,
    contactEmail: payload.contact?.email || payload.email || null,
    contactName:  payload.contact?.name  || payload.name  || null,
    product:      payload.product?.name  || payload.productName || null,
    amount:       payload.amount         || payload.price       || null,
    currency:     payload.currency       || "USD",
    affiliateId:  payload.affiliate?.id  || payload.affiliateId || null,
    orderId:      payload.order?.id      || payload.orderId     || null,
    at:           payload.created_at     || new Date().toISOString(),
  };

  // Commissions d'affiliation
  if (normalized.affiliateId && normalized.amount) {
    const rates = { level1: 0.25, level2: 0.10, level3: 0.05 };
    normalized.commissions = {
      level1: (normalized.amount * rates.level1).toFixed(2),
      level2: (normalized.amount * rates.level2).toFixed(2),
      level3: (normalized.amount * rates.level3).toFixed(2),
    };
  }

  return normalized;
}

// ══════════════════════════════════════════════════════════
//  GÉNÉRATION DE CODE WEBHOOK SYSTEME.IO
//  NyXia génère le handler complet prêt à déployer
// ══════════════════════════════════════════════════════════

export function generateWebhookHandler(options = {}) {
  const {
    projectName    = "mon-projet",
    webhookSecret  = "REMPLACE_PAR_TON_SECRET",
    kvNamespace    = "MY_KV",
    notifyDiscord  = true,
    notifyEmail    = true,
    events         = ["order.completed", "subscription.created", "affiliate.commission"],
  } = options;

  return `// ============================================================
//  Webhook Systeme.io — ${projectName}
//  Généré par NyXia · Publication-Web
//  Déployé sur Cloudflare Workers
// ============================================================

export default {
  async fetch(request, env) {
    // ── CORS pour Systeme.io ────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-systemeio-signature",
      }});
    }

    if (request.method !== "POST") {
      return new Response("Méthode non autorisée", { status: 405 });
    }

    // ── Vérification de la signature HMAC-SHA256 ───────
    const secret    = env.SYSTEMEIO_SECRET || "${webhookSecret}";
    const signature = request.headers.get("x-systemeio-signature") || "";
    const body      = await request.text();

    if (secret !== "${webhookSecret}") { // Vérifie seulement si le secret est configuré
      const key    = await crypto.subtle.importKey("raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const mac    = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
      const digest = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2,"0")).join("");

      if (digest !== signature.replace("sha256=", "")) {
        console.error("Signature invalide — webhook rejeté");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // ── Parse du payload ───────────────────────────────
    let payload;
    try { payload = JSON.parse(body); }
    catch(_) { return new Response("Payload invalide", { status: 400 }); }

    const eventType = payload.event || payload.type || "unknown";
    console.log(\`Événement Systeme.io reçu : \${eventType}\`);

    // ── Traitement selon le type d'événement ───────────
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
                title: "🛒 Nouvelle vente !",
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
        console.log(\`Nouvel abonné : \${email}\`);
        // Ajoute ici ta logique d'onboarding
        break;
      }

      case "affiliate.commission": {
        const affiliateId  = payload.affiliate?.id;
        const commission   = payload.amount || 0;
        const level        = payload.level  || 1;
        console.log(\`Commission niveau \${level} : \${commission}$ pour l'affilié \${affiliateId}\`);
        // Ajoute ici ta logique de tracking d'affiliation
        break;
      }

      default:
        console.log(\`Événement non géré : \${eventType}\`);
    }

    return new Response(JSON.stringify({ received: true, event: eventType }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
`;
}

// ══════════════════════════════════════════════════════════
//  GÉNÉRATION D'UNE CLÉ SECRÈTE SÉCURISÉE
// ══════════════════════════════════════════════════════════

export function generateWebhookSecret(length = 32) {
  const bytes  = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => b.toString(16).padStart(2,"0")).join("");
}

// ══════════════════════════════════════════════════════════
//  GUIDE D'INTÉGRATION SYSTEME.IO
//  Retourné à NyXia pour expliquer à l'utilisateur
// ══════════════════════════════════════════════════════════

export function getIntegrationGuide(workerUrl, secret) {
  return {
    webhookUrl:    `${workerUrl}/webhook/systemeio`,
    secret,
    instructions: [
      "1. Va dans Systeme.io → Paramètres → Webhooks",
      `2. Ajoute l'URL : ${workerUrl}/webhook/systemeio`,
      "3. Sélectionne les événements : order.completed, subscription.created",
      `4. Dans Wrangler, configure le secret : npx wrangler secret put SYSTEMEIO_SECRET`,
      `5. Colle cette valeur : ${secret}`,
      "6. Sauvegarde et teste avec le bouton 'Test webhook' de Systeme.io",
    ],
  };
}
