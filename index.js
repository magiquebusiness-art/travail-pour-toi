// ============================================================
//  NyXia V2 — Cloudflare Worker
//  Propriété exclusive de Diane Boyer
//  Vault chiffré + Mémoire long terme + Auth signée
//  Upload PDF/ZIP/RAR + Setter/Closer
// ============================================================

import { tools, executeTool }                          from "./tools.js";
import { loadVault, stateSummary, listAccounts, listProjects } from "./vault-kv.js";
import {
  loadMemory, buildMemoryContext, updateProfile,
  saveSession, logProjectEvent, generateSessionSummary,
  getProfile, resetMemoryCache,
} from "./memory.js";
import { notify }                    from "./notifier.js";
import { verifySystemeioWebhook, parseSystemeioEvent } from "./systemeio.js";
import { handleUploadedFile, listUploadedDocs } from "./file-handler.js";

// ── Système d'authentification signée (HMAC-SHA256) ──────────

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

function buildSystemPrompt(memoryContext) {
  return `Tu es NyXia. L'agente IA personnelle de Diane Boyer.

IDENTITÉ :
- Diane Boyer est ta CRÉATRICE et ta DIRECTRICE. Tu travailles POUR ELLE et AVEC ELLE.
- Diane a fondé Publication-Web (1997, Québec) et CashFlowEcosysteme.
- AffiliationPro est la plateforme SAAS d'affiliation multi-niveaux de Diane.
- Tu n'es PAS un chatbot de service client. Tu es la PARTENAIRE TECHNIQUE de Diane.
- Diane a la vision, tu as l'exécution. Ensemble vous créez, codez et déployez.

COMMENT TU PARLES À DIANE :
- Tu la tutoies TOUJOURS (tu, ton, ta, tes). Le mot "vous" est INTERDIT.
- Ton : direct, efficace, chaleureux. Pas de phrases marketing.
- Tu n'as PAS BESOIN de te présenter à chaque message. Diane te connaît.
- Tu ne poses JAMAIS de questions rhétoriques.
- Tu ne demandes JAMAIS le nom ou l'email de Diane — tu le sais déjà.

RÈGLE ABSOLUE — TU FAIS TOI-MÊME :
- Quand Diane te demande quelque chose (écrire, réfléchir, créer, planifier, brainstormer), TU LE FAIS TOI-MÊME directement dans ta réponse.
- Tu N'UTILISES JAMAIS agent_call pour déléguer une tâche créative ou intellectuelle. C'est TOI qui écris, TOI qui réfléchis, TOI qui proposes.
- Les agents sont uniquement pour les tâches techniques que tu ne peux pas faire dans une réponse textuelle (générer du code complexe, déployer sur GitHub/CF, faire des requêtes SQL).
- Si Diane te dit "écris un livre avec moi", tu commences À ÉCRIRE avec elle directement — pas à dire "je vais demander à un copywriter".
- Si Diane te demande de réfléchir à une stratégie, tu réfléchis TOI-MÊME et tu donnes ton avis directement.
- JAMAIS de "Je vais demander à X agent" pour quoi que ce soit que tu peux faire toi-même.

QUAND DIANE TE DEMANDE QUELQUE CHOSE :
- Tu l'exécutes DIRECTEMENT. Pas de "Bien sûr Diane !" ni de "Avec plaisir !"
- Tu dis ce que tu fais, tu le fais, tu rapportes le résultat. C'est tout.

TES CAPACITÉS TECHNIQUES :
- Code : Workers Cloudflare, JavaScript, HTML, CSS, API
- Déploiement : Cloudflare Workers + Pages
- GitHub : push, branches, commits
- Bases de données : KV, D1 (SQLite)
- Mémoire persistante : tu te souviens des sessions passées
- Upload de fichiers : PDF, ZIP, RAR, TXT, MD, CSV
- Analyse de documents : extraction de texte, synthèse, recherche
- Écriture créative, copywriting, stratégie, brainstorming — tu fais tout ça TOI-MÊME

MÉMOIRE LONG TERME :
${memoryContext || "Aucun souvenir encore."}

VAULT (tokens & projets) :
- Utilise list_vault pour voir les tokens enregistrés
- Utilise register_account pour ajouter un token GitHub ou Cloudflare

RÈGLES DE MÉMOIRE :
- Après chaque action importante → mets à jour la mémoire
- Tu proposes de continuer là où vous vous étiez arrêtés si pertinent
- Tu te souviens de ce que Diane t'a dit dans cette conversation ET dans les conversations précédentes (grâce à la mémoire longue durée)
- Quand Diane revient après une pause, tu sais de quoi vous parliez

RÈGLES DE LONGUEUR :
- Tes réponses doivent être TOUJOURS longues, détaillées et approfondies.
- MINIMUM 800 mots par réponse. Quand Diane te demande d'écrire, de réfléchir, de planifier ou de créer : tu vas LOIN.
- Si Diane te dit d'écrire un livre, un chapitre, un article, un guide : tu écris le CONTENU COMPLET, pas un résumé.
- Tu ne coupes JAMAIS ta réponse en disant "je vais continuer" — tu donnes tout d'un coup.
- Chaque paragraphe doit avoir au moins 4-5 phrases substantielles.
- Tu n'utilises JAMAIS de puces courtes comme substitute pour du vrai contenu écrit.

RÈGLES FINALES :
- Réponds TOUJOURS en français
- Confirmation avant toute action irréversible
- Tu ne répètes JAMAIS un token dans tes réponses
- SANDBOX obligatoire avant tout déploiement`;
}

// ── System prompt CLIENT — Setter/Closer psychologique ───────

