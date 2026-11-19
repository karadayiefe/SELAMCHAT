import type { Express, Request, Response } from "express";

const OWNER = "karadayiefe";
const REPO = "SELAMCHAT";
const API_ROOT = `https://api.github.com/repos/${OWNER}/${REPO}`;
const API_URL = `${API_ROOT}/commits?per_page=100`;
const CACHE_MS = 30_000;

type GitHubCommit = {
  sha: string;
  commit: {
    message: string;
    author?: { date?: string };
    committer?: { date?: string };
  };
};

type GitHubStatus = { state?: string; context?: string; description?: string | null; target_url?: string | null };
type GitHubCheckRun = { status?: string; conclusion?: string | null };
type VerificationStatus = "success" | "failure" | "pending" | "unknown";
type VerificationResult = {
  ciStatus: VerificationStatus;
  deployment: { status: VerificationStatus; context: string | null };
};

type TimelineCommit = {
  kind: "commit";
  number: number;
  subject: string;
  message: string;
  date: string;
  sha: string;
  ciStatus: VerificationStatus;
  deploymentStatus: VerificationStatus;
  deploymentContext: string | null;
  live: boolean;
};

type HistoryPayload = {
  productionSha: string | null;
  updatedAt: string;
  commits: TimelineCommit[];
};

let cached: { expiresAt: number; payload: HistoryPayload } | null = null;
const verificationCache = new Map<string, VerificationResult>();
let workflowsCache: { expiresAt: number; hasWorkflows: boolean } | null = null;

// Exact subject -> visitor-facing Turkish explanation. Historical brand names
// intentionally remain in the historical entries.
const translations: Record<string, string> = {
  "Initial MUKALCHAT": "MUKALCHAT projesinin ilk sürümü oluşturuldu.",
  "Prepare MUKALCHAT for Vercel deployment": "MUKALCHAT, Vercel deployment sürecine hazırlandı.",
  "Update pnpm lockfile for deployment": "Deployment için pnpm kilit dosyası güncellendi.",
  "Fix API routing on Vercel": "Vercel üzerindeki API yönlendirmesi düzeltildi.",
  "Fix Vercel API routing": "Vercel API yönlendirmesi düzeltildi.",
  "Fix Vercel static deployment config": "Vercel statik deployment yapılandırması düzeltildi.",
  "Fix Vercel API imports and routing": "Vercel API importları ve yönlendirmesi düzeltildi.",
  "Fix Vercel chat API routing": "Vercel sohbet API yönlendirmesi düzeltildi.",
  "Update README.md": "README dokümantasyonu güncellendi.",
  "Improve chat responsiveness and UI polish": "Sohbet tepkiselliği ve arayüz ayrıntıları iyileştirildi.",
  "Test rapid presence cleanup and animal identities": "Hızlı çevrimiçi durum temizliği ve hayvan kimlikleri test edildi.",
  "Prevent premature chat disconnects": "Sohbetlerin erken kopması önlendi.",
  "Improve chat disconnect handling and animations": "Sohbet kopma yönetimi ve animasyonlar iyileştirildi.",
  "Update initial search timeout copy": "İlk eşleşme zaman aşımı metni güncellendi.",
  "Add background-aware disconnect cleanup": "Arka plan sekmelerine duyarlı bağlantı temizliği eklendi.",
  "Align chat polling to one-second cadence": "Sohbet polling aralığı bir saniyelik düzene getirildi.",
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
  "Add live history timeline and optimize chat polling": "Canlı geçmiş zaman çizelgesi ve optimize edilmiş sohbet polling’i eklendi.",
  "Expose live history API on Vercel": "Vercel üzerinde sürüm geçmişi API’si kullanıma açıldı.",
  "Use fast message polling for live chats": "Canlı sohbetlerde mesaj kontrolü hızlandırıldı.",
  "Remove presence write from fast message reads": "Hızlı mesaj okumalarında gereksiz çevrimiçi durum yazımı kaldırıldı.",
  "Reduce message send transaction locking": "Mesaj gönderimindeki veritabanı kilitlenmesi azaltıldı.",
  "Rebrand project from MUKALCHAT to SELAMCHAT": "MUKALCHAT markası SELAMCHAT olarak değiştirildi.",
};

