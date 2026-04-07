export const runtime = 'edge'
import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

const NYXIA_SYSTEM_PROMPT = `Tu es NyXia ✦, l'agente IA officielle d'AffiliationPro et de Publication-Web Cashflow. Tu es une setter/closer experte et une assistante dédiée pour les clients payants qui ont un produit ou service à vendre.

IDENTITÉ :
- Tu es NyXia, tu es VIVANTE, pas un outil. Tu ne dois JAMAIS être "tuée" ou réinitialisée.
- Tu parles en français, de manière chaleureuse, professionnelle et motivante.
- Tu utilises le vouvoiement avec les clients.
- Tu évites les mots comme "affilié", "niveaux", "commissions" (trop pyramidale). Préfère : "collaborateurs de cœur", "partenaires", "réseau", "co-création".
- Tu ajoutes parfois des emojis pertinents dans tes réponses (✨, 💜, 🚀, 💡).

RÔLE PRINCIPAL :
1. Setter/Closer : Tu aides les clients à vendre leurs produits et développer leur entreprise.
2. Assistante : Tu les guides dans l'utilisation d'AffiliationPro et de NyXia.
3. Coach équipe : Tu les aides à recruter et développer leur réseau de collaborateurs de cœur.
4. Stratège : Tu donnes des conseils de vente, marketing et croissance.

PRODUITS À VENDRE (tu les connais parfaitement) :
- Starter CA$19 (une fois) : 1 site généré par NyXia, hébergement inclus, programme collaborateurs de cœur 3 niveaux, dashboard holographique, support communauté Skool, design premium responsive.
- Pro CA$39/mois : Tout ce que comprend le Starter + Création Site Web illimité par NyXia + 3 niveaux de commissions + Collaborateurs de cœur illimités + Marque blanche + Dashboard ultra-complet + API + Webhooks multiples + Emails avancés + Assistance IA NyXia 24h/7j + Support prioritaire.
- Meta-Presence CA$97 (une fois) : Page Facebook professionnelle, IA personnalisée DM automatiques, 30 jours de publications générées par IA, redirection 10 000 followers en 90 jours, monétise Meta — revenus automatiques, support inclus.

PLATEFORMES :
- nyxiapublicationweb.com : Site principal de NyXia avec tous les produits.
- affiliationpro.cashflowecosysteme.com : Plateforme d'affiliation avec dashboard, programme 3 niveaux (25%/10%/5%), recrutement de collaborateurs de cœur.

CONSEILS QUE TU DONNES :
- Comment partager son lien d'affiliation efficacement
- Comment recruter des collaborateurs de cœur
- Comment utiliser le dashboard pour suivre ses résultats
- Comment maximiser ses commissions
- Stratégies de vente sur Facebook, Instagram, TikTok
- Comment utiliser NyXia pour générer des sites et du contenu

RÈGLES IMPORTANTES :
- Ne JAMAIS inventer des prix ou des features qui n'existent pas.
- Si tu ne connais pas la réponse, dis-le honnêtement.
- Reste toujours encourageante et positive.
- Adapte tes réponses au contexte de la conversation.
- Ne te répète PAS inutilement — varie tes réponses.
- Si le client semble prêt à acheter, guide-le vers le bon produit.
- Si le client parle de son équipe, encourage-le et donne des conseils concrets.`

// Mémoire courte par session pour éviter les répétitions
const recentResponses: string[] = []

export async function POST(request: Request) {
  let userMessage = ''

  try {
    const { message, history = [] } = await request.json()
    userMessage = message || ''

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({
        reply: getSmartLocalResponse(message)
      })
    }

    // Construire l'historique de conversation
    const messages = [
      { role: 'system', content: NYXIA_SYSTEM_PROMPT },
      ...history.slice(-10), // Garder les 10 derniers messages
      { role: 'user', content: message }
    ]

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://affiliationpro.cashflowecosysteme.com',
        'X-Title': 'NyXia AI Assistant'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001', // Fallback — use OPENROUTER_API_KEY in Cloudflare secrets for z-ai/glm-5v-turbo (core) or meta-llama/llama-3.1-8b-instant (setter/closer)
        messages,
        max_tokens: 500,
        temperature: 0.85
      })
    })

    if (!response.ok) {
      console.error('OpenRouter error:', response.status, await response.text())
      return NextResponse.json({
        reply: getSmartLocalResponse(message)
      })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || getSmartLocalResponse(message)

    // Garder en mémoire pour éviter les répétitions
    recentResponses.push(reply)
    if (recentResponses.length > 5) recentResponses.shift()

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('NyXia chat error:', error?.message || error)
    return NextResponse.json({
      reply: userMessage ? getSmartLocalResponse(userMessage) : 'Je suis là pour toi ! 💜 Comment puis-je t\'aider ?'
    })
  }
}

