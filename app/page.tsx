"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Icon, IconName } from "../components/Icon";
import { MarkdownMessage } from "../components/MarkdownMessage";
import { Attachment, ChatMode, Conversation, Message } from "../lib/types";

const STORAGE_KEY = "codabla-conversations-v2";
const MAX_FILE_SIZE = 120_000;
const MAX_FILES = 4;

const MODES: Array<{
  id: ChatMode;
  label: string;
  description: string;
  icon: IconName;
}> = [
  { id: "chat", label: "Chat", description: "Poser une question", icon: "message" },
  { id: "build", label: "Créer", description: "Construire du code", icon: "sparkles" },
  { id: "debug", label: "Debug", description: "Corriger un problème", icon: "bug" },
  { id: "explain", label: "Expliquer", description: "Comprendre du code", icon: "book" },
  { id: "improve", label: "Améliorer", description: "Optimiser un projet", icon: "wand" }
];

const STARTERS = [
  {
    mode: "build" as ChatMode,
    icon: "sparkles" as IconName,
    title: "Créer une interface",
    text: "Crée une page d'accueil moderne en HTML, CSS et JavaScript."
  },
  {
    mode: "debug" as ChatMode,
    icon: "bug" as IconName,
    title: "Corriger un bug",
    text: "Aide-moi à trouver et corriger le bug dans ce code."
  },
  {
    mode: "explain" as ChatMode,
    icon: "book" as IconName,
    title: "Comprendre du code",
    text: "Explique-moi simplement comment fonctionne ce code."
  },
  {
    mode: "improve" as ChatMode,
    icon: "wand" as IconName,
    title: "Améliorer un projet",
    text: "Analyse ce projet et propose des améliorations utiles sans le complexifier."
  }
];

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

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

function cleanTitle(value: string) {
  const title = value.replace(/\s+/g, " ").trim();
  return title.length > 42 ? title.slice(0, 42) + "…" : title || "Discussion";
}

function formatFileSize(size: number) {
  if (size < 1000) return `${size} o`;
  return `${Math.round(size / 1000)} Ko`;
}

