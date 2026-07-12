// frontend/src/app/api/historyAdapter.ts — maps AnalysisSummary[] (GET
// /api/analyses) into the row shape HistoryView / HomeView's "recent
// analyses" list already render, mirroring reportAdapter.ts's pattern:
// reuse the same scoring formula (computeOverallScore) so a report's score
// on its own page and its row in History never disagree. Analyses that
// haven't finished yet (no report/confidence data) get isReady=false and a
// null score/sentiment rather than a misleading default.
import type { Language } from "../App";
import type { AnalysisStatus, AnalysisSummary, Sentiment } from "./types";
import { TERMINAL_STATUSES } from "./types";
import { CATEGORY_LABEL_EN, CATEGORY_LABEL_ID } from "./businessInput";
import { computeOverallScore, formatDate } from "./reportAdapter";

export type HistoryItem = {
  analysisId: string;
  topic: string;
  tag: string;
  date: string;
  time: string;
  status: AnalysisStatus;
  isReady: boolean;
  score: number | null;
  sentiment: Sentiment | null;
};

function dominantSentiment(dist: Record<string, number> | null | undefined): Sentiment | null {
  if (!dist) return null;
  const entries = Object.entries(dist).filter(([k]) => k === "positive" || k === "neutral" || k === "negative");
  if (entries.length === 0) return null;
  return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0] as Sentiment;
}

export function summaryToHistoryItem(s: AnalysisSummary, language: Language): HistoryItem {
  const categoryLabels = language === "id" ? CATEGORY_LABEL_ID : CATEGORY_LABEL_EN;
  // executive_summary is only ever set once a Report exists (see
  // store.py::list_summaries) -- a more reliable "is there something to
  // open" signal than sentiment_distribution, which can be null on a
  // completed-but-degraded report (e.g. sentiment source failed) that still
  // has a real narrative/SWOT worth showing.
  const isReady = TERMINAL_STATUSES.includes(s.status) && s.status !== "failed" && !!s.executive_summary;
  const created = new Date(s.created_at);
  let time = "";
  try {
    time = created.toLocaleTimeString(language === "id" ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    time = "";
  }
  return {
    analysisId: s.analysis_id,
    topic: s.business_type,
    tag: categoryLabels[s.category],
    date: formatDate(s.created_at, language),
    time,
    status: s.status,
    isReady,
    score: isReady ? computeOverallScore(s.sentiment_distribution, s.sentiment_confidence, s.swot_confidence) : null,
    sentiment: dominantSentiment(s.sentiment_distribution),
  };
}
