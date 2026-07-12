// frontend/src/app/api/businessInput.ts — maps the UI's free-text brief +
// clarification answers into a real backend BusinessInput. Pragmatic keyword
// heuristics, not a full NLU pipeline -- an unrecognized city/category still
// produces a valid request, it just won't be as sharply scoped. Each
// detector returns a `detected` flag alongside its value so callers (the
// BriefReview screen) can honestly show "needs clarification" instead of a
// silently-wrong guess when nothing in the text actually matched.
import type {
  BudgetRange, BusinessInput, BusinessStage, IndustryCategory, TargetCustomer,
} from "./types";

const CATEGORY_KEYWORDS: [RegExp, IndustryCategory][] = [
  [/kafe|cafe|kedai kopi|warung|resto|restoran|rumah makan|makan|kuliner|food|beverage|ayam goreng|ayam geprek|nasi|bakso|soto|mie ayam|seblak|sate|martabak|gorengan|catering|angkringan|warkop|minuman|jajanan/i, "food_beverage"],
  [/minimarket|toko kelontong|retail|grosir|swalayan/i, "retail"],
  [/fashion|baju|pakaian|butik|konveksi|clothing/i, "fashion"],
  [/salon|barbershop|skincare|kecantikan|beauty|spa|perawatan wajah/i, "beauty"],
  [/laundry|bengkel|jasa|service|cuci|reparasi/i, "services"],
  [/klinik|apotek|kesehatan|health|dokter|obat/i, "health"],
  [/bimbel|kursus|les|pendidikan|education|sekolah|tk|paud/i, "education"],
  [/aplikasi|software|startup|digital|tech|it\b/i, "tech_digital"],
  [/pertanian|kebun|farm|agri|peternakan|perikanan/i, "agriculture"],
];

export const CATEGORY_LABEL_ID: Record<IndustryCategory, string> = {
  food_beverage: "F&B / Kuliner", retail: "Retail", fashion: "Fashion",
  beauty: "Kecantikan", services: "Jasa", health: "Kesehatan",
  education: "Pendidikan", tech_digital: "Teknologi/Digital",
  agriculture: "Pertanian", other: "Lainnya",
};
export const CATEGORY_LABEL_EN: Record<IndustryCategory, string> = {
  food_beverage: "F&B / Food", retail: "Retail", fashion: "Fashion",
  beauty: "Beauty", services: "Services", health: "Health",
  education: "Education", tech_digital: "Tech/Digital",
  agriculture: "Agriculture", other: "Other",
};

const CITY_KEYWORDS: [RegExp, { city: string; district?: string; province?: string }][] = [
  [/dago/i, { city: "Bandung", district: "Dago", province: "Jawa Barat" }],
  [/bandung/i, { city: "Bandung", province: "Jawa Barat" }],
  [/depok/i, { city: "Depok", province: "Jawa Barat" }],
  [/bekasi/i, { city: "Bekasi", province: "Jawa Barat" }],
  [/sunter/i, { city: "Jakarta", district: "Sunter", province: "DKI Jakarta" }],
  [/jakarta/i, { city: "Jakarta", province: "DKI Jakarta" }],
  [/surabaya/i, { city: "Surabaya", province: "Jawa Timur" }],
  [/medan/i, { city: "Medan", province: "Sumatera Utara" }],
  [/semarang/i, { city: "Semarang", province: "Jawa Tengah" }],
  [/yogya|jogja/i, { city: "Yogyakarta", province: "DI Yogyakarta" }],
];

// Generic Indonesian administrative-unit pattern ("kecamatan Cimanggis",
// "kota Depok", "kabupaten Bogor", ...) plus bare place phrasing
// ("di Cengkareng", "area Purworejo"). This is deliberately broader than
// the fixed city list so odd but valid locations still flow into the review
// form instead of being overwritten by a Jakarta fallback.
const ADMIN_UNIT_RE = /\b(kecamatan|kec\.?|kelurahan|kel\.?|kota|kabupaten|kab\.?)\s+([a-z][a-z\s]{2,30}?)(?=,|\.|$|\bdi\b|\bkec|\bkel|\bkota|\bkab)/gi;
const BARE_LOCATION_RE = /\b(?:di|area|kawasan|daerah|sekitar)\s+([a-z][a-z\s]{2,30}?)(?=,|\.|$|\buntuk\b|\bdengan\b|\bmodal\b|\btarget\b|\byang\b)/i;

