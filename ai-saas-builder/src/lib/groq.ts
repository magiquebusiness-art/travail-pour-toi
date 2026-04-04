const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function groqChat(
  messages: GroqMessage[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
  } = {}
): Promise<string> {
  const {
    model = 'llama-3.3-70b-versatile',
    temperature = 0.7,
    maxTokens = 2048,
  } = options

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${error}`)
  }

  const data: GroqResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

// AI Helper for content generation
export async function generateAffiliateContent(prompt: string): Promise<string> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `Tu es un assistant expert en marketing d'affiliation. Tu aides les utilisateurs à créer du contenu persuasif, des emails de prospection, des pages de vente et des stratégies d'affiliation efficaces. Tu réponds toujours en français de manière professionnelle et engageante.`,
    },
    {
      role: 'user',
      content: prompt,
    },
  ]

  return groqChat(messages)
}

// AI Helper for site generation
export async function generateSiteContent(
  niche: string,
  style: string
): Promise<{
  headline: string
  subheadline: string
  cta: string
  benefits: string[]
}> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `Tu es un expert en création de landing pages. Tu génères du contenu optimisé pour la conversion. Réponds UNIQUEMENT avec un JSON valide contenant: headline, subheadline, cta, benefits (array).`,
    },
    {
      role: 'user',
      content: `Crée du contenu pour une landing page dans le domaine: "${niche}" avec le style: "${style}"`,
    },
  ]

  const response = await groqChat(messages, { temperature: 0.8 })
  
  try {
    return JSON.parse(response)
  } catch {
    // Fallback if JSON parsing fails
    return {
      headline: `Transformez votre ${niche}`,
      subheadline: `La solution premium pour réussir`,
      cta: 'Commencer maintenant',
      benefits: ['Bénéfice 1', 'Bénéfice 2', 'Bénéfice 3'],
    }
  }
}
