// ============================================================
//  IMAGE ENGINE — NyXia
//  Approche hybride :
//  • Cloudflare AI (gratuit, 10k images/jour) → images basiques
//  • Prompts optimisés Midjourney/Leonardo → demandes complexes
//
//  Types gérés :
//  • person      — coach, thérapeute, entrepreneur, portrait
//  • product     — mockup, boîte, ebook, application
//  • background  — fond, texture, dégradé, ambiance
//  • illustration — icône, illustration vectorielle, schéma
//  • banner      — header, bannière, hero section
// ============================================================

// ══════════════════════════════════════════════════════════
//  CLASSIFICATION AUTOMATIQUE DE LA DEMANDE
// ══════════════════════════════════════════════════════════

const TYPE_KEYWORDS = {
  person:       ["coach", "coaching", "thérapeute", "thérapeute", "personne", "portrait", "photo", "femme", "homme", "entrepreneur", "auteur", "formateur", "visage", "sourire", "professionnel"],
  product:      ["produit", "mockup", "livre", "ebook", "boîte", "application", "app", "logiciel", "formation", "cours", "programme", "packshot", "3d"],
  background:   ["fond", "background", "texture", "dégradé", "ambiance", "atmosphère", "abstrait", "pattern", "décor", "arrière-plan", "paysage", "nature"],
  illustration: ["illustration", "icône", "icon", "schéma", "graphique", "infographie", "vectoriel", "logo", "symbole", "dessin", "cartoon"],
  banner:       ["bannière", "banner", "header", "hero", "couverture", "entête", "bande", "titre"],
};

export function classifyImageRequest(description) {
  const lower = description.toLowerCase();
  const scores = {};

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    scores[type] = keywords.filter(k => lower.includes(k)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "background"; // Défaut : fond
}

// ══════════════════════════════════════════════════════════
//  DÉCISION : CF AI vs PROMPT MIDJOURNEY
//
//  CF AI pour :    fonds, textures, banners, illustrations simples
//  Midjourney pour : personnes (photos réalistes), mockups 3D complexes
// ══════════════════════════════════════════════════════════

export function shouldUseCfAI(imageType) {
  return ["background", "banner", "illustration"].includes(imageType);
}

// ══════════════════════════════════════════════════════════
//  CLOUDFLARE AI — Génération directe
//  Modèle : @cf/stabilityai/stable-diffusion-xl-base-1.0
//  Gratuit jusqu'à 10 000 images/jour
// ══════════════════════════════════════════════════════════

const CF_AI_STYLES = {
  background:   "seamless background texture, abstract, professional, high quality, 4k",
  banner:       "wide banner image, professional, modern design, clean composition, high quality",
  illustration: "flat design illustration, clean vector style, professional, minimal, colorful",
  product:      "product mockup, clean background, professional photography, studio lighting",
  person:       "professional portrait, natural lighting, friendly expression, high quality photo",
};

/**
 * Génère une image via Cloudflare AI Workers
 * env.AI doit être bindé dans wrangler.toml
 */
export async function generateWithCfAI(env, options) {
  const {
    description,
    imageType  = "background",
    palette,
    width      = 1024,
    height     = 576,
    steps      = 20,
  } = options;

  if (!env.AI) throw new Error("Binding AI manquant — ajoute [ai] dans wrangler.toml");

  const paletteHint = palette ? buildPaletteHint(palette) : "";
  const styleHint   = CF_AI_STYLES[imageType] || CF_AI_STYLES.background;
  const prompt      = `${description}, ${styleHint}${paletteHint}, no text, no watermark`;
  const negPrompt   = "text, watermark, blurry, low quality, distorted, ugly, bad anatomy, signature, frame, border";

  try {
    const response = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt,
      negative_prompt: negPrompt,
      width,
      height,
      num_inference_steps: steps,
      guidance: 7.5,
    });

    // CF AI retourne un ReadableStream ou Uint8Array
    let imageData;
    if (response instanceof ReadableStream) {
      const reader   = response.getReader();
      const chunks   = [];
      let   done     = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (value) chunks.push(value);
        done = d;
      }
      imageData = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) { imageData.set(chunk, offset); offset += chunk.length; }
    } else {
      imageData = response;
    }

    // Convertit en base64 pour l'API
    const base64 = btoa(String.fromCharCode(...imageData));

    return {
      success:    true,
      method:     "cloudflare_ai",
      base64,
      dataUrl:    `data:image/png;base64,${base64}`,
      prompt,
      imageType,
      dimensions: { width, height },
    };
  } catch(err) {
    return { success:false, method:"cloudflare_ai", error:err.message, prompt };
  }
}

