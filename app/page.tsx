"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const STORAGE_KEY = "codabla-conversations";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function emptyConversation(): Conversation {
  return {
    id: uid(),
    title: "Nouvelle discussion",
    messages: [],
    updatedAt: Date.now()
  };
}

function Icon({ name }: { name: "plus" | "menu" | "send" | "copy" | "trash" | "code" }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></>,
    code: <path d="m9 18-6-6 6-6M15 6l6 6-6 6M14 4l-4 16" />
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function CodeBlock({ children, language }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="code-block">
      <div className="code-head">
        <span>{language || "code"}</span>
        <button onClick={copy} type="button">
          <Icon name="copy" />
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const value = String(children).replace(/\n$/, "");
          const match = /language-(\w+)/.exec(className || "");

          if (className) {
            return <CodeBlock language={match?.[1]}>{value}</CodeBlock>;
          }

          return <code className="inline-code">{children}</code>;
        },
        a({ children, href }) {
          return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed: Conversation[] = JSON.parse(saved);
        if (parsed.length) {
          setConversations(parsed);
          setActiveId(parsed[0].id);
          setReady(true);
          return;
        }
      } catch {}
    }

    const first = emptyConversation();
    setConversations([first]);
    setActiveId(first.id);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations, ready]);

  const active = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId),
    [conversations, activeId]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, loading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
  }, [input]);

  function newChat() {
    const conversation = emptyConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setInput("");
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }

  function deleteConversation(id: string) {
    setConversations((current) => {
      const next = current.filter((conversation) => conversation.id !== id);

      if (!next.length) {
        const fresh = emptyConversation();
        setActiveId(fresh.id);
        return [fresh];
      }

      if (id === activeId) {
        setActiveId(next[0].id);
      }

      return next;
    });
  }

  function updateConversation(id: string, updater: (conversation: Conversation) => Conversation) {
    setConversations((current) => {
      const updated = current.map((conversation) =>
        conversation.id === id ? updater(conversation) : conversation
      );

      return updated.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }

  async function submit() {
    const text = input.trim();
    if (!text || !active || loading) return;

    const userMessage: Message = {
      id: uid(),
      role: "user",
      content: text
    };

    const currentId = active.id;
    const history = [...active.messages, userMessage];

    updateConversation(currentId, (conversation) => ({
      ...conversation,
      title: conversation.messages.length === 0 ? text.slice(0, 38) : conversation.title,
      messages: history,
      updatedAt: Date.now()
    }));

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      const assistantMessage: Message = {
        id: uid(),
        role: "assistant",
        content: data.content
      };

      updateConversation(currentId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, assistantMessage],
        updatedAt: Date.now()
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue.";

      updateConversation(currentId, (conversation) => ({
        ...conversation,
        messages: [
          ...conversation.messages,
          {
            id: uid(),
            role: "assistant",
            content: `**Erreur :** ${message}`
          }
        ],
        updatedAt: Date.now()
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  if (!ready) {
    return <main className="loading-screen">Codabla</main>;
  }

  return (
    <main className="app-shell">
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark"><Icon name="code" /></div>
            <span>Codabla</span>
          </div>

          <button className="new-chat" onClick={newChat} type="button">
            <Icon name="plus" />
            Nouveau chat
          </button>
        </div>

        <div className="history">
          <p className="history-label">Discussions</p>

          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`history-row ${conversation.id === activeId ? "active" : ""}`}
            >
              <button
                className="history-item"
                onClick={() => {
                  setActiveId(conversation.id);
                  setSidebarOpen(false);
                }}
                type="button"
              >
                <span>{conversation.title}</span>
              </button>

              <button
                className="delete-chat"
                onClick={() => deleteConversation(conversation.id)}
                type="button"
                aria-label="Supprimer la discussion"
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="avatar">G</div>
          <div>
            <strong>Codabla</strong>
            <span>Assistant de code</span>
          </div>
        </div>
      </aside>

      <section className="chat">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            type="button"
            aria-label="Ouvrir le menu"
          >
            <Icon name="menu" />
          </button>

          <span className="mobile-brand">Codabla</span>
          <div className="model-pill">Codabla Code</div>
        </header>

        <div className="messages">
          {!active?.messages.length ? (
            <div className="welcome">
              <div className="welcome-logo"><Icon name="code" /></div>
              <h1>Que veux-tu coder ?</h1>
              <p>Crée, corrige, explique ou améliore ton code avec Codabla.</p>

              <div className="suggestions">
                <button onClick={() => setInput("Crée-moi une page d'accueil moderne en HTML et CSS")} type="button">
                  <strong>Créer une interface</strong>
                  <span>Une page moderne en HTML et CSS</span>
                </button>
                <button onClick={() => setInput("Aide-moi à trouver l'erreur dans mon code JavaScript")} type="button">
                  <strong>Corriger un bug</strong>
                  <span>Analyser une erreur dans du code</span>
                </button>
                <button onClick={() => setInput("Explique-moi simplement comment fonctionne une API")} type="button">
                  <strong>Expliquer du code</strong>
                  <span>Comprendre une notion simplement</span>
                </button>
                <button onClick={() => setInput("Aide-moi à organiser les fichiers de mon projet web")} type="button">
                  <strong>Structurer un projet</strong>
                  <span>Organiser proprement les fichiers</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="message-list">
              {active.messages.map((message) => (
                <article key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === "assistant" ? <Icon name="code" /> : "G"}
                  </div>
                  <div className="message-body">
                    <div className="message-name">
                      {message.role === "assistant" ? "Codabla" : "Vous"}
                    </div>
                    <div className="message-content">
                      <MessageContent content={message.content} />
                    </div>
                  </div>
                </article>
              ))}

              {loading && (
                <article className="message assistant">
                  <div className="message-avatar"><Icon name="code" /></div>
                  <div className="message-body">
                    <div className="message-name">Codabla</div>
                    <div className="thinking"><i /><i /><i /></div>
                  </div>
                </article>
              )}

              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Demander à Codabla..."
              rows={1}
              disabled={loading}
            />
            <button
              className="send-button"
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Envoyer"
            >
              <Icon name="send" />
            </button>
          </form>
          <p className="notice">Codabla peut faire des erreurs. Vérifie le code important.</p>
        </div>
      </section>
    </main>
  );
}
