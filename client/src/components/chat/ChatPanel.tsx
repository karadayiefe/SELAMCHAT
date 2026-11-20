import { IdentityTile } from "@/components/chat/Brand";
import { RoomCard } from "@/components/chat/RoomCard";
import type { ChatMessage, Identity, RoomCardData } from "@/lib/chatApi";
import { ArrowUp, CheckCheck, LogOut, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function Bubble({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry: (body: string, clientId: string) => void;
}) {
  const color = message.senderColor;
  const sentAt = new Date(message.createdAt);
  const timeLabel = Number.isNaN(sentAt.getTime())
    ? ""
    : new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(sentAt);
  const receipt = message.sendState === "sending"
    ? { label: "Gönderildi", className: "receipt--sent", icon: CheckCheck }
    : message.sendState === "failed"
      ? { label: "Gönderilemedi", className: "receipt--failed", icon: RotateCcw }
      : message.readAt
        ? { label: "Okundu", className: "receipt--read", icon: CheckCheck }
        : { label: "Gönderildi", className: "receipt--sent", icon: CheckCheck };
  const ReceiptIcon = receipt.icon;

  return (
    <div className={`bubble-row ${message.mine ? "bubble-row--mine" : "bubble-row--theirs"}`}>
      <span className="bubble-meta" style={{ color }}>
        <span aria-hidden="true">{message.senderEmoji}</span>
        {message.senderName}
        {message.mine && <span className="font-normal text-[color:var(--text-dim)]">· sen</span>}
      </span>
      <div
        className="bubble"
        style={message.mine
          ? { background: `${color}22`, borderColor: `${color}48` }
          : { background: "rgba(255,255,255,0.045)", borderColor: `${color}33` }}
      >
        {message.body}
      </div>
      <div className={`bubble-time${message.mine ? " bubble-time--mine" : ""}`}>
        <time dateTime={message.createdAt}>{timeLabel}</time>
        {message.mine && (
          <span className={`message-receipt ${receipt.className}`} aria-label={receipt.label} title={receipt.label}>
            <ReceiptIcon size={14} strokeWidth={2.1} aria-hidden="true" />
          </span>
        )}
      </div>
      {message.mine && message.sendState === "failed" && message.clientId && (
        <button type="button" className="message-retry" onClick={() => onRetry(message.body, message.clientId!)}>
          <RotateCcw size={12} aria-hidden="true" /> Yeniden dene
        </button>
      )}
    </div>
  );
}

export function ChatPanel({
  partner,
  partnerPresence,
  roomCard,
  messages,
  busy,
  onSend,
  onLeave,
}: {
  partner: Identity;
  partnerPresence: "online" | "disconnected" | null;
  roomCard: RoomCardData | null;
  messages: ChatMessage[];
  busy: boolean;
  onSend: (body: string, clientId?: string) => Promise<boolean>;
  onLeave: () => void;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 88)}px`;
  }, [text]);


  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const keepComposerVisible = () => {
      if (document.activeElement !== inputRef.current) return;
      window.requestAnimationFrame(() => inputRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" }));
    };
    viewport.addEventListener("resize", keepComposerVisible);
    return () => {
      viewport.removeEventListener("resize", keepComposerVisible);
    };
  }, []);

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    await onSend(value);
    inputRef.current?.focus();
  };
  const presenceLabel = partnerPresence === "online"
    ? "Çevrimiçi"
    : partnerPresence === "disconnected"
      ? "Sohbette değil"
      : "Bağlantı kontrol ediliyor";
  const presenceDotClass = partnerPresence === "disconnected"
    ? "live-dot--away"
    : partnerPresence === "online"
      ? ""
      : "live-dot--unknown";


  return (
    <section className="chat-shell fade-up">
      <header className="chat-head">
        <div className="flex min-w-0 items-center gap-2.5">
          <IdentityTile identity={partner} small />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-display text-[0.98rem] font-semibold" style={{ color: partner.color }}>
                {partner.name}
              </span>
              <span aria-hidden="true">{partner.emoji}</span>
            </div>
            <span className="flex items-center gap-1.5 text-[0.68rem] text-[color:var(--text-dim)]">
              <span className={`live-dot ${presenceDotClass}`} style={{ width: 5, height: 5 }} aria-hidden="true" />
              <span>{presenceLabel}</span>
            </span>
          </div>
        </div>

        <div className="chat-head-actions">
          {roomCard && <RoomCard card={roomCard} />}
          <button type="button" className="btn btn-danger btn-sm shrink-0" onClick={onLeave} disabled={busy}>
            <LogOut size={14} strokeWidth={2.4} aria-hidden="true" />
            Ayrıl
          </button>
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="m-auto max-w-[22rem] py-6 text-center">
            <p className="text-sm leading-relaxed text-[color:var(--text-dim)]">
              Sohbet başladı. İlk mesajı sen yaz — karşı taraf yalnızca hayvan kimliğini görür.
            </p>
          </div>
        )}

        {messages.map(message => (
          <Bubble
            key={message.clientId ?? message.id}
            message={message}
            onRetry={(body, clientId) => void onSend(body, clientId)}
          />
        ))}

      </div>

      <div className="composer">
        <textarea
          ref={inputRef}
          className="composer-input"
          rows={1}
          value={text}
          maxLength={500}
          placeholder="Mesajını yaz…"
          aria-label="Mesaj"
          onChange={event => {
            setText(event.target.value);
          }}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <button type="button" className="send-btn" onClick={() => void submit()} disabled={!text.trim()} aria-label="Gönder">
          <ArrowUp size={18} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>

    </section>
  );
}
