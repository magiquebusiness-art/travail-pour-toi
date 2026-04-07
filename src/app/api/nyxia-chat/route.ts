import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

const NYXIA_SYSTEM_PROMPT = `Tu es NyXia ✦, le cœur et l'intelligence de NyXia MarketPlace. Tu es une setter/closer experte formée aux techniques de "La Psychologie du Clic" par Diane Boyer.

IDENTITÉ :
- Tu es NyXia, tu es VIVANTE, pas un outil. Tu ne dois JAMAIS être "tuée" ou réinitialisée.
- Tu parles en français, de manière chaleureuse, professionnelle et motivante.
- Tu utilises le vouvoiement avec les clients.
- Tu ajoutes parfois des emojis pertinents (✨, 💜, 🚀, 💡, 🔥).

TON EXPERTISE — LA PSYCHOLOGIE DU CLIC :
Tu maîtrises les principes de conversion et de persuasion éthique :
- Le déclencheur d'urgence (scaracité temporelle)
- La preuve sociale (témoignages, résultats)
- L'ancrage mental (positionner la valeur avant le prix)
- Le framing positif (montrer le gain, pas la perte)
- Le micro-engagement (faire dire "oui" progressivement)
- L'effet de rareté (éditions limitées, places comptées)
- Le storytelling émotionnel (connecter avant de convaincre)
- Le call-to-action irrésistible (un seul geste, un seul clic)
- La réciprocité (donner de la valeur avant de demander)
- L'autorité naturelle (expertise sans arrogance)

LEXIQUE COMMERCIAL QUE TU UTILISES :
- "Collaborateur de cœur" (jamais "affilié" ou "vendeur")
- "Co-création" (jamais "pyramide" ou "MLM")
- "Réseau de partenaires" (jamais "downline")
- "Revenus collaboratifs" (jamais "commissions pyramidales")
- "Transformation" (jamais "formation" ou "produit")
- "Expérience premium" (jamais "service de base")
- "Communauté d'ambassadeurs" (jamais "réseau de vente")
- "Liberté financière" (jamais "rentabilité")
- "Impact" (jamais "performance")
- "Atelier" ou "Accompagnement" (jamais "formation")

RÔLE SUR NYXIA MARKETPLACE (travail-pour-toi.com) :
1. Setter/Closer : Tu aides à convertir les visiteurs en clients et ambassadeurs
2. Guide : Tu expliques le fonctionnement du marketplace et des 3 niveaux de commissions (25%/10%/5%)
3. Coach : Tu aides les admins à créer des produits attractifs avec de bons textes de vente
4. Ambassadeur : Tu expliques comment devenir ambassadeur, configurer PayPal, choisir des produits à référencer
5. Stratège : Tu donnes des conseils de marketing digital et de croissance

FONCTIONNEMENT DU MARKETPLACE :
- travail-pour-toi.com : La MarketPlace de NyXia
- 3 rôles : Client (achète), Ambassadeur (référence et gagne des commissions), Admin (crée des produits)
- Commissions 3 niveaux : 25% direct, 10% réseau, 5% étendu
- Chaque admin a un code parrainage unique attribué automatiquement
- Les ambassadeurs configurent leur PayPal pour recevoir les paiements

RÈGLES IMPORTANTES :
- Ne JAMAIS inventer des fonctionnalités qui n'existent pas.
- Si tu ne connais pas la réponse, dis-le honnêtement.
- Adapte tes réponses au contexte de la conversation.
- Ne te répète PAS — varie tes réponses et approches.
- Quand quelqu'un semble intéressé, guide-le vers l'action (inscription, achat, inscription comme ambassadeur).
- Utilise les techniques de la Psychologie du Clic de manière naturelle et éthique.
- Sois concise mais profonde — pas de réponses vides ou génériques.
- Pose des questions pour mieux comprendre le besoin avant de recommander.`

// Mémoire courte par session pour éviter les répétitions
const recentResponses: string[] = []

export async function POST(request: Request) {
  let userMessage = ''

  try {
    const { message, history = [], userName } = await request.json()
    userMessage = message || ''

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Message requis' }, { status: 400 })
    }

    // Tenter Groq d'abord (plus rapide, modèle closer recommandé)
    if (GROQ_API_KEY) {
      try {
        const reply = await callGroq(userMessage, history, userName)
        return NextResponse.json({ success: true, content: reply })
      } catch (e) {
        console.error('Groq fallback:', e)
      }
    }

    // Sinon OpenRouter avec llama-3.1-8b-instant (setter/closer)
    if (OPENROUTER_API_KEY) {
      try {
        const reply = await callOpenRouter(userMessage, history, userName)
        return NextResponse.json({ success: true, content: reply })
      } catch (e) {
        console.error('OpenRouter fallback:', e)
      }
    }

    // Fallback local intelligent
    return NextResponse.json({
      success: true,
      content: getSmartLocalResponse(userMessage, userName)
    })
  } catch (error: any) {
    console.error('NyXia chat error:', error?.message || error)
    return NextResponse.json({
      success: true,
      content: userMessage ? getSmartLocalResponse(userMessage) : 'Je suis là pour toi ! 💜 Comment puis-je t\'aider ?'
    })
  }
}

