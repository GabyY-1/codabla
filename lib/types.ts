export type Role = "user" | "assistant";

export type Attachment = {
  name: string;
  size: number;
  content?: string;
};

export type Message = {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

export type ChatMode = "chat" | "build" | "debug" | "explain" | "improve";
