import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Editor from "@monaco-editor/react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Code2,
  Eye,
  File,
  FileCode2,
  Folder,
  FolderOpen,
  Github,
  MessageSquareCode,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  X
} from "lucide-react";
import "./styles.css";

const STARTER_FILES = {
  "index.html": `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mon projet</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main>
    <span class="badge">Codabla</span>
    <h1>Ton projet commence ici.</h1>
    <p>Modifie le code et regarde le résultat en direct.</p>
    <button id="action">Tester</button>
  </main>
  <script src="script.js"></script>
</body>
</html>`,
  "style.css": `:root {
  font-family: Inter, system-ui, sans-serif;
  color: #f7f7f8;
  background: #0b0d10;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 20% 20%, #202b45 0, transparent 35%),
    #0b0d10;
}
main { width: min(720px, 90%); }
.badge {
  display: inline-flex;
  padding: 8px 12px;
  border: 1px solid #303741;
  border-radius: 999px;
}
h1 {
  margin: 22px 0 10px;
  font-size: clamp(42px, 8vw, 78px);
  line-height: .95;
}
p { color: #aeb6c2; font-size: 18px; }
button {
  margin-top: 18px;
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  background: #f4f6f8;
  color: #0b0d10;
  font-weight: 700;
  cursor: pointer;
}`,
  "script.js": `document.querySelector("#action")?.addEventListener("click", () => {
  alert("Ton projet fonctionne.");
});`
};

const languageMap = {
  html: "html",
  css: "css",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  md: "markdown"
};

function getLanguage(file) {
  const ext = file.split(".").pop()?.toLowerCase();
  return languageMap[ext] || "plaintext";
}