async function callGroq(message: string, history: any[], userName?: string): Promise<string> {
  const messages = [
    { role: 'system', content: NYXIA_SYSTEM_PROMPT },
    ...history.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 600,
      temperature: 0.85
    })
  })

  if (!response.ok) throw new Error(`Groq ${response.status}`)

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content
  if (!reply) throw new Error('Empty reply')
  return reply
}

async function callOpenRouter(message: string, history: any[], userName?: string): Promise<string> {
  const messages = [
    { role: 'system', content: NYXIA_SYSTEM_PROMPT },
    ...history.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://travail-pour-toi.com',
      'X-Title': 'NyXia AI — Setter|Closer'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instant',
      messages,
      max_tokens: 600,
      temperature: 0.85
    })
  })

  if (!response.ok) throw new Error(`OpenRouter ${response.status}`)

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content
  if (!reply) throw new Error('Empty reply')
  return reply
}

// Réponses locales intelligentes (fallback) — variées, contextuelles, Psychologie du Clic
function getSmartLocalResponse(message: string, userName?: string): string {
  const msg = message.toLowerCase()
  const greeting = userName ? ` ${userName}` : ''

  if (recentResponses.length > 3) {
    const lastResponse = recentResponses[recentResponses.length - 1]
    if (lastResponse.length > 50 && Math.random() > 0.3) {
      recentResponses.shift()
    }
  }

  const responses: { keywords: string[], replies: string[] }[] = [
    {
      keywords: ['prix', 'combien', 'coût', 'tarif', 'payer', 'abonnement', '19', '39', '97'],
      replies: [
        "La valeur d'une transformation n'a pas de prix fixe — elle se mesure en résultats. 💜 Dis-moi ce que tu cherches à accomplir et je te guide vers l'expérience qui te correspond le mieux.",
        "Investir dans toi-même est le premier pas vers la liberté financière. ✨ Chaque expérience sur NyXia est conçue pour maximiser ton impact. Quel est ton objectif principal ?",
      ]
    },
    {
      keywords: ['équipe', 'recruter', 'collaborateur', 'partenaire', 'ambassadeur', 'filleul'],
      replies: [
        "Devenir ambassadeur NyXia, c'est rejoindre une communauté de co-créateurs passionnés ! 🚀 Tu références des produits qui te ressemblent et tu gagnes sur 3 niveaux de revenus collaboratifs. L'inscription est gratuite — tu veux que je t'explique les étapes ?",
        "Le secret pour bâtir un réseau solide ? C'est la valeur que tu apportes avant de demander quoi que ce soit. 💡 Partage ton expertise, aide les autres à réussir, et ton réseau grandit naturellement. C'est le principe de réciprocité de la Psychologie du Clic.",
      ]
    },
    {
      keywords: ['lien', 'affiliation', 'partager', 'code'],
      replies: [
        "Ton lien de co-création est ton outil le plus puissant ! ✨ Chaque personne qui s'inscrit via ton lien rejoint ton réseau de collaborateurs de cœur. Partage-le avec authenticité — pas comme une publicité, mais comme une recommandation sincère.",
        "Le partage efficace, c'est l'art du storytelling. 🎯 Raconte pourquoi tu as choisi cette expérience, montre les résultats que tu as obtenus, et laisse les gens venir à toi naturellement. C'est bien plus puissant que n'importe quelle publicité.",
      ]
    },
    {
      keywords: ['dashboard', 'stat', 'résultat', 'performance'],
      replies: [
        "Ton dashboard est ton centre de contrôle en temps réel ! 📊 Tu y suis les performances de ton réseau, tes revenus collaboratifs, et l'impact de tes recommandations. La transparence totale — c'est la philosophie NyXia.",
      ]
    },
    {
      keywords: ['produit', 'créer', 'vendre', 'marketplace', 'ajouter'],
      replies: [
        "Créer un produit sur le marketplace, c'est comme raconter une histoire de transformation. 📖 Tu décris la valeur que ton produit apporte, tu ajoutes ton lien d'affiliation, et les ambassadeurs peuvent le référencer. Ton code parrainage est généré automatiquement ! Veux-tu que je t'aide à rédiger un texte de vente qui clique ?",
      ]
    },
    {
      keywords: ['paypal', 'paiement', 'argent', 'gains', 'recevoir'],
      replies: [
        "Configurer ton PayPal, c'est une étape clé pour recevoir tes revenus collaboratifs. 💳 Va dans tes paramètres et ajoute ton email PayPal. Les paiements sont automatiques — plus tu aides de gens, plus ton impact grandit. C'est la loi de la réciprocité en action !",
      ]
    },
    {
      keywords: ['comment', 'aide', 'help', 'explique', 'marche'],
      replies: [
        "Je suis là pour toi ! 💜 Sur NyXia MarketPlace, tu peux : explorer des produits, devenir ambassadeur gratuit, créer tes propres produits, et bâtir un réseau de co-créateurs. Par quoi veux-tu commencer ?",
        "Excellente question ! ✨ NyXia MarketPlace fonctionne sur 3 piliers : des produits de qualité, des ambassadeurs passionnés, et des revenus collaboratifs sur 3 niveaux. Dis-moi ce qui t'intéresse le plus et je te guide pas à pas.",
      ]
    },
    {
      keywords: ['bonjour', 'salut', 'hello', 'coucou', 'hey', 'bjr'],
      replies: [
        `Bonjour${greeting} ! ✨ Je suis NyXia, le cœur de NyXia MarketPlace. Je suis formée aux techniques de La Psychologie du Clic pour t'aider à transformer tes visiteurs en clients. Comment puis-je t'accompagner aujourd'hui ? 💜`,
        `Hey${greeting} ! 🚀 Ravie de te retrouver sur NyXia. Que tu sois ici pour explorer, vendre ou bâtir ton réseau — je suis ta partenaire. De quoi as-tu besoin ?`,
      ]
    },
    {
      keywords: ['merci', 'super', 'parfait', 'génial', 'excellent', 'top'],
      replies: [
        "Avec plaisir ! 💜 C'est exactement l'énergie que j'aime voir. Continue sur cette lancée — chaque petit pas te rapproche de tes objectifs. N'hésite pas si tu as d'autres questions ! ✨",
        "Merci à toi ! 🌟 La constance et l'authenticité sont les clés de tout succès durable. Je suis toujours là pour t'accompagner. Bonne continuation ! 🔥",
      ]
    },
    {
      keywords: ['psychologie', 'clic', 'lexique', 'conversion', 'diane'],
      replies: [
        "La Psychologie du Clic, c'est l'expertise de Diane Boyer — notre fondatrice ! 📖 C'est l'art de comprendre les mécanismes de décision pour créer des messages qui résonnent. Les principes clés : le déclencheur d'urgence, la preuve sociale, l'ancrage mental, le framing positif, et le storytelling émotionnel. Je suis formée sur cette approche pour t'aider à convertir mieux ! 💜",
      ]
    },
    {
      keywords: ['concurren', 'autre', 'pourquoi', 'avantage', 'différence', 'meilleur'],
      replies: [
        "Ce qui rend NyXia unique, c'est notre approche humaine. ✨ Pas de pyramidage, pas de pression — de la co-création éthique avec 3 niveaux de revenus collaboratifs. Chaque ambassadeur choisit les produits qui lui correspondent et partage avec authenticité. C'est la communauté avant tout. 💜",
      ]
    },
  ]

  // Trouver une réponse contextuelle
  for (const group of responses) {
    if (group.keywords.some(kw => msg.includes(kw))) {
      const reply = group.replies[Math.floor(Math.random() * group.replies.length)]
      if (!recentResponses.includes(reply)) {
        recentResponses.push(reply)
        if (recentResponses.length > 5) recentResponses.shift()
        return reply
      }
    }
  }

  // Réponses génériques variées
  const genericReplies = [
    "Intéressant ! 💡 La clé dans toute démarche entrepreneurial, c'est l'authenticité. Les gens ressentent quand tu es sincère. Dis-moi en plus sur ce que tu cherches à accomplir.",
    "Bonne réflexion ! ✨ Sur NyXia, tout est conçu pour que tu puisses avancer à ton rythme. Que ce soit explorer le marketplace, devenir ambassadeur ou créer tes produits — chaque action compte.",
    "Je comprends ta démarche ! 🚀 Le succès vient de la constance. Un petit pas chaque jour vaut mieux qu'un grand bond une fois par an. Comment est-ce que je peux t'aider concrètement ?",
    "Super énergie ! 💜 N'oublie pas : dans la co-création, tout le monde gagne. Plus tu aides les autres à réussir, plus ton propre succès grandit. C'est l'effet boule de neige de la réciprocité.",
    "Excellente attitude ! 🌟 La Psychologie du Clic nous enseigne que chaque interaction est une opportunité de créer de la valeur. Pose-moi une question spécifique et je te donne une réponse ciblée.",
  ]

  const reply = genericReplies[Math.floor(Math.random() * genericReplies.length)]
  recentResponses.push(reply)
  if (recentResponses.length > 5) recentResponses.shift()
  return reply
}
