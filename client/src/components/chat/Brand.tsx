import type { Identity } from "@/lib/chatApi";

export function Wordmark() {
  return (
    <div>
      <div className="wordmark">
        <span className="wordmark-mark" aria-hidden="true">
          <img className="wordmark-logo wordmark-logo--dark" src="/logo-dark.svg" alt="" />
          <img className="wordmark-logo wordmark-logo--light" src="/logo-light.svg" alt="" />
          <img className="wordmark-logo wordmark-logo--vice-city" src="/logo-vice-city.svg" alt="" />
          <img className="wordmark-logo wordmark-logo--cat" src="/logo-cat.jpg" alt="" />
        </span>
        <span aria-label="SELAMCHAT">
          SELAM<span className="wordmark-accent">CHAT</span>
        </span>
      </div>
    </div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const text = String(Math.max(0, value));
  return (
    <b className="counter-number" aria-label={text}>
      {text.split("").map((digit, index) => (
        <span className="counter-digit" key={`${index}-${digit}-${text}`} aria-hidden="true">{digit}</span>
      ))}
    </b>
  );
}

export function LiveCounters({ online, activeChats }: { online: number; activeChats: number }) {
  return (
    <div className="counters" aria-live="polite" aria-atomic="true">
      <span className="counter-pill" title="Şu anda sitede olan kişi sayısı">
        <span className="live-dot" aria-hidden="true" />
        Canlı Bağlantı:{" "}
        <AnimatedCounter value={online} />
      </span>
      <span className="counter-pill" title="Şu anda süren sohbet odası sayısı">
        <span className="live-dot live-dot--chat" aria-hidden="true" />
        Aktif Sohbet:{" "}
        <AnimatedCounter value={activeChats} />
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