function detectLocationFromText(text: string): { city?: string; district?: string; province?: string } {
  let city: string | undefined;
  let district: string | undefined;
  for (const match of text.matchAll(ADMIN_UNIT_RE)) {
    const unit = match[1].toLowerCase();
    const name = match[2].trim().replace(/\s+/g, " ");
    if (!name) continue;
    const titled = name.replace(/\b\w/g, (c) => c.toUpperCase());
    if (unit.startsWith("kota") || unit.startsWith("kabupaten") || unit.startsWith("kab")) {
      city = titled;
    } else if (unit.startsWith("kec")) {
      district = titled;
    }
    // kelurahan is finer-grained than what BusinessInput.location models
    // (city/district/province only) -- intentionally not captured.
  }
  if (!city && !district) {
    const bare = text.match(BARE_LOCATION_RE)?.[1]?.trim().replace(/\s+/g, " ");
    if (bare) city = bare.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return { city, district };
}

function detectCategory(text: string): { value: IndustryCategory; detected: boolean } {
  const hit = CATEGORY_KEYWORDS.find(([re]) => re.test(text));
  return hit ? { value: hit[1], detected: true } : { value: "other", detected: false };
}

function detectLocation(text: string): {
  city: string; district?: string; province?: string; detected: boolean;
} {
  const generic = detectLocationFromText(text);
  const knownHit = CITY_KEYWORDS.find(([re]) => re.test(text));
  if (knownHit) {
    // A fixed-list match (e.g. "Depok") is more reliable for city/province,
    // but the generic kecamatan/kelurahan scan can still fill in a more
    // specific district than the fixed list knows about (e.g. "Cimanggis").
    return { ...knownHit[1], district: knownHit[1].district ?? generic.district, detected: true };
  }

  if (generic.city) {
    return { city: generic.city, district: generic.district, detected: true };
  }
  // Nothing recognizable -- honest fallback, not a confident guess.
  return { city: "Jakarta", province: "DKI Jakarta", detected: false };
}

function detectCustomers(text: string): { value: TargetCustomer[]; detected: boolean } {
  const hits = CUSTOMER_KEYWORDS.filter(([re]) => re.test(text)).map(([, v]) => v);
  return hits.length > 0 ? { value: hits, detected: true } : { value: ["general"], detected: false };
}

// TargetCustomer is a closed 7-value enum on the backend (contracts.py) --
// broadening this list can't invent new buckets, only recognize more of the
// real phrasings people actually use for the 6 specific ones (e.g. "pelajar"
// and "siswa" are common synonyms for "mahasiswa" that weren't matched
// before). The last pattern is new: text that clearly states a *broad/
// generic* audience ("masyarakat umum", "semua kalangan", ...) used to fall
// through to the same catch-all as text that said nothing about customers
// at all, both reported as detected:false -- that's wrong, an explicit
// "general" answer is still an answer.
const CUSTOMER_KEYWORDS: [RegExp, TargetCustomer][] = [
  [/mahasiswa|pelajar|siswa|siswi|student|kampus|kuliah|universitas|anak sekolah/i, "students"],
  [/pekerja kantor|karyawan|perkantoran|kantoran|kantor|office worker|remote worker|kerja remote|wfh|wfo|pegawai|profesional muda|eksekutif muda/i, "office_workers"],
  [/pabrik|buruh|factory/i, "factory_workers"],
  [/keluarga|family|ibu rumah tangga|\birt\b|rumah tangga|orang tua/i, "families"],
  [/remaja|anak muda|youth|gen z|genz|milenial|millennial/i, "youth"],
  [/turis|wisatawan|tourist|pelancong|traveler/i, "tourists"],
  [/masyarakat umum|khalayak umum|semua kalangan|siapa saja|masyarakat sekitar|warga sekitar|warga lokal|pengunjung|komunitas sekitar/i, "general"],
];

const CUSTOMER_LABEL_ID: Record<TargetCustomer, string> = {
  students: "Mahasiswa", office_workers: "Pekerja kantoran/remote",
  factory_workers: "Pekerja pabrik", families: "Keluarga", youth: "Anak muda",
  tourists: "Wisatawan", general: "Umum",
};
const CUSTOMER_LABEL_EN: Record<TargetCustomer, string> = {
  students: "Students", office_workers: "Office/remote workers",
  factory_workers: "Factory workers", families: "Families", youth: "Youth",
  tourists: "Tourists", general: "General",
};

const STAGE_KEYWORDS: [RegExp, BusinessStage][] = [
  [/sudah (buka|jalan|berjalan|beroperasi)|existing|established|berjalan sejak/i, "established"],
  [/ekspansi|buka cabang|tambah cabang|\bcabang\b|expand|scale up|tambah outlet/i, "expanding"],
  [/baru buka|baru berdiri|baru mulai|new business|<\s*1\s*tahun/i, "new"],
];

function detectStage(text: string): BusinessStage {
  const hit = STAGE_KEYWORDS.find(([re]) => re.test(text));
  return hit ? hit[1] : "idea";
}

// Budget/timing clarification answers come from constrained UI controls
// (pill buttons + a number/date input), not free text -- deliberately, to
// shrink the prompt-injection surface on these two fields. A pill answer is
// one of the enum values below directly; a custom amount is the literal
// string "custom:<millions>"; a timing answer is always "YYYY-MM" or
// "YYYY-MM-DD" (native <input type="month"|"date"> output, so it can never
// contain anything but digits and dashes). resolveBudgetRange/describe*
// below are the single place that turns those safe codes into both the
// real BudgetRange enum and a human sentence for the LLM-facing narrative.
export const BUDGET_OPTIONS: { value: BudgetRange; labelId: string; labelEn: string }[] = [
  { value: "under_10m", labelId: "< Rp10 juta", labelEn: "< Rp10M" },
  { value: "10m_50m", labelId: "Rp10 - 50 juta", labelEn: "Rp10 - 50M" },
  { value: "50m_200m", labelId: "Rp50 - 200 juta", labelEn: "Rp50 - 200M" },
  { value: "over_200m", labelId: "> Rp200 juta", labelEn: "> Rp200M" },
  { value: "undisclosed", labelId: "Belum ingin disebutkan", labelEn: "Prefer not to say" },
];

const BUDGET_RANGE_VALUES: BudgetRange[] = BUDGET_OPTIONS.map((o) => o.value);

export function resolveBudgetRange(answer: string): BudgetRange | undefined {
  if (!answer) return undefined;
  if (answer.startsWith("custom:")) {
    const millions = Number(answer.slice(7));
    if (!Number.isFinite(millions) || millions < 0) return undefined;
    if (millions < 10) return "under_10m";
    if (millions < 50) return "10m_50m";
    if (millions < 200) return "50m_200m";
    return "over_200m";
  }
  return (BUDGET_RANGE_VALUES as string[]).includes(answer) ? (answer as BudgetRange) : undefined;
}

/** Short label for the answer alone (e.g. "Rp10 - 50 juta"), used in the
 * compact chip preview where the field's own label ("Modal awal") already
 * provides the context. */
export function formatBudgetLabel(answer: string, language: "id" | "en"): string {
  if (!answer) return "";
  const id = language === "id";
  if (answer.startsWith("custom:")) {
    const amount = answer.slice(7);
    return id ? `Rp${amount} juta` : `Rp${amount}M`;
  }
  const opt = BUDGET_OPTIONS.find((o) => o.value === answer);
  return opt ? (id ? opt.labelId : opt.labelEn) : "";
}

export function describeBudget(answer: string, language: "id" | "en"): string {
  const label = formatBudgetLabel(answer, language);
  if (!label) return "";
  return language === "id" ? `Modal awal: ${label}` : `Initial budget: ${label}`;
}

const TIMING_RE = /^\d{4}-\d{2}(-\d{2})?$/;

/** Short label for the answer alone (e.g. "Agustus 2026"), used in the
 * compact chip preview. */
export function formatTimingLabel(answer: string, language: "id" | "en"): string {
  if (!TIMING_RE.test(answer)) return "";
  const isFullDate = answer.length === 10;
  const parsed = new Date(`${answer}${isFullDate ? "T00:00:00" : "-01T00:00:00"}`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(language === "id" ? "id-ID" : "en-US",
    isFullDate ? { year: "numeric", month: "long", day: "numeric" } : { year: "numeric", month: "long" });
}

export function describeTiming(answer: string, language: "id" | "en"): string {
  const label = formatTimingLabel(answer, language);
  if (!label) return "";
  return language === "id" ? `Target mulai berjalan: ${label}` : `Target launch: ${label}`;
}

/** UI-facing summary of what the heuristics detected from `query`, in the
 * same shape the BriefReview screen renders as chips -- single source of
 * truth shared with buildBusinessInput() below, so the review screen shows
 * exactly what will actually be sent, not a disconnected guess. */
export type DetectedBrief = {
  category: { label: string; detected: boolean };
  location: { label: string; detected: boolean };
  customers: { label: string; detected: boolean };
};

export function detectBrief(query: string, language: "id" | "en"): DetectedBrief {
  const text = query.trim();
  const cat = detectCategory(text);
  const loc = detectLocation(text);
  const cust = detectCustomers(text);
  const catLabels = language === "id" ? CATEGORY_LABEL_ID : CATEGORY_LABEL_EN;
  const custLabels = language === "id" ? CUSTOMER_LABEL_ID : CUSTOMER_LABEL_EN;

  return {
    category: { label: catLabels[cat.value], detected: cat.detected },
    location: {
      label: loc.district ? `${loc.district}, ${loc.city}` : loc.city,
      detected: loc.detected,
    },
    customers: { label: cust.value.map((c) => custLabels[c]).join(", "), detected: cust.detected },
  };
}

export function buildBusinessInput(
  query: string,
  // Keyed by the stable BriefReviewView field keys: industry, location,
  // customers, budget, timing -- NOT the localized display label (that
  // changes with `language`; the key must not).
  clarificationAnswers: Record<string, string>,
  language: "id" | "en" = "id",
): BusinessInput {
  const text = query.trim() || "Analisis peluang bisnis";
  const budgetAnswer = clarificationAnswers.budget || "";
  const timingAnswer = clarificationAnswers.timing || "";
  // budget/timing are rendered into their human-readable form here, not
  // joined as raw codes -- combinedText below feeds the keyword detectors
  // and the LLM-facing description, neither of which should ever see a
  // literal "10m_50m" or "2026-08" string.
  const budgetNote = describeBudget(budgetAnswer, language);
  const timingNote = describeTiming(timingAnswer, language);
  const extraNotes = [
    clarificationAnswers.industry, clarificationAnswers.location,
    clarificationAnswers.customers, budgetNote, timingNote,
  ].filter(Boolean).join(". ");
  // Re-run detection against query + every clarification answer combined,
  // so a field that was "Perlu"/missing from the free-text alone still gets
  // classified from what the user typed into that field's follow-up box.
  const combinedText = extraNotes ? `${text}. ${extraNotes}` : text;
  const loc = detectLocation(combinedText);

  return {
    business_type: text.length > 80 ? `${text.slice(0, 77)}...` : text,
    description: extraNotes ? `${text}\n\nKonteks tambahan: ${extraNotes}` : text,
    location: { city: loc.city, district: loc.district, province: loc.province },
    category: detectCategory(combinedText).value,
    radius_km: 3,
    business_stage: detectStage(combinedText),
    primary_goals: ["validate_idea", "know_competitors"],
    target_customers: detectCustomers(combinedText).value,
    budget_range: resolveBudgetRange(budgetAnswer),
  };
}
