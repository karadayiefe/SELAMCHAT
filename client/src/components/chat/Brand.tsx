import type { Identity } from "@/lib/chatApi";

export function Wordmark() {
  return (
    <div>
      <div className="wordmark">
        <span className="wordmark-mark" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M3.5 7.5A4.5 4.5 0 0 1 8 3h8a4.5 4.5 0 0 1 4.5 4.5v5A4.5 4.5 0 0 1 16 17h-4l-4.5 4v-4.1A4.5 4.5 0 0 1 3.5 12.5z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span aria-label="MUKALCHAT">
          MUKAL<span className="wordmark-accent">CHAT</span>
        </span>
      </div>
      <span className="wordmark-tag">anonim ·  MUKal öğrencileri için.</span>
    </div>
  );
}

export function LiveCounters({ online, activeChats }: { online: number; activeChats: number }) {
  return (
    <div className="counters" aria-live="polite" aria-atomic="true">
      <span className="counter-pill" title="Şu anda sitede olan kişi sayısı">
        <span className="live-dot" aria-hidden="true" />
        Canlı Bağlantı: <b>{online}</b>
      </span>
      <span className="counter-pill" title="Şu anda süren sohbet odası sayısı">
        <span className="live-dot live-dot--chat" aria-hidden="true" />
        Aktif Sohbet: <b>{activeChats}</b>
      </span>
    </div>
  );
}

export function IdentityTile({
  identity,
  small = false,
}: {
  identity: Identity;
  small?: boolean;
}) {
  return (
    <span
      className={small ? "identity-tile identity-tile--sm" : "identity-tile"}
      style={{
        borderColor: `${identity.color}55`,
        background: `radial-gradient(circle at 30% 25%, ${identity.color}2e, ${identity.color}12)`,
        boxShadow: `0 0 26px -8px ${identity.color}80`,
      }}
      aria-hidden="true"
    >
      {identity.emoji}
    </span>
  );
}
