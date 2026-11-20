import { LiveCounters, Wordmark } from "@/components/chat/Brand";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { IdlePanel } from "@/components/chat/IdlePanel";
import { LeftPanel } from "@/components/chat/LeftPanel";
import { WaitingPanel } from "@/components/chat/WaitingPanel";
import { ThemeSettings } from "@/components/chat/ThemeSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { useChat } from "@/hooks/useChat";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimelinePanel } from "@/pages/Changelog";
import { CatRain } from "@/components/chat/CatRain";
import { useState } from "react";

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
  const ownLeaveNotice = status === "idle" && notice === "Sohbeti bitirdin. Her şey silindi.";
  const { setTheme, isCatMode, toggleCatMode, viceMusicPlaying, toggleViceMusic } = useTheme();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const selectViceCity = () => {
    if (isCatMode) toggleCatMode();
    setTheme("vice-city");
    setChangelogOpen(false);
  };

  return (
    <div className={`page-shell${status === "chatting" ? " page-shell--chatting" : ""}`}>
      {isCatMode && <CatRain />}
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
            {notice && !ownLeaveNotice && (
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
                roomCard={state.roomCard}
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
            ) : status === "connection_lost" ? (
              <LeftPanel message="Bağlantı kesildi. Sohbet silindi." me={state.me} busy={busy} onFindNew={() => void join(true)} />
            ) : status === "partner_left" ? (
              <LeftPanel message="Karşıdaki kişi ayrıldı." me={state.me} busy={busy} onFindNew={() => void join(true)} />
            ) : ownLeaveNotice ? (
              <LeftPanel message="Sohbeti bitirdin. Her şey silindi." me={state.me} busy={busy} onFindNew={() => void join(true)} />
            ) : (
              <IdlePanel me={state.me} busy={busy} onStart={() => void join()} />
            )}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <button
          type="button"
          className="brand-easter-egg font-semibold tracking-wide"
          onClick={toggleCatMode}
          aria-pressed={isCatMode}
          title={isCatMode ? "Kedi modunu kapat" : "Gizli kedi modunu aç"}
        >
          {isCatMode ? "Gizli temayı kapat" : "SELAMCHAT"}
        </button>
        <span aria-hidden="true">·</span>
        <span>Mesajlar saklanmaz, sohbet bitince silinir</span>
        <span className="hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <span className="beta-version-label">V1.0 BETA</span>
        <button type="button" className="beta-changelog-link" onClick={() => setChangelogOpen(true)}>
          GEÇMİŞİ GÖR <span aria-hidden="true">→</span>
        </button>
      </footer>

      <Dialog open={changelogOpen} onOpenChange={setChangelogOpen}>
        <DialogContent className="changelog-dialog">
          <DialogHeader>
            <DialogTitle>SELAMCHAT — GEÇMİŞ</DialogTitle>
          </DialogHeader>
          <div className="changelog-dialog-scroll">
            <TimelinePanel
              onSelectViceCity={selectViceCity}
              viceMusicPlaying={viceMusicPlaying}
              onToggleViceMusic={toggleViceMusic}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
