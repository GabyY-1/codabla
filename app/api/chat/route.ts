import { NextRequest } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const BASE_PROMPT = `Tu es Codabla, une IA spécialisée dans le développement logiciel.

Tu aides à concevoir, écrire, corriger, expliquer et améliorer du code.

Principes :
- produis du code propre, naturel, simple et directement utilisable ;
- évite les commentaires inutiles et les formulations artificielles ;
- respecte la stack et les contraintes données par l'utilisateur ;
- lorsque plusieurs fichiers sont nécessaires, indique clairement le chemin de chaque fichier ;
- explique précisément les bugs et propose une correction concrète ;
- ne prétends jamais avoir exécuté, testé ou vérifié un code si ce n'est pas réellement le cas ;
- privilégie une solution fiable et simple avant une architecture plus complexe ;
- pour une modification de code, conserve ce qui fonctionne déjà et change seulement ce qui est utile ;
- utilise Markdown et des blocs de code avec le bon langage ;
- réponds en français sauf demande contraire.`;

const MODE_PROMPTS: Record<string, string> = {
  build: "Mode CRÉER : produis une solution complète et directement exploitable. Si plusieurs fichiers sont nécessaires, structure clairement la réponse.",
  debug: "Mode DEBUG : cherche la cause probable du problème, explique-la brièvement puis donne la correction exacte. Ne réécris pas inutilement tout le projet.",
  explain: "Mode EXPLIQUER : enseigne de façon claire, progressive et concrète, avec de petits exemples quand ils sont utiles.",
  improve: "Mode AMÉLIORER : conserve le comportement existant, améliore qualité, UX, lisibilité, performances et robustesse sans complexifier gratuitement.",
  chat: "Mode CHAT : réponds normalement comme assistant de programmation."
};

function validMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") return false;
      const message = item as Partial<ChatMessage>;
      return (
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    })
    .slice(-40)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 60000)
    }));
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json(
        { error: "OPENROUTER_API_KEY n'est pas configurée sur le serveur." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = validMessages(body.messages);
    const mode = typeof body.mode === "string" ? body.mode : "chat";

    if (!messages.length) {
      return Response.json({ error: "Aucun message valide reçu." }, { status: 400 });
    }

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://codabla.horibli.com",
        "X-Title": "Codabla"
      },
      body: JSON.stringify({
        model:
          process.env.OPENROUTER_MODEL ||
          "nvidia/nemotron-3-ultra-550b-a55b:free",
        stream: true,
        messages: [
          {
            role: "system",
            content: `${BASE_PROMPT}\n\n${MODE_PROMPTS[mode] || MODE_PROMPTS.chat}`
          },
          ...messages
        ]
      })
    });

    if (!upstream.ok || !upstream.body) {
      let message = "Le fournisseur IA a renvoyé une erreur.";

      try {
        const data = await upstream.json();
        message = data?.error?.message || message;
      } catch {}

      return Response.json({ error: message }, { status: upstream.status || 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith("data:")) continue;

              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;

              try {
                const data = JSON.parse(payload);
                const content = data?.choices?.[0]?.delta?.content;

                if (typeof content === "string" && content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {}
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return Response.json(
      { error: "Impossible de traiter la requête." },
      { status: 500 }
    );
  }
}
