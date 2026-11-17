import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi, type ChatMessage, type ChatState, type ChatStatus } from "@/lib/chatApi";

const TOKEN_KEY = "mukchat.token";
/** The brief says: if nobody is available within 5 seconds, say so. */
const NO_ONE_AFTER_SECONDS = 5;

function delayFor(status: ChatStatus, hidden: boolean) {
  if (status === "chatting") return hidden ? 1200 : 800;
  if (status === "waiting") return 900;
  if (status === "partner_left") return 1000;
  return 1000;
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
  const meRef = useRef<ChatState["me"] | null>(null);
  const stateRef = useRef<ChatState | null>(null);
  const endedRoomIdsRef = useRef(new Set<number>());
  const lifecycleRef = useRef(0);
  const typingSentAt = useRef(0);
  const waitStartedAt = useRef<number | null>(null);

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

    const safeState =
      next.status === "chatting"
        ? next
        : { ...next, roomId: null, partner: null, partnerTyping: false, messages: [] };
    stateRef.current = safeState;
    tokenRef.current = safeState.token;
    statusRef.current = safeState.status;
    meRef.current = safeState.me;
    try {
      // Kept per tab: a reload preserves the identity, while a second tab gets
      // its own anonymous student instead of sharing one chat session.
      sessionStorage.setItem(TOKEN_KEY, safeState.token);
    } catch {
      /* storage can be unavailable in private mode */
    }
    setState(safeState);
  }, []);

  // Main session + polling loop.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let wakeSleep: (() => void) | null = null;

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

      const establish = async () => {
        try {
          const res = await chatApi.session(readStoredToken());
          if (cancelled) return;
          if (res.ok && res.state) {
            apply(res.state);
            setConnectionIssue(false);
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

      while (!cancelled) {
        const token = tokenRef.current;

        // No session yet (first load failed or the visitor was swept): retry.
        if (!token) {
          await sleep(1500);
          if (cancelled) break;
          await establish();
          continue;
        }

        await sleep(delayFor(statusRef.current, document.hidden));
        if (cancelled) break;

        const lifecycle = lifecycleRef.current;
        try {
          const res = await chatApi.state(token);
          if (cancelled) break;
          if (lifecycle !== lifecycleRef.current) continue;

          if (res.ok && res.state) {
            apply(res.state);
            setConnectionIssue(false);
          } else if (res.error === "no_session") {
            const fresh = await chatApi.session(null);
            if (!cancelled && lifecycle === lifecycleRef.current && fresh.ok) apply(fresh.state);
          }
        } catch {
          if (!cancelled) setConnectionIssue(true);
        }
      }
    };

    const refreshOnReturn = () => {
      if (!document.hidden) wakeSleep?.();
    };
    document.addEventListener("visibilitychange", refreshOnReturn);
    void loop();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refreshOnReturn);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      wakeSleep = null;
    };
  }, [apply]);

  // Counts how long the visitor has been waiting (for the 5 second rule).
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

  // Tell the server when the tab is closed so the partner is released at once.
  useEffect(() => {
    const bye = () => {
      const token = tokenRef.current;
      if (!token) return;
      if (statusRef.current !== "chatting" && statusRef.current !== "waiting") return;
      try {
        const payload = new Blob([JSON.stringify({ token })], { type: "application/json" });
        navigator.sendBeacon("/api/chat/bye", payload);
      } catch {
        /* beacon unsupported: the server sweeper still cleans up */
      }
    };

    window.addEventListener("pagehide", bye);
    return () => window.removeEventListener("pagehide", bye);
  }, []);

  const join = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    const lifecycle = ++lifecycleRef.current;
    setBusy(true);
    setNotice(null);
    try {
      const res = await chatApi.join(token);
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
    if (previous?.roomId !== null && previous?.roomId !== undefined) {
      endedRoomIdsRef.current.add(previous.roomId);
    }
    statusRef.current = "idle";
    if (previous) {
      const cleared: ChatState = {
        ...previous,
        status: "idle",
        roomId: null,
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
    async (raw: string) => {
      const token = tokenRef.current;
      const body = raw.trim();
      if (!token || !body || statusRef.current !== "chatting") return false;
      const lifecycle = lifecycleRef.current;

      const me = meRef.current;
      if (me && stateRef.current) {
        const optimistic: ChatMessage = {
          id: -Date.now(),
          body,
          mine: true,
          senderName: me.name,
          senderEmoji: me.emoji,
          senderColor: me.color,
          createdAt: new Date().toISOString(),
        };
        const optimisticState = { ...stateRef.current, messages: [...stateRef.current.messages, optimistic] };
        stateRef.current = optimisticState;
        setState(optimisticState);
      }

      try {
        const res = await chatApi.message(token, body);
        if (lifecycle === lifecycleRef.current && res.state) apply(res.state);
        if (res.error === "too_fast") setNotice("Çok hızlı yazıyorsun, bir saniye bekle.");
        return res.ok;
      } catch {
        setConnectionIssue(true);
        return false;
      }
    },
    [apply]
  );

  const notifyTyping = useCallback(() => {
    const token = tokenRef.current;
    if (!token || statusRef.current !== "chatting") return;
    const now = Date.now();
    if (now - typingSentAt.current < 2500) return;
    typingSentAt.current = now;
    void chatApi.typing(token).catch(() => undefined);
  }, []);

  const noOneOnline = state?.status === "waiting" && waitSeconds >= NO_ONE_AFTER_SECONDS;

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
