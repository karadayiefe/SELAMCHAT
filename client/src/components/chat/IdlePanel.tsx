import { IdentityTile } from "@/components/chat/Brand";
import type { Identity } from "@/lib/chatApi";
import { ArrowRight } from "lucide-react";

export function IdlePanel({
  me,
  busy,
  onStart,
}: {
  me: Identity;
  busy: boolean;
  onStart: () => void;
}) {
  return (
    <section className="panel-body fade-up">
      <p className="eyebrow">Anonim kimliğin</p>

      <div className="mt-3 flex items-center gap-3">
        <IdentityTile identity={me} />
        <div className="min-w-0">
          <div
            className="font-display text-[1.6rem] leading-none font-semibold"
            style={{ color: me.color }}
          >
            {me.name} <span aria-hidden="true">{me.emoji}</span>
          </div>
          <p className="mt-1.5 text-xs text-[color:var(--text-dim)]">
            olarak bağlısın · gerçek adın kimseye görünmez
          </p>
        </div>
      </div>

      <h1 className="mt-7 font-display text-[1.75rem] leading-[1.15] font-semibold tracking-tight sm:text-[2rem]">
        Kimse kim olduğunu bilmeyecek, Sen söyleyene kadar.
      </h1>
      <p className="mt-2.5 max-w-[34rem] text-sm leading-relaxed text-[color:var(--text-dim)]">
        Tek dokunuşla eşleş, tanımadığın biriyle konuş. Üyelik yok, profil yok. Sohbet bittiğinde
        mesajlar da kalıcı olarak silinir.{" "}
      </p>

      <button type="button" className="btn btn-primary mt-6 w-full" onClick={onStart} disabled={busy}>
        {busy ? "Bağlanıyor…" : "Sohbete Başla"}
        {!busy && <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />}
      </button>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="fact-chip">Üyelik yok</span>
        <span className="fact-chip">Mesaj kaydı yok</span>
        <span className="fact-chip">Anında eşleşme</span>
      </div>
    </section>
  );
}
