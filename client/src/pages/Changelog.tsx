import { CalendarDays, Check, CircleAlert, Pause, Play, Radio, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CommitRecord = {
  kind: "commit";
  number: number;
  message: string;
  date: string;
  subject: string;
  sha: string;
  ciStatus: "success" | "failure" | "pending" | "unknown";
  deploymentStatus: "success" | "failure" | "pending" | "unknown";
  deploymentContext: string | null;
  live: boolean;
};

type HistoryResponse = { ok: boolean; commits?: CommitRecord[]; error?: string };

export const changes = [
  {
    id: "origin",
    date: "2026-11-17",
    anchorSubject: "Initial MUKALCHAT",
    eyebrow: "ÖZEL CHANGELOG · 17 KASIM 2026",
    title: "HER ŞEYİN BAŞLANGICI",
    description: "MUKALCHAT doğdu. Okuldaki öğrencilerin üyelik veya profil oluşturmadan, yeni insanlarla canlı ve anonim şekilde konuşabilmesi fikri hoşumuza gitti. Projenin ilk adı MUKCHAT idi.",
    sectionLabel: "İlk gün:",
    details: ["Sitenin temel hâli oluşturuldu.", "İlk eşleşmeler denendi.", "Üst üste 3 hata aldık. Evet, daha ilk günden sıçtık."],
  },
  {
    id: "improvements",
    date: "2026-11-17",
    anchorSubject: "Improve chat responsiveness and UI polish",
    eyebrow: "ÖZEL CHANGELOG · 17 KASIM 2026",
    title: "İLK ADIM VE GELİŞTİRMELER",
    description: "Sohbet deneyiminin temelini güçlendirdik. Eşleşme, heartbeat ve sohbet temizleme sistemlerini daha güvenilir hâle getirdik.",
    sectionLabel: "Bu gün gelenler:",
    details: ["56+ farklı hayvan eklendi.", "Sohbet bitince mesajlar temizleniyor.", "Karşı taraf ayrıldığında oda güvenli şekilde kapanıyor."],
  },
  {
    id: "vice-city",
    date: "2026-11-18",
    anchorSubject: "Redesign Vice City theme",
    eyebrow: "ÖZEL CHANGELOG · 18 KASIM 2026",
    title: "VICE CITY'YE HOŞ GELDİNİZ",
    description: "GTA 6 çıkışına özel tema MUKALCHAT'te. GTA 6 temasını seçin ve Vice City atmosferini keşfedin.",
    details: ["GTA 6 özel teması eklendi.", "Blood In Your Eyes tema müziği eklendi."],
    viceCity: true,
  },
  {
    id: "cat",
    date: "2026-11-18",
    anchorSubject: "Add cat easter egg theme",
    eyebrow: "ÖZEL CHANGELOG · 18 KASIM 2026",
    title: "BİR YERLERE KEDİ SAKLADIK",
    description: "Bir kedi teması Easter egg'i saklandı.",
    details: ["Temayı kendiniz bulun.", "Tıklayın, etrafı keşfedin; belki gizli kedi temasını ilk siz bulursunuz."],
    cat: true,
  },
  {
    id: "beta",
    date: "2026-11-18T23:00:00+03:00",
    eyebrow: "ÖZEL CHANGELOG · 18 KASIM 2026 · 23:00",
    title: "MUKALCHAT V1.0 BETA",
    description: "ŞU AN AÇILDI",
    details: ["18 Kasım 2026, saat 23:00 itibarıyla MUKALCHAT artık sizinle."],
    finale: true,
  },
];

type ChangelogCardsProps = {
  onSelectViceCity?: () => void;
  viceMusicPlaying?: boolean;
  onToggleViceMusic?: () => void;
};

function formatSpecialDate(value: string) {
  const exact = value.includes("T");
  const date = new Date(exact ? value : `${value}T12:00:00+03:00`);
  return exact ? date.toLocaleString("tr-TR") : `${date.toLocaleDateString("tr-TR")} · saat belirtilmedi`;
}

function SpecialCard({ change, resolvedDate, onSelectViceCity, viceMusicPlaying, onToggleViceMusic }: { change: (typeof changes)[number]; resolvedDate?: string } & ChangelogCardsProps) {
  return (
    <article className={`changelog-entry timeline-special${change.finale ? " changelog-entry--finale" : ""}${change.viceCity ? " changelog-entry--vice-city" : ""}${change.cat ? " changelog-entry--cat" : ""}`}>
      <div className="changelog-entry-meta">
        <span className="changelog-version">{change.eyebrow}</span>
        <span className="changelog-date"><CalendarDays size={14} aria-hidden="true" />{formatSpecialDate(resolvedDate ?? change.date)}</span>
      </div>
      <h2>{change.title}</h2>
      <p className="changelog-entry-description">{change.description}</p>
      {change.sectionLabel && <p className="changelog-section-label">{change.sectionLabel}</p>}
      <ul>{change.details.map(detail => <li key={detail}><Check size={15} aria-hidden="true" /><span>{detail}</span></li>)}</ul>
      {change.viceCity && onSelectViceCity && <div className="timeline-vice-actions">
        <button type="button" className="changelog-vice-button" onClick={onSelectViceCity}>GTA 6 temasını seç</button>
        {onToggleViceMusic && <button type="button" className="changelog-vice-button changelog-music-button changelog-icon-button" onClick={onToggleViceMusic} aria-pressed={viceMusicPlaying} aria-label={viceMusicPlaying ? "Blood In Your Eyes müziğini durdur" : "Blood In Your Eyes müziğini oynat"} title={viceMusicPlaying ? "Müziği durdur" : "Müziği oynat"}>{viceMusicPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}</button>}
      </div>}
    </article>
  );
}

function formatRelative(date: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return `${seconds} saniye önce`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export function TimelinePanel({ onSelectViceCity, viceMusicPlaying, onToggleViceMusic }: ChangelogCardsProps) {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  useEffect(() => { void fetch("/api/history", { cache: "no-store" }).then(response => response.json()).then(setHistory).catch(() => setHistory({ ok: false, error: "history_unavailable" })); }, []);
  const records = useMemo(() => {
    const commits = history?.commits ?? [];
    return [...commits.map(commit => ({ ...commit, sortDate: new Date(commit.date).getTime() })), ...changes.map(change => {
      const resolvedDate = change.anchorSubject ? commits.find(commit => commit.subject === change.anchorSubject)?.date ?? change.date : change.date;
      return { kind: "special" as const, change, resolvedDate, sortDate: new Date(resolvedDate).getTime() };
    })].sort((a, b) => b.sortDate - a.sortDate);
  }, [history]);

  return <div className="timeline-list">
    {!history && <div className="timeline-loading">GitHub geçmişi getiriliyor…</div>}
    {history && !history.ok && <div className="timeline-loading timeline-error">Geçmiş şu an getirilemedi. Tekrar deneyebilirsin.</div>}
    {records.map(record => record.kind === "special" ? <SpecialCard key={record.change.id} change={record.change} resolvedDate={record.resolvedDate} onSelectViceCity={onSelectViceCity} viceMusicPlaying={viceMusicPlaying} onToggleViceMusic={onToggleViceMusic} /> : <article key={record.sha} className={`timeline-commit${record.live ? " timeline-commit--live" : ""}`}>
      <div className="timeline-commit-top"><span className="timeline-number">#{record.number}</span><span className="timeline-relative">{formatRelative(record.date)}</span>{record.live && <span className="live-badge"><Radio size={11} /> CANLI</span>}</div>
      <p>{record.message}</p>
      <div className="timeline-commit-meta"><span>{new Date(record.date).toLocaleString("tr-TR")}</span><span className={`build-status build-status--${record.ciStatus}`}>{record.ciStatus === "success" ? <Check size={13} /> : record.ciStatus === "failure" ? <X size={13} /> : <CircleAlert size={13} />}CI: {record.ciStatus === "success" ? "Başarılı" : record.ciStatus === "failure" ? "Başarısız" : record.ciStatus === "pending" ? "Bekliyor" : "Bilinmiyor"}</span><span className={`build-status build-status--${record.deploymentStatus}`}>{record.deploymentStatus === "success" ? <Check size={13} /> : record.deploymentStatus === "failure" ? <X size={13} /> : <CircleAlert size={13} />}Deploy: {record.deploymentStatus === "success" ? "Başarılı" : record.deploymentStatus === "failure" ? "Başarısız" : record.deploymentStatus === "pending" ? "Bekliyor" : "Bilinmiyor"}</span></div>
    </article>)}
  </div>;
}

export function ChangelogCards(props: ChangelogCardsProps) {
  return <div className="changelog-list">{changes.map(change => <SpecialCard key={change.id} change={change} {...props} />)}</div>;
}