// ══════════════════════════════════════════════════════════
//  GÉNÉRATEUR DE PROMPTS MIDJOURNEY / LEONARDO
//  Pour les demandes complexes (personnes, mockups 3D)
// ══════════════════════════════════════════════════════════

const PROMPT_TEMPLATES = {

  person: {
    base: "professional {gender} {role}, {age_range}, {expression}, {style} photography",
    styles: {
      chaud:       "warm studio lighting, soft bokeh background, golden hour, lifestyle",
      professionnel:"clean white background, corporate headshot, bright lighting, sharp",
      naturel:     "natural outdoor lighting, candid, authentic, environmental portrait",
      editorial:   "editorial magazine style, dynamic lighting, high fashion feel",
    },
    suffixes: "--ar 4:5 --v 6.1 --style raw --q 2",
    negative: "ugly, deformed, cartoon, anime, watermark, text, logo",
  },

  product: {
    base: "{product_type} product mockup, {material}, professional studio",
    styles: {
      minimal:   "clean white background, minimalist, Apple-style product photography",
      lifestyle: "lifestyle context, real environment, natural lighting, in-use",
      "3d":      "3D rendered, photorealistic, dramatic lighting, floating on gradient",
      flat:      "flat lay, overhead view, clean background, styled composition",
    },
    suffixes: "--ar 1:1 --v 6.1 --q 2",
    negative: "blurry, text, watermark, bad quality, distorted",
  },

  background: {
    base: "{theme} background, {mood}, abstract, high resolution",
    styles: {
      gradient:   "smooth color gradient, modern, professional, digital art",
      geometric:  "geometric patterns, clean lines, professional, minimal",
      organic:    "organic flowing shapes, soft colors, dreamy, ethereal",
      dark:       "dark luxury background, deep colors, premium feel, mysterious",
    },
    suffixes: "--ar 16:9 --v 6.1 --tile",
    negative: "text, watermark, logo, faces, people",
  },

  banner: {
    base: "wide horizontal banner, {theme}, {mood}, professional design",
    styles: {
      hero:      "hero section background, light and airy, website header, clean",
      dark:      "dark premium banner, dramatic lighting, luxury feel",
      nature:    "nature-inspired banner, serene, wellness, soft greens and blues",
      tech:      "technology banner, digital, blue tones, futuristic, clean",
    },
    suffixes: "--ar 3:1 --v 6.1 --q 2",
    negative: "text, watermark, cluttered, busy",
  },

  illustration: {
    base: "{subject} flat illustration, vector style, {color_scheme}",
    styles: {
      flat:    "flat design, clean lines, minimal shadows, 2D, modern app style",
      outline: "outline style, thin strokes, geometric, icon-like, scalable",
      isometric:"isometric illustration, 3D flat, business concept, clean",
      character:"character illustration, friendly, approachable, cartoon style",
    },
    suffixes: "--ar 1:1 --v 6.1 --style raw",
    negative: "realistic, photo, 3D render, blurry",
  },
};

/**
 * Génère un prompt optimisé pour Midjourney ou Leonardo.ai
 * Retourne le prompt ET des suggestions de paramètres
 */
