import { CalendarDays, Check, Pause, Play, Radio } from "lucide-react";

type ChangelogCard = {
  id: string;
  date: string;
  title: string;
  description: string;
  details?: string[];
  live?: boolean;
  presenceDetails?: boolean;
  viceCity?: boolean;
  cat?: boolean;
};

export const changes: ChangelogCard[] = [
  {
    id: "messages-faster",
    date: "20.11.2026 · 16:55",
    title: "MESAJLAR ARTIK DAHA HIZLI, TEMALAR TAŞŞA GİBİ.",
    description: "Mesajların geç gitmesine neden olan sorunları elden geçirdik. Sohbeti hızlandırdık, temalara da bayağı büyük bir güncelleme çaktık.",
    details: ["GTA 6 teması baştan aşağı yenilendi.", "Koyu ve açık temalar tamamen değiştirildi.", "Mesajlaşma sisteminde büyük iyileştirmeler yapıldı.", "Okundu bilgisi daha sade ve hızlı hâle getirildi.", "Sohbet durumunu daha anlaşılır kılmak için 2 yeni sohbet detayı eklendi."],
    live: true,
    presenceDetails: true,
  },
  {
    id: "cat-easter-egg",
    date: "18.11.2026 · 21:31",
    title: "GİZLİ KEDİ TEMASI!",
    description: "SELAMCHAT'in içine gizli bir kedi teması ve ona özel bir müzik sakladık.",
    details: ["Bir yerlere tıklayın\netrafla oynaşın"],
    cat: true,
  },
  {
    id: "vice-city",
    date: "18.11.2026 · 17:48",
    title: "VICE CITY'YE HOŞ GELDİNİZ",
    description: "Vice City havasını SELAMCHAT'e taşıdık. Artık sohbet ederken biraz da Vice City'deymişsiniz gibi hissedebilirsiniz.",
    details: ["GTA 6 özel teması eklendi.", "A GTA 6 Dianzi Tema Müziği eklendi."],
    viceCity: true,
  },
  {
    id: "chat-improvements",
    date: "17.11.2026 · 23:26",
    title: "SOHBET DENEYİMİNİ TOPARLADIK.",
    description: "Eşleşme, bağlantı takibi ve sohbet temizleme sistemlerini daha sağlam hâle getirdik. Artık işler biraz daha yoluna girmeye başladı.",
    details: ["56 hayvan eklendi.", "Sohbet bittiğinde mesajlar otomatik olarak temizleniyor.", "Karşı taraf ayrıldığında oda güvenli şekilde kapatılıyor.", "Sohbet kartları sayesinde karşılaştığınız kişiye daha sonra Instagram gibi platformlardan yeniden ulaşabiliyorsunuz."],
  },
  {
    id: "beginning",
    date: "17.11.2026 · 21:23",
    title: "HER ŞEYİN BAŞLANGICI",
    description: "SELAMCHAT bir fikirle başladı: Üyelik yok, profil yok. Sadece anonim sohbet. Sonra oturduk, siteyi kurmaya başladık.",
    details: ["Sitenin temeli oluşturuldu.", "İlk eşleşmeler denendi.", "(çok kötüydü)"],
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
      {change.presenceDetails && (
        <section className="changelog-presence-card" aria-labelledby={`changelog-presence-title-${change.id}`}>
          <h3 id={`changelog-presence-title-${change.id}`}>YENİ SOHBET DETAYLARI</h3>
          <div className="changelog-presence-list">
            <div className="changelog-presence-item">
              <span className="flex items-center gap-1.5 text-[0.68rem] text-[color:var(--text-dim)]">
                <span className="live-dot" style={{ width: 5, height: 5 }} aria-hidden="true" />
                <span>Çevrimiçi</span>
              </span>
              <p>Kullanıcı aktif olarak sohbet ekranında. Sohbetine devam ediyor ve bağlantısı aktif.</p>
            </div>
            <div className="changelog-presence-item">
              <span className="flex items-center gap-1.5 text-[0.68rem] text-[color:var(--text-dim)]">
                <span className="live-dot live-dot--away" style={{ width: 5, height: 5 }} aria-hidden="true" />
                <span>Sohbette değil</span>
              </span>
              <p>Kullanıcı sohbet ekranından ayrıldığında veya başka bir uygulamaya geçtiğinde bu durum gösterilir. 3 dakika içinde geri dönmezse sohbet otomatik olarak kapatılır.</p>
            </div>
          </div>
        </section>
      )}
      {change.viceCity && onSelectViceCity && (
        <div className="timeline-vice-actions">
          <button type="button" className="changelog-vice-button" onClick={onSelectViceCity}>GTA 6 TEMASINI SEÇ</button>
          {onToggleViceMusic && <button type="button" className="changelog-vice-button changelog-music-button changelog-icon-button" onClick={onToggleViceMusic} aria-pressed={viceMusicPlaying} aria-label={viceMusicPlaying ? "A GTA 6 müziğini durdur" : "A GTA 6 müziğini oynat"} title={viceMusicPlaying ? "Müziği durdur" : "Müziği oynat"}>{viceMusicPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}</button>}
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
