"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Icon } from "./Icon";

function CodeBlock({ value, language }: { value: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="code-block">
      <div className="code-head">
        <span>{language || "code"}</span>
        <button onClick={copy} type="button">
          <Icon name="copy" size={14} />
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre><code>{value}</code></pre>
    </div>
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const value = String(children).replace(/\n$/, "");
          const match = /language-([\w-]+)/.exec(className || "");

          if (className || value.includes("\n")) {
            return <CodeBlock value={value} language={match?.[1]} />;
          }

          return <code className="inline-code">{children}</code>;
        },
        a({ children, href }) {
          return (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