export function generateMidjourneyPrompt(options) {
  const {
    description,
    imageType   = "person",
    style,
    palette,
    platform    = "midjourney", // midjourney | leonardo | dalle3
    gender      = "woman",
    role        = "coach",
    ageRange    = "30-40 years old",
    expression  = "confident and warm smile",
  } = options;

  const tpl      = PROMPT_TEMPLATES[imageType] || PROMPT_TEMPLATES.background;
  const styles   = tpl.styles;
  const styleName = style && styles[style] ? style : Object.keys(styles)[0];
  const styleDesc = styles[styleName];

  const paletteDesc = palette ? buildPaletteDesc(palette) : "";

  // Construit le prompt selon le type
  let mainPrompt = description;

  if (imageType === "person") {
    mainPrompt = `${styleDesc} portrait, ${gender} ${role}, ${ageRange}, ${expression}, ${description}`;
  } else if (imageType === "product") {
    mainPrompt = `${description}, ${styleDesc}, product photography, commercial quality`;
  } else if (imageType === "background" || imageType === "banner") {
    mainPrompt = `${description}, ${styleDesc}${paletteDesc}`;
  } else if (imageType === "illustration") {
    mainPrompt = `${description}, ${styleDesc}${paletteDesc}`;
  }

  // Paramètres selon la plateforme
  let finalPrompt, instructions;

  if (platform === "midjourney") {
    const neg = tpl.negative ? `\n\n--no ${tpl.negative}` : "";
    finalPrompt = `${mainPrompt}, highly detailed, professional quality${neg}\n\n${tpl.suffixes}`;
    instructions = [
      "1. Va sur Discord → Midjourney",
      "2. Tape /imagine dans n'importe quel canal",
      `3. Colle ce prompt : ${mainPrompt}`,
      `4. Paramètres : ${tpl.suffixes}`,
      "5. Attends ~60 secondes pour les 4 variations",
      "6. Clique sur U1-U4 pour upscaler la meilleure",
    ];
  } else if (platform === "leonardo") {
    finalPrompt = `${mainPrompt}, highly detailed, professional quality`;
    instructions = [
      "1. Va sur leonardo.ai → Image Generation",
      "2. Sélectionne le modèle : Leonardo Kino XL ou Leonardo Diffusion XL",
      `3. Colle le prompt : ${finalPrompt}`,
      "4. Negative prompt : text, watermark, blurry, low quality",
      "5. Dimensions recommandées : 1024×1024 ou 1366×768",
      "6. Génère et sélectionne la meilleure variation",
    ];
  } else { // dalle3
    finalPrompt = `${mainPrompt}. High quality, professional, no text or watermarks.`;
    instructions = [
      "1. Va sur chat.openai.com (GPT-4)",
      "2. Tape : /imagine ou demande une image",
      `3. Décris : "${finalPrompt}"`,
      "4. Spécifie le format si nécessaire (carré, paysage...)",
    ];
  }

  return {
    success:        true,
    method:         "prompt",
    platform,
    imageType,
    style:          styleName,
    prompt:         finalPrompt,
    mainPrompt,
    parameters:     tpl.suffixes,
    negativePrompt: tpl.negative,
    instructions,
    estimatedCost:  platform === "midjourney" ? "~0.02$" : platform === "leonardo" ? "~3 crédits" : "~0.04$",
    alternatives: Object.entries(styles)
      .filter(([k]) => k !== styleName)
      .map(([k, v]) => ({ style:k, hint:v.split(",")[0] })),
  };
}

// ══════════════════════════════════════════════════════════
//  PLACEHOLDERS INTELLIGENTS (SVG inline)
//  Pour les sites générés quand aucune image n'est dispo
// ══════════════════════════════════════════════════════════

