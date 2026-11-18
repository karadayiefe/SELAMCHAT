import { CalendarDays, Check, Pause, Play } from "lucide-react";

export const changes = [
  {
    eyebrow: "CHANGELOG · 17 KASIM 2026",
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
    eyebrow: "CHANGELOG · 17 KASIM 2026",
    title: "İLK ADIM VE GELİŞTİRMELER",
    description:
      "Sohbet deneyiminin temelini güçlendirdik. Eşleşme, heartbeat ve sohbet temizleme sistemlerini daha güvenilir hâle getirdik.",
    sectionLabel: "Bu gün gelenler:",
    details: [
      "56+ farklı hayvan eklendi.",
      "Sohbet bitince mesajlar temizleniyor.",
      "Karşı taraf ayrıldığında oda güvenli şekilde kapanıyor.",
    ],
  },
  {
    eyebrow: "CHANGELOG · 18 KASIM 2026",
    title: "VICE CITY'YE HOŞ GELDİNİZ",
    description:
      "GTA 6 çıkışına özel tema MUKALCHAT'te. GTA 6 temasını seçin ve Vice City atmosferini keşfedin.",
    details: [
      "🌴 GTA 6 özel teması eklendi.",
      "🎵 GTA 6 temasına özel müzik eklendi.",
    ],
    viceCity: true,
  },
  {
    eyebrow: "GİZLİ EASTER EGG",
    title: "🐈 BİR YERLERE KEDİ SAKLADIK!",
    description: "Bir kedi teması Easter egg'i saklandı.",
    details: [
      "Temayı kendiniz bulun.",
      "Tıklayın, etrafı keşfedin; belki gizli kedi temasını ilk siz bulursunuz.",
    ],
    cat: true,
  },
  {
    eyebrow: "MUKALCHAT V1.0 BETA",
    date: "18 KASIM 2026 · 23:00",
    title: "MUKALCHAT V1.0 BETA",
    description: "ŞU AN AÇILDI",
    details: ["18 Kasım 2026, saat 23:00 itibarıyla MUKALCHAT artık sizinle."],
    finale: true,
  },
];

interface ChangelogCardsProps {
  onSelectViceCity?: () => void;
  viceMusicPlaying?: boolean;
  onToggleViceMusic?: () => void;
}

export function ChangelogCards({ onSelectViceCity, viceMusicPlaying = false, onToggleViceMusic }: ChangelogCardsProps) {
  return (
    <div className="changelog-list">
      {changes.map(change => (
        <article
          className={`changelog-entry${change.finale ? " changelog-entry--finale" : ""}${change.viceCity ? " changelog-entry--vice-city" : ""}${change.cat ? " changelog-entry--cat" : ""}`}
          key={`${change.eyebrow}-${change.title}`}
        >
          <div className="changelog-entry-meta">
            <span className="changelog-version">{change.eyebrow}</span>
            {change.date && (
              <span className="changelog-date">
                <CalendarDays size={14} aria-hidden="true" />
                {change.date}
              </span>
            )}
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
          {change.viceCity && onToggleViceMusic && (
            <button
              type="button"
              className="changelog-vice-button changelog-music-button"
              onClick={onToggleViceMusic}
              aria-pressed={viceMusicPlaying}
              aria-label={viceMusicPlaying ? "Tove Lo - Blood In Your Eyes müziğini durdur" : "Tove Lo - Blood In Your Eyes çal"}
            >
              {viceMusicPlaying ? <Pause size={15} aria-hidden="true" /> : <Play size={15} fill="currentColor" aria-hidden="true" />}
              {viceMusicPlaying ? "Tove Lo - Blood In Your Eyes durdur" : "Tove Lo - Blood In Your Eyes çal"}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
