import { ReactNode } from "react";

export type IconName =
  | "code"
  | "plus"
  | "menu"
  | "send"
  | "stop"
  | "copy"
  | "trash"
  | "search"
  | "paperclip"
  | "x"
  | "download"
  | "refresh"
  | "sparkles"
  | "bug"
  | "book"
  | "wand"
  | "message"
  | "chevron";

const paths: Record<IconName, ReactNode> = {
  code: <path d="m8.5 18-6-6 6-6M15.5 6l6 6-6 6M14 4l-4 16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  send: <><path d="m4 4 16 8-16 8 3-8-3-8Z" /><path d="M7 12h13" /></>,
  stop: <rect x="7" y="7" width="10" height="10" rx="2" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  paperclip: <path d="m20.5 11.5-8.8 8.8a5 5 0 0 1-7.1-7.1l9.5-9.5a3.5 3.5 0 0 1 5 5l-9.6 9.6a2 2 0 0 1-2.8-2.8l8.9-8.9" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  download: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 1-2-5" /></>,
  sparkles: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
  bug: <><path d="M8 9h8v7a4 4 0 0 1-8 0V9Z" /><path d="M9 5l2 2M15 5l-2 2M4 13h4M16 13h4M5 18l3-1M19 18l-3-1" /></>,
  book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" /></>,
  wand: <><path d="m15 4 5 5L8 21l-5-5L15 4Z" /><path d="m13 6 5 5M6 3v3M4.5 4.5h3M20 15v3M18.5 16.5h3" /></>,
  message: <path d="M4 5h16v12H8l-4 4V5Z" />,
  chevron: <path d="m9 7 5 5-5 5" />
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
