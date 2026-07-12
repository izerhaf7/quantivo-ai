// frontend/src/app/api/reportAdapter.ts — maps a real backend Report into the
// exact shape App.tsx's REPORT_DATA[language] already has, so ReportView /
// FullReportView / SlideDeckView keep using their existing (already
// i18n-correct, already-verified) JSX unchanged -- only the data source
// changes. Fields the backend doesn't produce (sentimentTrend,
// revenueProjection, structured priorities/risks) get honest, clearly-marked
// placeholders rather than invented numbers; see comments per field below.
import type { Language, Level } from "../App";
import type { Report } from "./types";

export type ReportViewModel = {
  topic: string;
  date: string;
  overallScore: number;
  sentimentPos: number;
  sentimentNeu: number;
  sentimentNeg: number;
  sentimentTrend: { month: string; pos: number; neg: number }[];
  revenueProjection: { q: string; base: number; opt: number }[];
  competitors: { name: string; score: number; share: number; growth: string }[];
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  priorities: { rank: number; title: string; impact: Level; effort: Level; timeframe: string }[];
  risks: { risk: string; prob: Level; impact: Level; mitigation: string }[];
  claims: { text: string; source: string; conf: number }[];
  executiveSummary: string;
  narrative: string;
  marketInsights: string[];
  degradationNotes: string[];
  sentimentSources: string[];
  sentimentSampleTotal: number;
};

export function formatDate(iso: string, language: Language): string {
  try {
    return new Date(iso).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return iso;
  }
}

// No score field exists on the backend Report -- composite of the two
// quantitative confidence scores the spec DOES guarantee (never
// LLM-generated), weighted toward sentiment since it's the more direct
// "is this well-received" signal. Explicitly a derived/UI-only number.
// Shared with historyAdapter.ts so History/recent-analyses rows show the
// same score a report's own page would compute for it.
export function computeOverallScore(
  distribution: Record<string, number> | null | undefined,
  sentimentConfidence: number | null | undefined,
  swotConfidence: number | null | undefined,
): number {
  const sentimentPos = Math.round((distribution?.positive ?? 0) * 100);
  const sentimentConf = sentimentConfidence ?? 0.5;
  const swotConf = swotConfidence ?? 0.5;
  return Math.round((sentimentPos * 0.5) + (sentimentConf * 30) + (swotConf * 20));
}

export function reportToViewModel(
  report: Report, language: Language, fallbackTopic: string,
): ReportViewModel {
  const dist = report.sentiment?.overall_distribution ?? {};
  const sentimentPos = Math.round((dist.positive ?? 0) * 100);
  const sentimentNeu = Math.round((dist.neutral ?? 0) * 100);
  const sentimentNeg = Math.round((dist.negative ?? 0) * 100);

  const overallScore = computeOverallScore(
    dist, report.sentiment?.confidence.score, report.swot?.confidence.score,
  );

  const competitors = (report.swot?.competitors ?? []).map((c) => ({
    name: c.name,
    // rating_aggregate is 0-5 stars; no market-share/growth data exists on
    // the backend (never scraped), so those two columns are honestly blank
    // rather than invented -- FullReportView/SlideDeckView render them as-is.
    score: c.rating_aggregate != null ? Math.round((c.rating_aggregate / 5) * 100) : 0,
    share: 0,
    growth: c.review_count != null ? `${c.review_count} ulasan` : "-",
  }));

  const priorities = report.recommendations.map((title, i) => ({
    rank: i + 1,
    title,
    // Backend recommendations are plain strings; it doesn't classify
    // impact/effort/timeframe, so these are neutral placeholders, not a
    // real per-item assessment.
    impact: "medium" as Level,
    effort: "medium" as Level,
    timeframe: "-",
  }));

  // Backend has no dedicated risk model -- SWOT threats ARE risks
  // conceptually, so they're reused here instead of leaving Risks empty.
  const risks = (report.swot?.threats ?? []).map((risk) => ({
    risk, prob: "medium" as Level, impact: "medium" as Level, mitigation: "-",
  }));

  // Backend has no per-claim confidence list; synthesize from the two real
  // SectionConfidence objects the spec requires be quantitative.
  const claims: { text: string; source: string; conf: number }[] = [];
  if (report.sentiment) {
    claims.push({
      text: language === "id" ? "Analisis sentimen konsumen" : "Consumer sentiment analysis",
      source: report.sentiment.sources.join(", ") || "-",
      conf: Math.round(report.sentiment.confidence.score * 100),
    });
  }
  if (report.swot) {
    claims.push({
      text: language === "id" ? "Analisis SWOT & kompetitor" : "SWOT & competitor analysis",
      source: `${report.swot.competitors.length} ${language === "id" ? "kompetitor terdeteksi" : "competitors detected"}`,
      conf: Math.round(report.swot.confidence.score * 100),
    });
  }

  return {
    topic: fallbackTopic,
    date: formatDate(report.generated_at, language),
    overallScore,
    sentimentPos, sentimentNeu, sentimentNeg,
    sentimentTrend: [],      // no time-series data on the backend (MVP scope)
    revenueProjection: [],   // no financial projection data on the backend (MVP scope)
    competitors,
    swot: {
      strengths: report.swot?.strengths ?? [],
      weaknesses: report.swot?.weaknesses ?? [],
      opportunities: report.swot?.opportunities ?? [],
      threats: report.swot?.threats ?? [],
    },
    priorities,
    risks,
    claims,
    executiveSummary: report.executive_summary,
    narrative: report.narrative,
    marketInsights: report.market_insights,
    degradationNotes: report.degradation_notes,
    sentimentSources: report.sentiment?.sources ?? [],
    sentimentSampleTotal: (report.sentiment?.points ?? []).reduce((s, p) => s + p.sample_size, 0),
  };
}
