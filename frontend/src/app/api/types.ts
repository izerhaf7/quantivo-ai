// frontend/src/app/api/types.ts — TS mirror of contracts/contracts.py (v1.1.0).
// Hand-written, not generated: keep in sync with contracts.py when fields
// change there (see CLAUDE.md's contract-first rule — bump CONTRACT_VERSION
// and update both sides). Only the fields the frontend actually consumes are
// included; backend fields with no UI use are omitted rather than guessed at.

export type IndustryCategory =
  | "food_beverage" | "retail" | "fashion" | "beauty" | "services"
  | "health" | "education" | "tech_digital" | "agriculture" | "other";

export type BusinessStage = "idea" | "new" | "established" | "expanding";

export type PrimaryGoal =
  | "validate_idea" | "assess_location" | "know_competitors"
  | "find_product_gap" | "measure_demand";

export type TargetCustomer =
  | "students" | "office_workers" | "factory_workers" | "families"
  | "youth" | "tourists" | "general";

export type BudgetRange = "under_10m" | "10m_50m" | "50m_200m" | "over_200m" | "undisclosed";

export type Location = {
  city: string;
  district?: string | null;
  province?: string | null;
};

export type BusinessInput = {
  business_type: string;
  description: string;
  location: Location;
  category: IndustryCategory;
  radius_km?: number;
  business_stage: BusinessStage;
  primary_goals?: PrimaryGoal[];
  target_customers?: TargetCustomer[];
  known_competitors?: string[];
  unique_value?: string | null;
  budget_range?: BudgetRange | null;
  business_name?: string | null;
};

export type ScopeConfig = {
  scope_id: string;
  business_input: BusinessInput;
  interpreted_summary: string;
  search_keywords: string[];
  competitor_query: string;
  created_at: string;
  expires_at: string;
};

export type AnalysisStatus =
  | "awaiting_confirmation" | "confirmed" | "scraping" | "routing"
  | "preprocessing" | "indexing" | "analyzing" | "composing"
  | "completed" | "partial" | "failed";

export type CreateAnalysisResponse = {
  analysis_id: string;
  status: AnalysisStatus;
  scope: ScopeConfig;
};

export type ProgressStage = {
  status: AnalysisStatus;
  pct: number;
  message: string;
};

export type AnalysisStatusResponse = {
  analysis_id: string;
  status: AnalysisStatus;
  progress: ProgressStage;
  sections_ready: string[];
  error?: string | null;
};

export type SectionConfidence = {
  score: number;
  source_count: number;
  agreement: number;
  recency: number;
  explanation: string;
};

export type Sentiment = "positive" | "neutral" | "negative";

export type SentimentPoint = {
  location_tag: string;
  sentiment_score: number;
  label: Sentiment;
  sample_size: number;
  demographics?: Record<string, unknown> | null;
};

export type SentimentResult = {
  scope_id: string;
  points: SentimentPoint[];
  overall_distribution: Record<string, number>;
  sources: string[];
  confidence: SectionConfidence;
};

export type Competitor = {
  name: string;
  category: string;
  rating_aggregate?: number | null;
  review_count?: number | null;
  place_id?: string | null;
};

export type SWOTResult = {
  scope_id: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  competitors: Competitor[];
  confidence: SectionConfidence;
};

export type Visualizations = {
  heatmap_geojson_url?: string | null;
  sentiment_chart_data?: Record<string, unknown> | null;
  competitor_table: Competitor[];
};

export type Report = {
  scope_id: string;
  status: AnalysisStatus;
  executive_summary: string;
  sentiment?: SentimentResult | null;
  swot?: SWOTResult | null;
  market_insights: string[];
  recommendations: string[];
  narrative: string;
  visualizations: Visualizations;
  degradation_notes: string[];
  generated_at: string;
};

export const TERMINAL_STATUSES: readonly AnalysisStatus[] = ["completed", "partial", "failed"];

export type AnalysisSummary = {
  analysis_id: string;
  business_type: string;
  location: Location;
  category: IndustryCategory;
  status: AnalysisStatus;
  created_at: string;
  sentiment_distribution?: Record<string, number> | null;
  sentiment_confidence?: number | null;
  swot_confidence?: number | null;
  executive_summary?: string | null;
};
