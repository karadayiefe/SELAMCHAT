import { LiveCounters, Wordmark } from "@/components/chat/Brand";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { IdlePanel } from "@/components/chat/IdlePanel";
import { LeftPanel } from "@/components/chat/LeftPanel";
import { WaitingPanel } from "@/components/chat/WaitingPanel";
import { ThemeSettings } from "@/components/chat/ThemeSettings";
import { useChat } from "@/hooks/useChat";
import { Loader2 } from "lucide-react";

export default function Home() {
  const {
    state,
    busy,
    notice,
    connectionIssue,
    waitSeconds,
    noOneOnline,
    join,
    leave,
    send,
    notifyTyping,
  } = useChat();

  const status = state?.status ?? "idle";
  const online = state?.counters.online ?? 0;
  const activeChats = state?.counters.activeChats ?? 0;

  return (
    <div className="page-shell">
      <div className="vice-city-palms" aria-hidden="true">
        <svg className="vice-palm vice-palm--left" viewBox="0 0 220 320" fill="none">
          <path d="M96 314c10-79 20-142 28-213" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <path d="M124 101C83 52 45 51 14 61c42 3 63 18 96 50C75 80 41 79 18 92c42-2 68 11 94 23-41 1-63 16-79 35 31-14 59-20 83-19-38 16-54 39-61 59 25-23 48-37 71-43-31 28-40 52-39 73 16-30 33-51 53-66-19 37-18 63-10 81 6-36 16-63 29-84 0 38 11 62 25 77-7-36-7-66-2-92 11 34 29 54 48 63-18-32-29-59-34-85 19 29 42 43 62 46-26-25-45-48-58-71 28 20 56 26 77 20-33-15-60-31-82-49 34 11 63 9 81-3-38-3-71-10-101-23 39 0 66-12 80-28-38 9-72 11-107 8 35-11 57-28 65-48-31 20-63 36-98 44 26-21 39-45 39-67-21 29-45 55-74 75Z" fill="currentColor" />
        </svg>
        <svg className="vice-palm vice-palm--right" viewBox="0 0 220 320" fill="none">
          <path d="M122 314c-10-79-20-142-28-213" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <path d="M96 101c41-49 79-50 110-40-42 3-63 18-96 50 35-31 69-32 92-19-42-2-68 11-94 23 41 1 63 16 79 35-31-14-59-20-83-19 38 16 54 39 61 59-25-23-48-37-71-43 31 28 40 52 39 73-16-30-33-51-53-66 19 37 18 63 10 81-6-36-16-63-29-84 0 38-11 62-25 77 7-36 7-66 2-92-11 34-29 54-48 63 18-32 29-59 34-85-19 29-42 43-62 46 26-25 45-48 58-71-28 20-56 26-77 20 33-15 60-31 82-49-34 11-63 9-81-3 38-3 71-10 101-23-39 0-66-12-80-28 38 9 72 11 107 8-35-11-57-28-65-48 31 20 63 36 98 44-26-21-39-45-39-67 21 29 45 55 74 75Z" fill="currentColor" />
        </svg>
      </div>
      <header className="site-header">
        <Wordmark />
        <div className="header-actions">
          <LiveCounters online={online} activeChats={activeChats} />
          <ThemeSettings />
        </div>
      </header>

      <main className="panel">
        {!state ? (
          <div className="panel-body flex min-h-[20rem] flex-col items-center justify-center gap-3 text-center">
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--lime)" }} />
            <p className="text-sm text-[color:var(--text-dim)]">
              {connectionIssue
                ? "Bağlantı kuruluyor, birkaç saniye sürebilir…"
                : "Bağlanıyor…"}
            </p>
          </div>
        ) : (
          <div
            key={status === "chatting" ? `chat-${state.roomId ?? "none"}` : status}
            className="state-panel-enter w-full"
          >
            {notice && (
              <div className="px-4 pt-4">
                <div className="notice">
                  <span>{notice}</span>
                </div>
              </div>
            )}

            {status === "chatting" && state.partner ? (
              <ChatPanel
                me={state.me}
                partner={state.partner}
                roomCode={state.roomCode}
                messages={state.messages}
                partnerTyping={state.partnerTyping}
                busy={busy}
                onSend={send}
                onLeave={() => void leave()}
                onTyping={notifyTyping}
              />
            ) : status === "waiting" ? (
              <WaitingPanel
                me={state.me}
                noOneOnline={noOneOnline}
                waitSeconds={waitSeconds}
                busy={busy}
                onCancel={() => void leave()}
              />
            ) : status === "partner_left" ? (
              <LeftPanel me={state.me} busy={busy} onFindNew={() => void join()} />
            ) : (
              <IdlePanel me={state.me} busy={busy} onStart={() => void join()} />
            )}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <span className="font-semibold tracking-wide text-[color:var(--text)]">MUKALCHAT</span>
        <span aria-hidden="true">·</span>
        <span>Mesajlar saklanmaz, sohbet bitince silinir</span>
        <span className="hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <span className="hidden sm:inline">MUKAL</span>
      </footer>
    </div>
  );
}
