// ============================================================
//  SERVEUR — NyXia Phase 2
// ============================================================

import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { chat } from "./agent.js";
import { PROJECTS } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "../public")));

// ── Chat ──────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: "messages[] requis" });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "GROQ_API_KEY manquante dans .env" });

  try {
    const result = await chat(messages);
    res.json(result);
  } catch (err) {
    console.error("❌ Erreur agent :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Status enrichi ────────────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json({
    status:     "ok",
    groq:       !!process.env.GROQ_API_KEY,
    github:     !!process.env.GITHUB_TOKEN,
    cloudflare: !!(process.env.CF_API_TOKEN && process.env.CF_ACCOUNT_ID),
    projects:   Object.keys(PROJECTS),
  });
});

// ── Démarrage ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   NyXia — Agent IA Publication-Web  ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`\n→ http://localhost:${PORT}\n`);
  console.log("Tokens :");
  console.log(`  GROQ       ${process.env.GROQ_API_KEY       ? "✅" : "❌ MANQUANT"}`);
  console.log(`  GitHub     ${process.env.GITHUB_TOKEN        ? "✅" : "❌ MANQUANT"}`);
  console.log(`  Cloudflare ${process.env.CF_API_TOKEN        ? "✅" : "❌ MANQUANT"}`);
  console.log(`  CF Account ${process.env.CF_ACCOUNT_ID       ? "✅" : "❌ MANQUANT"}`);
  console.log("\nProjets connus :");
  Object.entries(PROJECTS).forEach(([k, p]) =>
    console.log(`  • ${p.label} (${k}) → ${p.github.owner}/${p.github.repo}`)
  );
  console.log("");
});
