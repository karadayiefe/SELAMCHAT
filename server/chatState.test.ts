import { describe, expect, it } from "vitest";
import type { ChatMessage, ChatState } from "@/lib/chatApi";
import { mergeUnconfirmedMessages } from "@/lib/chatState";

const message = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: -1,
  clientId: "msg_0123456789abcdef",
  body: "Test mesajı",
  mine: true,
  senderName: "Kedi",
  senderEmoji: "🐱",
  senderColor: "#B79BFF",
  createdAt: "2026-11-18T00:00:00.000Z",
  deliveredAt: null,
  readAt: null,
  sendState: "sending",
  ...overrides,
});

const state = (messages: ChatMessage[], roomId = 7): ChatState => ({
  token: "tab-token-0123456789",
  status: "chatting",
  roomId,
  roomCode: "123-456-789",
  roomCard: null,
  me: { animalKey: "kedi", name: "Kedi", emoji: "🐱", color: "#B79BFF" },
  partner: { animalKey: "tilki", name: "Tilki", emoji: "🦊", color: "#FF8A4C" },
  partnerTyping: false,
  messages,
  counters: { online: 2, activeChats: 1 },
  serverTime: "2026-11-18T00:00:00.000Z",
});

describe("optimistic chat state merging", () => {
  it("keeps an unconfirmed message visible across a poll while its POST is pending", () => {
    const optimistic = message();
    const merged = mergeUnconfirmedMessages(state([optimistic]), state([]));

    expect(merged.messages).toEqual([optimistic]);
  });

  it("retains failed messages so the retry control stays available", () => {
    const failed = message({ sendState: "failed" });
    const merged = mergeUnconfirmedMessages(state([failed]), state([]));

    expect(merged.messages).toEqual([failed]);
  });

  it("replaces the optimistic item with the server-confirmed copy without duplicating it", () => {
    const confirmed = message({ id: 42, sendState: undefined, createdAt: "2026-11-18T00:00:01.000Z" });
    const merged = mergeUnconfirmedMessages(state([message()]), state([confirmed]));

    expect(merged.messages).toEqual([confirmed]);
  });

  it("does not carry an unconfirmed message into a different room", () => {
    const merged = mergeUnconfirmedMessages(state([message()], 7), state([], 8));

    expect(merged.messages).toEqual([]);
  });
});
