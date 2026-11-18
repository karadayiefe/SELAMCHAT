import { CalendarDays, Check, Play } from "lucide-react";

export const changes = [
  {
    date: "16 Kasım 2026",
    title: "HER ŞEYİN BAŞLANGICI",
    description:
      "MUKALCHAT doğdu. Okuldaki öğrencilerin üyelik veya profil oluşturmadan, yeni insanlarla canlı ve anonim şekilde konuşabilmesi fikri hoşumuza gitti. Projenin ilk adı MUKCHAT idi.",
    sectionLabel: "İlk gün:",
    details: [
      "Sitenin temel hâli oluşturuldu.",
      "İlk eşleşmeler denendi.",
      "Üst üste 3 hata aldık. Evet, daha ilk günden sıçtık.",
    ],
  },
  {
    date: "17 Kasım 2026",
    title: "İLK ADIM VE GELİŞTİRMELER",
    description:
      "Sohbet deneyiminin temelini güçlendirdik. Eşleşme, heartbeat ve sohbet temizleme sistemlerini daha güvenilir hâle getirdik.",
    sectionLabel: "Bu gün gelenler:",
    details: [
      "56 farklı hayvan eklendi.",
      "Sohbet bitince mesajlar temizleniyor.",
      "Karşı taraf ayrıldığında oda güvenli şekilde kapanıyor.",
    ],
  },
  {
    date: "18 Kasım 2026",
    title: "VICE CITY'YE HOŞ GELDİNİZ",
    description:
      "GTA 6 çıkışına özel tema MUKALCHAT'te. GTA 6 temasını seçin ve Vice City atmosferini keşfedin.",
    sectionLabel: "Bu gün açılanlar:",
    details: [
      "GTA 6 özel teması ve tema müziği eklendi.",
      "GTA 6 temasından bağımsız ayrı bir civciv Easter egg'i saklandı.",
      "Civcivi kendiniz bulun. Tıklayın, etrafı keşfedin; belki gizli civcivi ilk siz bulursunuz.",
    ],
    viceCity: true,
  },
  {
    date: "18 Kasım 2026 · 23:00",
    title: "MUKALCHAT V1.0 BETA",
    description: "ŞU AN AÇILDI",
    details: ["18 Kasım 2026, saat 23:00 itibarıyla MUKALCHAT artık sizinle."],
    finale: true,
  },
];

interface ChangelogCardsProps {
  onSelectViceCity?: () => void;
}

export function ChangelogCards({ onSelectViceCity }: ChangelogCardsProps) {
  return (
    <div className="changelog-list">
      {changes.map(change => (
        <article className={`changelog-entry${change.finale ? " changelog-entry--finale" : ""}`} key={`${change.date}-${change.title}`}>
          <div className="changelog-entry-meta">
            <span className="changelog-version">{change.finale ? "MUKALCHAT V1.0 BETA" : "CHANGELOG"}</span>
            <span className="changelog-date">
              <CalendarDays size={14} aria-hidden="true" />
              {change.date}
            </span>
          </div>
          <h2>{change.title}</h2>
          <p className="changelog-entry-description">{change.description}</p>
          {change.sectionLabel && <p className="changelog-section-label">{change.sectionLabel}</p>}
          <ul>
            {change.details.map(detail => (
              <li key={detail}>
                <Check size={15} aria-hidden="true" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
          {change.viceCity && onSelectViceCity && (
            <button type="button" className="changelog-vice-button" onClick={onSelectViceCity}>
              <Play size={15} fill="currentColor" aria-hidden="true" />
              GTA 6 temasını seç
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
