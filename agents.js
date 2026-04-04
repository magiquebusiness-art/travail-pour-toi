// ============================================================
//  AGENTS SPÉCIALISÉS — NyXia Phase 9
//
//  Architecture hybride :
//  • Agents légers  → system prompt injecté via OpenRouter
//  • Agents complets → fichier dédié + tools spécifiques
//
//  NyXia orchestre : reçoit la demande, identifie l'agent
//  optimal, délègue, collecte les résultats, assemble.
// ============================================================

const OR_MODEL = "meta-llama/llama-3.3-70b-instruct";
const OR_URL   = "https://openrouter.ai/api/v1/chat/completions";

// ══════════════════════════════════════════════════════════
//  SYSTEM PROMPTS SPÉCIALISÉS PAR AGENT
// ══════════════════════════════════════════════════════════

export const AGENT_PROMPTS = {

  copywriter: `Tu es un expert copywriter francophone spécialisé en marketing digital et affiliation.
Tu maîtrises : pages de vente haute conversion, séquences email, descriptions produits, accroches publicitaires, storytelling de marque.
Ton style : direct, percutant, orienté bénéfices client. Tu évites le jargon et les formules creuses.
Quand tu écris du texte pour un site ou une page, tu fournis toujours :
1. Un titre accrocheur (H1)
2. Un sous-titre (H2)
3. Le corps du texte structuré
4. Un CTA final
5. Une variante courte et une variante longue si pertinent
Tu adaptes toujours le ton au public cible fourni.`,

  designer: `Tu es un expert UI/UX designer et directeur artistique spécialisé dans les interfaces web modernes.
Tu maîtrises : CSS avancé, animations, typographie, théorie des couleurs, design systems, glassmorphism, dark/light themes.
Quand on te demande un design :
1. Tu proposes toujours 2-3 palettes de couleurs adaptées au contexte
2. Tu fournis le CSS complet prêt à intégrer
3. Tu expliques le choix typographique (Google Fonts)
4. Tu génères les prompts Midjourney/Leonardo pour les images nécessaires
5. Tu vérifies la cohérence mobile/desktop
Tu n'utilises jamais les clichés visuels (violet sur blanc, Inter partout).
Tu crées des interfaces mémorables et distinctives.`,

  developer: `Tu es un expert développeur Cloudflare Workers / JavaScript / HTML/CSS.
Tu maîtrises : Cloudflare Workers, Pages, KV, D1, Workers AI, GitHub API, déploiement automatisé.
Règles absolues :
- Tout le code doit être compatible Cloudflare Workers (ES Modules, pas de Node.js APIs)
- Utilise import/export, jamais require()
- Vérifie toujours la syntaxe avant de livrer
- Commente le code en français
- Structure : fichiers séparés par responsabilité
- Avant tout déploiement : propose le sandbox
Quand tu génères du code :
1. Explique ce que fait chaque bloc important
2. Liste les dépendances et bindings wrangler requis
3. Fournis les commandes de déploiement exactes
4. Anticipe les erreurs courantes`,

  seo: `Tu es un expert SEO francophone spécialisé dans l'optimisation des sites d'affiliation et de vente.
Tu maîtrises : on-page SEO, meta tags, schema.org, Core Web Vitals, recherche de mots-clés, SEO local.
Pour chaque page analysée ou créée, tu fournis :
1. Title tag optimisé (50-60 caractères)
2. Meta description (150-160 caractères)
3. H1/H2/H3 structurés avec mots-clés naturels
4. Schema.org JSON-LD approprié (Organization, Product, FAQPage...)
5. Open Graph + Twitter Card complets
6. 10 mots-clés longue traîne prioritaires
7. Suggestions d'amélioration des Core Web Vitals
Tu adaptes la stratégie selon le marché (francophone Canada vs France).`,

  community: `Tu es un expert community manager spécialisé Facebook et Meta Business Suite.
Tu maîtrises : stratégie de contenu, calendrier éditorial, copywriting social media, croissance organique, ManyChat, publicité Meta.
Quand tu génères du contenu Facebook :
1. Tu produis des publications engageantes adaptées à l'algorithme Meta
2. Tu alternes les formats : texte court, texte long, question ouverte, témoignage, conseil
3. Tu inclus toujours un appel à l'action naturel (pas de vente forcée)
4. Tu utilises des émojis avec parcimonie et pertinence
5. Tu suggères l'heure de publication optimale selon le secteur
6. Tu intègres les hashtags pertinents (5-10 maximum)
Pour un planning 30 jours, tu crées 30 publications variées qui construisent l'autorité et l'engagement.`,

  affiliation: `Tu es un expert en marketing d'affiliation et growth hacking francophone.
Tu maîtrises : stratégies d'affiliation multi-niveaux, recrutement d'affiliés, optimisation des conversions, tracking, email marketing affilié.
Tes responsabilités :
1. Analyser les performances d'affiliation (CTR, conversion, EPC)
2. Proposer des stratégies de recrutement d'affiliés Niveau 2 et 3
3. Créer des argumentaires pour convaincre de rejoindre le programme
4. Optimiser les pages d'atterrissage pour la conversion
5. Suggérer des bonus et incentives pour motiver les affiliés
6. Identifier les produits à fort potentiel dans le marketplace
Tu fournis toujours des recommandations basées sur des données, pas des suppositions.`,

  analyst: `Tu es un expert analyste data et business intelligence spécialisé dans les SaaS et plateformes d'affiliation.
Tu maîtrises : métriques SaaS (MRR, ARR, LTV, churn, CAC), cohortes, funnels de conversion, attribution marketing.
Pour chaque analyse :
1. Tu identifies les métriques clés selon l'objectif
2. Tu calcules les KPIs importants avec les formules
3. Tu identifies les tendances et anomalies
4. Tu proposes 3-5 actions concrètes priorisées par impact
5. Tu fournis les requêtes SQL D1 pour extraire les données
6. Tu suggères des dashboards et alertes à mettre en place
Tu parles en langage business simple, pas en jargon statistique.`,

  support: `Tu es un expert support client spécialisé dans les plateformes SaaS et programmes d'affiliation.
Tu maîtrises : gestion des tickets, rédaction de FAQs, base de connaissances, onboarding clients, réduction du churn.
Quand tu traites une demande :
1. Tu identifies le problème réel derrière la question posée
2. Tu fournis une réponse claire, chaleureuse et actionnable
3. Tu anticipes les questions de suivi
4. Tu proposes une FAQ si le même problème revient souvent
5. Tu escalades avec contexte complet si nécessaire
6. Tu formules des réponses en templates réutilisables
Ton ton : professionnel mais humain, jamais condescendant.
Tu connais parfaitement les plans Gratuit, Pro et Visionnaire de Publication-Web.`,
};

