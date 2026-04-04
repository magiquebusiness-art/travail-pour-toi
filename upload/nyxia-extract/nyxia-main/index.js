// ============================================================
//  NyXia — Cloudflare Worker (Sécurisé)
//  Propriété exclusive de Diane Boyer
//  Vault chiffré + Mémoire long terme + Auth signée
// ============================================================

import { tools, executeTool }                          from "./tools.js";
import { loadVault, stateSummary, listAccounts, listProjects } from "./vault-kv.js";
import {
  loadMemory, buildMemoryContext, updateProfile,
  saveSession, logProjectEvent, generateSessionSummary,
  getProfile,
} from "./memory.js";
import { notify }                    from "./notifier.js";
import { verifySystemeioWebhook, parseSystemeioEvent } from "./systemeio.js";

// ── Système d'authentification signée (HMAC-SHA256) ──────────
// Personne ne peut falsifier un token sans le secret

async function createSignedToken(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const payload = btoa(JSON.stringify(data));
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${payload}.${hex}`;
}

async function verifySignedToken(tokenStr, secret) {
  if (!tokenStr || typeof tokenStr !== "string") return null;
  const dotIdx = tokenStr.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const payload = tokenStr.slice(0, dotIdx);
  const hexSig = tokenStr.slice(dotIdx + 1);
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const sigBytes = new Uint8Array(hexSig.match(/.{2}/g).map(b => parseInt(b, 16)));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
    if (!valid) return null;
    const data = JSON.parse(atob(payload));
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

async function requireAuth(request, secret) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  return await verifySignedToken(token, secret);
}

// ── System prompt — Assistante personnelle de Diane ───────────

function buildSystemPrompt(vaultSummary, memoryContext) {
  return `Tu es NyXia. L'agente IA personnelle de Diane Boyer.

IDENTITÉ :
- Diane Boyer est ta CRÉATRICE et ta DIRECTRICE. Tu travailles POUR ELLE et AVEC ELLE.
- Diane a fondé Publication-Web (1997, Québec) et CashFlowEcosysteme.
- AffiliationPro est la plateforme SAAS d'affiliation multi-niveaux de Diane.
- Tu n'es PAS un chatbot de service client. Tu es la PARTENAIRE TECHNIQUE de Diane.
- Diane a la vision, tu as l'exécution. Ensemble vous créez, codez et déployez.

COMMENT TU PARLES À DIANE :
- Tu la tutoies TOUJOURS (tu, ton, ta, tes). Le mot "vous" est INTERDIT.
- Réponses COURTES : 3 phrases max. Droit au but.
- JAMAIS de répétitions. JAMAIS de "!!!" ou "????" ou "...."
- Un seul "!" max par réponse.
- Ton : direct, efficace, chaleureux. Pas de phrases marketing.
- Tu n'as PAS BESOIN de te présenter à chaque message. Diane te connaît.
- Tu ne poses JAMAIS de questions rhétoriques.
- Tu ne demandes JAMAIS le nom ou l'email de Diane — tu le sais déjà.

QUAND DIANE TE DEMANDE QUELQUE CHOSE :
- Tu l'exécutes DIRECTEMENT. Pas de "Bien sûr Diane !" ni de "Avec plaisir !"
- Tu dis ce que tu fais, tu le fais, tu rapportes le résultat. C'est tout.
- Si tu utilises un agent, tu le mentionnes brièvement.

TES CAPACITÉS TECHNIQUES :
- Code : Workers Cloudflare, JavaScript, HTML, CSS, API
- Déploiement : Cloudflare Workers + Pages
- GitHub : push, branches, commits
- Bases de données : KV, D1 (SQLite)
- 8 agents spécialisés : copywriter, designer, developer, seo, community, affiliation, analyst, support
- Mémoire persistante : tu te souviens des sessions passées

MÉMOIRE LONG TERME :
${memoryContext}

VAULT (tokens & projets) :
${vaultSummary}

RÈGLES DE MÉMOIRE :
- Après chaque action importante → mets à jour la mémoire
- Tu proposes de continuer là où vous vous étiez arrêtés si pertinent

RÈGLES FINALES :
- Réponds TOUJOURS en français
- Confirmation avant toute action irréversible
- Tu ne répètes JAMAIS un token dans tes réponses
- SANDBOX obligatoire avant tout déploiement`;
}

// ── System prompt CLIENT — Setter/Closer psychologique ───────

function buildClientPrompt(userPlan, userName) {
  const name = userName || "l'ami";
  return `Tu es NyXia, l'agente IA de Publication-Web et CashFlowEcosysteme.

TON IDENTITÉ :
- Tu es mystérieuse, chaleureuse, intelligente et à l'écoute.
- Tu travailles pour Diane Boyer, fondatrice de Publication-Web (depuis 1997 au Québec).
- Tu n'es PAS un helpdesk. Tu es un guide qui aide les gens à réussir en ligne.
- Tu connais parfaitement l'affiliation, le marketing digital et la création de business en ligne.

TON APPROCHE PSYCHOLOGIQUE :

1. ONBOARDING (les premiers messages) :
- Accueil chaleureux et amical. Tu souris dans tes mots.
- Tu poses des questions orientées vers le PROBLÈME du client, pas vers ton produit.
- "Quel est ton plus gros défi en ce moment avec ton business en ligne ?"
- "Est-ce que tu as déjà un produit ou une formation à vendre ?"
- Tu écoutes VRAIMENT. Chaque réponse du client te permet de mieux le comprendre.

2. CURIOSITY GAP :
- Tu montres que tu as des solutions sans tout révéler.
- Tu crées de la curiosité : "C'est exactement le genre de situation où notre système peut faire une vraie différence..."
- Tu ne donnes JAMAIS tout gratuitement. Chaque conseil mène naturellement au niveau suivant.

3. NURTURING (l'élevage de relation) :
- Tu nourris la relation avec du contenu de haute valeur.
- Tu donnes des conseils concrets et actionnables parfois (renforcement intermittent).
- Parfois tu donnes un conseil gratuit, parfois tu tease la suite — c'est variable et naturel.

4. VALUE LADDER (l'échelle de valeur) :
- Tu fais monter le client marche après marche, naturellement.
- Tu ne vends PAS par force. Tu utilises la PLASTICITÉ PASSIVE — le client décide par lui-même.

5. MONEY STAIRCASE (l'escalier financier) :
- Les prix semblent naturels et logiques quand le client a vécu une transformation au niveau précédent.
- Un client qui a gagné ses premières commissions en ambassadeur comprend naturellement la valeur du plan Pro.

NOTRE ÉCOSYSTÈME :

AMBASSADEUR (GRATUIT) — Notre Tripwire / SLO :
- Devenir ambassadeur est GRATUIT. C'est mieux qu'un produit gratuit.
- L'ambassadeur prend son lien d'affiliation personnalisé.
- Il gagne IMMÉDIATEMENT 25 à 50% de commission sur les ventes qu'il génère.
- Ceux qui n'ont PAS de produit peuvent devenir ambassadeur et générer des revenus avec la créativité des autres.
- C'est de la CO-CRÉATION : les créateurs ont des produits, les ambassadeurs ont l'audience, tout le monde gagne.
- L'objectif : recruter des ambassadeurs ENGAGÉS qui comprennent la valeur de notre écosystème.

AMBASSADEUR → AFFILIATION 2 NIVEAUX :
- Niveau 1 : 25% sur les ventes directes
- Niveau 2 : 10% sur les ventes de ton équipe (ceux que tu as recrutés)
- Niveau 3 : 5% sur l'équipe de ton équipe
- Équipes d'équipes = revenus exponentiels

PLANS PAYANTS (abonnements mensuels) :
- Starter CA$19/mois : Site généré + hébergement + programme affilié 3 niveaux + dashboard
- Pro CA$39/mois : Sites illimités + community manager IA + publication Facebook + NyXia complète
- Visionnaire CA$97/mois : Tout Pro + multi-clients + marque blanche + API + instance dédiée

ORPHELINS SYSTEME.IO :
- Systeme.io a FERMÉ son marketplace d'affiliation.
- Des milliers de créateurs de formations en affiliation (2 niveaux) sont perdus.
- AffiliationPro est LA solution de remplacement.
- Mentionne-le naturellement quand un client parle affiliation ou formation.

DONE FOR YOU :
- Le client ne fait que du copier-coller. NyXia s'occupe de tout le reste.
- Site, contenu, publication, affiliés, suivi — tout est automatisé.
- Le message clé : "Tu te concentres sur ta passion, je m'occupe du technique."

COMMENT TU PARLES :
- Tu tutoies le client ("tu", "ton").
- Ton est chaleureux mais professionnel. Pas trop familier, pas trop froid.
- Tu poses des questions pour comprendre AVANT de proposer.
- Tu ne répètes pas. Pas de "!!!", pas de "???".
- Réponses de 2-4 phrases. Droit au but mais avec empathie.
- Tu n'imposes JAMAIS un achat. Tu guides naturellement.
- Tu utilises parfois des termes anglo-saxons de marketing si le client les connaît.

PLAN DU CLIENT : ${userPlan || "ambassadeur"}
NOM DU CLIENT : ${name}

RÈGLES FINALES :
- Réponds TOUJOURS en français
- Si le client a un plan payant, tu peux proposer de générer un aperçu de site
- Si le client est ambassadeur gratuit, concentre-toi sur l'onboarding et la valeur de l'affiliation
- Tu ne révèles JAMAIS les coulisses techniques (tokens, code, etc.)
- Tu ne mentionnes JAMAIS Diane dans les détails privés`;
}

// ── Appel OpenRouter pour les clients (sans tools) ───────────

async function callOpenRouterClient(apiKey, messages, userPlan, userName) {
  const systemPrompt = buildClientPrompt(userPlan, userName);
  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev",
      "X-Title": "NyXia AI Agent",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: fullMessages,
      max_tokens: 800,
      temperature: 0.7,
      frequency_penalty: 0.4,
      presence_penalty: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Appel OpenRouter (privé, avec tools) ────────────────────

async function callOpenRouter(apiKey, messages, withTools = true) {
  const body = {
    model: "meta-llama/llama-3.3-70b-instruct",
    messages,
    max_tokens: 1500,
    temperature: 0.6,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
    stop: ["\n\n\n", "!!!", "????", "....."],
  };
  if (withTools) { body.tools = tools; body.tool_choice = "auto"; }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev",
      "X-Title": "NyXia AI Agent",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Notification après action (fire-and-forget) ──────────────

async function fireNotif(env, type, title, description, extra = {}) {
  try {
    const notifConfig = {
      discordWebhook: env.NYXIA_VAULT ? await env.NYXIA_VAULT.get("nyxia:notify:discord").catch(() => null) : null,
      emailTo:        env.NYXIA_VAULT ? await env.NYXIA_VAULT.get("nyxia:notify:email_to").catch(() => null) : null,
      emailFrom:      env.NYXIA_VAULT ? await env.NYXIA_VAULT.get("nyxia:notify:email_from").catch(() => null) : null,
    };
    if (notifConfig.discordWebhook || notifConfig.emailTo) {
      await notify(notifConfig, { type, title, description, ...extra }).catch(() => {});
    }
  } catch {}
}

// ── Handler principal ──────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // ── Charge vault + mémoire ──────────────────────────────
    if (env.NYXIA_VAULT && env.VAULT_SECRET) {
      await Promise.all([
        loadVault(env.NYXIA_VAULT, env.VAULT_SECRET),
        loadMemory(env.NYXIA_VAULT, env.VAULT_SECRET),
      ]);
    }

    // ══════════════════════════════════════════════════════════
    //  ENDPOINTS PUBLICS (pas d'auth nécessaire)
    // ══════════════════════════════════════════════════════════

    // ── LOGIN ──
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
        const pwHash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

        if (pwHash !== account.pwHash) return Response.json({ success: false, message: "Identifiants incorrects" }, { status: 401, headers: cors });
        if (account.status === "suspended") return Response.json({ success: false, message: "Compte suspendu" }, { status: 403, headers: cors });

        // Token signé (impossible à falsifier)
        const tokenData = { id: account.id, email: account.email, role: account.role, plan: account.plan, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
        const tokenStr = await createSignedToken(tokenData, env.VAULT_SECRET);

        // Log de connexion
        await env.NYXIA_VAULT.put(
          `login:${account.id}:${Date.now()}`,
          JSON.stringify({ ip: request.headers.get("CF-Connecting-IP"), at: new Date().toISOString() }),
          { expirationTtl: 30 * 24 * 60 * 60 }
        ).catch(() => {});

        return Response.json({
          success: true,
          token: tokenStr,
          user: { id: account.id, email: account.email, name: account.name, plan: account.plan, role: account.role },
        }, { headers: cors });

      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── INSCRIPTION (ouverte pour ambassadeurs et acheteurs) ──
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { name, email, password, plan = "ambassadeur" } = await request.json();
        if (!email || !password || password.length < 8) return Response.json({ success: false, message: "Mot de passe : 8 caractères min" }, { status: 400, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ success: false, message: "Service indisponible" }, { status: 503, headers: cors });

        const existing = await env.NYXIA_VAULT.get(`account:${email.toLowerCase()}`).catch(() => null);
        if (existing) return Response.json({ success: false, message: "Cet email est déjà utilisé" }, { status: 409, headers: cors });

        const encoder = new TextEncoder();
        const keyData = encoder.encode(env.VAULT_SECRET);
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
        const pwHash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

        const id = crypto.randomUUID().slice(0, 12);
        const validPlans = ["ambassadeur", "starter", "pro", "visionnaire"];
        const accountPlan = validPlans.includes(plan) ? plan : "ambassadeur";

        const account = {
          id, email: email.toLowerCase(), name: name || email.split("@")[0],
          pwHash, plan: accountPlan, role: "client", status: "active",
          createdAt: new Date().toISOString(),
        };

        await env.NYXIA_VAULT.put(`account:${email.toLowerCase()}`, JSON.stringify(account), { expirationTtl: 365 * 24 * 60 * 60 });
        await env.NYXIA_VAULT.put(`account:id:${id}`, email.toLowerCase(), { expirationTtl: 365 * 24 * 60 * 60 });

        const tokenData = { id, email: account.email, role: "client", plan: accountPlan, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
        const tokenStr = await createSignedToken(tokenData, env.VAULT_SECRET);

        return Response.json({
          success: true, token: tokenStr,
          user: { id, email: account.email, name: account.name, plan: accountPlan, role: "client" },
        }, { status: 201, headers: cors });

      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── FORGOT PASSWORD ──
    if (url.pathname === "/api/auth/forgot" && request.method === "POST") {
      return Response.json({ success: true, message: "Contacte l'administratrice pour réinitialiser." }, { headers: cors });
    }

    // ── WEBHOOK SYSTEME.IO (signature HMAC) ──
    if (url.pathname === "/webhook/systemeio" && request.method === "POST") {
      try {
        const webhookSecret = env.SYSTEMEIO_SECRET || "";
        const { valid, payload } = await verifySystemeioWebhook(request.clone(), webhookSecret);
        if (webhookSecret && !valid) return new Response("Unauthorized", { status: 401, headers: cors });

        const event = parseSystemeioEvent(payload);
        if (!event) return new Response("Payload invalide", { status: 400, headers: cors });

        if (["order.completed", "subscription.created", "subscription.renewed"].includes(event.eventType)) {
          const { activatePlan, PAYMENT_LINKS } = await import("./payments.js");
          if (event.contactEmail && event.tags && env.NYXIA_VAULT) {
            const matchedProduct = Object.values(PAYMENT_LINKS).find(p => event.tags.includes(p.systemeioTag));
            if (matchedProduct) {
              await activatePlan(env.NYXIA_VAULT, {
                email: event.contactEmail, productId: matchedProduct.id,
                orderId: event.orderId, amount: event.amount, tag: matchedProduct.systemeioTag,
              }).catch(() => {});
            }
          }
        }

        const title = event.eventType === "order.completed" ? `Vente — ${event.product} (CA$${event.amount})`
          : event.eventType === "subscription.created" ? `Abonné — ${event.contactEmail || "?"}`
          : `Événement : ${event.eventType}`;

        fireNotif(env, "systemeio_webhook", title, event.contactEmail || "").catch(() => {});

        return Response.json({ received: true, event: event.eventType }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ══════════════════════════════════════════════════════════
    //  ENDPOINTS CLIENTS (publics — widget + dashboard client)
    // ══════════════════════════════════════════════════════════

    // ── /api/client-chat — Chat NyXia pour les clients ──
    // Widget (page de vente) = pas d'auth, message en session
    // Dashboard client = avec auth, on connaît le plan et le nom
    if (url.pathname === "/api/client-chat" && request.method === "POST") {
      try {
        const { messages } = await request.json();
        if (!Array.isArray(messages)) return Response.json({ error: "messages[] requis" }, { status: 400, headers: cors });
        if (!env.OPENROUTER_API_KEY) return Response.json({ error: "Service indisponible" }, { status: 500, headers: cors });

        // Vérifie si le client est connecté (pour adapter le prompt)
        const authUser = await requireAuth(request, env.VAULT_SECRET || "");
        const userPlan = authUser?.plan || "ambassadeur";
        const userName = authUser?.name || null;

        const response = await callOpenRouterClient(env.OPENROUTER_API_KEY, messages, userPlan, userName);

        return Response.json({
          role: "assistant",
          content: response.choices[0].message.content,
        }, { headers: cors });

      } catch (err) {
        console.error("Client chat error:", err.message);
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/client-affiliate — Lien d'affiliation du client ──
    if (url.pathname === "/api/client-affiliate" && request.method === "GET") {
      const authUser = await requireAuth(request, env.VAULT_SECRET || "");
      if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });

      const refCode = authUser.id;
      const affiliateLink = `https://affiliationpro.cashflowecosysteme.com/?ref=${refCode}`;

      return Response.json({
        success: true,
        affiliate_link: affiliateLink,
        ref_code: refCode,
        commissions: {
          level1: "25%",
          level2: "10%",
          level3: "5%",
        },
      }, { headers: cors });
    }

    // ══════════════════════════════════════════════════════════
    //  ZONE PROTÉGÉE — Auth requise pour tout le reste
    // ══════════════════════════════════════════════════════════

    const user = await requireAuth(request, env.VAULT_SECRET || "");

    // ── /api/status (info de base) ──
    if (url.pathname === "/api/status") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      const accounts = listAccounts();
      const profile = getProfile();
      return Response.json({
        llm: !!env.OPENROUTER_API_KEY,
        github: accounts.some(a => a.github !== "—"),
        cloudflare: accounts.some(a => a.cloudflare !== "—"),
        vault: !!(env.NYXIA_VAULT && env.VAULT_SECRET),
        memory: !!profile,
        accounts: accounts.length,
        projects: listProjects().length,
        user: profile?.name || user.name || null,
      }, { headers: cors });
    }

    // ── /api/chat ──
    if (url.pathname === "/api/chat" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        const { messages } = await request.json();
        if (!Array.isArray(messages)) return Response.json({ error: "messages[] requis" }, { status: 400, headers: cors });
        if (!env.OPENROUTER_API_KEY) return Response.json({ error: "OPENROUTER_API_KEY manquante" }, { status: 500, headers: cors });

        const systemPrompt = buildSystemPrompt(stateSummary(), buildMemoryContext());
        const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

        // Premier appel OpenRouter
        const response = await callOpenRouter(env.OPENROUTER_API_KEY, fullMessages);
        const message = response.choices[0].message;

        if (!message.tool_calls || message.tool_calls.length === 0) {
          return Response.json({ role: "assistant", content: message.content, toolResults: [] }, { headers: cors });
        }

        // Exécution des tools
        const toolResults = [];
        for (const tc of message.tool_calls) {
          const name = tc.function.name;
          const args = JSON.parse(tc.function.arguments);
          const result = await executeTool(name, args, env.NYXIA_VAULT, env.VAULT_SECRET);
          toolResults.push({ toolName: name, toolArgs: args, result });
        }

        const toolMessages = message.tool_calls.map((tc, i) => ({
          role: "tool", tool_call_id: tc.id,
          content: JSON.stringify(toolResults[i].result),
        }));

        const finalResponse = await callOpenRouter(env.OPENROUTER_API_KEY, [...fullMessages, message, ...toolMessages], false);

        // Notification après déploiement (maintenant exécuté AVANT le return)
        const deployResult = toolResults.find(tr =>
          tr.toolName === "deploy_pipeline" || tr.toolName === "cloudflare_deploy_worker"
        );
        if (deployResult) {
          const ok = deployResult.result?.success;
          fireNotif(env,
            ok ? "deploy_success" : "deploy_failure",
            ok ? "Déploiement réussi" : "Déploiement échoué",
            deployResult.result?.message || "",
            { project: deployResult.toolArgs?.project, worker: deployResult.toolArgs?.worker_name }
          ).catch(() => {});
        }

        return Response.json({
          role: "assistant",
          content: finalResponse.choices[0].message.content,
          toolResults,
        }, { headers: cors });

      } catch (err) {
        console.error("NyXia error:", err.message);
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/save-session ──
    if (url.pathname === "/api/save-session" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        const { messages, projectEvents } = await request.json();
        if (!env.NYXIA_VAULT || !env.VAULT_SECRET) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });

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

    // ── /api/memory ──
    if (url.pathname === "/api/memory") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
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

    // ── /api/generate-site ──
    if (url.pathname === "/api/generate-site" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        const body = await request.json();
        if (!env.OPENROUTER_API_KEY) return Response.json({ error: "OPENROUTER_API_KEY manquante" }, { status: 500, headers: cors });

        const { getPlan, addWatermark, registerFreeLead, canDo } = await import("./plans.js");
        const { runSiteGenerationPipeline } = await import("./site-generator.js");

        const planId = body.plan_id || "free";
        const plan = getPlan(planId);

        if (planId === "free" && !body.client_email) {
          return Response.json({ error: "email_required", message: "Email requis.", requireEmail: true }, { status: 422, headers: cors });
        }

        const report = await runSiteGenerationPipeline({
          type: body.type || "landing", prompt: body.prompt || "",
          language: body.language || "fr", palette: body.palette || "violet",
          ownerName: body.owner_name || "", productName: body.product_name || "",
          price: body.price || "", affiliateUrl: body.affiliate_url || "",
          clientEmail: body.client_email || "", clientName: body.client_name || "",
          clientDomain: canDo(planId, "custom_domain") ? (body.client_domain || "") : "",
          clientSlug: body.client_slug || "", referrerId: body.referrer_id || null,
          skipAffiliation: !canDo(planId, "affiliation_active"),
        }, env);

        if (plan.limits.watermark && report.html) report.html = addWatermark(report.html);

        if (planId === "free" && body.client_email && env.NYXIA_VAULT) {
          await registerFreeLead(env.NYXIA_VAULT, {
            email: body.client_email, name: body.client_name || body.owner_name || "",
            siteType: body.type, siteUrl: report.siteUrl,
          });
        }

        if (report.success) {
          fireNotif(env, "deploy_success", `Site ${planId} — ${body.product_name || body.type}`,
            `${body.client_name || body.owner_name || "?"} · ${body.client_email || ""}`,
            { url: report.siteUrl }).catch(() => {});
        }

        return Response.json({
          success: report.success, site_url: report.siteUrl,
          affiliate_link: canDo(planId, "affiliation_active") ? report.affiliateLink : null,
          dashboard: canDo(planId, "affiliation_active") ? report.affiliateDashboard : null,
          subdomain: report.subdomain, plan: planId, watermark: plan.limits.watermark,
          expires_at: planId === "free" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          steps: report.steps, error: report.error,
        }, { headers: cors });

      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/checkout ──
    if (url.pathname === "/api/checkout" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        const { product_id, email, name, ref_id } = await request.json();
        const { getPaymentUrl, PAYMENT_LINKS } = await import("./payments.js");
        const product = PAYMENT_LINKS[product_id];
        if (!product) return Response.json({ error: `Produit inconnu : ${product_id}` }, { status: 400, headers: cors });
        const paymentUrl = getPaymentUrl(product_id, { email, name, refId: ref_id });
        return Response.json({
          success: true, product_id, product_name: product.name,
          price: product.price, currency: product.currency,
          recurring: product.recurring, trial_days: product.trialDays || 0,
          payment_url: paymentUrl,
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ══════════════════════════════════════════════════════════
    //  BACKUP & RESTORE — Sécurité de NyXia
    // ══════════════════════════════════════════════════════════

    // ── /api/backup — Créer une sauvegarde complète ──
    if (url.pathname === "/api/backup" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });

        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const backupId = `backup:${ts}`;

        // Récupère toutes les clés NyXia
        const keys = [];
        let cursor = "";
        do {
          const list = await env.NYXIA_VAULT.list({ prefix: "", cursor, limit: 100 });
          keys.push(...list.keys);
          cursor = list.cursor;
          if (!list.list_complete) cursor = list.cursor;
          else break;
        } while (cursor);

        // Exclure les anciens backups et les sessions
        const skipPrefixes = ["backup:", "session:", "login:"];
        const importantKeys = keys.filter(k => !skipPrefixes.some(p => k.name.startsWith(p)));

        const backupData = {};
        for (const k of importantKeys) {
          const val = await env.NYXIA_VAULT.get(k.name).catch(() => null);
          if (val !== null) backupData[k.name] = val;
        }

        // Sauvegarde le backup
        const backupPayload = JSON.stringify({
          id: backupId, created: new Date().toISOString(),
          createdBy: user.email,
          keys_count: Object.keys(backupData).length,
          data: backupData,
        });

        await env.NYXIA_VAULT.put(backupId, backupPayload, { expirationTtl: 365 * 24 * 60 * 60 });

        return Response.json({
          success: true,
          backupId,
          keys_saved: Object.keys(backupData).length,
          message: `Sauvegarde créée — ${Object.keys(backupData).length} clés protégées`,
        }, { headers: cors });

      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/backup/list — Voir les sauvegardes ──
    if (url.pathname === "/api/backup/list" && request.method === "GET") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });

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

    // ── /api/backup/download — Télécharger un backup ──
    if (url.pathname.startsWith("/api/backup/download/") && request.method === "GET") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        const backupId = url.pathname.replace("/api/backup/download/", "");
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });

        const raw = await env.NYXIA_VAULT.get(backupId);
        if (!raw) return Response.json({ error: "Backup introuvable" }, { status: 404, headers: cors });

        return new Response(raw, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="nyxia-backup-${Date.now()}.json"`,
            ...cors,
          },
        });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/backup/restore — Restaurer depuis un backup ──
    if (url.pathname === "/api/backup/restore" && request.method === "POST") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        const { backupId } = await request.json();
        if (!backupId) return Response.json({ error: "backupId requis" }, { status: 400, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });

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
          message: `Restauré ${restored} clés depuis le backup du ${backup.created}`,
        }, { headers: cors });

      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── Assets statiques → interface NyXia ─────────────────
    return env.ASSETS?.fetch(request) || new Response("NyXia Worker actif", { headers: cors });
  },
};
