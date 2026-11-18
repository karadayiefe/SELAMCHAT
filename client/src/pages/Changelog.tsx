import { CalendarDays, Check } from "lucide-react";

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
    title: "DAHA GÜVENİLİR ANONİM SOHBET",
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
      "~ VİCE CITY BABYYYY 🌴\n\nGTA 6 çıkışına özel tema sonunda MUKALCHAT'te!\n\nBu kez biraz farklı şeyler denedik:",
    details: [
      "🌴 GTA 6 özel teması eklendi.",
      "🎵 GTA 6 temasına özel müzik eklendi.",
      "🐈 Bir yerlere sakladığımız küçük bir kedi teması Easter egg'i var.",
      "Kediyi kendiniz bulun. :) Bir yerlere tıklayın, etrafı keşfedin. Belki de gizli kediyi ilk siz bulursunuz.",
    ],
  },
  {
    date: "V1.0 BETA",
    title: "VE BU GECE... 23:00...",
    description: "MUKALCHAT V1.0 BETA",
    details: ["16 Kasım'da bir fikir olarak başladı. Şimdi sizinle."],
    finale: true,
  },
];

export function ChangelogCards() {
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
        </article>
      ))}
    </div>
  );
}
