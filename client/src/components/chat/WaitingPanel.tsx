import { IdentityTile } from "@/components/chat/Brand";
import type { Identity } from "@/lib/chatApi";
import { AlertTriangle } from "lucide-react";

export function WaitingPanel({
  me,
  noOneOnline,
  waitSeconds,
  busy,
  onCancel,
}: {
  me: Identity;
  noOneOnline: boolean;
  waitSeconds: number;
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <section className="panel-body fade-up flex min-h-[22rem] flex-col items-center justify-center text-center">
      <div className="pulse-stage">
        <span className="pulse-ring" />
        <span className="pulse-ring" />
        <span className="pulse-ring" />
        <IdentityTile identity={me} />
      </div>

      <h2 className="mt-5 font-display text-xl font-semibold">
        Eşleşme aranıyor<span className="text-[color:var(--lime)]">…</span>
      </h2>
      <p className="mt-1.5 text-sm text-[color:var(--text-dim)]">
        Senin gibi konuşacak birini bekliyoruz.
      </p>

      {noOneOnline ? (
        <div className="notice mt-5 w-full max-w-[26rem] text-left" role="status">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            <b className="font-semibold">Şu anda aktif online yok.</b> Yeni biri girdiğinde
            otomatik olarak bağlanacaksın; bu sayfayı açık tutman yeterli.
          </span>
        </div>
      ) : (
        <p className="mt-5 text-xs text-[color:var(--text-dim)]">
          {waitSeconds < 5 ? "Aranıyor…" : `${waitSeconds} saniyedir aranıyor`}
        </p>
      )}

      <button type="button" className="btn btn-ghost mt-5" onClick={onCancel} disabled={busy}>
        Aramayı Durdur
      </button>
    </section>
  );
}
