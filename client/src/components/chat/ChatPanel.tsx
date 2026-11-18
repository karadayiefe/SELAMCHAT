import { IdentityTile } from "@/components/chat/Brand";
import type { ChatMessage, Identity } from "@/lib/chatApi";
import { ArrowUp, Check, CheckCheck, Clock3, LogOut, RotateCcw } from "lucide-react";
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
    ? { label: "Gönderiliyor", className: "receipt--sending", icon: Clock3 }
    : message.sendState === "failed"
      ? { label: "Gönderilemedi", className: "receipt--failed", icon: RotateCcw }
      : message.readAt
        ? { label: "Okundu", className: "receipt--read", icon: CheckCheck }
        : message.deliveredAt
          ? { label: "İletildi", className: "receipt--delivered", icon: CheckCheck }
          : { label: "Gönderildi", className: "receipt--sent", icon: Check };
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
            <span>{receipt.label}</span>
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
  me,
  partner,
  messages,
  partnerTyping,
  busy,
  onSend,
  onLeave,
  onTyping,
}: {
  me: Identity;
  partner: Identity;
  messages: ChatMessage[];
  partnerTyping: boolean;
  busy: boolean;
  onSend: (body: string, clientId?: string) => Promise<boolean>;
  onLeave: () => void;
  onTyping: () => void;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages.length, partnerTyping]);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 88)}px`;
  }, [text]);

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    await onSend(value);
    inputRef.current?.focus();
  };

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
              <span className="live-dot" style={{ width: 5, height: 5 }} aria-hidden="true" />
              çevrimiçi · anonim sohbet
            </span>
          </div>
        </div>

        <button type="button" className="btn btn-danger btn-sm shrink-0" onClick={onLeave} disabled={busy}>
          <LogOut size={14} strokeWidth={2.4} aria-hidden="true" />
          Ayrıl
        </button>
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

        {partnerTyping && (
          <div className="bubble-row bubble-row--theirs">
            <span className="bubble-meta" style={{ color: partner.color }}>
              <span aria-hidden="true">{partner.emoji}</span>
              {partner.name}
            </span>
            <span
              className="bubble typing-dots"
              style={{
                background: "rgba(255,255,255,0.045)",
                borderColor: `${partner.color}33`,
                color: partner.color,
                padding: "0.6rem 0.8rem",
              }}
              aria-label={`${partner.name} yazıyor`}
            >
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
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
            onTyping();
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

      <span className="sr-only">Sen {me.name} olarak yazıyorsun.</span>
    </section>
  );
}