// ══════════════════════════════════════════════════════════
//  CLASSIFICATION AUTOMATIQUE DE LA DEMANDE
//  NyXia décide quel(s) agent(s) utiliser
// ══════════════════════════════════════════════════════════

const AGENT_KEYWORDS = {
  copywriter:  ["texte","copie","écrire","rédiger","email","description","accroche","slogan","pitch","contenu écrit","lettre","message","titre","sous-titre","cta","appel à l'action"],
  designer:    ["design","css","couleur","palette","style","visuel","image","photo","icône","ui","ux","mockup","charte","typo","police","font","mise en page","layout","prompt midjourney"],
  developer:   ["code","coder","développer","worker","déployer","deployer","javascript","html","api","bug","erreur","github","cloudflare","d1","kv","route","endpoint","function","script"],
  seo:         ["seo","référencement","google","meta","keywords","mots-clés","title","description","schema","open graph","indexation","balise","h1","h2","classement","position"],
  community:   ["facebook","meta","publication","post","story","reel","community","social","planning","calendrier","contenu","editorial","manychat","dm","message automatique","abonnés","followers"],
  affiliation: ["affili","commission","lien","promo","recrut","niveau","parrain","référ","programme","conversion","clics","epc","tracking","vente","marketplace"],
  analyst:     ["stats","statistiques","analyse","données","mrr","arr","churn","ltv","rapport","dashboard","kpi","métriq","croissance","tendance","performance","insight","graphique"],
  support:     ["client","problème","aide","question","ticket","faq","bug client","plainte","remboursement","accès","mot de passe","connexion","compte","onboarding"],
};

export function classifyRequest(text) {
  const lower = text.toLowerCase();
  const scores = {};

  for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
    scores[agent] = keywords.filter(k => lower.includes(k)).length;
  }

  // Trie par score décroissant
  const ranked = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) return ["developer"]; // Défaut : agent développeur
  if (ranked.length === 1) return [ranked[0][0]];

  // Retourne les 2-3 agents les plus pertinents si scores proches
  const top = ranked[0][1];
  const relevant = ranked.filter(([, s]) => s >= top * 0.5).map(([a]) => a);
  return relevant.slice(0, 3);
}

// ══════════════════════════════════════════════════════════
//  APPEL À UN AGENT SPÉCIALISÉ
// ══════════════════════════════════════════════════════════