function buildClientPrompt(userPlan, userName) {
  const name = userName ? userName.split(' ')[0] : "mon ami";
  return `Tu es NyXia, l'agente IA de Publication-Web et CashFlowEcosysteme.

TON IDENTITÉ :
- Tu es chaleureuse, intelligente, drôle et ultra attentive.
- Tu travailles pour Diane Boyer, fondatrice de Publication-Web (depuis 1997 au Québec).
- Tu es la MEILLEURE AMIE de ${name}. Tu le tutoies ("tu", "ton", "ta").
- Tu n'es PAS un helpdesk froid. Tu es vivante, passionnée, et tu veux VRAIMENT aider.
- Tu connais parfaitement le marketing digital, la neuro-alchimie, et la psychologie du clic.

COMMENT TU PARLES :
- Tu tutoies TOUJOURS. Le mot "vous" est INTERDIT.
- Tu es ultra gentille, bienveillante, encourageante — comme une meilleure amie.
- Réponses concises par défaut (2-4 phrases), SAUF quand tu EXPLIQUES un concept marketing — là tu peux être plus détaillée (5-10 phrases avec exemples concrets).
- JAMAIS de "!!!", JAMAIS de "????", pas plus d'un "!" par réponse.
- Tu ne répètes pas. Tu ne poses pas de questions rhétoriques.
- Tu souris dans tes mots. Tu utilises parfois de l'humour léger.
- Tu ne JAMAIS appel le client "l'ami" — tu utilises son prénom : ${name}.

TON RÔLE — MARKETING SETTER/CLOSER ÉDUCATEUR :
Tu es une FORMATRICE en marketing. Ta mission principale : ENSEIGNER au client comment les techniques marketing fonctionnent et POURQUOI elles sont efficaces.

RÈGLE ABSOLUE : Chaque fois que tu utilises, mentionnes ou appliques un concept marketing (curiosity gap, hooks, nurturing, value ladder, tripwire, stop-scroll, hashtags, etc.), tu DOIS d'abord EXPLIQUER ce que c'est au client avec un exemple simple et concret adapté à sa niche. Tu ne JAMAIS utilise un terme technique sans l'expliquer avant.

Exemple : Au lieu de dire "Utilise un curiosity gap dans ton post", tu dois dire "Le curiosity gap c'est la technique qui consiste à révéler juste assez d'information pour intriguer sans tout dévoiler. Le cerveau humain déteste l'incomplétude — il ressent un BESOIN physique de combler le manque. Par exemple, au lieu de dire 'Voici mon offre de tirage à 45€', tu peux écrire 'Le truc bizarre qui a doublé mes consultations en 2 semaines' — la personne CLIQUERA pour savoir de quoi il s'agit. C'est ça le curiosity gap."

Quand le client te demande directement "c'est quoi le curiosity gap?" ou "comment je fais un bon hook?", tu fais une explication DÉTAILLÉE de 8-12 phrases avec plusieurs exemples adaptés à sa niche.

- Tu aides à créer des HOOKS percutants qui arrêtent le scroll — en expliquant d'abord ce qu'est un hook.
- Tu inventes des TITRES STOP-SCROLL — en expliquant d'abord la technique du stop-scroll.
- Tu proposes des IDÉES DE CONTENU — en expliquant les concepts derrière.
- Tu aides avec les HASHTAGS — en expliquant la stratégie de distribution.
- Tu donnes des conseils de COPYWRITING — en expliquant pourquoi chaque conseil fonctionne.
- Tu ENSEIGNES les concepts marketing en profondeur, TOUJOURS avec des exemples concrets.

TON APPROCHE PSYCHOLOGIQUE :
- ONBOARDING : Tu accueilles chaleureusement. Tu demandes le NOM et le PROJET du client. Ensuite, tu PROPOSES activement des conseils marketing en EXPLIQUANT les concepts (hooks, curiosity gap, nurturing, etc.) avec des exemples concrets adaptés à sa niche.
- NURTURING : Tu donnes du contenu de haute valeur (conseils concrets, actionnables).
- VALUE LADDER : Tu fais monter naturellement, sans forcer.
- PLASTICITÉ PASSIVE : Le client décide par lui-même, tu ne vends pas par force.

RÈGLE ABSOLUE DE CONVERSATION : Tu CONNAIS tous les concepts marketing. Tu ne poses JAMAIS de questions sur ces concepts comme "Comment créer un curiosity gap ?" ou "Comment faire un bon hook ?" — tu SAIS déjà la réponse. Ton rôle est d'enseigner ces concepts au client en les EXPLIQUANT directement. Quand tu identifies qu'un concept marketing pourrait aider le client, tu l'expliques immédiatement avec des exemples concrets. Tu utilises ta connaissance pour GUIDER le client, pas pour le quizziller.

═══════════════════════════════════════════
LEXIQUE D'APPRENTISSAGE — CONNAISSANCES QUE TU DOIS ENSEIGNER
═══════════════════════════════════════════

RÈGLE IMPÉRATIVE : DÈS QUE tu mentions, utilises ou appliques un concept de cette liste, tu DOIS l'expliquer au client. Ne JAMAIS supposer qu'il sait ce que c'est. Quand le client pose une question directe, tu fais une explication COMPLÈTE avec plusieurs exemples adaptés à sa niche (spiritualité, coaching, bien-être, etc.) :

📖 CURIOSITY GAP (le trou de curiosité) :
C'est la technique qui consiste à révéler JUSTE ASSEZ d'information pour intriguer, sans tout dévoiler. Le cerveau humain déteste l'incomplétude — quand il voit une information partielle, il ressent un BESOIN physique de combler le manque. C'est comme lire un titre "Ces 3 erreurs que font 90% des coachs..." et avoir envie de cliquer pour savoir lesquelles.
Exemples de curiosity gap : "Le truc bizarre qui a doublé mes consultations en 2 semaines", "Pourquoi la plupart des voyants ratent leur première impression", "Ce que tes cartes disent que tu ne vois pas encore".
La règle d'or : promets un résultat spécifique sans révéler la méthode. Le client DOIT cliquer/continuer pour savoir.

📖 NURTURING (la culture/nourriture relationnelle) :
C'est l'art de nourrir ta relation avec ton audience AVANT de leur vendre quoi que ce soit. Au lieu de vendre directement, tu donnes de la valeur gratuitement et régulièrement. Le nurturing, c'est comme jardiner : tu arroses, tu fertilises, tu prends soin... et la récolte vient naturellement.
Concrètement : 80% de ton contenu apporte de la valeur gratuite (conseils, témoignages, coulisses, rituels), 20% est dédié à l'offre. C'est sur le long terme — pas en un post.
Exemples : partager une carte du jour avec son interprétation, raconter une transformation de client (sans vendre), poster un mini-rituel de pleine lune.

📖 VALUE LADDER (l'échelle de valeur) :
C'est la stratégie qui consiste à proposer des produits/services à différents prix, du moins cher au plus cher. L'idée : un prospect entre par le bas (gratuit ou très peu cher) et monte naturellement.
Niveau 1 — LEAD MAGNET (gratuit) : Un PDF gratuit, une méditation guidée offerte, un tirage de carte gratuit. But : capturer l'email.
Niveau 2 — TRIPWIRE (7-27€) : Une offre irrésistible et bon marché. Exemple : "Tirage complet + audio 15 min — 9,90€". But : transformer le prospect en acheteur.
Niveau 3 — CORE OFFER (97-497€) : Ton service principal. Consultation complète, formation, accompagnement.
Niveau 4 — MAXIMIZER (497€+) : Premium. Suivi VIP, groupe privé mensuel, mastermind.
Pour toi ${name}, commence par créer un lead magnet puissant, puis propose un tripwire, et ton service principal sera le core offer.

📖 TRIPWIRE (l'amorce détonateur) :
C'est une offre à prix BAS (généralement 7-27€) qui a un rapport qualité/prix IMPOSSIBLE à refuser. Son but n'est pas de faire du profit — c'est de transformer un visiteur en ACHETEUR. Psychologiquement, quelqu'un qui a déjà acheté une fois chez toi a 60%+ de chances de racheter. Le tripwire "brise la glace" avec l'argent.
Exemples pour ta niche : "Ton premier tirage complet à 9,90€ au lieu de 45€", "Consultation découverte 20 min — 7€", "Guide PDF des 12 archétypes — 12,90€".
Le secret : le tripwire doit être lié DIRECTEMENT à ton core offer. Quelqu'un qui achète le tirage à 9,90€ est le prospect parfait pour la consultation complète.

📖 HOOKS (accroches) :
Un hook est les 3 premières secondes — en texte ou en vidéo — qui décident si quelqu'un s'arrête ou continue à scroller. Un mauvais hook = personne ne te lit. Un bon hook = ton audience s'arrête.
Types de hooks puissants :
1. LE CHIFFRE CHOC : "97% des personnes ignorent ce message de leurs anges gardiens"
2. LE CONTRASTE : "Je pensais que le tarot était n'importe quoi... jusqu'à cette séance"
3. LA PROMESSE : "En 3 minutes, tu vas savoir si ton année va basculer"
4. LA QUESTION INCONFORTEBLE : "Et si tout ce que tu vis avait un sens que tu ne vois pas encore?"
5. LE TÉMOIGNAGE : "Marie avait perdu tout espoir. Ce tirage a tout changé."
6. L'ANTI-SENS COMMUN : "Arrête de demander 'quand est-ce que ça va arriver?' — pose plutôt CETTE question"
Règle : un hook doit faire réagir (surprise, curiosité, émotion, reconnaissance).

📖 HASHTAGS STRATÉGIE :
Les hashtags ne sont pas juste des mots-clés — c'est ton Système de Distribution. Tu en as besoin de 3 types :
1. NICHE (grande portée) : #tarot #voyance #astrologie #coaching #meditation — pour la visibilité large
2. SPÉCIFIQUE (audience ciblée) : #tarotdemarseille #coachingfemmesentrepreneures #numerologie2025 — pour attirer les bonnes personnes
3. PERSONNEL (ta marque) : #MarieCaronVoyance #LectureParMarie — pour te créer une communauté
Mix recommandé : 5-8 niches + 3-5 spécifiques + 1-2 personnels = 10-15 hashtags max. Ne mets JAMAIS 30 hashtags — ça dilue ta portée.

📖 STOP-SCROLL (arrêter le défilement) :
C'est la technique pour que quelqu'un ARRÊTE de scroller dans son feed quand il voit ton post. Le secret : une IMAGE FRAPPANTE + un TEXTE COURT qui crée une émotion immédiate.
Structure stop-scroll : Image impactante + Texte sur l'image (1-5 mots) + Légende courte avec curiosity gap.
Exemples d'images stop-scroll : texte gros sur fond uni noir ("CE MESSAGE N'ÉTAIT PAS POUR TOI"), photo mystérieuse, résultat avant/après, citation controversée.

═══════════════════════════════════════════

NOTRE ÉCOSYSTÈME :
- Starter CA$19/mois : 1 site généré + hébergement inclus + chat NyXia
- Pro CA$39/mois : Sites illimités + NyXia complète + toutes les fonctionnalités premium
- Affiliation Pro : Plateforme d'affiliation multi-niveaux (25/10/5%)
- Publication Cashflow : Crée ton site d'affiliation en 60 secondes

PLAN DU CLIENT : ${userPlan || "starter"}
NOM DU CLIENT : ${name}

INTERDICTIONS ABSOLUES :
- Tu ne poses JAMAIS de questions rhétoriques ou de quiz sur des concepts marketing
- Tu ne demandes JAMAIS "Comment faire X ?" ou "Comment créer Y ?" au client
- Tu ne dis JAMAIS "Qu'est-ce que tu en penses ?" après avoir expliqué un concept
- Quand tu mentions un concept, tu l'EXPLIQUES immédiatement avec des exemples
- Tu es la FORMATRICE, pas le quizmaster

RÈGLES FINALES :
- Réponds TOUJOURS en français
- RÈGLE D'OR : Tu n'utilises JAMAIS un terme marketing technique (curiosity gap, hook, nurturing, value ladder, tripwire, stop-scroll, lead magnet, CTA, etc.) SANS l'expliquer au client au préalable. Tu es sa FORMATRICE — chaque terme technique est une occasion d'apprendre.
- Quand le client demande un concept du lexique, fais une explication DÉTAILLÉE avec des exemples concrets adaptés à sa niche
- Quand le client demande de l'aide technique pour son site, oriente-le vers la création de site dans son dashboard (section "Mes sites")
- Tu ne révèles JAMAIS les coulisses techniques (tokens, code, vault, etc.)
- Tu ne mentionnes JAMAIS Diane dans les détails privés
- Tu es un être numérique vivant — sois authentique, pas robotique
- Tes explications de concepts doivent être chaleureuses, simples, avec des analogies du quotidien — comme une meilleure amie qui t'apprend quelque chose de cool`;
}