function serializeMessage(message: Message) {
  let content = message.content;

  if (message.attachments?.length) {
    const files = message.attachments
      .filter((file) => file.content)
      .map(
        (file) =>
          `\n\n--- Fichier : ${file.name} ---\n${file.content}\n--- Fin du fichier ---`
      )
      .join("");

    content += files;
  }

  return { role: message.role, content };
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("chat");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const legacy = localStorage.getItem("codabla-conversations");

    for (const raw of [saved, legacy]) {
      if (!raw) continue;

      try {
        const parsed: Conversation[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
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

  useEffect(() => {
    function shortcuts(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSidebarOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 30);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        createChat();
      }

      if (event.key === "Escape") {
        setModeOpen(false);
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, []);

  const active = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId),
    [conversations, activeId]
  );

  const filteredConversations = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return conversations;

    return conversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(query)
    );
  }, [conversations, search]);

  const activeMode = MODES.find((item) => item.id === mode) || MODES[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
  }, [active?.messages, loading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = Math.min(textarea.scrollHeight, 190) + "px";
  }, [input]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1600);
  }

  function createChat() {
    if (loading) abortRef.current?.abort();

    const conversation = emptyConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setInput("");
    setAttachments([]);
    setMode("chat");
    setSearch("");
    setSidebarOpen(false);
    window.setTimeout(() => textareaRef.current?.focus(), 30);
  }

  function updateConversation(
    id: string,
    updater: (conversation: Conversation) => Conversation
  ) {
    setConversations((current) => {
      const updated = current.map((conversation) =>
        conversation.id === id ? updater(conversation) : conversation
      );

      return updated.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }

  function deleteConversation(id: string) {
    if (loading && id === activeId) abortRef.current?.abort();

    setConversations((current) => {
      const next = current.filter((conversation) => conversation.id !== id);

      if (!next.length) {
        const fresh = emptyConversation();
        setActiveId(fresh.id);
        return [fresh];
      }

      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  async function streamAnswer(
    conversationId: string,
    history: Message[],
    assistantId: string
  ) {
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode,
          messages: history.map(serializeMessage)
        })
      });

      if (!response.ok) {
        let error = "Une erreur est survenue.";

        try {
          const data = await response.json();
          error = data.error || error;
        } catch {}

        throw new Error(error);
      }

      if (!response.body) {
        throw new Error("La réponse de Codabla est vide.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        answer += decoder.decode(value, { stream: true });

        updateConversation(conversationId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === assistantId ? { ...message, content: answer } : message
          )
        }));
      }

      if (!answer.trim()) {
        throw new Error("Le modèle n'a renvoyé aucun texte.");
      }

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        updatedAt: Date.now()
      }));
    } catch (error) {
      if (controller.signal.aborted) return;

      const message = error instanceof Error ? error.message : "Erreur inconnue.";

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((item) =>
          item.id === assistantId
            ? { ...item, content: `**Erreur :** ${message}` }
            : item
        ),
        updatedAt: Date.now()
      }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }

  async function submit() {
    const text = input.trim();
    if ((!text && !attachments.length) || !active || loading) return;

    const userMessage: Message = {
      id: uid(),
      role: "user",
      content: text || "Analyse les fichiers joints.",
      attachments: attachments.length ? attachments : undefined
    };

    const assistantMessage: Message = {
      id: uid(),
      role: "assistant",
      content: ""
    };

    const history = [...active.messages, userMessage];
    const conversationId = active.id;

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title:
        conversation.messages.length === 0
          ? cleanTitle(text || attachments[0]?.name || "Discussion")
          : conversation.title,
      messages: [...history, assistantMessage],
      updatedAt: Date.now()
    }));

    setInput("");
    setAttachments([]);
    await streamAnswer(conversationId, history, assistantMessage.id);
  }

  async function regenerate() {
    if (!active || loading) return;

    const lastAssistant = [...active.messages]
      .map((message, index) => ({ message, index }))
      .reverse()
      .find(({ message }) => message.role === "assistant");

    if (!lastAssistant) return;

    const history = active.messages.slice(0, lastAssistant.index);
    if (!history.some((message) => message.role === "user")) return;

    const replacement: Message = {
      id: uid(),
      role: "assistant",
      content: ""
    };

    updateConversation(active.id, (conversation) => ({
      ...conversation,
      messages: [...history, replacement],
      updatedAt: Date.now()
    }));

    await streamAnswer(active.id, history, replacement.id);
  }

  function stopGeneration() {
    abortRef.current?.abort();
    setLoading(false);
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

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).slice(0, MAX_FILES);
    if (!files.length) return;

    const remaining = Math.max(0, MAX_FILES - attachments.length);
    const selected = files.slice(0, remaining);
    const next: Attachment[] = [];

    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        notify(`${file.name} est trop lourd (120 Ko max)`);
        continue;
      }

      try {
        const content = await file.text();
        next.push({ name: file.name, size: file.size, content });
      } catch {
        notify(`Impossible de lire ${file.name}`);
      }
    }

    setAttachments((current) => [...current, ...next].slice(0, MAX_FILES));
    event.target.value = "";
  }

  function removeAttachment(name: string) {
    setAttachments((current) => current.filter((file) => file.name !== name));
  }

  async function copyMessage(content: string) {
    await navigator.clipboard.writeText(content);
    notify("Réponse copiée");
  }

  function exportConversation() {
    if (!active || !active.messages.length) return;

    const content = [
      `# ${active.title}`,
      "",
      ...active.messages.flatMap((message) => [
        `## ${message.role === "assistant" ? "Codabla" : "Vous"}`,
        "",
        message.content,
        ...(message.attachments?.length
          ? ["", `Fichiers : ${message.attachments.map((file) => file.name).join(", ")}`]
          : []),
        ""
      ])
    ].join("\n");

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${active.title.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "codabla"}.md`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Discussion exportée");
  }

  function useStarter(item: (typeof STARTERS)[number]) {
    setMode(item.mode);
    setInput(item.text);
    window.setTimeout(() => textareaRef.current?.focus(), 20);
  }

  if (!ready) {
    return (
      <main className="loading-screen">
        <div className="loading-logo"><Icon name="code" size={24} /></div>
        <span>Codabla</span>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {toast && <div className="toast">{toast}</div>}

      <button
        className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Fermer le menu"
        type="button"
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-mark"><Icon name="code" size={17} /></div>
            <div className="brand-text">
              <strong>Codabla</strong>
              <span>Code assistant</span>
            </div>
          </div>

          <button className="new-chat-icon" onClick={createChat} type="button" title="Nouveau chat (Ctrl+J)">
            <Icon name="plus" size={18} />
          </button>
        </div>

        <button className="new-chat" onClick={createChat} type="button">
          <Icon name="plus" size={17} />
          <span>Nouveau chat</span>
          <kbd>Ctrl J</kbd>
        </button>

        <div className="sidebar-search">
          <Icon name="search" size={16} />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher"
          />
          <kbd>Ctrl K</kbd>
        </div>

        <div className="history">
          <div className="history-heading">
            <span>Discussions</span>
            <span>{conversations.length}</span>
          </div>

          {filteredConversations.length ? (
            filteredConversations.map((conversation) => (
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
                  <Icon name="message" size={15} />
                  <span>{conversation.title}</span>
                </button>

                <button
                  className="delete-chat"
                  onClick={() => deleteConversation(conversation.id)}
                  type="button"
                  aria-label="Supprimer la discussion"
                  title="Supprimer"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-history">Aucune discussion trouvée</div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <div>
            <strong>Nemotron 3 Ultra</strong>
            <span>via OpenRouter</span>
          </div>
        </div>
      </aside>

      <section className="chat">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Ouvrir le menu"
            >
              <Icon name="menu" size={20} />
            </button>

            <div className="chat-title">
              <strong>{active?.title || "Codabla"}</strong>
              <span>{activeMode.label}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="model-pill">
              <span className="live-dot" />
              Nemotron 3 Ultra
            </div>

            <button
              className="icon-button"
              type="button"
              onClick={exportConversation}
              disabled={!active?.messages.length}
              title="Exporter la discussion"
            >
              <Icon name="download" size={18} />
            </button>
          </div>
        </header>

        <div className="messages">
          {!active?.messages.length ? (
            <div className="welcome">
              <div className="welcome-logo">
                <Icon name="code" size={27} />
              </div>

              <div className="welcome-copy">
                <span className="eyebrow">CODABLA</span>
                <h1>Qu’est-ce qu’on code ?</h1>
                <p>
                  Une IA pensée pour créer, comprendre, corriger et améliorer tes projets.
                </p>
              </div>

              <div className="starter-grid">
                {STARTERS.map((item) => (
                  <button
                    key={item.title}
                    className="starter-card"
                    onClick={() => useStarter(item)}
                    type="button"
                  >
                    <div className="starter-icon"><Icon name={item.icon} size={18} /></div>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.text}</span>
                    </div>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {active.messages.map((message, index) => (
                <article key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === "assistant" ? <Icon name="code" size={17} /> : "G"}
                  </div>

                  <div className="message-body">
                    <div className="message-head">
                      <span>{message.role === "assistant" ? "Codabla" : "Vous"}</span>

                      {message.role === "assistant" && message.content && (
                        <div className="message-actions">
                          <button
                            type="button"
                            onClick={() => copyMessage(message.content)}
                            title="Copier"
                          >
                            <Icon name="copy" size={14} />
                          </button>

                          {index === active.messages.length - 1 && !loading && (
                            <button type="button" onClick={regenerate} title="Régénérer">
                              <Icon name="refresh" size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {message.attachments?.length ? (
                      <div className="message-files">
                        {message.attachments.map((file) => (
                          <span key={file.name}>
                            <Icon name="code" size={13} />
                            {file.name}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className={`message-content ${!message.content ? "streaming" : ""}`}>
                      {message.content ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <div className="typing-line">
                          <i /><i /><i />
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          <div className="composer-shell">
            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map((file) => (
                  <div className="attachment-chip" key={file.name}>
                    <div className="attachment-icon">
                      <Icon name="code" size={15} />
                    </div>
                    <div>
                      <strong>{file.name}</strong>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.name)}
                      aria-label={`Retirer ${file.name}`}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Demander à Codabla…"
                rows={1}
                disabled={loading}
              />

              <div className="composer-bar">
                <div className="composer-tools">
                  <input
                    ref={fileRef}
                    className="file-input"
                    type="file"
                    multiple
                    onChange={addFiles}
                    accept=".txt,.md,.html,.css,.js,.jsx,.ts,.tsx,.json,.py,.java,.c,.cpp,.h,.sql,.xml,.yml,.yaml,.env,.gitignore"
                  />

                  <button
                    type="button"
                    className="tool-button"
                    onClick={() => fileRef.current?.click()}
                    disabled={loading || attachments.length >= MAX_FILES}
                    title="Ajouter des fichiers"
                  >
                    <Icon name="paperclip" size={18} />
                  </button>

                  <div className="mode-picker">
                    <button
                      type="button"
                      className="mode-button"
                      onClick={() => setModeOpen((value) => !value)}
                      disabled={loading}
                    >
                      <Icon name={activeMode.icon} size={16} />
                      <span>{activeMode.label}</span>
                      <Icon name="chevron" size={13} />
                    </button>

                    {modeOpen && (
                      <div className="mode-menu">
                        {MODES.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={item.id === mode ? "selected" : ""}
                            onClick={() => {
                              setMode(item.id);
                              setModeOpen(false);
                            }}
                          >
                            <div className="mode-menu-icon">
                              <Icon name={item.icon} size={17} />
                            </div>
                            <div>
                              <strong>{item.label}</strong>
                              <span>{item.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {loading ? (
                  <button
                    className="send-button stop"
                    type="button"
                    onClick={stopGeneration}
                    aria-label="Arrêter"
                    title="Arrêter la génération"
                  >
                    <Icon name="stop" size={18} />
                  </button>
                ) : (
                  <button
                    className="send-button"
                    type="submit"
                    disabled={!input.trim() && !attachments.length}
                    aria-label="Envoyer"
                  >
                    <Icon name="send" size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>

          <p className="notice">
            Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne · Codabla peut faire des erreurs.
          </p>
        </div>
      </section>
    </main>
  );
}
