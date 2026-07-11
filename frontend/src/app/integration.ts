export type AnalysisStatus = "queued" | "processing" | "complete" | "failed";

export type BriefField = {
  key: "industry" | "location" | "customer" | "budget" | "timing";
  label: string;
  value: string;
  confidence: number;
  missing?: boolean;
};

export type ClarifyingQuestion = {
  id: string;
  question: string;
  options: string[];
  required: boolean;
};

export type ProcessingStep = {
  id: string;
  label: string;
  status: AnalysisStatus;
  evidenceCount: number;
  confidence: number;
};

export type EvidenceSource = {
  name: string;
  type: "review" | "social" | "report" | "benchmark" | "observation";
  confidence: number;
  url?: string;
};

export type ReportClaim = {
  text: string;
  implication: string;
  confidence: number;
  sources: EvidenceSource[];
};

export type SlideDeckSummary = {
  title: string;
  slideCount: number;
  status: "available" | "locked" | "generating";
};

export type AnalysisRequest = {
  id: string;
  topic: string;
  status: AnalysisStatus;
  createdAt: string;
  brief: BriefField[];
  clarifyingQuestions: ClarifyingQuestion[];
};

export type UsageSummary = {
  used: number;
  limit: number;
  resetAt: string;
};

export type AuthProvider = "email" | "google" | "facebook" | "phone";

export type AuthResult = {
  ok: boolean;
  provider: AuthProvider;
  userId: string;
};

const usage: UsageSummary = {
  used: 1,
  limit: 3,
  resetAt: "2026-08-01",
};

export const frontendAdapter = {
  getUsage(): UsageSummary {
    return usage;
  },

  signIn(provider: AuthProvider = "email"): AuthResult {
    return { ok: true, provider, userId: "demo-ceo" };
  },

  signOut(): void {},

  createAnalysis(topic: string): AnalysisRequest {
    usage.used = Math.min(usage.used + 1, usage.limit);

    return {
      id: `analysis-${Date.now()}`,
      topic,
      status: "queued",
      createdAt: new Date().toISOString(),
      brief: [
        { key: "industry", label: "Industri", value: "Perlu dikonfirmasi", confidence: 48, missing: true },
        { key: "location", label: "Lokasi", value: "Dago, Bandung", confidence: 76 },
        { key: "customer", label: "Target pembeli", value: "Mahasiswa dan pekerja remote", confidence: 68 },
        { key: "budget", label: "Modal awal", value: "Belum disebutkan", confidence: 0, missing: true },
        { key: "timing", label: "Waktu buka", value: "Belum disebutkan", confidence: 0, missing: true },
      ],
      clarifyingQuestions: [
        {
          id: "budget-range",
          question: "Berapa rentang modal awal yang ingin dianalisis?",
          options: ["< Rp50jt", "Rp50–150jt", "> Rp150jt"],
          required: true,
        },
      ],
    };
  },
};
