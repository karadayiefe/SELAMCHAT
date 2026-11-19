import type { Express, Request, Response } from "express";

const OWNER = "karadayiefe";
const REPO = "MUKALCHAT";
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=100`;
const CACHE_MS = 30_000;

type GitHubCommit = {
  sha: string;
  commit: {
    message: string;
    author?: { date?: string };
    committer?: { date?: string };
  };
};

type TimelineCommit = {
  kind: "commit";
  number: number;
  message: string;
  date: string;
  sha: string;
  status: "success" | "pending";
  live: boolean;
};

type HistoryPayload = {
  productionSha: string | null;
  updatedAt: string;
  commits: TimelineCommit[];
};

let cached: { expiresAt: number; payload: HistoryPayload } | null = null;

const translations: Record<string, string> = {
  "Initial MUKALCHAT": "MUKALCHAT’in ilk sürümü oluşturuldu.",
  "Prepare MUKALCHAT for Vercel deployment": "MUKALCHAT, Vercel deployment sürecine hazırlandı.",
  "Update pnpm lockfile for deployment": "Deployment için pnpm kilit dosyası güncellendi.",
  "Fix API routing on Vercel": "Vercel üzerindeki API yönlendirmesi düzeltildi.",
  "Fix Vercel API routing": "Vercel API yönlendirmesi düzeltildi.",
  "Fix Vercel static deployment config": "Vercel statik deployment yapılandırması düzeltildi.",
  "Fix Vercel API imports and routing": "Vercel API importları ve yönlendirmesi düzeltildi.",
  "Fix Vercel chat API routing": "Vercel sohbet API yönlendirmesi düzeltildi.",
  "Update README.md": "Proje dokümantasyonu güncellendi.",
  "Improve chat responsiveness and UI polish": "Sohbet tepkiselliği ve arayüz ayrıntıları iyileştirildi.",
  "Test rapid presence cleanup and animal identities": "Hızlı çevrimiçi durum temizliği ve hayvan kimlikleri test edildi.",
  "Prevent premature chat disconnects": "Sohbetlerin erken kopması önlendi.",
  "Improve chat disconnect handling and animations": "Sohbet kopma yönetimi ve animasyonlar iyileştirildi.",
  "Update initial search timeout copy": "İlk eşleşme zaman aşımı metni güncellendi.",
  "Add background-aware disconnect cleanup": "Arka plan sekmelerine duyarlı bağlantı temizliği eklendi.",
  "Align chat polling to one-second cadence": "Sohbet polling aralığı düzenlendi.",
  "Update search chip to instant match": "Eşleşme bekleme arayüzü anlık eşleşmeye göre güncellendi.",
  "Add persistent theme settings": "Tema tercihleri kalıcı hale getirildi.",
  "Improve chat presence and message feedback": "Sohbet çevrimiçi durumu ve mesaj geri bildirimi iyileştirildi.",
  "Fix chat lifecycle and message reliability": "Sohbet yaşam döngüsü ve mesaj güvenilirliği düzeltildi.",
  "Compact room card control": "Oda kartı kontrolleri sadeleştirildi.",
  "Redesign Vice City theme": "Vice City teması yeniden tasarlandı.",
  "Run migrations only when Drizzle changes": "Veritabanı migration’ları yalnızca Drizzle değiştiğinde çalışacak şekilde düzenlendi.",
  "Keep Vercel migration gate within limit": "Vercel migration kontrolü limitler içinde tutuldu.",
  "Fix one-minute away timeout and animal rotation": "Uzakta kalma zaman aşımı ve hayvan değişimi düzeltildi.",
  "Reduce hidden chat timeout to 30 seconds": "Gizli sekme sohbet zaman aşımı 30 saniyeye indirildi.",
  "Replace footer MUKAL label with V1.0 BETA": "Footer’daki MUKAL etiketi V1.0 BETA ile değiştirildi.",
  "Add cat easter egg theme": "Kedi Easter egg teması eklendi.",
  "Add music and motion to cat easter egg": "Kedi Easter egg’ine müzik ve hareket eklendi.",
  "Add Turkish changelog page and restore cat easter egg": "Türkçe changelog ve kedi Easter egg’i güncellendi.",
  "Add Vice City music and finalize changelog": "Vice City müziği eklendi ve changelog tamamlandı.",
  "Restore beta label beside changelog link": "Changelog bağlantısının yanındaki beta etiketi geri getirildi.",
  "Open changelog as in-place popup": "Changelog, sayfadan ayrılmadan açılan popup’a dönüştürüldü.",
  "Fix changelog popup scrolling and timeline": "Changelog popup kaydırması ve zaman çizelgesi düzeltildi.",
  "Reduce live chat message latency": "Canlı sohbet mesaj gecikmesi azaltıldı.",
  "Refine changelog cards and themed artwork": "Changelog kartları ve temalı görseller iyileştirildi.",
  "Add changelog Vice City music control": "Changelog’a Vice City müzik kontrolü eklendi.",
};

function translate(message: string) {
  const subject = message.split("\n")[0].trim();
  return translations[subject] ?? `Proje geliştirildi: ${subject}`;
}

function noStore(res: Response) {
  res.set("Cache-Control", "no-store, max-age=0");
  res.set("Pragma", "no-cache");
}

async function getTimeline(): Promise<HistoryPayload> {
  if (cached && cached.expiresAt > Date.now()) return cached.payload;
  const response = await fetch(API_URL, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "MUKALCHAT-history" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`github_${response.status}`);
  const commits = (await response.json()) as GitHubCommit[];
  const productionSha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? null;
  const chronological = [...commits].reverse();
  const liveIndex = productionSha ? chronological.findIndex(commit => commit.sha === productionSha) : chronological.length - 1;
  const payload = {
    productionSha,
    updatedAt: new Date().toISOString(),
    commits: chronological.map((commit, index): TimelineCommit => ({
      kind: "commit",
      number: index + 1,
      message: translate(commit.commit.message),
      date: commit.commit.author?.date ?? commit.commit.committer?.date ?? new Date().toISOString(),
      sha: commit.sha,
      status: liveIndex >= 0 && index <= liveIndex ? "success" : "pending",
      live: commit.sha === productionSha,
    })),
  };
  cached = { expiresAt: Date.now() + CACHE_MS, payload };
  return payload;
}

export function registerHistoryRoutes(app: Express) {
  app.get("/api/history", async (_req: Request, res: Response) => {
    noStore(res);
    try {
      res.json({ ok: true, ...(await getTimeline()) });
    } catch (error) {
      console.error("[history]", error);
      res.status(502).json({ ok: false, error: "history_unavailable" });
    }
  });
}