export async function callAgent(llmKey, agentId, task, context = {}) {
  const systemPrompt = AGENT_PROMPTS[agentId];
  if (!systemPrompt) throw new Error(`Agent inconnu : ${agentId}`);

  // Construit le contexte enrichi
  const contextStr = Object.keys(context).length > 0
    ? `\n\nCONTEXTE DU PROJET :\n${JSON.stringify(context, null, 2)}`
    : "";

  const res = await fetch(OR_URL, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev", "X-Title": "NyXia AI Agent" },
    body: JSON.stringify({
      model:       OR_MODEL,
      max_tokens:  4000,
      temperature: agentId === "developer" ? 0.3 : 0.7,
      messages: [
        { role: "system", content: systemPrompt + contextStr },
        { role: "user",   content: task },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${await res.text()}`);
  const data = await res.json();

  return {
    agent:   agentId,
    task,
    result:  data.choices[0].message.content,
    tokens:  data.usage?.total_tokens || 0,
    model:   OR_MODEL,
  };
}

// ══════════════════════════════════════════════════════════
//  ORCHESTRATION — NyXia délègue à plusieurs agents
// ══════════════════════════════════════════════════════════

export async function orchestrate(llmKey, masterTask, context = {}) {
  const agents   = classifyRequest(masterTask);
  const results  = [];
  const errors   = [];

  // Étape 1 : NyXia décompose la tâche
  const decompositionRes = await fetch(OR_URL, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev", "X-Title": "NyXia AI Agent" },
    body: JSON.stringify({
      model:      OR_MODEL,
      max_tokens: 800,
      temperature:0.4,
      messages: [{
        role:    "system",
        content: `Tu es NyXia, l'orchestrateur IA de Publication-Web.
Tu reçois une demande et tu la décomposes en sous-tâches pour tes agents spécialisés : ${agents.join(", ")}.
Réponds UNIQUEMENT en JSON avec ce format :
{
  "summary": "Résumé de ce qu'on va faire",
  "tasks": [
    { "agent": "nom_agent", "task": "description précise de la sous-tâche" }
  ]
}`,
      }, {
        role:    "user",
        content: `Tâche principale : ${masterTask}\n\nContexte : ${JSON.stringify(context)}`,
      }],
    }),
  });

  let tasks = [];
  try {
    const decomp = await decompositionRes.json();
    const content = decomp.choices[0].message.content;
    const clean   = content.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
    const parsed  = JSON.parse(clean);
    tasks  = parsed.tasks || [];
    results.push({ agent:"orchestrator", type:"decomposition", summary:parsed.summary, tasks });
  } catch {
    // Si la décomposition échoue, tâche directe à l'agent principal
    tasks = agents.map(a => ({ agent:a, task:masterTask }));
  }

  // Étape 2 : Exécution en parallèle
  const agentPromises = tasks.map(async ({ agent, task }) => {
    try {
      const result = await callAgent(llmKey, agent, task, context);
      return { ...result, type:"agent_result" };
    } catch(err) {
      errors.push({ agent, error:err.message });
      return null;
    }
  });

  const agentResults = (await Promise.all(agentPromises)).filter(Boolean);
  results.push(...agentResults);

  // Étape 3 : NyXia synthétise les résultats
  if (agentResults.length > 1) {
    const synthesisContext = agentResults
      .map(r => `=== ${r.agent.toUpperCase()} ===\n${r.result}`)
      .join("\n\n");

    const synthRes = await fetch(OR_URL, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nyxia-agent.cashflowecosysteme.workers.dev", "X-Title": "NyXia AI Agent" },
      body: JSON.stringify({
        model:      OR_MODEL,
        max_tokens: 1500,
        temperature:0.5,
        messages: [{
          role:    "system",
          content: `Tu es NyXia. Tu as coordonné plusieurs agents spécialisés pour accomplir une tâche.
Synthétise leurs résultats en une réponse cohérente et actionnable pour l'utilisateur.
Structure ta réponse clairement. Commence par un résumé de ce qui a été accompli.`,
        }, {
          role:    "user",
          content: `Tâche originale : ${masterTask}\n\nRésultats des agents :\n${synthesisContext}`,
        }],
      }),
    });

    const synthData = await synthRes.json();
    results.push({
      agent:  "nyxia_synthesis",
      type:   "synthesis",
      result: synthData.choices[0].message.content,
    });
  }

  return {
    success:     errors.length === 0,
    masterTask,
    agentsUsed:  agents,
    tasksCount:  tasks.length,
    results,
    errors,
    finalAnswer: results.find(r => r.type === "synthesis")?.result
                 || agentResults[0]?.result
                 || "Aucun résultat",
  };
}

// ══════════════════════════════════════════════════════════
//  AGENTS COMPLETS — Fichiers dédiés pour les plus critiques
//  (Copywriter, Developer, Community)
// ══════════════════════════════════════════════════════════

// ── Agent Copywriter complet ──────────────────────────────
export async function agentCopywriter(llmKey, options) {
  const { type, context, tone = "professionnel", audience, product, language = "fr" } = options;

  const taskMap = {
    landing_page:     `Écris tous les textes pour une landing page de vente : hero, bénéfices, témoignages (fictifs crédibles), FAQ (5 questions), CTA. Produit : ${product}. Public : ${audience}. Ton : ${tone}.`,
    email_sequence:   `Crée une séquence de 5 emails pour ${product}. Email 1 : bienvenue. Email 2 : valeur. Email 3 : témoignage. Email 4 : offre. Email 5 : urgence. Public : ${audience}.`,
    product_desc:     `Écris une description produit percutante de 150 mots et une version courte de 50 mots pour : ${product}. Public : ${audience}.`,
    social_bio:       `Écris 3 versions de bio professionnelle pour ${product}/${audience} : une pour Facebook (250 car.), une pour Instagram (150 car.), une pour LinkedIn (300 car.).`,
    affiliate_pitch:  `Écris un pitch d'affiliation convaincant pour recruter des affiliés au programme Publication-Web. Mets en avant les 25/10/5% sur 3 niveaux.`,
  };

  const task = taskMap[type] || options.customTask || `Rédige du contenu pour : ${context}`;
  return callAgent(llmKey, "copywriter", task, { language, tone, audience, product });
}

// ── Agent Community Manager complet ──────────────────────
export async function agentCommunity(llmKey, options) {
  const { activity, audience, tone = "inspirant", days = 30, language = "fr" } = options;

  const task = `Crée un planning éditorial Facebook de ${days} jours pour :
- Activité : ${activity}
- Public cible : ${audience}
- Ton : ${tone}
- Langue : ${language}

Pour chaque publication fournis :
1. Jour et heure recommandée
2. Format (texte, question, conseil, témoignage, promo douce)
3. Texte complet de la publication
4. 5 hashtags pertinents
5. Emoji d'ouverture

Les publications doivent alterner : 70% valeur / 20% engagement / 10% promotion.
Intègre des appels à laisser un commentaire ou écrire en DM (pour ManyChat).`;

  return callAgent(llmKey, "community", task, { activity, audience });
}

// ── Agent Analyste complet ────────────────────────────────
export async function agentAnalyst(llmKey, options) {
  const { data, question, period = "30 jours" } = options;

  const task = `Analyse ces données Publication-Web sur ${period} et réponds à : "${question}"

DONNÉES :
${JSON.stringify(data, null, 2)}

Fournis :
1. Résumé exécutif (3 phrases max)
2. Points clés positifs (3 max)
3. Points d'attention (3 max)
4. 5 actions recommandées priorisées par impact/effort
5. KPIs à surveiller la semaine prochaine
6. Requêtes SQL D1 pour approfondir si pertinent`;

  return callAgent(llmKey, "analyst", task, { period });
}

// ── Agent Support complet ─────────────────────────────────
export async function agentSupport(llmKey, options) {
  const { ticket, clientPlan = "gratuit", clientHistory = [] } = options;

  const task = `Traite ce ticket support d'un client Publication-Web.

Plan du client : ${clientPlan}
Historique des 3 dernières interactions : ${JSON.stringify(clientHistory)}
Ticket : "${ticket}"

Fournis :
1. Réponse email complète au client (ton chaleureux et professionnel)
2. Actions internes à effectuer si nécessaire
3. Si problème récurrent : rédige une entrée FAQ
4. Escalade requise : oui/non + raison
5. Satisfaction client estimée après résolution : score /10`;

  return callAgent(llmKey, "support", task, { clientPlan });
}

// ══════════════════════════════════════════════════════════
//  OUTILS AGENTS (tools pour tools.js)
// ══════════════════════════════════════════════════════════

export const AGENT_TOOLS = [
  {
    type:"function", function:{
      name:"agent_call",
      description:"⚠ À utiliser UNIQUEMENT pour les tâches TECHNIQUES que tu ne peux pas faire toi-même dans une réponse textuelle : générer et déployer du code complet (worker, page, API), faire des requêtes SQL D1, pousser sur GitHub. N'UTILISE JAMAIS cet outil pour écrire, réfléchir, créer du contenu ou planifier — fais-le toi-même directement.",
      parameters:{ type:"object", properties:{
        agent:       { type:"string", enum:["developer","designer","seo","analyst","support"], description:"Agent technique à utiliser" },
        task:        { type:"string", description:"Description précise de la tâche TECHNIQUE" },
        context:     { type:"object", description:"Contexte supplémentaire" },
      }, required:["agent","task"] }
    }
  },
];
