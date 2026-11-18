import type { ChatState } from "@/lib/chatApi";

/** Keep local sends until a server snapshot confirms their client ID or the room ends. */
export function mergeUnconfirmedMessages(previous: ChatState | null, next: ChatState): ChatState {
  if (previous?.status !== "chatting" || next.status !== "chatting" || previous.roomId !== next.roomId) {
    return next;
  }

  const confirmedClientIds = new Set(
    next.messages.map(message => message.clientId).filter((id): id is string => Boolean(id))
  );
  const unconfirmed = previous.messages.filter(message =>
    message.clientId &&
    (message.id < 0 || message.sendState === "sending" || message.sendState === "failed") &&
    !confirmedClientIds.has(message.clientId)
  );

  return unconfirmed.length > 0 ? { ...next, messages: [...next.messages, ...unconfirmed] } : next;
}
