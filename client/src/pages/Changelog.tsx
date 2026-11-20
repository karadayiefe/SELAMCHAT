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
    date: "20.11.2026 · 15:45",
    title: "MESAJLAR ARTIK DAHA HIZLI, TEMALAR TAŞŞŞ GİBİ",
    description: "Mesajların geç gitmesine neden olan sorunları elden geçirdik. Sohbeti hızlandırdık, temalara da bayağı büyük bir güncelleme çaktık.",
    details: ["GTA 6 teması baştan yenilendi.", "Mesajlaşma hızı iyileştirildi.", "Tema deneyimi ciddi şekilde geliştirildi."],
    live: true,
  },
  {
    id: "cat-easter-egg",
    date: "18.11.2026 · 21:31",
    title: "KEDİ SAKLADIK AMK. ciddi",
    description: "SELAMCHAT'in içine gizli bir kedi teması ve ona özel bir müzik sakladık.",
    details: ["Bir yerlere tıklayın, etrafı dürtün. Belki de gizli temayıilk siz bulursunuz. :)"],
    cat: true,
  },
  {
    id: "vice-city",
    date: "18.11.2026 · 17:48",
    title: "VICE CITY'YE HOŞ GELDİNİZ",
    description: "Vice City havasını SELAMCHAT'e taşıdık. Neonlar, atmosfer ve GTA 6 ruhu artık sohbet ekranınızda.",
    details: ["GTA 6 özel teması eklendi.", "Blood In Your Eyes (GTA 6) tema müziği eklendi."],
    viceCity: true,
  },
  {
    id: "chat-improvements",
    date: "17.11.2026 · 23:26",
    title: "SOHBET DENEYİMİNİ TOPARLADIK.",
    description: "Eşleşme, bağlantı takibi ve sohbet temizleme sistemlerini daha sağlam hâle getirdik. Artık işler biraz daha yoluna girmeye başladı.",
    details: ["56+ hayvan kimliği eklendi.", "Sohbet bittiğinde mesajlar otomatik temizleniyor.", "Karşı taraf ayrıldığında oda güvenli şekilde kapatılıyor.", "Sohbet kartlarıyla karşılaştığınız kişiyi daha sonra yeniden bulabiliyorsunuz."],
  },
  {
    id: "beginning",
    date: "17.11.2026 · 21:23",
    title: "HER ŞEYİN BAŞLANGICI",
    description: "SELAMCHAT bir fikirle başladı: Üyelik yok, profil yok, gereksiz uğraş yok. Sadece anonim sohbet. Sonra oturduk, siteyi kurmaya başladık.",
    details: ["Sitenin temeli oluşturuldu.", "İlk eşleşmeler denendi.", "Üst üste 3 kez başarısız olduk."],
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
