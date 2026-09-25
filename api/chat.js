const MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";

function stripFence(value) {
  return value
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "OPENROUTER_API_KEY n'est pas configurée sur Vercel."
    });
  }

  const { mode = "chat", prompt = "", files = {}, activeFile = "" } = req.body || {};

  const system = `Tu es Codabla AI, un assistant développeur intégré dans un IDE.
Tu es spécialisé en HTML, CSS, JavaScript, TypeScript, React, Node.js et architecture web.
Réponds de façon concise et pratique.

Quand l'utilisateur demande de créer, modifier, corriger, refactorer ou ajouter une fonctionnalité au projet, réponds UNIQUEMENT avec un JSON valide de cette forme:
{
  "answer": "courte explication",
  "files": {
    "chemin/fichier.ext": "contenu complet du fichier"
  }
}

Quand aucune modification de fichier n'est nécessaire:
{
  "answer": "réponse utile",
  "files": {}
}

Ne mets jamais le JSON dans des balises markdown.
Tu peux créer plusieurs fichiers.
Ne supprime pas les fichiers non concernés.
Le mode actuel est: ${mode}.`;

  const projectContext = Object.entries(files)
    .map(([path, content]) => `--- ${path} ---\n${String(content).slice(0, 12000)}`)
    .join("\n\n");

  const user = `Fichier actif: ${activeFile || "aucun"}\n\nProjet:\n${projectContext}\n\nDemande:\n${prompt}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://codabla.horibli.com",
        "X-Title": "Codabla"
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Erreur OpenRouter."
      });
    }

    const raw = data?.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(stripFence(raw));
      return res.status(200).json({
        answer: parsed.answer || "",
        files: parsed.files || {}
      });
    } catch {
      return res.status(200).json({ answer: raw, files: {} });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur serveur." });
  }
}
