export type ChatStatus = "idle" | "waiting" | "chatting" | "partner_left" | "connection_lost";

export type Identity = {
  animalKey: string;
  name: string;
  emoji: string;
  color: string;
};

export type ChatMessage = {
  id: number;
  clientId: string | null;
  body: string;
  mine: boolean;
  senderName: string;
  senderEmoji: string;
  senderColor: string;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  sendState?: "sending" | "failed";
};

export type RoomCardData = {
  animals: [Identity, Identity];
  code: string;
};

export type ChatState = {
  token: string;
  status: ChatStatus;
  roomId: number | null;
  roomCode: string | null;
  roomCard: RoomCardData | null;
  me: Identity;
  partner: Identity | null;
  partnerPresence: "online" | "disconnected" | null;
  messages: ChatMessage[];
  counters: { online: number; activeChats: number };
  serverTime: string;
};

export type ChatResponse = {
  ok: boolean;
  error?: string;
  token?: string;
  state?: ChatState | null;
  messages?: ChatMessage[];
  partnerPresence?: "online" | "disconnected";
};

// Vercel apex domain is intentionally redirected to www. Use the canonical
// API origin directly so a page opened on the apex never pays that extra hop.
const apiOrigin = typeof window !== "undefined" && window.location.hostname === "selamchat.fun"
  ? "https://www.selamchat.fun"
  : "";

async function post(path: string, body: Record<string, unknown>): Promise<ChatResponse> {
  const response = await fetch(`${apiOrigin}/api/chat/${path}`, {
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
  session: (token: string | null, avoidAnimalKey?: string | null) =>
    post("session", { ...(token ? { token } : {}), ...(avoidAnimalKey ? { avoidAnimalKey } : {}) }),
  state: (token: string) => post("state", { token }),
  messages: (token: string) => post("messages", { token }),
  join: (token: string, rotateAnimal = false) => post("join", { token, rotateAnimal }),
  leave: (token: string) => post("leave", { token }),
  message: (token: string, body: string, clientId: string) => post("message", { token, body, clientId }),
  bye: (token: string) => post("bye", { token }),
};
