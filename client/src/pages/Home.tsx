import { LiveCounters, Wordmark } from "@/components/chat/Brand";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { IdlePanel } from "@/components/chat/IdlePanel";
import { LeftPanel } from "@/components/chat/LeftPanel";
import { WaitingPanel } from "@/components/chat/WaitingPanel";
import { ThemeSettings } from "@/components/chat/ThemeSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { useChat } from "@/hooks/useChat";
import { Loader2 } from "lucide-react";

function VicePalm({ side }: { side: "left" | "right" }) {
  return (
    <svg className={`vice-palm vice-palm--${side}`} viewBox="0 0 240 360" fill="none" aria-hidden="true">
      <g transform={side === "right" ? "translate(240 0) scale(-1 1)" : undefined}>
        <path d="M108 359C111 290 122 210 139 115" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        <path d="M112 357C116 288 127 211 142 122" stroke="#ffb458" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
        <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M139 115C119 72 79 42 22 28" />
          <path d="M139 115C101 83 58 67 10 75" />
          <path d="M139 115C96 108 53 111 17 137" />
          <path d="M139 115C106 137 78 161 57 190" />
          <path d="M139 115C135 153 137 185 149 216" />
          <path d="M139 115C162 145 190 165 222 177" />
          <path d="M139 115C178 117 211 108 235 93" />
          <path d="M139 115C168 77 194 52 219 38" />
          <path d="M139 115C151 77 156 45 151 18" />
        </g>
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.78">
          <path d="M120 83L116 64L100 71M104 70L100 52L84 60M87 55L81 39L66 46M70 42L63 29L47 37" />
          <path d="M109 91L90 76L84 91M89 78L71 67L65 84M69 68L50 62L44 78M48 73L31 70L27 84" />
          <path d="M105 103L82 96L80 112M83 98L60 95L60 111M63 97L41 98L42 114M43 104L24 110L25 124" />
          <path d="M106 120L83 124L88 141M86 128L67 141L75 155M101 139L86 160L101 169M115 130L105 151L120 164" />
          <path d="M131 149L118 171L133 188M138 166L134 189L149 205M153 140L168 159L162 175M171 148L191 162L183 179M169 112L191 106L186 125M190 108L212 100L204 120M158 83L174 65L184 82M178 66L196 49L202 68M146 72L150 50L164 63M151 47L151 27L166 41" />
        </g>
        <circle cx="139" cy="115" r="4.2" fill="currentColor" />
      </g>
    </svg>
  );
}

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
  const { isCatMode, toggleCatMode } = useTheme();

  return (
    <div className="page-shell">
      <div className="vice-city-palms" aria-hidden="true">
        <VicePalm side="left" />
        <VicePalm side="right" />
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
        <span className="font-semibold tracking-wide text-[color:var(--text)]">MUKALCHAT</span>
        <span aria-hidden="true">·</span>
        <span>Mesajlar saklanmaz, sohbet bitince silinir</span>
        <span className="hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className="beta-easter-egg"
          onClick={toggleCatMode}
          aria-pressed={isCatMode}
          title={isCatMode ? "Kedi modunu kapat" : "Gizli kedi modunu aç"}
        >
          V1.0 BETA
        </button>
      </footer>
    </div>
  );
}
