import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi, type ChatMessage, type ChatState, type ChatStatus } from "@/lib/chatApi";
import { mergeUnconfirmedMessages } from "@/lib/chatState";

const TOKEN_KEY = "selamchat.token";
const RELOAD_MATCH_KEY = "selamchat.reload-match";
const ANIMAL_KEY = "selamchat.animal-key";
/** Keep search open long enough for students to join without using the chat-leave timeout. */
const NO_ONE_AFTER_SECONDS = 30;

function delayFor(hidden: boolean, status: ChatStatus) {
  if (hidden) return 10_000;
  if (status === "chatting") return 350;
  if (status === "waiting") return 700;
  return 2500;
}

function createSessionToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function createClientMessageId() {
  return createSessionToken();
}

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Owns the anonymous session and polls the server.
 * Polling (instead of a WebSocket) keeps the app on the standard stateless
 * backend, so hosting stays on the free tier with no always-on instance.
 */
export function useChat() {
  const [state, setState] = useState<ChatState | null>(null);
  const [ready, setReady] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  const tokenRef = useRef<string | null>(null);
  const statusRef = useRef<ChatStatus>("idle");
  const pageLeavingRef = useRef(false);
  const meRef = useRef<ChatState["me"] | null>(null);
  const stateRef = useRef<ChatState | null>(null);
  const endedRoomIdsRef = useRef(new Set<number>());
  const lifecycleRef = useRef(0);
  const typingSentAt = useRef(0);
  const waitStartedAt = useRef<number | null>(null);
  const optimisticIdRef = useRef(0);

  const apply = useCallback((next: ChatState | null | undefined) => {
    if (!next) return;
    const previous = stateRef.current;
    if (
      previous?.status === "chatting" &&
      previous.roomId !== null &&
      (next.status !== "chatting" || next.roomId !== previous.roomId)
    ) {
      endedRoomIdsRef.current.add(previous.roomId);
      if (endedRoomIdsRef.current.size > 100) {
        const oldest = endedRoomIdsRef.current.values().next().value;
        if (oldest !== undefined) endedRoomIdsRef.current.delete(oldest);
      }
    }

    // A slow poll/message response from an ended room may not repaint its old
    // transcript after the exit notice or a newer match has already appeared.
    if (next.status === "chatting" && next.roomId !== null && endedRoomIdsRef.current.has(next.roomId)) {
      return;
    }

    const stateToApply = mergeUnconfirmedMessages(previous, next);

    const safeState =
      stateToApply.status === "chatting"
        ? stateToApply
        : { ...stateToApply, roomId: null, roomCode: null, roomCard: null, partner: null, partnerTyping: false, messages: [] };
    stateRef.current = safeState;
    tokenRef.current = safeState.token;
    statusRef.current = safeState.status;
    meRef.current = safeState.me;
    try {
      // Keep the same token in this tab so a reload is not counted as a new visitor.
      sessionStorage.setItem(TOKEN_KEY, safeState.token);
      sessionStorage.setItem(ANIMAL_KEY, safeState.me.animalKey);
      if (safeState.status === "chatting") sessionStorage.setItem(RELOAD_MATCH_KEY, "1");
      else sessionStorage.removeItem(RELOAD_MATCH_KEY);
    } catch {
      /* storage can be unavailable in private mode */
    }
    setState(safeState);
  }, []);

  const applyMessages = useCallback((messages: ChatMessage[]) => {
    const previous = stateRef.current;
    if (!previous || previous.status !== "chatting") return;
    const next = mergeUnconfirmedMessages(previous, { ...previous, messages });
    stateRef.current = next;
    setState(next);
  }, []);

  // Main session + polling loop.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let wakeSleep: (() => void) | null = null;
    let lastVisibilityVersion = 0;
    const navigationType = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    let rejoinAfterReload = false;
    try {
      const isReload = navigationType?.type === "reload";
      rejoinAfterReload = isReload && sessionStorage.getItem(RELOAD_MATCH_KEY) === "1";
      sessionStorage.removeItem(RELOAD_MATCH_KEY);
    } catch { /* A fresh identity is best-effort when storage is blocked. */ }

    const sleep = (ms: number) =>
      new Promise<void>(resolve => {
        const finish = () => {
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
          timeoutId = undefined;
          wakeSleep = null;
          resolve();
        };
        timeoutId = window.setTimeout(finish, ms);
        wakeSleep = finish;
      });

    const loop = async () => {
      let announcedReady = false;
      let fastPolls = 0;

      const establish = async () => {
        if (pageLeavingRef.current) return;
        try {
          let token = readStoredToken();
          if (!token) {
            token = createSessionToken();
            try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* Server still issues a session. */ }
          }
          let avoidAnimalKey: string | null = null;
          try { avoidAnimalKey = sessionStorage.getItem(ANIMAL_KEY); } catch { /* Best-effort identity rotation. */ }
          const res = await chatApi.session(token, avoidAnimalKey);
          if (cancelled || pageLeavingRef.current) return;
          if (res.ok && res.state) {
            if (rejoinAfterReload) {
              const joined = await chatApi.join(res.token ?? res.state.token);
              if (joined.ok && joined.state) apply(joined.state);
              else apply(res.state);
              rejoinAfterReload = false;
            } else {
              apply(res.state);
            }
            setConnectionIssue(false);
            reportVisibility();
          } else {
            setConnectionIssue(true);
          }
        } catch {
          if (!cancelled) setConnectionIssue(true);
        }
        if (!cancelled && !announcedReady) {
          announcedReady = true;
          setReady(true);
        }
      };

      await establish();

      while (!cancelled && !pageLeavingRef.current) {
        const token = tokenRef.current;

        // No session yet (first load failed or the visitor was swept): retry.
        if (!token) {
          await sleep(1500);
          if (cancelled || pageLeavingRef.current) break;
          await establish();
          continue;
        }

        const pollStartedAt = performance.now();
        const lifecycle = lifecycleRef.current;
        try {
          fastPolls += 1;
          const res = statusRef.current === "chatting" && fastPolls % 5 !== 0
            ? await chatApi.messages(token)
            : await chatApi.state(token);
          if (cancelled || pageLeavingRef.current) break;
          if (lifecycle !== lifecycleRef.current) continue;

          if (res.ok && res.messages && statusRef.current === "chatting") {
            applyMessages(res.messages);
            setConnectionIssue(false);
          } else if (res.ok && res.state) {
            apply(res.state);
            setConnectionIssue(false);
          } else if (res.error === "no_session") {
            const fresh = await chatApi.session(null);
            if (!cancelled && !pageLeavingRef.current && lifecycle === lifecycleRef.current && fresh.ok) apply(fresh.state);
          }
        } catch {
          if (!cancelled) setConnectionIssue(true);
        }

        if (pageLeavingRef.current) break;
        const remainingDelay = delayFor(document.hidden, statusRef.current) - (performance.now() - pollStartedAt);
        if (remainingDelay > 0) await sleep(remainingDelay);
      }
    };

    const reportVisibility = () => {
      if (pageLeavingRef.current) return;
      const token = tokenRef.current;
      if (token) {
        let version = Math.max(Date.now(), lastVisibilityVersion + 1);
        try {
          const key = `selamchat:visibility-version:${token}`;
          const stored = Number(window.sessionStorage.getItem(key) ?? 0);
          if (Number.isSafeInteger(stored)) version = Math.max(version, stored + 1);
          window.sessionStorage.setItem(key, String(version));
        } catch { /* Fall back to the in-memory monotonic counter. */ }
        lastVisibilityVersion = version;
        const body = JSON.stringify({ token, hidden: document.hidden, version });
        const payload = new Blob([body], { type: "application/json" });
        let queued = false;
        try {
          if (typeof navigator.sendBeacon === "function") {
            queued = navigator.sendBeacon("/api/chat/visibility", payload);
          }
        } catch { /* Fall through to a keepalive fetch. */ }
        if (!queued) {
          void fetch("/api/chat/visibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            credentials: "same-origin",
            keepalive: true,
          }).catch(() => undefined);
        }
      }
      if (!document.hidden) wakeSleep?.();
    };
    document.addEventListener("visibilitychange", reportVisibility);
    void loop();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", reportVisibility);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      wakeSleep = null;
    };
  }, [apply, applyMessages]);

  // Counts how long the visitor has been waiting before the 30-second notice.
  useEffect(() => {
    if (state?.status !== "waiting") {
      waitStartedAt.current = null;
      setWaitSeconds(0);
      return;
    }

    if (waitStartedAt.current === null) waitStartedAt.current = Date.now();
    const startedAt = waitStartedAt.current;
    setWaitSeconds(Math.floor((Date.now() - startedAt) / 1000));

    const id = window.setInterval(() => {
      setWaitSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 400);

    return () => window.clearInterval(id);
  }, [state?.status]);

  // Leaving the chat always clears the on-screen notice.
  useEffect(() => {
    if (state?.status === "chatting" || state?.status === "waiting") setNotice(null);
  }, [state?.status]);

  // Keep the tab token across reloads. The server lease handles real tab exits;
  // deleting the token here made every rapid F5 look like a new visitor.
  useEffect(() => {
    const bye = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      const token = tokenRef.current;
      if (!token) return;
      pageLeavingRef.current = true;
      lifecycleRef.current += 1;
      try {
        if (stateRef.current?.status === "chatting") sessionStorage.setItem(RELOAD_MATCH_KEY, "1");
        else sessionStorage.removeItem(RELOAD_MATCH_KEY);
      } catch { /* Reload continuity is best-effort when storage is blocked. */ }
    };

    window.addEventListener("pagehide", bye);
    return () => window.removeEventListener("pagehide", bye);
  }, []);

  const join = useCallback(async (rotateAnimal = false) => {
    const token = tokenRef.current;
    if (!token) return;
    const lifecycle = ++lifecycleRef.current;
    setBusy(true);
    setNotice(null);
    try {
      const res = await chatApi.join(token, rotateAnimal);
      if (lifecycle === lifecycleRef.current && res.ok) apply(res.state);
    } catch {
      setConnectionIssue(true);
    } finally {
      setBusy(false);
    }
  }, [apply]);

  const leave = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    const lifecycle = ++lifecycleRef.current;
    const previous = stateRef.current;
    if (previous?.status === "chatting") {
      setNotice("Sohbeti bitirdin. Her şey silindi.");
    }
    if (previous?.roomId !== null && previous?.roomId !== undefined) {
      endedRoomIdsRef.current.add(previous.roomId);
    }
    statusRef.current = "idle";
    try { sessionStorage.removeItem(RELOAD_MATCH_KEY); } catch { /* Storage can be unavailable. */ }
    if (previous) {
      const cleared: ChatState = {
        ...previous,
        status: "idle",
        roomId: null,
        roomCode: null,
        roomCard: null,
        partner: null,
        partnerTyping: false,
        messages: [],
      };
      stateRef.current = cleared;
      setState(cleared);
    }
    setBusy(true);
    try {
      const res = await chatApi.leave(token);
      if (lifecycle === lifecycleRef.current && res.ok) apply(res.state);
    } catch {
      setConnectionIssue(true);
    } finally {
      setBusy(false);
    }
  }, [apply]);

  const send = useCallback(
    async (raw: string, retryClientId?: string) => {
      const token = tokenRef.current;
      const body = raw.trim();
      if (!token || !body || statusRef.current !== "chatting") return false;
      const lifecycle = lifecycleRef.current;
      const clientId = retryClientId ?? createClientMessageId();

      const me = meRef.current;
      const currentState = stateRef.current;
      if (me && currentState) {
        const existing = currentState.messages.find(message => message.clientId === clientId);
        const optimistic: ChatMessage = existing
          ? { ...existing, sendState: "sending" }
          : {
              id: -(++optimisticIdRef.current),
              clientId,
              body,
              mine: true,
              senderName: me.name,
              senderEmoji: me.emoji,
              senderColor: me.color,
              createdAt: new Date().toISOString(),
              deliveredAt: null,
              readAt: null,
              sendState: "sending",
            };
        const optimisticState = {
          ...currentState,
          messages: existing
            ? currentState.messages.map(message => message.clientId === clientId ? optimistic : message)
            : [...currentState.messages, optimistic],
        };
        stateRef.current = optimisticState;
        setState(optimisticState);
      }

      const markFailed = () => {
        const latest = stateRef.current;
        if (!latest || latest.status !== "chatting") return;
        const failedState = {
          ...latest,
          messages: latest.messages.map(message =>
            message.clientId === clientId ? { ...message, sendState: "failed" as const } : message
          ),
        };
        stateRef.current = failedState;
        setState(failedState);
      };
      const markSent = () => {
        const latest = stateRef.current;
        if (!latest || latest.status !== "chatting") return;
        const sentState = {
          ...latest,
          messages: latest.messages.map(message => {
            if (message.clientId !== clientId) return message;
            const { sendState: _sendState, ...sentMessage } = message;
            return sentMessage;
          }),
        };
        stateRef.current = sentState;
        setState(sentState);
      };

      try {
        const res = await chatApi.message(token, body, clientId);
        if (lifecycle !== lifecycleRef.current) return false;
        if (res.ok) {
          if (res.state) apply(res.state);
          else markSent();
          return true;
        }
        if (res.state && res.state.status !== "chatting") apply(res.state);
        markFailed();
        if (res.error === "too_fast") setNotice("Çok hızlı yazıyorsun, bir saniye bekle.");
        return res.ok;
      } catch {
        if (lifecycle === lifecycleRef.current) markFailed();
        setConnectionIssue(true);
        return false;
      }
    },
    [apply]
  );

  const noOneOnline = state?.status === "waiting" && waitSeconds >= NO_ONE_AFTER_SECONDS;

  const notifyTyping = useCallback(() => {
    const token = tokenRef.current;
    if (!token || statusRef.current !== "chatting") return;
    const now = Date.now();
    if (now - typingSentAt.current < 2500) return;
    typingSentAt.current = now;
    void chatApi.typing(token).catch(() => undefined);
  }, []);

  return {
    state,
    ready,
    busy,
    notice,
    connectionIssue,
    waitSeconds,
    noOneOnline,
    join,
    leave,
    send,
    notifyTyping,
  };
}
