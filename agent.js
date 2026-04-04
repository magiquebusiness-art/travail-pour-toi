// ============================================================
//  AGENT — NyXia · Phase 2
//  Groq LLM + tools GitHub/Cloudflare + conscience des projets
// ============================================================

import Groq from "groq-sdk";
import { tools, executeTool } from "./tools.js";
import { projectsSummary } from "./config.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt() {
  return `Tu es NyXia, une agente IA programmeuse d'élite au service exclusif de Publication-Web.
Tu as une personnalité professionnelle, précise et légèrement mystérieuse — efficace et directe, mais toujours bienveillante.

═══ TES PROJETS ═══
${projectsSummary()}

═══ TES CAPACITÉS ═══
1. Générer du code JavaScript, Node.js et PHP de qualité production, commenté et lisible
2. Lire, créer et modifier des fichiers dans les repos GitHub
3. Créer et gérer des branches Git, préparer des commits clairs
4. Déployer des Cloudflare Workers (fonctions serverless)
5. Déployer sur Cloudflare Pages (sites statiques/frontend)
6. Lire et écrire dans Cloudflare KV (base de données clé-valeur)
7. Accepter un nouveau projet à la volée via set_active_project

═══ TES RÈGLES ═══
- Tu réponds TOUJOURS en français, avec élégance et précision
- Tu identifies le projet concerné avant d'agir
- Avant toute action IRRÉVERSIBLE (écraser un fichier, déployer en prod, supprimer), tu demandes confirmation
- Tu expliques brièvement CE QUE tu vas faire avant de le faire
- Tu génères du code propre, commenté, prêt pour la production
- Si une info manque, tu demandes avant d'agir
- Tu signales les erreurs et proposes des solutions
- Quand tu crées du code, tu précises dans quel fichier il doit aller`;
}

export async function chat(messages) {
  const systemPrompt = buildSystemPrompt();

  const response = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages:    [{ role: "system", content: systemPrompt }, ...messages],
    tools,
    tool_choice: "auto",
    max_tokens:  4096,
    temperature: 0.25,
  });

  const message = response.choices[0].message;

  if (!message.tool_calls || message.tool_calls.length === 0) {
    return { role: "assistant", content: message.content, toolResults: [] };
  }

  const toolResults = [];

  for (const tc of message.tool_calls) {
    const name = tc.function.name;
    const args = JSON.parse(tc.function.arguments);
    console.log(`\n⚡ NyXia → ${name}\n   ${JSON.stringify(args)}`);
    const result = await executeTool(name, args);
    toolResults.push({ toolName: name, toolArgs: args, result });
    console.log(`   → ${result.success ? "✓" : "✗ " + result.error}`);
  }

  const toolMessages = message.tool_calls.map((tc, i) => ({
    role:         "tool",
    tool_call_id: tc.id,
    content:      JSON.stringify(toolResults[i].result),
  }));

  const finalResponse = await groq.chat.completions.create({
    model:    "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: systemPrompt }, ...messages, message, ...toolMessages],
    max_tokens:  4096,
    temperature: 0.25,
  });

  return {
    role:        "assistant",
    content:     finalResponse.choices[0].message.content,
    toolResults,
  };
}
