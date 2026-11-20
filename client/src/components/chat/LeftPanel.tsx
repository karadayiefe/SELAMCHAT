import { IdentityTile } from "@/components/chat/Brand";
import { RoomCard } from "@/components/chat/RoomCard";
import type { Identity, RoomCardData } from "@/lib/chatApi";
import { DoorOpen, RotateCw } from "lucide-react";

export function LeftPanel({
  me,
  busy,
  onFindNew,
  message,
  showAwayStatus = false,
  roomCard,
}: {
  me: Identity;
  busy: boolean;
  onFindNew: () => void;
  message: string;
  showAwayStatus?: boolean;
  roomCard?: RoomCardData | null;
}) {
  return (
    <section className="panel-body fade-up">
      <div className="flex items-start gap-3">
        <span
          className="identity-tile"
          style={{
            borderColor: "rgba(255,200,97,0.35)",
            background: "rgba(255,200,97,0.1)",
          }}
          aria-hidden="true"
        >
          <DoorOpen size={22} style={{ color: "var(--amber)" }} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[1.15rem] leading-snug font-semibold">
            {message}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--text-dim)]">
            {showAwayStatus && <>Sohbette Değil · </>}
            Sohbet geçmişi silindi.
          </p>
        </div>
      </div>

      <button type="button" className="btn btn-primary mt-6 w-full" onClick={onFindNew} disabled={busy}>
        <RotateCw size={16} strokeWidth={2.4} aria-hidden="true" />
        {busy ? "Ana sayfaya dönülüyor…" : "Yeni kişi bul"}
      </button>

      {roomCard && (
        <div className="mt-3 flex justify-center">
          <RoomCard card={roomCard} size="large" />
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--text-dim)]">
        <IdentityTile identity={me} small />
        <span>
          Kimliğin:{" "}
          <b className="font-semibold" style={{ color: me.color }}>
            {me.name} {me.emoji}
          </b>
        </span>
      </div>
    </section>
  );
}