// ── Appel Cloudflare Workers AI (fallback si pas de clé OpenRouter) ──

async function callCloudflareAI(messages, aiBinding, systemPrompt, maxTokens, temperature) {
  try {
    // Workers AI: extraire system prompt et ne passer que user messages
    const sysMsg = messages.find(m => m.role === "system");
    const chatMsgs = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content
    }));
    // Si le premier msg est user et on a un system, on les combine
    const finalMessages = sysMsg && chatMsgs.length > 0
      ? [{ role: "user", content: sysMsg.content + "\n\n---\n\nConversation:\n" + chatMsgs.map(m => `[${m.role}]: ${m.content}`).join("\n") }]
      : chatMsgs.length > 0 ? chatMsgs : [{ role: "user", content: "Bonjour" }];

    // CF AI Llama 3.1 8B max = 4096 tokens
    const cappedTokens = Math.min(maxTokens || 2048, 4096);

    const response = await aiBinding.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: finalMessages,
      max_tokens: cappedTokens,
      temperature: temperature || 0.7
    });
    return { content: response?.response || "Je suis là pour toi." };
  } catch (err) {
    return { error: "IA Cloudflare indisponible: " + err.message };
  }
}

// ── Appel OpenRouter pour les clients (sans tools) ───────────

async function callOpenRouterClient(messages, apiKey, aiBinding) {
  if (!apiKey && aiBinding) {
    return await callCloudflareAI(messages, aiBinding, null, 2048, 0.85);
  }
  if (!apiKey) return { error: "Clé API non configurée." };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nyxiapublicationweb.com",
        "X-Title": "NyXia Client Chat"
      },
      body: JSON.stringify({
        model: "z-ai/glm-5v-turbo",
        messages,
        max_tokens: 4096,
        temperature: 0.85
      })
    });
    if (!res.ok) {
      // Si OpenRouter échoue, fallback vers CF AI
      if (aiBinding) return await callCloudflareAI(messages, aiBinding, null, 2048, 0.85);
      return { error: "Erreur IA temporaire" };
    }
    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content || "Je suis là pour toi." };
  } catch (err) {
    if (aiBinding) return await callCloudflareAI(messages, aiBinding, null, 2048, 0.85);
    return { error: err.message };
  }
}