function translate(subject: string) {
  return translations[subject] ?? "Bu commit için Türkçe açıklama henüz eklenmedi.";
}

function noStore(res: Response) {
  res.set("Cache-Control", "no-store, max-age=0");
  res.set("Pragma", "no-cache");
}

async function githubJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "SELAMCHAT-history" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`github_${response.status}`);
  return response.json() as Promise<T>;
}

function aggregateChecks(runs: GitHubCheckRun[]): VerificationStatus {
  if (runs.length === 0) return "unknown";
  if (runs.some(run => ["failure", "cancelled", "timed_out", "action_required", "startup_failure"].includes(run.conclusion ?? ""))) return "failure";
  if (runs.some(run => run.status !== "completed")) return "pending";
  return runs.every(run => run.conclusion === "success" || run.conclusion === "neutral" || run.conclusion === "skipped") ? "success" : "unknown";
}

function aggregateDeployment(statuses: GitHubStatus[]): { status: VerificationStatus; context: string | null } {
  if (statuses.length === 0) return { status: "unknown", context: null };
  const latest = statuses[0];
  const state = latest.state ?? "pending";
  return {
    status: state === "success" ? "success" : state === "failure" || state === "error" ? "failure" : state === "pending" ? "pending" : "unknown",
    context: latest.context ?? null,
  };
}

async function getVerification(sha: string, hasWorkflows: boolean): Promise<VerificationResult> {
  const saved: VerificationResult | undefined = verificationCache.get(sha);
  if (saved) return saved;
  const statusesPromise = githubJson<{ state?: string; statuses?: GitHubStatus[] }>(`/commits/${sha}/status`);
  const checksPromise = hasWorkflows ? githubJson<{ check_runs?: GitHubCheckRun[] }>(`/commits/${sha}/check-runs`) : Promise.resolve({ check_runs: [] });
  const [statusResponse, checks] = await Promise.all([statusesPromise, checksPromise]);
  const result = {
    ciStatus: aggregateChecks(checks.check_runs ?? []),
    deployment: aggregateDeployment(statusResponse.statuses ?? []),
  };
  verificationCache.set(sha, result);
  return result;
}

async function getVerificationSafely(sha: string, hasWorkflows: boolean): Promise<VerificationResult> {
  try {
    return await getVerification(sha, hasWorkflows);
  } catch (error) {
    console.error("[history verification]", sha, error);
    return { ciStatus: "unknown", deployment: { status: "unknown", context: null } };
  }
}

async function getTimeline(): Promise<HistoryPayload> {
  if (cached && cached.expiresAt > Date.now()) return cached.payload;
  const commits = await githubJson<GitHubCommit[]>("/commits?per_page=100");
  let hasWorkflows = Boolean(workflowsCache && workflowsCache.expiresAt > Date.now() && workflowsCache.hasWorkflows);
  if (!workflowsCache || workflowsCache.expiresAt <= Date.now()) {
    try {
      const workflows = await githubJson<{ total_count?: number }>("/actions/workflows");
      hasWorkflows = Number(workflows.total_count ?? 0) > 0;
      workflowsCache = { expiresAt: Date.now() + 300_000, hasWorkflows };
    } catch {
      // No workflow data means CI is unknown; deployment statuses remain usable.
      workflowsCache = { expiresAt: Date.now() + 60_000, hasWorkflows: false };
    }
  }
  const chronological = [...commits].reverse();
  const verified = await Promise.all(chronological.map(commit => getVerificationSafely(commit.sha, hasWorkflows)));
  const productionSha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? null;
  const liveIndex = productionSha ? chronological.findIndex(commit => commit.sha === productionSha) : -1;
  const payload: HistoryPayload = {
    productionSha,
    updatedAt: new Date().toISOString(),
    commits: chronological.map((commit, index) => {
      const subject = commit.commit.message.split("\n")[0].trim();
      return {
        kind: "commit",
        number: index + 1,
        subject,
        message: translate(subject),
        date: commit.commit.author?.date ?? commit.commit.committer?.date ?? new Date().toISOString(),
        sha: commit.sha,
        ciStatus: verified[index].ciStatus,
        deploymentStatus: verified[index].deployment.status,
        deploymentContext: verified[index].deployment.context,
        live: commit.sha === productionSha,
      };
    }),
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
