import { ArrowLeft, CalendarDays, Check, Sparkles } from "lucide-react";
import { Link } from "wouter";

const changes = [
  {
    version: "V1.0 BETA",
    date: "18 Kasım 2026",
    title: "Kedi easter egg modu",
    description:
      "MUKALCHAT yazısına tıklayarak gizli kedi temasını açabilirsin. Seçtiğimiz kedi görseli artık hareketli karolarla arka planda akıyor.",
    details: ["Kediler arka planda sürekli sola doğru hareket ediyor.", "Tema müziği loop olarak çalıyor.", "Ses, ayarların yanındaki ikonla açılıp kapatılabiliyor."],
  },
  {
    version: "V1.0 BETA",
    date: "17 Kasım 2026",
    title: "Daha güvenilir anonim sohbet",
    description:
      "Sohbet deneyiminin temelini güçlendirdik. Eşleşme, heartbeat ve sohbet temizleme akışları daha güvenilir hale geldi.",
    details: ["Anonim hayvan kimlikleri korunuyor.", "Sohbet bitince mesajlar temizleniyor.", "Karşı taraf ayrıldığında oda güvenli şekilde kapanıyor."],
  },
  {
    version: "V1.0 BETA",
    date: "İlk yayın",
    title: "MUKALCHAT doğdu",
    description:
      "Okuldaki öğrencilerin üyelik veya profil oluşturmadan yeni biriyle canlı ve anonim şekilde konuşabilmesi için MUKALCHAT’i oluşturduk.",
    details: ["Üyelik, e-posta ve profil zorunluluğu yok.", "Rastgele bire bir eşleşme.", "Açık, koyu ve GTA 6 · Vice City temaları."],
  },
];

export default function Changelog() {
  return (
    <div className="changelog-shell">
      <header className="changelog-header">
        <Link href="/" className="changelog-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Sohbete dön
        </Link>
        <span className="changelog-kicker">MUKALCHAT / CHANGELOG</span>
      </header>

      <main className="changelog-main">
        <div className="changelog-hero">
          <span className="changelog-icon" aria-hidden="true">
            <Sparkles size={22} />
          </span>
          <p className="changelog-eyebrow">Neler değişti?</p>
          <h1>Her gün biraz daha iyi.</h1>
          <p>
            MUKALCHAT’te yapılan önemli geliştirmeleri burada Türkçe ve kısa kısa paylaşıyoruz.
          </p>
        </div>

        <div className="changelog-list">
          {changes.map(change => (
            <article className="changelog-entry" key={`${change.date}-${change.title}`}>
              <div className="changelog-entry-meta">
                <span className="changelog-version">{change.version}</span>
                <span className="changelog-date">
                  <CalendarDays size={14} aria-hidden="true" />
                  {change.date}
                </span>
              </div>
              <h2>{change.title}</h2>
              <p>{change.description}</p>
              <ul>
                {change.details.map(detail => (
                  <li key={detail}>
                    <Check size={15} aria-hidden="true" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </main>

      <footer className="changelog-footer">
        <Link href="/">MUKALCHAT</Link>
        <span aria-hidden="true">·</span>
        <span>Mesajlar saklanmaz, sohbet bitince silinir</span>
      </footer>
    </div>
  );
}