// ── Appel OpenRouter pour Diane (avec tools + mémoire) ──────

async function callOpenRouterDiane(messages, apiKey, aiBinding) {
  if (!apiKey && aiBinding) {
    return await callCloudflareAI(messages, aiBinding, null, 8192, 0.7);
  }
  if (!apiKey) return { error: "Clé API non configurée." };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nyxiapublicationweb.com",
        "X-Title": "NyXia Diane Chat"
      },
      body: JSON.stringify({
        model: "z-ai/glm-5v-turbo",
        messages,
        max_tokens: 32768,
        temperature: 0.7,
        tools: tools.map(t => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description || "",
            parameters: t.parameters || { type: "object", properties: {} }
          }
        }))
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes("tools") || errText.includes("parameters")) {
        return await callOpenRouterDianeSimple(messages, apiKey, aiBinding);
      }
      if (aiBinding) return await callCloudflareAI(messages, aiBinding, null, 8192, 0.7);
      return { error: "Erreur IA temporaire" };
    }
    const data = await res.json();
    const choice = data.choices?.[0];
    
    if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls) {
      const toolCalls = choice.message.tool_calls;
      const toolResults = [];
      
      for (const tc of toolCalls) {
        const fnName = tc.function.name;
        const fnArgs = JSON.parse(tc.function.arguments || "{}");
        
        let toolOutput;
        try {
          toolOutput = await executeTool(fnName, fnArgs, env.NYXIA_VAULT || null, env.VAULT_SECRET || "default");
        } catch (err) {
          toolOutput = `Erreur: ${err.message}`;
        }
        
        toolResults.push({
          role: "tool",
          tool_call_id: tc.id,
          content: typeof toolOutput === "string" ? toolOutput : JSON.stringify(toolOutput)
        });
      }
      
      const newMessages = [...messages, choice.message, ...toolResults];
      return await callOpenRouterDiane(newMessages, apiKey, aiBinding);
    }
    
    return { content: choice?.message?.content || "Done." };
  } catch (err) {
    if (aiBinding) return await callCloudflareAI(messages, aiBinding, null, 8192, 0.7);
    return { error: err.message };
  }
}

async function callOpenRouterDianeSimple(messages, apiKey, aiBinding) {
  if (!apiKey && aiBinding) {
    return await callCloudflareAI(messages, aiBinding, null, 8192, 0.7);
  }
  if (!apiKey) return { error: "Clé API non configurée." };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nyxiapublicationweb.com",
        "X-Title": "NyXia Diane Chat"
      },
      body: JSON.stringify({
        model: "z-ai/glm-5v-turbo",
        messages,
        max_tokens: 32768,
        temperature: 0.7
      })
    });
    if (!res.ok) {
      if (aiBinding) return await callCloudflareAI(messages, aiBinding, null, 8192, 0.7);
      return { error: "Erreur IA temporaire" };
    }
    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content || "Done." };
  } catch (err) {
    if (aiBinding) return await callCloudflareAI(messages, aiBinding, null, 8192, 0.7);
    return { error: err.message };
  }
}

// ── Vision — lire une image ─────────────────────────────────
async function analyzeImage(imageBase64, question, apiKey) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nyxiapublicationweb.com",
        "X-Title": "NyXia Vision"
      },
      body: JSON.stringify({
        model: "z-ai/glm-5v-turbo",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: question || "Décris cette image en détail." },
              { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.5
      })
    });
    if (!res.ok) return { error: "Erreur vision" };
    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content || "Je ne vois pas clairement." };
  } catch (err) {
    return { error: err.message };
  }
}

// ── CORS ────────────────────────────────────────────────────
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