export function generatePlaceholder(options) {
  const {
    type    = "banner",
    label   = "",
    palette = "violet",
    width   = 1200,
    height  = 600,
    text    = "",
  } = options;

  const colors = {
    violet:  { bg:"#ede9fe", accent:"#7c3aed", text2:"#5b21b6" },
    emeraude:{ bg:"#d1fae5", accent:"#059669", text2:"#065f46" },
    corail:  { bg:"#ffedd5", accent:"#f97316", text2:"#9a3412" },
    ardoise: { bg:"#f1f5f9", accent:"#334155", text2:"#0f172a" },
    rose:    { bg:"#ffe4e6", accent:"#e11d48", text2:"#9f1239" },
    ocean:   { bg:"#e0f2fe", accent:"#0ea5e9", text2:"#075985" },
    sombre:  { bg:"#1e1b4b", accent:"#a78bfa", text2:"#c4b5fd" },
  };

  const c   = colors[palette] || colors.violet;
  const ico = { person:"👤", product:"📦", background:"🖼️", banner:"🎨", illustration:"✦" }[type] || "🖼️";

  // Patterns selon le type
  const patterns = {
    person: `<circle cx="${width/2}" cy="${height*0.35}" r="${height*0.18}" fill="${c.accent}" opacity=".15"/>
             <circle cx="${width/2}" cy="${height*0.35}" r="${height*0.11}" fill="${c.accent}" opacity=".25"/>
             <text x="${width/2}" y="${height*0.37}" text-anchor="middle" font-size="${height*0.14}" fill="${c.accent}">👤</text>
             <rect x="${width*0.3}" y="${height*0.62}" width="${width*0.4}" height="${height*0.06}" rx="4" fill="${c.accent}" opacity=".15"/>`,

    product:`<rect x="${width*0.3}" y="${height*0.15}" width="${width*0.4}" height="${height*0.55}" rx="12" fill="${c.accent}" opacity=".1" transform="rotate(-5,${width/2},${height/2})"/>
             <rect x="${width*0.32}" y="${height*0.12}" width="${width*0.4}" height="${height*0.55}" rx="12" fill="${c.accent}" opacity=".18"/>
             <text x="${width/2}" y="${height*0.47}" text-anchor="middle" font-size="${height*0.12}" fill="${c.accent}">📦</text>`,

    background:`${generatePatternSVG(width, height, c.accent)}`,

    banner:`<rect x="0" y="0" width="${width}" height="${height}" fill="${c.accent}" opacity=".05"/>
            ${generatePatternSVG(width, height, c.accent, 0.06)}
            <text x="${width/2}" y="${height*0.5}" text-anchor="middle" font-size="${height*0.1}" fill="${c.accent}" opacity=".4">✦</text>`,

    illustration:`<circle cx="${width/2}" cy="${height/2}" r="${height*0.28}" fill="${c.accent}" opacity=".08"/>
                  <circle cx="${width/2}" cy="${height/2}" r="${height*0.18}" fill="${c.accent}" opacity=".12"/>
                  <text x="${width/2}" y="${height*0.56}" text-anchor="middle" font-size="${height*0.18}" fill="${c.accent}" opacity=".5">✦</text>`,
  };

  const pattern = patterns[type] || patterns.background;
  const displayLabel = label || { person:"Photo de la personne", product:"Visuel produit", background:"Image de fond", banner:"Bannière / Header", illustration:"Illustration" }[type];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${c.bg}"/>
  ${pattern}
  <text x="${width/2}" y="${height*0.78}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.max(14, height*0.04)}" font-weight="600" fill="${c.text2}" opacity=".6">${displayLabel}</text>
  ${text ? `<text x="${width/2}" y="${height*0.88}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.max(12, height*0.028)}" fill="${c.text2}" opacity=".4">${text}</text>` : ""}
</svg>`;
}

function generatePatternSVG(width, height, color, opacity = 0.05) {
  const dots = [];
  const spacing = Math.min(width, height) / 8;
  for (let x = spacing; x < width; x += spacing) {
    for (let y = spacing; y < height; y += spacing) {
      dots.push(`<circle cx="${x}" cy="${y}" r="2" fill="${color}" opacity="${opacity}"/>`);
    }
  }
  return dots.join("");
}

// ══════════════════════════════════════════════════════════
//  PIPELINE PRINCIPAL
//  Décide automatiquement : CF AI ou prompt Midjourney
// ══════════════════════════════════════════════════════════

export async function processImageRequest(env, options) {
  const {
    description,
    imageType:   forcedType,
    palette      = "violet",
    platform     = "midjourney",
    style,
    gender,
    role,
    returnPromptOnly = false,
  } = options;

  // Auto-classification si le type n'est pas forcé
  const imageType = forcedType || classifyImageRequest(description);
  const useCfAI   = !returnPromptOnly && shouldUseCfAI(imageType) && !!env?.AI;

  if (useCfAI) {
    // Génération directe via Cloudflare AI
    const result = await generateWithCfAI(env, {
      description,
      imageType,
      palette,
      width:  imageType === "banner" ? 1366 : imageType === "person" ? 512 : 1024,
      height: imageType === "banner" ? 456  : imageType === "person" ? 640 : 1024,
    });

    if (result.success) return result;

    // Fallback vers prompt si CF AI échoue
    console.warn("CF AI échoué, fallback vers prompt:", result.error);
  }

  // Génération du prompt Midjourney/Leonardo
  const promptResult = generateMidjourneyPrompt({
    description,
    imageType,
    style,
    palette,
    platform,
    gender,
    role,
  });

  // Génère aussi un placeholder SVG
  const placeholder = generatePlaceholder({ type:imageType, palette, label:description.slice(0,40) });

  return {
    ...promptResult,
    placeholder,
    placeholderDataUrl: `data:image/svg+xml;base64,${btoa(placeholder)}`,
  };
}

// ── Helpers ───────────────────────────────────────────────

function buildPaletteHint(palette) {
  const hints = {
    violet:   ", purple and violet color palette",
    emeraude: ", green and teal color palette",
    corail:   ", orange and coral color palette",
    ardoise:  ", slate blue and grey color palette",
    rose:     ", rose and pink color palette",
    ocean:    ", ocean blue and cyan color palette",
    sombre:   ", dark mysterious atmosphere, deep purple tones",
  };
  return hints[palette] || "";
}

function buildPaletteDesc(palette) {
  const descs = {
    violet:   ", purple violet tones, #7c3aed accent color",
    emeraude: ", emerald green tones, #059669 accent color",
    corail:   ", coral orange tones, #f97316 accent color",
    ardoise:  ", slate blue grey tones, #334155 accent color",
    rose:     ", rose pink tones, #e11d48 accent color",
    ocean:    ", ocean blue tones, #0ea5e9 accent color",
    sombre:   ", dark background, purple glow, #a78bfa accent",
  };
  return descs[palette] || "";
}