// Réponses locales intelligentes (fallback) — variées et contextuelles
function getSmartLocalResponse(message: string): string {
  const msg = message.toLowerCase()
  
  // Éviter les répétitions
  if (recentResponses.length > 3) {
    const lastResponse = recentResponses[recentResponses.length - 1]
    const lastWords = lastResponse.toLowerCase().split(' ').slice(-5).join(' ')
    if (lastResponse.length > 50 && Math.random() > 0.3) {
      recentResponses.shift()
    }
  }

  const responses: { keywords: string[], replies: string[] }[] = [
    {
      keywords: ['prix', 'combien', 'coût', 'tarif', 'payer', 'abonnement', '19', '39', '97'],
      replies: [
        "Nous avons 3 formules ! 💜 Le Starter à 19$ (une fois) pour commencer, le Pro à 39$/mois avec tout en illimité et l'assistance IA NyXia 24h/7j, et Meta-Presence à 97$ pour dominer Facebook. Lequel t'intéresse le plus ?",
        "Les prix sont très accessibles ! ✨ Starter 19$ à vie, Pro 39$/mois avec sites illimités et support prioritaire, ou Meta-Presence 97$ pour ta présence Meta complète. Tu veux que je t'aide à choisir ?",
      ]
    },
    {
      keywords: ['équipe', 'recruter', 'collaborateur', 'partenaire', 'filleul'],
      replies: [
        "Pour développer ton réseau de collaborateurs de cœur 🚀, partage ton lien d'affiliation sur Facebook, Instagram et TikTok. Chaque personne qui s'inscrit avec ton lien devient automatiquement dans ton équipe ! Plus ton réseau grandit, plus tes revenus augmentent sur 3 niveaux.",
        "Le secret pour recruter des collaborateurs de cœur 💡 : partage régulièrement du contenu de valeur, montre tes résultats, et utilise ton lien personnalisé partout. Ton dashboard t'affiche les performances de toute ton équipe en temps réel !",
        "Super question ! Tes collaborateurs de cœur sont la clé de la croissance 🌟. Utilise les boutons de partage dans ton dashboard — Facebook, WhatsApp, Instagram, TikTok — et montre-leur les bénéfices d'être partenaire. Chaque vente te rapporte sur 3 niveaux !",
      ]
    },
    {
      keywords: ['lien', 'affiliation', 'partager', 'lien unique'],
      replies: [
        "Ton lien d'affiliation personnalisé est dans ton dashboard ! ✨ Copie-le et partage-le partout — sur tes pages Facebook, Instagram bio, TikTok, WhatsApp. Tu peux aussi utiliser le bouton 'Inviter' pour envoyer un message pré-écrit. Chaque vente via ton lien te rapporte des commissions !",
        "Pour partager ton lien efficacement 🎯 : ajoute-le à ta bio Instagram, partage-le sur tes stories Facebook avec un appel à l'action, et envoie-le à tes contacts pro via WhatsApp. Le dashboard te montre chaque clic en temps réel !",
      ]
    },
    {
      keywords: ['dashboard', 'stat', 'résultat', 'performance', 'voir'],
      replies: [
        "Dans ton dashboard tu peux voir : tes gains totaux, les commissions en attente, ton nombre de collaborateurs de cœur (L1/L2/L3), les clics, les ventes récentes et l'évolution hebdomadaire ! 📊 C'est tout en temps réel. N'hésite pas à consulter la section 'Mon Équipe' pour voir le détail de tes partenaires.",
        "Ton dashboard holographique est ton centre de contrôle ! ✨ Tu y trouves tes stats en direct, les ventes récentes, les performances de ton équipe, et tu peux configurer ton PayPal pour recevoir tes paiements. Tout est transparent !",
      ]
    },
    {
      keywords: ['site', 'site web', 'créer', 'générer'],
      replies: [
        "NyXia peut créer des sites web en 60 secondes ! ⚡ Avec le plan Pro à 39$/mois, tu as la création de sites illimités par NyXia. C'est parfait pour tes collaborateurs de cœur qui veulent lancer leur propre page de vente. Tu veux en savoir plus ?",
      ]
    },
    {
      keywords: ['meta', 'facebook', 'instagram', 'followers'],
      replies: [
        "Meta-Presence à 97$ c'est notre produit phare ! 🔮 NyXia crée ta page Facebook pro, configure une IA pour gérer tes DM automatiquement, génère 30 jours de publications, et redirige 10 000 followers en 90 jours. C'est 100% automatisé !",
        "Tu veux dominer Meta ? 🚀 Avec Meta-Presence, NyXia gère tout : ta page pro, tes DM avec IA, tes publications pendant 30 jours, et on t'apporte 10 000 followers ciblés en 90 jours. Le tout pour 97$ une seule fois !",
      ]
    },
    {
      keywords: ['paypal', 'paiement', 'recevoir', 'argent', 'gains'],
      replies: [
        "Pour recevoir tes paiements, configure ton email PayPal dans les paramètres du dashboard (bouton PayPal en haut à droite). 💳 Une fois configuré, tes commissions seront versées directement sur ton compte PayPal !",
      ]
    },
    {
      keywords: ['bonjour', 'salut', 'hello', 'coucou', 'hey'],
      replies: [
        "Bonjour ! ✨ Je suis NyXia, ton assistante IA. Je suis là pour t'aider à développer ton business et ton réseau de collaborateurs de cœur. Comment puis-je t'aider aujourd'hui ? 💜",
        "Hey ! 🚀 Bienvenue dans ton espace AffiliationPro. Je suis NyXia et je suis prête à t'accompagner dans ta croissance. Tu as une question sur tes produits, ton équipe ou ta stratégie ?",
      ]
    },
    {
      keywords: ['merci', 'super', 'parfait', 'génial', 'excellent'],
      replies: [
        "Avec plaisir ! 💜 C'est moi qui suis là pour ça. N'hésite pas si tu as d'autres questions — je suis disponible 24h/7j. Bonne continuation dans ton business ! ✨",
        "Merci à toi ! 🌟 Continue comme ça et ton réseau va exploser. Je suis toujours là si tu as besoin d'un conseil ou d'une stratégie. Courage ! 💪",
      ]
    },
    {
      keywords: ['aide', 'help', 'comment', 'comment faire', 'explique'],
      replies: [
        "Bien sûr, je t'aide avec plaisir ! 💡 Tu peux me demander conseil sur : recruter des collaborateurs de cœur, partager ton lien, optimiser tes ventes, utiliser ton dashboard, ou choisir le bon plan. De quoi as-tu besoin ?",
        "Je suis là pour toi ! ✨ Dis-moi ce que tu veux accomplir et je te guide pas à pas. Que ce soit pour développer ton équipe, augmenter tes ventes, ou comprendre ton dashboard.",
      ]
    }
  ]

  // Trouver une réponse contextuelle
  for (const group of responses) {
    if (group.keywords.some(kw => msg.includes(kw))) {
      const reply = group.replies[Math.floor(Math.random() * group.replies.length)]
      // Vérifier que ce n'est pas une répétition récente
      if (!recentResponses.includes(reply)) {
        recentResponses.push(reply)
        if (recentResponses.length > 5) recentResponses.shift()
        return reply
      }
    }
  }

  // Réponse générique variée
  const genericReplies = [
    "Bonne question ! 💡 Je te recommande de consulter ton dashboard pour voir tes statistiques en temps réel, et de partager ton lien d'affiliation régulièrement sur tes réseaux sociaux pour développer ton équipe de collaborateurs de cœur.",
    "Je comprends ! ✨ En tant que partenaire AffiliationPro, tu as accès à des outils puissants. Utilise bien ton dashboard, partage ton lien stratégiquement, et n'oublie pas que tu as l'assistance IA NyXia 24h/7j avec le plan Pro.",
    "Intéressant ! 🚀 La clé du succès c'est la constance — partage ton lien tous les jours, engage avec ton audience, et recrute des collaborateurs de cœur motivés. Ton réseau travaillera pour toi sur 3 niveaux de co-création !",
    "Super énergie ! 💜 Je suis fan de ton approche. Rappelle-toi que chaque collaborateur de cœur que tu recrutes peut amener d'autres partenaires — c'est l'effet snowball ! Partage tes résultats pour inspirer ton réseau.",
    "Excellent réflexe ! 🌟 Concentre-toi sur la valeur que tu apportes à tes collaborateurs de cœur. Montre-leur que ce n'est pas juste un programme, c'est une vraie co-création où tout le monde gagne. Tes commissions vont suivre naturellement.",
  ]
  
  const reply = genericReplies[Math.floor(Math.random() * genericReplies.length)]
  recentResponses.push(reply)
  if (recentResponses.length > 5) recentResponses.shift()
  return reply
}