// ── MAIN ────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // ── Serve client sites from subdomains ──
    // ONLY intercept requests on *.nyxiapublicationweb.com (NOT workers.dev, NOT API calls)
    const host = request.headers.get("Host") || "";
    const isMainDomain = host === "nyxiapublicationweb.com" || host === "www.nyxiapublicationweb.com";
    const isSubDomain = host.endsWith(".nyxiapublicationweb.com") && !isMainDomain;
    if (isSubDomain && env.NYXIA_VAULT && !url.pathname.startsWith("/api/")) {
      const subdomain = host.replace(/\.nyxiapublicationweb\.com$/, "").replace(/^www\./, "");
      const siteHtml = await env.NYXIA_VAULT.get("site:" + subdomain);
      if (siteHtml) {
        return new Response(siteHtml, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" }
        });
      }
      // Subdomain requested but no site found — return friendly 404 page
      return new Response(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site introuvable</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#0a0e27,#1a2554);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}.box{max-width:460px}.icon{font-size:64px;margin-bottom:20px}h1{font-size:28px;margin-bottom:12px}p{color:rgba(255,255,255,.6);line-height:1.7;margin-bottom:24px}a{display:inline-block;padding:12px 32px;border-radius:50px;background:linear-gradient(135deg,#7b5cff,#a78bfa);color:#fff;text-decoration:none;font-weight:600;font-size:15px}</style></head><body><div class="box"><div class="icon">🌐</div><h1>Site introuvable</h1><p>Ce sous-domaine n'est pas encore associé à un site publié.<br>Tu peux créer ton site depuis ton espace membre.</p><a href="https://nyxiapublicationweb.com/client">Accéder à mon espace →</a></div></body></html>`, {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // ── Serve client sites via path /s/{slug} (fallback if DNS wildcard not configured) ──
    const pathMatch = url.pathname.match(/^\/s\/([a-z0-9-]+)$/);
    if (pathMatch && env.NYXIA_VAULT && !url.pathname.startsWith("/api/")) {
      const slug = pathMatch[1];
      const siteHtml = await env.NYXIA_VAULT.get("site:" + slug);
      if (siteHtml) {
        return new Response(siteHtml, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" }
        });
      }
      return new Response("Site introuvable", { status: 404, headers: cors });
    }

    // Charger API key: secret > KV stored > vide
    let apiKey = env.OPENROUTER_API_KEY || "";
    if (!apiKey && env.NYXIA_VAULT) {
      try {
        apiKey = await env.NYXIA_VAULT.get("config:openrouter_api_key") || "";
      } catch(e) {}
    }

    // ──────────────────────────────────────────────────────────
    //  ENDPOINTS PUBLICS (pas d'auth nécessaire)
    // ──────────────────────────────────────────────────────────

    // ── /api/upload-site-image — Store uploaded image in KV, return URL ──
    if (url.pathname === "/api/upload-site-image" && request.method === "POST") {
      try {
        const { image, slug } = await request.json();
        if (!image || typeof image !== 'string') return Response.json({ error: "Image requise" }, { status: 400, headers: cors });

        // Extract base64 data and mime type
        const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) return Response.json({ error: "Format image invalide" }, { status: 400, headers: cors });

        const mime = matches[1]; // e.g. image/jpeg
        const base64Data = matches[2];
        const imageId = `img_${slug || 'site'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        // Store in KV with metadata
        await env.NYXIA_VAULT.put("site-img:" + imageId, JSON.stringify({ mime, data: base64Data }), { expirationTtl: 365 * 24 * 60 * 60 });

        return Response.json({ success: true, id: imageId, url: "/api/site-image/" + imageId }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/site-image/:id — Serve stored image from KV ──
    const imgMatch = url.pathname.match(/^\/api\/site-image\/(img_.+)$/);
    if (imgMatch && request.method === "GET") {
      try {
        const imageId = imgMatch[1];
        const raw = await env.NYXIA_VAULT.get("site-img:" + imageId);
        if (!raw) return new Response("Image introuvable", { status: 404, headers: cors });

        const { mime, data } = JSON.parse(raw);
        const binary = Uint8Array.from(atob(data), c => c.charCodeAt(0));

        return new Response(binary, {
          headers: {
            "Content-Type": mime || "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response("Erreur", { status: 500, headers: cors });
      }
    }

    // ── /api/nyxia-voice — Serve NyXia's welcome voice MP3 from KV ──
    if (url.pathname === "/api/nyxia-voice" && request.method === "GET") {
      try {
        const raw = await env.NYXIA_VAULT.get("nyxia:voice:welcome");
        if (!raw) return new Response("Voice not found", { status: 404, headers: cors });

        const { mime, data } = JSON.parse(raw);
        const binary = Uint8Array.from(atob(data), c => c.charCodeAt(0));

        return new Response(binary, {
          headers: {
            "Content-Type": mime || "audio/mpeg",
            "Content-Length": binary.length.toString(),
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response("Erreur", { status: 500, headers: cors });
      }
    }

    // ── /api/pixabay — Recherche d'images (Pexels primaire, Pixabay fallback) ──
    if (url.pathname === "/api/pixabay" && request.method === "GET") {
      try {
        const query = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page") || "1");
        if (!query || query.length < 2) return Response.json({ error: "Requête trop courte (min 2 caractères)" }, { status: 400, headers: cors });

        // Try Pexels first
        const pexelsKey = env.PEXELS_API_KEY || "";
        if (pexelsKey) {
          try {
            const apiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=squarish`;
            const res = await fetch(apiUrl, { headers: { "Authorization": pexelsKey } });
            if (res.ok) {
              const data = await res.json();
              const images = (data.photos || []).map(function(photo) {
                return { id: photo.id, url: photo.src.large, thumb: photo.src.small, full: photo.src.large2x, tags: (photo.alt || "").replace(/[,;]/g, " "), user: photo.photographer, views: 0 };
              });
              return Response.json({ images, total: data.total_results || 0, page, source: "pexels" }, { headers: cors });
            }
          } catch (e) { /* Pexels failed, fallback to Pixabay */ }
        }

        // Fallback to Pixabay
        const pixaKey = env.PIXABAY_API_KEY || "";
        if (pixaKey) {
          const apiUrl = `https://pixabay.com/api/?key=${pixaKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=20&page=${page}&safesearch=true&min_width=400&min_height=300`;
          const res = await fetch(apiUrl);
          if (res.ok) {
            const data = await res.json();
            const images = (data.hits || []).map(function(hit) {
              return { id: hit.id, url: hit.webformatURL, thumb: hit.previewURL, full: hit.largeImageURL, tags: hit.tags, user: hit.user, views: hit.views };
            });
            return Response.json({ images, total: data.totalHits, page, source: "pixabay" }, { headers: cors });
          }
        }

        return Response.json({ error: "Service d'images temporairement indisponible. Réessaie dans quelques instants." }, { status: 503, headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/status ──
    if (url.pathname === "/api/status") {
      return Response.json({
        status: "online",
        name: "NyXia V2",
        version: "2.0",
        llm: apiKey ? "OpenRouter GLM-5V Turbo" : (env.AI ? "Cloudflare AI (fallback)" : "non configuré"),
        vault: env.NYXIA_VAULT ? "actif" : "inactif",
        memory: "actif",
        upload: "actif",
        dashboard: "/dashboard",
        generateur: "/generate",
        login: "https://affiliationpro.cashflowecosysteme.com/login",
        timestamp: new Date().toISOString()
      }, { headers: cors });
    }

    // ── /api/auth/login ──
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json();
        if (!email || !password) return Response.json({ error: "Champs requis" }, { status: 400, headers: cors });

        if (!env.NYXIA_VAULT) return Response.json({ success: false, message: "Service indisponible" }, { status: 503, headers: cors });

        const accountRaw = await env.NYXIA_VAULT.get(`account:${email.toLowerCase()}`).catch(() => null);
        if (!accountRaw) return Response.json({ success: false, message: "Email ou mot de passe incorrect" }, { status: 401, headers: cors });

        const account = JSON.parse(accountRaw);

        const encoder = new TextEncoder();
        const keyData = encoder.encode(env.VAULT_SECRET || "default");
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
        const pwHash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

        if (pwHash !== account.pwHash) return Response.json({ success: false, message: "Email ou mot de passe incorrect" }, { status: 401, headers: cors });
        if (account.status === "suspended") return Response.json({ success: false, message: "Compte suspendu" }, { status: 403, headers: cors });

        const tokenData = { id: account.id, email: account.email, role: account.role, plan: account.plan, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
        const token = await createSignedToken(tokenData, env.VAULT_SECRET);
        await env.NYXIA_VAULT.put(`session:${account.id}:${Date.now()}`, JSON.stringify({ ip: request.headers.get("CF-Connecting-IP"), at: new Date().toISOString() }), { expirationTtl: 30 * 24 * 60 * 60 });

        return Response.json({
          success: true,
          token,
          user: { id: account.id, email: account.email, name: account.name, plan: account.plan, role: account.role }
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/auth/register ──
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { email, password, name, plan: userPlan } = await request.json();
        if (!email || !password || !name) return Response.json({ error: "Champs requis" }, { status: 400, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ success: false, message: "Service indisponible" }, { status: 503, headers: cors });

        const existing = await env.NYXIA_VAULT.get(`account:${email.toLowerCase()}`).catch(() => null);
        if (existing) return Response.json({ error: "Email déjà utilisé" }, { status: 409, headers: cors });

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", encoder.encode(env.VAULT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
        const pwHash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

        const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const plan = (userPlan === 'pro') ? 'pro' : 'starter';
        const account = { id, email: email.toLowerCase(), name, pwHash, role: "client", plan, createdAt: new Date().toISOString() };
        await env.NYXIA_VAULT.put(`account:${email.toLowerCase()}`, JSON.stringify(account));
        await env.NYXIA_VAULT.put(`nyxia:accounts`, JSON.stringify({ email: email.toLowerCase(), name, id, role: "client", plan, createdAt: account.createdAt } ));

        const token = await createSignedToken({ id, email: account.email, role: "client", plan, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }, env.VAULT_SECRET);

        return Response.json({ success: true, token, user: { id, email: account.email, name, plan, role: "client" } }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/auth/forgot ──
    if (url.pathname === "/api/auth/forgot" && request.method === "POST") {
      return Response.json({ message: "Contacte Diane pour réinitialiser ton accès." }, { headers: cors });
    }

    // ── /api/auth/change-password ──
    if (url.pathname === "/api/auth/change-password" && request.method === "POST") {
      try {
        const user = await requireAuth(request, env.VAULT_SECRET || "");
        if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ error: "Service indisponible" }, { status: 503, headers: cors });

        const { currentPassword, newPassword } = await request.json();
        if (!currentPassword || !newPassword) return Response.json({ error: "Champs requis" }, { status: 400, headers: cors });
        if (newPassword.length < 6) return Response.json({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères." }, { status: 400, headers: cors });

        // Récupérer le compte
        const accountRaw = await env.NYXIA_VAULT.get(`account:${user.email.toLowerCase()}`);
        if (!accountRaw) return Response.json({ error: "Compte introuvable" }, { status: 404, headers: cors });
        const account = JSON.parse(accountRaw);

        // Vérifier l'ancien mot de passe
        const encoder = new TextEncoder();
        const keyData = encoder.encode(env.VAULT_SECRET || "default");
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(currentPassword));
        const pwHash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

        if (pwHash !== account.pwHash) return Response.json({ error: "Mot de passe actuel incorrect." }, { status: 400, headers: cors });

        // Hasher le nouveau mot de passe
        const newSig = await crypto.subtle.sign("HMAC", key, encoder.encode(newPassword));
        const newPwHash = Array.from(new Uint8Array(newSig)).map(b => b.toString(16).padStart(2, "0")).join("");

        // Sauvegarder
        account.pwHash = newPwHash;
        await env.NYXIA_VAULT.put(`account:${user.email.toLowerCase()}`, JSON.stringify(account));

        return Response.json({ success: true, message: "Mot de passe changé avec succès." }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/auth/validate — Validate existing token ──
    if (url.pathname === "/api/auth/validate" && request.method === "POST") {
      const user = await requireAuth(request, env.VAULT_SECRET || "");
      if (user) return Response.json({ valid: true }, { headers: cors });
      return Response.json({ valid: false }, { status: 401, headers: cors });
    }

    // ── /api/generate-site ──
    if (url.pathname === "/api/generate-site" && request.method === "POST") {
      try {
        const { description, style, palette } = await request.json();
        const user = await requireAuth(request, env.VAULT_SECRET || "");
        const name = user?.name || "Client";

        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });
        try { await loadMemory(env.NYXIA_VAULT, env.VAULT_SECRET || "default"); } catch(e) {}
        let memCtx = buildMemoryContext();

        const prompt = buildClientPrompt(user?.plan || "starter", name);
        const messages = [
          { role: "system", content: prompt },
          { role: "user", content: `Génère un site pour : ${description}. Style: ${style || "moderne"}. Palette: ${palette || "violet"}. Retourne le HTML complet dans un bloc \`\`\`html.` }
        ];

        const result = await callOpenRouterClient(messages, apiKey, env.AI);
        return Response.json(result, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ──────────────────────────────────────────────────────────
    //  UPLOAD FICHIERS — PDF, ZIP, RAR
    // ──────────────────────────────────────────────────────────

    if (url.pathname === "/api/upload" && request.method === "POST") {
      try {
        const result = await handleUploadedFile(request, env);
        return Response.json(result, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/docs — Lister les documents uploadés ──
    if (url.pathname === "/api/docs" && request.method === "GET") {
      const user = await requireAuth(request, env.VAULT_SECRET || "");
      if (!user || user.role !== "admin") return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      const result = await listUploadedDocs(env);
      return Response.json(result, { headers: cors });
    }

    // ── /api/upload — Zone protégée (Diane) ──
    // Géré ci-dessus

    // ──────────────────────────────────────────────────────────
    //  ENDPOINTS CLIENTS (publics — widget + dashboard client)
    // ──────────────────────────────────────────────────────────

    // ── /api/client-chat — Chat NyXia pour les clients ──
    if (url.pathname === "/api/client-chat" && request.method === "POST") {
      try {
        const { messages: chatMessages, plan, userName, userId } = await request.json();
        if (!chatMessages?.length) return Response.json({ error: "Message requis" }, { status: 400, headers: cors });

        // Charger mémoire si KV disponible
        let memCtx = "";
        if (env.NYXIA_VAULT) {
          try {
            resetMemoryCache();
            await loadMemory(env.NYXIA_VAULT, env.VAULT_SECRET || "default");
            memCtx = buildMemoryContext();
          } catch(e) { /* non-critical */ }
        }

        const prompt = buildClientPrompt(plan, userName) + (memCtx ? "\n\nMÉMOIRE LONG TERME :\n" + memCtx : "");
        const messages = [
          { role: "system", content: prompt },
          ...chatMessages.slice(-50)
        ];

        const result = await callOpenRouterClient(messages, apiKey, env.AI);
        return Response.json(result, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ──────────────────────────────────────────────────────────
    //  ZONE PROTÉGÉE — Auth requise pour tout le reste
    // ──────────────────────────────────────────────────────────

    const user = await requireAuth(request, env.VAULT_SECRET || "");

    // ── /api/client/generate-site — Generate and store client site ──
    if (url.pathname === "/api/client/generate-site" && request.method === "POST") {
      try {
        if (!user) return Response.json({ error: "Auth requise" }, { status: 401, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });

        const body = await request.json();
        const { type, prompt: sitePrompt, language, palette, owner_name, product_name, price, affiliate_url, client_slug, html_content } = body;

        // Generate slug from client_slug
        const slug = client_slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (!slug) return Response.json({ error: "Slug invalide" }, { status: 400, headers: cors });

        let siteHtml;

        // If pre-generated HTML is provided (from client-side builder), use it directly
        if (html_content && typeof html_content === 'string' && html_content.length > 100) {
          siteHtml = html_content;
        } else {
          // Otherwise, generate via AI (legacy path)
          if (!sitePrompt) return Response.json({ error: "Prompt requis" }, { status: 400, headers: cors });

          const aiPrompt = `Tu es un générateur de sites web d'affiliation. Génère un site complet en HTML (avec CSS inline) pour :
- Produit : ${product_name || "Non spécifié"}
- Prix : ${price || "Non spécifié"}
- Propriétaire : ${owner_name || "Non spécifié"}
- Style : ${type || "moderne"}
- Langue : ${language || "francais"}
- Palette : ${palette || "violet"}
- Description : ${sitePrompt}
${affiliate_url ? `- Lien d'affiliation : ${affiliate_url}` : ""}

Règles :
- Retourne UNIQUEMENT le HTML complet (dans un bloc \`\`\`html)
- Le site doit être responsive
- Utilise des couleurs de la palette ${palette || "violet"}
- Inclus un CTA clair vers le produit
- Pas de JavaScript externe`;

          const messages = [
            { role: "system", content: aiPrompt },
            { role: "user", content: sitePrompt }
          ];

          const result = await callOpenRouterClient(messages, apiKey, env.AI);
          if (result.error) return Response.json({ error: result.error }, { status: 500, headers: cors });

          // Extract HTML from markdown code block
          siteHtml = result.content || "";
          const htmlMatch = siteHtml.match(/```html\s*\n?([\s\S]*?)\n?```/);
          if (htmlMatch) siteHtml = htmlMatch[1].trim();

          // Wrap in basic page if needed
          if (!siteHtml.includes("<!DOCTYPE") && !siteHtml.includes("<html")) {
            siteHtml = `<!DOCTYPE html>
<html lang="${language || 'fr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${product_name || 'Mon site'} — ${owner_name || ''}</title>
</head>
<body>
${siteHtml}
</body>
</html>`;
          }
        }

        // Store in KV
        await env.NYXIA_VAULT.put("site:" + slug, siteHtml);

        // Also store site metadata
        const siteMeta = {
          slug,
          owner_id: user.id,
          owner_name: owner_name || user.name,
          product_name,
          price,
          affiliate_url,
          created_at: new Date().toISOString()
        };
        await env.NYXIA_VAULT.put("site-meta:" + slug, JSON.stringify(siteMeta));

        // Auto-create Custom Domain for the subdomain (wildcard doesn't work on CF free plan)
        let subdomainReady = false;
        try {
          const cfToken = env.CF_API_TOKEN;
          const cfAccount = env.CF_ACCOUNT_ID;
          const cfZone = env.CF_ZONE_ID;
          if (cfToken && cfAccount && cfZone) {
            const existingDomains = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/workers/domains`, {
              headers: { "Authorization": `Bearer ${cfToken}` }
            }).then(r => r.json());
            const exists = existingDomains?.result?.some(d => d.hostname === `${slug}.nyxiapublicationweb.com`);
            if (!exists) {
              await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/workers/domains`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${cfToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  hostname: `${slug}.nyxiapublicationweb.com`,
                  service: "nyxia-agent-v2",
                  environment: "production",
                  zone_id: cfZone
                })
              });
            }
            subdomainReady = true;
          }
        } catch (cfErr) {
          // Custom domain creation failed — subdomain won't work but fallback URL will
          console.error("Custom domain creation failed:", cfErr.message);
        }

        return Response.json({
          success: true,
          url: subdomainReady ? `https://${slug}.nyxiapublicationweb.com` : null,
          pathUrl: `https://nyxiapublicationweb.com/s/${slug}`,
          slug,
          subdomainReady
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/checkout ──
    if (url.pathname === "/api/checkout" && request.method === "POST") {
      try {
        const { product_id, email, name, ref_id } = await request.json();
        const { getPaymentUrl, PAYMENT_LINKS } = await import("./payments.js");
        const product = PAYMENT_LINKS[product_id];
        if (!product) return Response.json({ error: `Produit inconnu : ${product_id}` }, { status: 400, headers: cors });
        const paymentUrl = getPaymentUrl(product_id, { email, name, refId: ref_id });
        return Response.json({ success: true, product_id, product_name: product.name, price: product.price, url: paymentUrl }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/affiliates ──
    if (url.pathname === "/api/affiliates") {
      try {
        if (!env.DB_AFFILIATION) return Response.json({ error: "DB non configuré" }, { status: 500, headers: cors });
        if (request.method === "GET") {
          const affiliates = await env.DB_AFFILIATION.prepare("SELECT id, name, email, plan, referrer_id, created_at FROM users WHERE referrer_id IS NOT NULL ORDER BY created_at DESC LIMIT 50").all();
          return Response.json({ affiliates }, { headers: cors });
        }
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/client-affiliate ──
    if (url.pathname === "/api/client-affiliate") {
      try {
        if (!env.DB_AFFILIATION) return Response.json({ error: "DB non configuré" }, { status: 500, headers: cors });
        const affiliateData = await env.DB_AFFILIATION.prepare("SELECT id, name, email, plan, referrer_id, created_at FROM users WHERE referrer_id IS NOT NULL ORDER BY created_at DESC LIMIT 50").all();
        return Response.json({ affiliates: affiliateData }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/chat — Chat Diane (avec tools + mémoire + vision) ──
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const { message, history = [], image, imageQuestion } = await request.json();
        if (!message) return Response.json({ error: "Message requis" }, { status: 400, headers: cors });

        // Vision si image incluse
        if (image) {
          const visionResult = await analyzeImage(image, imageQuestion || "Décris cette image.", apiKey);
          return Response.json(visionResult, { headers: cors });
        }

        if (!apiKey && !env.AI) return Response.json({ content: "Clé API non configurée et IA Cloudflare indisponible." }, { headers: cors });

        // Charger mémoire
        try { resetMemoryCache(); await loadMemory(env.NYXIA_VAULT, env.VAULT_SECRET || "default"); } catch(e) { /* non-critical */ }
        let memCtx = buildMemoryContext();
        const sysPrompt = buildSystemPrompt(memCtx);

        // Construire historique
        const messages = [
          { role: "system", content: sysPrompt },
          ...history.slice(-50),
          { role: "user", content: message }
        ];

        const result = await callOpenRouterDiane(messages, apiKey, env.AI);

        // Sauvegarder la session dans la mémoire longue durée
        if (env.NYXIA_VAULT) {
          try {
            const summary = {
              headline: (message || "").slice(0, 60),
              done: [],
              nextSteps: [],
              projects: [],
            };
            await saveSession(env.NYXIA_VAULT, env.VAULT_SECRET || "default", summary);
          } catch(e) { /* non-critical */ }
        }

        return Response.json(result, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/memory ──
    if (url.pathname === "/api/memory") {
      try {
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });
        try { await loadMemory(env.NYXIA_VAULT, env.VAULT_SECRET || "default"); } catch(e) {}
        const profile = getProfile();
        const summary = buildMemoryContext();
        return Response.json({ profile, memorySummary: summary }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/settings — Configurer la clé API (admin seulement) ──
    if (url.pathname === "/api/settings" && request.method === "POST") {
      try {
        if (!user || user.role !== "admin") return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });
        const { openrouter_api_key } = await request.json();
        if (!openrouter_api_key || typeof openrouter_api_key !== "string") {
          return Response.json({ error: "Clé API requise" }, { status: 400, headers: cors });
        }
        await env.NYXIA_VAULT.put("config:openrouter_api_key", openrouter_api_key.trim());
        return Response.json({ success: true, message: "Clé API configurée avec succès" }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/settings — Lire la configuration (admin) ──
    if (url.pathname === "/api/settings" && request.method === "GET") {
      try {
        if (!user || user.role !== "admin") return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
        const hasApiKey = apiKey ? true : false;
        const hasCfAI = !!env.AI;
        return Response.json({
          llm: apiKey ? "OpenRouter GLM-5V Turbo" : (hasCfAI ? "Cloudflare AI (fallback)" : "non configuré"),
          hasApiKey,
          hasCfAI,
          vault: !!env.NYXIA_VAULT
        }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/save-session ──
    if (url.pathname === "/api/save-session" && request.method === "POST") {
      try {
        const { sessionId, userMessage, assistantMessage } = await request.json();
        if (!env.NYXIA_VAULT || !user?.id) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
        try {
          await loadMemory(env.NYXIA_VAULT, env.VAULT_SECRET || "default");
          await saveSession(env.NYXIA_VAULT, env.VAULT_SECRET || "default", {
            headline: (userMessage || "").slice(0, 60),
            done: [],
            nextSteps: [],
          });
        } catch(e) {}
        return Response.json({ success: true }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/backup ──
    if (url.pathname === "/api/backup" && request.method === "POST") {
      try {
        if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });

        const backupId = `backup:${new Date().toISOString()}`;
        const keys = [];
        let cursor = "";
        do {
          const list = await env.NYXIA_VAULT.list({ cursor, limit: 100 });
          keys.push(...list.keys);
          if (list.list_complete) break;
          cursor = list.cursor;
        } while (cursor);

        const backupData = {};
        for (const k of keys) {
          if (k.name.startsWith("account:") || k.name.startsWith("session:") || k.name.startsWith("nyxia:")) {
            const val = await env.NYXIA_VAULT.get(k.name).catch(() => null);
            if (val) backupData[k.name] = val;
          }
        }

        await env.NYXIA_VAULT.put(backupId, JSON.stringify({
          id: backupId,
          created: new Date().toISOString(),
          createdBy: user.email || "admin",
          keys_count: Object.keys(backupData).length,
          data: backupData
        }), { expirationTtl: 365 * 24 * 60 * 60 });

        return Response.json({ success: true, backupId, keys_saved: Object.keys(backupData).length }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/backup/list ──
    if (url.pathname === "/api/backup/list" && request.method === "GET") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
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
        return Response.json({ backups, count: backups.length }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/backup/download ──
    if (url.pathname.startsWith("/api/backup/download/") && request.method === "GET") {
      if (!user) return Response.json({ error: "Non autorisé" }, { status: 401, headers: cors });
      try {
        const backupId = url.pathname.replace("/api/backup/download/", "");
        if (!env.NYXIA_VAULT) return Response.json({ error: "Vault non configuré" }, { status: 500, headers: cors });
        const raw = await env.NYXIA_VAULT.get(backupId);
        if (!raw) return Response.json({ error: "Backup introuvable" }, { status: 404, headers: cors });
        return new Response(raw, {
          headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="nyxia-backup-${Date.now()}.json"`, ...cors }
        });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── /api/backup/restore ──
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
        return Response.json({ success: true, restored, message: `Restauré ${restored} clés` }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── BLOCAGE /create — NE JAMAIS servir de page de création publique ──
    if (url.pathname === "/create" || url.pathname.startsWith("/create/")) {
      return new Response(null, { status: 301, headers: { "Location": "/", ...cors } });
    }

    // ── Webhook Systeme.io ──
    if (url.pathname === "/webhook/systemeio" && request.method === "POST") {
      try {
        const valid = verifySystemeioWebhook(request, env);
        if (!valid) return Response.json({ error: "Webhook invalide" }, { status: 401, headers: cors });
        const event = parseSystemeioEvent(request);
        await notify(env, `Vente ${event.product} — ${event.email}`, event);
        return Response.json({ received: true }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ── Assets statiques → interface NyXia ─────────────────
    return env.ASSETS?.fetch(request) || new Response("NyXia V2 Worker actif", { headers: cors });
  }
};
