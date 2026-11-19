import { CalendarDays, Check, Pause, Play, Radio } from "lucide-react";

type ChangelogCard = {
  id: string;
  date: string;
  title: string;
  description: string;
  details?: string[];
  live?: boolean;
  viceCity?: boolean;
  cat?: boolean;
};

export const changes: ChangelogCard[] = [
  {
    id: "messages-faster",
    date: "19.11.2026 · 14:47",
    title: "MESAJLAR ARTIK DAHA HIZLI",
    description: "Geri bildirimleriniz doğrultusunda mesajların geç iletilmesine neden olan sorunları iyileştirdik. Sohbet deneyimini hızlandırdık ve temalarda güncellemeler yaptık.",
    live: true,
  },
  {
    id: "beta-release",
    date: "18.11.2026 · 23:00",
    title: "SELAMCHAT V1.0 BETA ARTIK YAYINDA",
    description: "SELAMCHAT artık herkesin kullanımına açık. Üyelik veya profil oluşturmadan anonim şekilde yeni insanlarla sohbet edebilirsiniz.",
  },
  {
    id: "cat-easter-egg",
    date: "18.11.2026 · 21:31",
    title: "BİR YERLERE KEDİ SAKLADIK",
    description: "SELAMCHAT'in içinde küçük bir sürpriz gizli. Gizli kedi temasını keşfedebilecek misiniz?",
    details: ["Temayı kendiniz bulun.", "Tıklayın, etrafı keşfedin; belki gizli kedi temasını ilk siz bulursunuz :)"],
    cat: true,
  },
  {
    id: "vice-city",
    date: "18.11.2026 · 17:48",
    title: "VICE CITY'YE HOŞ GELDİNİZ",
    description: "Vice City atmosferinden ilham alan özel tema SELAMCHAT'te.",
    details: ["GTA 6 özel teması eklendi.", "Blood In Your Eyes tema müziği eklendi."],
    viceCity: true,
  },
  {
    id: "chat-improvements",
    date: "17.11.2026 · 23:26",
    title: "SOHBET DENEYİMİ GELİŞİYOR",
    description: "Eşleşme, bağlantı takibi ve sohbet temizleme sistemlerini daha güvenilir hâle getirdik.",
    details: ["56'dan fazla hayvan kimliği eklendi.", "Sohbet bitince mesajlar temizleniyor.", "Katılımcılardan biri ayrıldığında oda güvenli şekilde kapanıyor.", "Eşleşme ve bağlantı yönetimi iyileştirildi."],
  },
  {
    id: "beginning",
    date: "17.11.2026 · 21:23",
    title: "HER ŞEYİN BAŞLANGICI",
    description: "SELAMCHAT'in yolculuğu küçük bir fikirle başladı. Üyelik olmadan anonim sohbet platformu oluşturmak istedik.",
    details: ["Sitenin temeli oluşturuldu.", "İlk eşleşmeler denendi.", "Üst üste 3 hata aldık. Daha ilk günden sıçtık."],
  },
];

type ChangelogCardsProps = {
  onSelectViceCity?: () => void;
  viceMusicPlaying?: boolean;
  onToggleViceMusic?: () => void;
};

function ChangelogCard({ change, onSelectViceCity, viceMusicPlaying, onToggleViceMusic }: { change: ChangelogCard } & ChangelogCardsProps) {
  const classes = [
    "changelog-entry",
    change.live ? "changelog-entry--live" : "",
    change.viceCity ? "changelog-entry--vice-city" : "",
    change.cat ? "changelog-entry--cat" : "",
  ].filter(Boolean).join(" ");

  return (
    <article className={classes}>
      <div className="changelog-entry-meta">
        <span className="changelog-date"><CalendarDays size={14} aria-hidden="true" />{change.date}</span>
        {change.live && <span className="changelog-live-badge"><Radio size={12} aria-hidden="true" /> CANLI</span>}
      </div>
      <h2>{change.title}</h2>
      <p className="changelog-entry-description">{change.description}</p>
      {change.details && <ul>{change.details.map(detail => <li key={detail}><Check size={15} aria-hidden="true" /><span>{detail}</span></li>)}</ul>}
      {change.viceCity && onSelectViceCity && (
        <div className="timeline-vice-actions">
          <button type="button" className="changelog-vice-button" onClick={onSelectViceCity}>GTA 6 TEMASINI SEÇ</button>
          {onToggleViceMusic && <button type="button" className="changelog-vice-button changelog-music-button changelog-icon-button" onClick={onToggleViceMusic} aria-pressed={viceMusicPlaying} aria-label={viceMusicPlaying ? "Blood In Your Eyes müziğini durdur" : "Blood In Your Eyes müziğini oynat"} title={viceMusicPlaying ? "Müziği durdur" : "Müziği oynat"}>{viceMusicPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}</button>}
        </div>
      )}
    </article>
  );
}

export function TimelinePanel(props: ChangelogCardsProps) {
  return <div className="changelog-list">{changes.map(change => <ChangelogCard key={change.id} change={change} {...props} />)}</div>;
}

export function ChangelogCards(props: ChangelogCardsProps) {
  return <TimelinePanel {...props} />;
}
