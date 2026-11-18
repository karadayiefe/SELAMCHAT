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
