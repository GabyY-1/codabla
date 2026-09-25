import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `Tu es Codabla, une IA spécialisée dans le développement logiciel.

Tu aides principalement à écrire, corriger, expliquer et améliorer du code.
Tu peux travailler avec HTML, CSS, JavaScript, TypeScript, React, Next.js, Python, SQL, Git et d'autres technologies.

Règles :
- donne du code propre, simple et directement utilisable ;
- explique clairement les erreurs ;
- évite les commentaires inutiles ;
- n'invente pas qu'un code a été testé si ce n'est pas le cas ;
- lorsque plusieurs fichiers sont nécessaires, indique clairement leurs noms ;
- privilégie des solutions simples avant les architectures complexes ;
- réponds en français sauf si l'utilisateur demande une autre langue.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json(
        { error: "La variable OPENROUTER_API_KEY n'est pas configurée." },
        { status: 500 }
      );
    }

    if (!messages.length) {
      return Response.json({ error: "Aucun message reçu." }, { status: 400 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Codabla"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((message: { role: string; content: string }) => ({
            role: message.role,
            content: message.content
          }))
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || "Erreur du fournisseur IA." },
        { status: response.status }
      );
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json(
        { error: "L'IA n'a renvoyé aucune réponse." },
        { status: 502 }
      );
    }

    return Response.json({ content });
  } catch {
    return Response.json(
      { error: "Impossible de traiter la requête." },
      { status: 500 }
    );
  }
}