function buildPreview(files) {
  let html = files["index.html"] || "<h1>Aucun index.html</h1>";
  const css = files["style.css"] || "";
  const js = files["script.js"] || "";

  html = html
    .replace(/<link[^>]*href=["']style\.css["'][^>]*>/i, `<style>${css}</style>`)
    .replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/i, `<script>${js}<\/script>`);

  return html;
}

function Onboarding({ onCreate, onSkip }) {
  const [choice, setChoice] = useState("ai");
  const [name, setName] = useState("Nouveau projet");
  const [type, setType] = useState("Site web");
  const [description, setDescription] = useState("");
  const [stack, setStack] = useState("HTML, CSS et JavaScript");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (choice !== "ai") {
      onCreate(STARTER_FILES, name);
      return;
    }

    if (!description.trim()) {
      onCreate(STARTER_FILES, name);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          prompt: `Crée un projet nommé "${name}". Type: ${type}. Stack: ${stack}. Description: ${description}. Donne tous les fichiers nécessaires.`,
          files: {}
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      onCreate(Object.keys(data.files || {}).length ? data.files : STARTER_FILES, name);
    } catch {
      onCreate(STARTER_FILES, name);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding-glow" />
      <div className="onboarding-card">
        <div className="brand-mark"><Code2 size={24} /></div>
        <div className="eyebrow">CODABLA</div>
        <h1>Comment veux-tu commencer ?</h1>
        <p className="lead">Pars d'un projet vide, code avec un copilote ou laisse l'agent créer la première version.</p>

        <div className="choice-grid">
          {[
            ["manual", "Je code moi-même", "Un espace propre et vide."],
            ["copilot", "L'IA m'aide", "Suggestions, corrections et explications."],
            ["ai", "L'IA crée le projet", "Décris ton idée, Codabla construit la base."]
          ].map(([id, title, desc]) => (
            <button key={id} onClick={() => setChoice(id)} className={"choice " + (choice === id ? "selected" : "")}>
              {id === "ai" ? <Sparkles size={20} /> : id === "copilot" ? <Bot size={20} /> : <Code2 size={20} />}
              <strong>{title}</strong>
              <span>{desc}</span>
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            Nom du projet
            <input value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label>
            Type
            <select value={type} onChange={e => setType(e.target.value)}>
              <option>Site web</option>
              <option>Application web</option>
              <option>Landing page</option>
              <option>Dashboard</option>
            </select>
          </label>
        </div>

        {choice === "ai" && (
          <>
            <label>
              Technologie
              <select value={stack} onChange={e => setStack(e.target.value)}>
                <option>HTML, CSS et JavaScript</option>
                <option>React</option>
                <option>React + TypeScript</option>
              </select>
            </label>
            <label>
              Décris ton projet
              <textarea
                rows="4"
                placeholder="Ex : un portfolio sombre et moderne avec une page projets et un formulaire de contact..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </label>
          </>
        )}

        <div className="onboarding-actions">
          <button className="ghost" onClick={onSkip}>Ouvrir l'espace</button>
          <button className="primary" onClick={submit} disabled={loading}>
            {loading ? <><RefreshCw className="spin" size={17} /> Création...</> : <><Sparkles size={17} /> Continuer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem("codabla-files");
    return saved ? JSON.parse(saved) : STARTER_FILES;
  });
  const [activeFile, setActiveFile] = useState("index.html");
  const [tabs, setTabs] = useState(["index.html"]);
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem("codabla-intro-done"));
  const [projectName, setProjectName] = useState(localStorage.getItem("codabla-project") || "my-project");
  const [rightPanel, setRightPanel] = useState(true);
  const [bottomPanel, setBottomPanel] = useState("terminal");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Je vois ton projet. Demande-moi de créer, corriger ou modifier n'importe quelle partie du code." }
  ]);
  const [aiBusy, setAiBusy] = useState(false);
  const [terminalLines, setTerminalLines] = useState([
    "Codabla workspace ready.",
    "Tape 'help' pour afficher les commandes."
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  useEffect(() => {
    localStorage.setItem("codabla-files", JSON.stringify(files));
  }, [files]);

  const preview = useMemo(() => buildPreview(files), [files, previewVersion]);

  function openFile(path) {
    setActiveFile(path);
    setTabs(prev => prev.includes(path) ? prev : [...prev, path]);
  }

  function closeTab(path) {
    setTabs(prev => {
      const next = prev.filter(item => item !== path);
      if (activeFile === path) setActiveFile(next[next.length - 1] || Object.keys(files)[0]);
      return next;
    });
  }

  function newFile() {
    const base = "untitled";
    let i = 1;
    let name = `${base}.js`;
    while (files[name]) name = `${base}-${i++}.js`;
    setFiles(prev => ({ ...prev, [name]: "" }));
    openFile(name);
  }

  function createProject(newFiles, name) {
    setFiles(newFiles);
    const first = newFiles["index.html"] ? "index.html" : Object.keys(newFiles)[0];
    setActiveFile(first);
    setTabs([first]);
    setProjectName(name || "my-project");
    localStorage.setItem("codabla-project", name || "my-project");
    localStorage.setItem("codabla-intro-done", "1");
    setShowIntro(false);
  }

  async function askAI() {
    if (!prompt.trim() || aiBusy) return;
    const text = prompt.trim();
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setAiBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "agent",
          prompt: text,
          files,
          activeFile
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur IA");

      if (data.files && Object.keys(data.files).length) {
        setFiles(prev => ({ ...prev, ...data.files }));
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        text: data.answer || (Object.keys(data.files || {}).length ? `${Object.keys(data.files).length} fichier(s) mis à jour.` : "Terminé.")
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: error.message }]);
    } finally {
      setAiBusy(false);
    }
  }

  function runTerminal(command) {
    const value = command.trim();
    if (!value) return;
    const next = [...terminalLines, `$ ${value}`];

    if (value === "clear") {
      setTerminalLines([]);
    } else if (value === "help") {
      setTerminalLines([...next, "Commandes: help, clear, ls, pwd, npm run dev, cat <fichier>"]);
    } else if (value === "ls") {
      setTerminalLines([...next, Object.keys(files).join("  ")]);
    } else if (value === "pwd") {
      setTerminalLines([...next, `/workspace/${projectName}`]);
    } else if (value === "npm run dev") {
      setBottomPanel("preview");
      setTerminalLines([...next, "VITE ready — preview ouverte dans Codabla."]);
    } else if (value.startsWith("cat ")) {
      const file = value.slice(4).trim();
      setTerminalLines([...next, files[file] ?? `cat: ${file}: fichier introuvable`]);
    } else {
      setTerminalLines([...next, `${value}: commande non disponible dans le terminal navigateur actuel`]);
    }
    setTerminalInput("");
  }

  const activeContent = files[activeFile] ?? "";

  return (
    <>
      {showIntro && <Onboarding onCreate={createProject} onSkip={() => createProject(files, projectName)} />}

      <div className="app-shell">
        <header className="topbar">
          <div className="top-left">
            <div className="logo"><Code2 size={18} /></div>
            <button className="project-switch">
              <span>{projectName}</span>
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="top-center">
            <button><Search size={15} /> Rechercher dans le projet <kbd>Ctrl K</kbd></button>
          </div>
          <div className="top-actions">
            <button title="GitHub"><Github size={17} /></button>
            <button onClick={() => setBottomPanel("preview")} className="run-btn"><Play size={15} /> Run</button>
            <button title="Paramètres"><Settings size={17} /></button>
          </div>
        </header>

        <div className="workspace">
          <aside className="activitybar">
            <button className="active"><FileCode2 size={20} /></button>
            <button><Search size={20} /></button>
            <button><Github size={20} /></button>
            <button onClick={() => setBottomPanel("preview")}><Eye size={20} /></button>
            <div className="spacer" />
            <button onClick={() => setRightPanel(v => !v)}><Bot size={20} /></button>
            <button><Settings size={20} /></button>
          </aside>

          <aside className="explorer">
            <div className="panel-head">
              <span>EXPLORER</span>
              <div>
                <button onClick={newFile}><Plus size={15} /></button>
              </div>
            </div>
            <div className="project-row">
              <ChevronDown size={14} />
              <FolderOpen size={15} />
              <strong>{projectName.toUpperCase()}</strong>
            </div>
            <div className="file-list">
              {Object.keys(files).map(file => (
                <button key={file} onClick={() => openFile(file)} className={activeFile === file ? "active" : ""}>
                  <File size={15} />
                  <span>{file}</span>
                </button>
              ))}
            </div>
            <button className="new-file" onClick={newFile}><CirclePlus size={15} /> Nouveau fichier</button>
          </aside>

          <main className="editor-area">
            <div className="tabs">
              {tabs.map(tab => (
                <div key={tab} className={"tab " + (activeFile === tab ? "active" : "")} onClick={() => setActiveFile(tab)}>
                  <FileCode2 size={14} />
                  <span>{tab}</span>
                  <button onClick={e => { e.stopPropagation(); closeTab(tab); }}><X size={13} /></button>
                </div>
              ))}
            </div>

            <div className="editor-wrap">
              <Editor
                path={activeFile}
                value={activeContent}
                language={getLanguage(activeFile)}
                theme="vs-dark"
                onChange={value => setFiles(prev => ({ ...prev, [activeFile]: value ?? "" }))}
                options={{
                  fontSize: 14,
                  fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
                  minimap: { enabled: true },
                  smoothScrolling: true,
                  padding: { top: 16 },
                  automaticLayout: true,
                  wordWrap: "on",
                  renderLineHighlight: "all",
                  scrollBeyondLastLine: false
                }}
              />
            </div>

            <section className="bottom-panel">
              <div className="bottom-tabs">
                <button className={bottomPanel === "terminal" ? "active" : ""} onClick={() => setBottomPanel("terminal")}>
                  TERMINAL
                </button>
                <button className={bottomPanel === "preview" ? "active" : ""} onClick={() => setBottomPanel("preview")}>
                  PREVIEW
                </button>
                <button>PROBLEMS <span className="badge-count">0</span></button>
                <div className="grow" />
                {bottomPanel === "preview" && (
                  <button onClick={() => setPreviewVersion(v => v + 1)}><RefreshCw size={14} /></button>
                )}
              </div>

              {bottomPanel === "terminal" ? (
                <div className="terminal">
                  {terminalLines.map((line, i) => <div key={i}>{line}</div>)}
                  <div className="terminal-input">
                    <span>$</span>
                    <input
                      value={terminalInput}
                      onChange={e => setTerminalInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && runTerminal(terminalInput)}
                      spellCheck="false"
                      placeholder="Tape une commande..."
                    />
                  </div>
                </div>
              ) : (
                <iframe key={previewVersion} title="Preview" className="preview-frame" srcDoc={preview} sandbox="allow-scripts allow-modals" />
              )}
            </section>
          </main>

          {rightPanel && (
            <aside className="ai-panel">
              <div className="ai-head">
                <div>
                  <div className="ai-avatar"><Sparkles size={16} /></div>
                  <div>
                    <strong>Codabla AI</strong>
                    <span>Agent projet</span>
                  </div>
                </div>
                <button onClick={() => setRightPanel(false)}><X size={16} /></button>
              </div>

              <div className="ai-context">
                <span><MessageSquareCode size={14} /> Contexte</span>
                <strong>{Object.keys(files).length} fichiers</strong>
                <span className="dot">•</span>
                <span>{activeFile}</span>
              </div>

              <div className="messages">
                {messages.map((message, i) => (
                  <div key={i} className={"message " + message.role}>
                    {message.role === "assistant" && <div className="mini-ai"><Bot size={14} /></div>}
                    <div>{message.text}</div>
                  </div>
                ))}
                {aiBusy && <div className="thinking"><span /><span /><span /></div>}
              </div>

              <div className="quick-actions">
                <button onClick={() => setPrompt("Explique le fichier actuel")}>Expliquer</button>
                <button onClick={() => setPrompt("Cherche et corrige les bugs du projet")}>Fix bugs</button>
                <button onClick={() => setPrompt("Améliore le design sans casser les fonctionnalités")}>Améliorer UI</button>
              </div>

              <div className="composer">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      askAI();
                    }
                  }}
                  placeholder="Demande une modification à Codabla..."
                  rows="3"
                />
                <div className="composer-footer">
                  <span>Agent • projet complet</span>
                  <button onClick={askAI} disabled={aiBusy || !prompt.trim()}><Sparkles size={16} /></button>
                </div>
              </div>
            </aside>
          )}
        </div>

        <footer className="statusbar">
          <div><Github size={13} /> main</div>
          <div>0 erreurs</div>
          <div className="grow" />
          <div>{getLanguage(activeFile)}</div>
          <div>UTF-8</div>
          <button onClick={() => setRightPanel(true)}><Bot size={13} /> Codabla AI</button>
        </footer>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
