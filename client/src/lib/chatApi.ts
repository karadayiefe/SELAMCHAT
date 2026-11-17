export type ChatStatus = "idle" | "waiting" | "chatting" | "partner_left";

export type Identity = {
  animalKey: string;
  name: string;
  emoji: string;
  color: string;
};

export type ChatMessage = {
  id: number;
  body: string;
  mine: boolean;
  senderName: string;
  senderEmoji: string;
  senderColor: string;
  createdAt: string;
};

export type ChatState = {
  token: string;
  status: ChatStatus;
  roomId: number | null;
  me: Identity;
  partner: Identity | null;
  partnerTyping: boolean;
  messages: ChatMessage[];
  counters: { online: number; activeChats: number };
  serverTime: string;
};

export type ChatResponse = {
  ok: boolean;
  error?: string;
  token?: string;
  state?: ChatState | null;
};

async function post(path: string, body: Record<string, unknown>): Promise<ChatResponse> {
  const response = await fetch(`/api/chat/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, error: `http_${response.status}` };
  }

  return (await response.json()) as ChatResponse;
}

export const chatApi = {
  session: (token: string | null) => post("session", token ? { token } : {}),
  state: (token: string) => post("state", { token }),
  join: (token: string) => post("join", { token }),
  leave: (token: string) => post("leave", { token }),
  message: (token: string, body: string) => post("message", { token, body }),
  typing: (token: string) => post("typing", { token }),
  bye: (token: string) => post("bye", { token }),
};
