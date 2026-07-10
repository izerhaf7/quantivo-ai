import { useState, useEffect } from "react";
import {
  Home, Clock, User, Send, ChevronLeft, ChevronRight,
  Search, LogOut, Lock, Eye, EyeOff, CheckCircle2,
  TrendingUp, Download, BarChart2, MapPin, FileText,
  ChevronDown, Shield, Crown,

  AlertTriangle, ArrowRight, ArrowLeft, Phone, Mail,
  Building2, Users, Activity, Target,
  Globe, Layers, RefreshCw, CircleDot, Menu, X, Moon, Sun,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, Cell, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { frontendAdapter } from "./integration";
import CLogoImg from "@/imports/C-Logo.svg";
import ConsultinLogo from "@/imports/Consultin_Logo.svg";
import OnboardingBriefImg from "@/app/assets/illustrations/onboarding-brief.webp";
import OnboardingEvidenceImg from "@/app/assets/illustrations/onboarding-evidence.webp";
import OnboardingWorkflowImg from "@/app/assets/illustrations/onboarding-workflow.webp";
import NanoReportImg from "@/app/assets/illustrations/nano/consultin-report.svg";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | "splash" | "onboarding" | "login" | "signup"
  | "phonenumber" | "phoneverify" | "forgotpassword" | "reset"
  | "home" | "briefreview" | "processing" | "report" | "fullreport"
  | "slidedeck" | "history" | "subscription" | "account";

type ThemeMode = "light" | "dark";
type Language = "id" | "en";

const UI_COPY = {
  id: {
    dashboard: "Dashboard",
    history: "Riwayat",
    account: "Akun",
    freePlan: "Paket Gratis",
    upgrade: "Upgrade ke Pro",
    user: "Akun CEO",
    themeLight: "Mode terang",
    themeDark: "Mode gelap",
    language: "Bahasa",
    mainControl: "Kontrol tampilan",

    // Splash
    splashSubtitle: "Kecerdasan Bisnis AI",

    // Onboarding
    skipOnboarding: "Lewati onboarding",
    step: "Langkah",
    onboardingPreviewTitle: "Pratinjau alur",
    onboardingWorkspace: "Ruang analisis",
    onboardingReadyToReview: "Siap ditinjau",
    onboardingStepTitle: "Langkah onboarding",
    back: "Kembali",
    next: "Lanjut",
    startBrief: "Mulai isi brief",
    onboardingFooterText: "Analisis berjalan setelah brief kamu tinjau dan lengkapi.",

    // Login & Signup & Verification
    loginTitle: "Masuk ke Akun",
    loginSubtitle: "Selamat datang kembali, CEO",
    signupTitle: "Buat Akun Baru",
    signupSubtitle: "Bergabung dengan 2.800+ CEO UMKM Indonesia",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    passwordMinPlaceholder: "Password (min. 8 karakter)",
    namePlaceholder: "Nama Lengkap",
    forgotPasswordLink: "Lupa password?",
    loginButton: "Masuk",
    signupButton: "Buat Akun",
    or: "atau",
    noAccount: "Belum punya akun?",
    haveAccount: "Sudah punya akun?",
    signupLink: "Daftar",
    loginLink: "Masuk",

    // Phone verify
    phoneTitle: "Tambah Nomor Telepon",
    phoneSubtitle: "Opsional · untuk keamanan akun dan notifikasi analisis",
    phonePlaceholder: "8xx xxxx xxxx",
    sendVerifyCode: "Kirim Kode Verifikasi",
    later: "Nanti Saja",
    phoneFooter: "Nomor telepon Anda hanya digunakan untuk keamanan dan tidak akan dibagikan kepada pihak ketiga.",
    otpTitle: "Verifikasi Nomor",
    otpSubtitle: "Masukkan kode 6 digit yang dikirim ke nomor Anda",
    verifyButton: "Verifikasi",
    resendIn: "Kirim ulang dalam",
    resendButton: "Kirim ulang kode",
    changePhoneButton: "← Ganti nomor telepon",

    // Reset Pass
    forgotPassTitle: "Reset Password",
    forgotPassSubtitle: "Pilih metode untuk menerima kode verifikasi",
    emailMethodLabel: "Via Email",
    emailMethodDesc: "Kode dikirim ke c**o@gmail.com",
    whatsappMethodLabel: "Via WhatsApp",
    whatsappMethodDesc: "Kode dikirim ke +62 8xx xxxx xx89",
    resetPassTitle: "Buat Password Baru",
    resetPassSubtitle: "Password harus minimal 8 karakter",
    newPassPlaceholder: "Password baru",
    confirmPassPlaceholder: "Konfirmasi password",
    passNotMatch: "Password tidak cocok",
    resetPassBtn: "Reset Password",

    // Home/Dashboard
    dashboardTable: "Meja Analisis Bisnis",
    dashboardDesc: "Tulis ide mentah. Consultin menyusun brief, menandai asumsi, lalu memakai kuota setelah Anda setuju.",
    dashboardBriefInitial: "Brief bisnis awal",
    quotaSafeText: "Kuota aman sampai Anda konfirmasi",
    dashboardPromptPlaceholder: "Contoh: analisis kompetitor kafe di area Dago Bandung...",
    detectedLocText: "Lokasi terdeteksi otomatis, bisa dikoreksi di brief.",
    createBriefBtn: "Susun brief",
    suggestionsTitle: "Contoh brief kuat",
    suggestionsDesc: "Pakai sebagai titik mulai, bukan template kaku.",
    recentAnalysesTitle: "Analisis terakhir",
    recentAnalysesDesc: "Lanjut dari laporan yang sudah punya bukti dan skor.",
    scoreLabel: "Skor kelayakan pasar",
    remainingQuota: "tersisa",

    // BriefReview
    reviewTitle: "Tinjau brief sebelum analisis",
    reviewSubtitle: "Kuota dipakai setelah brief dikonfirmasi.",
    reviewEnsureContext: "Pastikan konteksnya benar dulu.",
    reviewUserBrief: "Brief pengguna",
    reviewWeakAssumptions: "Yang masih lemah",
    reviewMissingText: "asumsi perlu dikunci.",
    reviewWarningText: "Analisis tetap bisa berjalan, tapi rekomendasi modal dan waktu buka akan ditandai sebagai asumsi.",
    reviewLengkapiText: "Lengkapi sekarang jika keputusan investasi bergantung pada bagian ini.",
    reviewConfirmBtn: "Konfirmasi dan pakai 1 kuota",
    reviewEditBtn: "Edit brief dulu",

    // Processing
    processingTitle: "Mesin Analisis Berjalan",
    processingSubtitle: "4 agen menganalisis sinyal pasar secara paralel.",
    processingVisualizing: "Memvisualisasikan struktur bukti...",
    processingTechnicalDetails: "Detail teknis proses agen",
    processingFinished: "Proses Selesai",
    processingFinishedDesc: "Laporan kelayakan pasar siap dibaca.",

    // Report
    reportTitle: "Laporan Analisis",
    fullReport: "Laporan Lengkap",
    slideDeck: "Slide Deck",
    newAnalysis: "Baru",
    summaryTitle: "Ringkasan eksekutif",
    summaryDesc: "Pasar kafe spesialti di area Dago Bandung menunjukkan momentum pertumbuhan yang kuat dengan peningkatan 34% YoY, didorong oleh demografi mahasiswa dan profesional muda. Namun, masuknya jaringan nasional menciptakan tekanan kompetitif yang signifikan. Rekomendasi utama: fokus pada diferensiasi brand, optimasi digital presence, dan program loyalitas dalam 90 hari pertama.",
    sentimentTrendTitle: "Tren Sentimen (6 Bulan)",
    swotTitle: "Analisis SWOT",
    strengths: "Kekuatan",
    weaknesses: "Kelemahan",
    opportunities: "Peluang",
    threats: "Ancaman",
    priorityTitle: "Prioritas Tindakan",
    priorityDesc: "Langkah terukur berdasarkan dampak pasar dan kemudahan eksekusi.",
    rank: "Peringkat",
    action: "Tindakan",
    impact: "Dampak",
    effort: "Upaya",
    timeframe: "Waktu",
    risksTitle: "Risks & Mitigation",
    risksDesc: "Risiko utama yang diidentifikasi beserta rencana mitigasinya.",
    probability: "Probabilitas",
    mitigation: "Mitigasi",
    evidenceTitle: "Bukti Pendukung & Keyakinan",
    evidenceDesc: "Klaim diuji terhadap data riil dengan persentase tingkat keyakinan.",
    confidence: "Keyakinan",
    source: "Sumber",

    // Full Report
    fullReportTitle: "Laporan Analisis Bisnis Lengkap",
    fullReportSubtitle: "Dossier McKinsey-style dengan pembuktian analitis lengkap",
    marketDynamics: "Dinamika Pasar & Demografi",
    financialProjection: "Proyeksi Finansial",
    competitorDetail: "Lansekap Kompetitif Detail",
    mitigationDetail: "Strategi Risiko & Mitigasi Mendalam",
    slidedeckPromo: "Butuh presentasi? Ekspor alur analisis ini menjadi slide deck pitch dalam satu klik.",

    // Slide Deck
    slideDeckTitle: "Pitch Deck & Laporan Eksekutif",
    slideDeckSubtitle: "10 Slide terstruktur untuk presentasi tim atau investor",
    prevSlide: "Sebelumnya",
    nextSlide: "Selanjutnya",
    viewFullReportBtn: "Lihat Laporan Lengkap",

    // History
    historyTitle: "Riwayat Laporan",
    historySubtitle: "Semua analisis bisnis yang telah diproses sebelumnya",
    historySearchPlaceholder: "Cari berdasarkan topik bisnis...",
    historyTopic: "Topik Bisnis",
    historyDate: "Tanggal",
    historyScore: "Skor",
    historyAction: "Aksi",
    historyOpen: "Buka",
    historyDeleted: "Laporan dihapus",

    // Account / Pricing
    accountHeading: "Akun & Langganan",
    logout: "Keluar",
    activeStatus: "Aktif",
    bestValue: "Paling masuk akal",
    cancelAnytime: "Batal kapan saja, tanpa penalti.",
    dataOwnership: "Data tetap milik Anda.",
    secureTransaction: "Transaksi diproses aman via payment gateway lokal.",
    monthly: "Bulanan",
    yearly: "Tahunan (Hemat 20%)",
  },
  en: {
    dashboard: "Dashboard",
    history: "History",
    account: "Account",
    freePlan: "Free Plan",
    upgrade: "Upgrade to Pro",
    user: "CEO Account",
    themeLight: "Light mode",
    themeDark: "Dark mode",
    language: "Language",
    mainControl: "Display controls",

    // Splash
    splashSubtitle: "AI Business Intelligence",

    // Onboarding
    skipOnboarding: "Skip onboarding",
    step: "Step",
    onboardingPreviewTitle: "Flow preview",
    onboardingWorkspace: "Analysis space",
    onboardingReadyToReview: "Ready to review",
    onboardingStepTitle: "Onboarding step",
    back: "Back",
    next: "Next",
    startBrief: "Start writing brief",
    onboardingFooterText: "Analysis runs after you review and complete the brief.",

    // Login & Signup & Verification
    loginTitle: "Log In to Account",
    loginSubtitle: "Welcome back, CEO",
    signupTitle: "Create New Account",
    signupSubtitle: "Join 2,800+ Indonesian SME CEOs",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    passwordMinPlaceholder: "Password (min. 8 characters)",
    namePlaceholder: "Full Name",
    forgotPasswordLink: "Forgot password?",
    loginButton: "Log In",
    signupButton: "Create Account",
    or: "or",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signupLink: "Register",
    loginLink: "Log In",

    // Phone verify
    phoneTitle: "Add Phone Number",
    phoneSubtitle: "Optional · for account security and analysis notifications",
    phonePlaceholder: "8xx xxxx xxxx",
    sendVerifyCode: "Send Verification Code",
    later: "Maybe Later",
    phoneFooter: "Your phone number is only used for security and will never be shared with third parties.",
    otpTitle: "Verify Number",
    otpSubtitle: "Enter the 6-digit code sent to your number",
    verifyButton: "Verify",
    resendIn: "Resend in",
    resendButton: "Resend code",
    changePhoneButton: "← Change phone number",

    // Reset Pass
    forgotPassTitle: "Reset Password",
    forgotPassSubtitle: "Choose method to receive verification code",
    emailMethodLabel: "Via Email",
    emailMethodDesc: "Code sent to c**o@gmail.com",
    whatsappMethodLabel: "Via WhatsApp",
    whatsappMethodDesc: "Code sent to +62 8xx xxxx xx89",
    resetPassTitle: "Create New Password",
    resetPassSubtitle: "Password must be at least 8 characters",
    newPassPlaceholder: "New password",
    confirmPassPlaceholder: "Confirm password",
    passNotMatch: "Passwords do not match",
    resetPassBtn: "Reset Password",

    // Home/Dashboard
    dashboardTable: "Business Analysis Table",
    dashboardDesc: "Write your raw idea. Consultin creates the brief, marks weak assumptions, and uses quota only after you agree.",
    dashboardBriefInitial: "Initial business brief",
    quotaSafeText: "Quota is safe until you confirm",
    dashboardPromptPlaceholder: "Example: competitor analysis for specialty cafe in Dago Bandung...",
    detectedLocText: "Location auto-detected, can be corrected in brief.",
    createBriefBtn: "Compose brief",
    suggestionsTitle: "Examples of strong briefs",
    suggestionsDesc: "Use as starting points, not rigid templates.",
    recentAnalysesTitle: "Recent analyses",
    recentAnalysesDesc: "Continue from reports that already have evidence and scores.",
    scoreLabel: "Market viability score",
    remainingQuota: "remaining",

    // BriefReview
    reviewTitle: "Review brief before analysis",
    reviewSubtitle: "Quota used only after brief is confirmed.",
    reviewEnsureContext: "Ensure context is correct first.",
    reviewUserBrief: "User brief",
    reviewWeakAssumptions: "Remaining Weaknesses",
    reviewMissingText: "assumptions need to be locked.",
    reviewWarningText: "Analysis can still run, but budget and timing recommendations will be marked as assumptions.",
    reviewLengkapiText: "Complete this now if your investment decision depends on these details.",
    reviewConfirmBtn: "Confirm & use 1 quota",
    reviewEditBtn: "Edit brief first",

    // Processing
    processingTitle: "Analysis Engine Running",
    processingSubtitle: "4 agents analyzing local market signals in parallel.",
    processingVisualizing: "Visualizing evidence structure...",
    processingTechnicalDetails: "Agent technical execution details",
    processingFinished: "Process Finished",
    processingFinishedDesc: "Market feasibility report is ready to read.",

    // Report
    reportTitle: "Analysis Report",
    fullReport: "Full Report",
    slideDeck: "Slide Deck",
    newAnalysis: "New",
    summaryTitle: "Executive Summary",
    summaryDesc: "The specialty cafe market in Dago Bandung shows strong growth momentum with a 34% YoY increase, driven by college students and young professionals. However, the entry of national chains creates significant competitive pressure. Primary recommendation: focus on brand differentiation, digital presence optimization, and loyalty programs within the first 90 days.",
    sentimentTrendTitle: "Sentiment Trend (6 Months)",
    swotTitle: "SWOT Analysis",
    strengths: "Strengths",
    weaknesses: "Weaknesses",
    opportunities: "Opportunities",
    threats: "Threats",
    priorityTitle: "Priority Action Items",
    priorityDesc: "Measured steps based on market impact and execution effort.",
    rank: "Rank",
    action: "Action",
    impact: "Impact",
    effort: "Effort",
    timeframe: "Timeframe",
    risksTitle: "Risks & Mitigation",
    risksDesc: "Key identified risks and their corresponding mitigation strategies.",
    probability: "Probability",
    mitigation: "Mitigation",
    evidenceTitle: "Supporting Evidence & Confidence",
    evidenceDesc: "Claims tested against real data with percentage confidence levels.",
    confidence: "Confidence",
    source: "Source",

    // Full Report
    fullReportTitle: "Full Business Analysis Report",
    fullReportSubtitle: "McKinsey-style dossier with comprehensive analytical validation",
    marketDynamics: "Market Dynamics & Demographics",
    financialProjection: "Financial Projections",
    competitorDetail: "Detailed Competitive Landscape",
    mitigationDetail: "In-depth Risk & Mitigation Strategy",
    slidedeckPromo: "Need a presentation? Export this analysis flow into a pitch deck slide in one click.",

    // Slide Deck
    slideDeckTitle: "Pitch Deck & Executive Report",
    slideDeckSubtitle: "10 Structured slides for team or investor presentations",
    prevSlide: "Previous",
    nextSlide: "Next",
    viewFullReportBtn: "View Full Report",

    // History
    historyTitle: "Report History",
    historySubtitle: "All business analyses processed previously",
    historySearchPlaceholder: "Search by business topic...",
    historyTopic: "Business Topic",
    historyDate: "Date",
    historyScore: "Score",
    historyAction: "Action",
    historyOpen: "Open",
    historyDeleted: "Report deleted",

    // Account / Pricing
    accountHeading: "Account & Subscription",
    logout: "Log Out",
    activeStatus: "Active",
    bestValue: "Most popular",
    cancelAnytime: "Cancel anytime, no penalty.",
    dataOwnership: "Data remains yours.",
    secureTransaction: "Transactions processed securely via local payment gateway.",
    monthly: "Monthly",
    yearly: "Yearly (Save 20%)",
  },
} as const;

// ─── Shared data ──────────────────────────────────────────────────────────────
const REPORT_DATA = {
  topic: "Kafe Spesialti di Area Dago, Bandung",
  date: "8 Juli 2026",
  overallScore: 82,
  sentimentPos: 71, sentimentNeu: 18, sentimentNeg: 11,
  sentimentTrend: [
    { month: "Jan", pos: 62, neg: 18 }, { month: "Feb", pos: 65, neg: 16 },
    { month: "Mar", pos: 68, neg: 15 }, { month: "Apr", pos: 70, neg: 13 },
    { month: "Mei", pos: 71, neg: 11 }, { month: "Jun", pos: 74, neg: 10 },
  ],
  revenueProjection: [
    { q: "Q1 '26", base: 420, opt: 520 }, { q: "Q2 '26", base: 480, opt: 610 },
    { q: "Q3 '26", base: 530, opt: 680 }, { q: "Q4 '26", base: 610, opt: 790 },
  ],
  competitors: [
    { name: "Kopi Kenangan", score: 88, share: 24, growth: "+12%" },
    { name: "Filosofi Kopi", score: 84, share: 18, growth: "+8%" },
    { name: "Kopi Tuku", score: 79, share: 15, growth: "+15%" },
    { name: "Anomali Coffee", score: 76, share: 11, growth: "+5%" },
    { name: "Target UMKM", score: 68, share: 6, growth: "Baru" },
  ],
  swot: {
    strengths: ["Lokasi strategis dekat kampus ITB & Unpad", "Konsep specialty coffee yang unik & Instagram-worthy", "Harga premium terjangkau (Rp 32-58k)"],
    weaknesses: ["Brand awareness masih rendah vs. chain nasional", "Kapasitas seating terbatas (max 40 pax)", "Keterbatasan modal untuk ekspansi"],
    opportunities: ["Pertumbuhan komunitas coffee enthusiast Bandung +34% YoY", "Tren work-from-café pasca pandemi belum jenuh", "Potensi kolaborasi dengan local roaster"],
    threats: ["Masuknya chain nasional Kopi Kenangan di koridor Dago", "Kenaikan harga biji kopi arabica +22% (2026)", "Regulasi UMKM digital belum jelas"],
  },
  priorities: [
    { rank: 1, title: "Perbaiki kehadiran digital", impact: "Tinggi", effort: "Rendah", timeframe: "0-3 bln" },
    { rank: 2, title: "Uji program loyalitas", impact: "Tinggi", effort: "Sedang", timeframe: "1-4 bln" },
    { rank: 3, title: "Susun ulang margin menu", impact: "Sedang", effort: "Rendah", timeframe: "Segera" },
    { rank: 4, title: "Validasi pivot work-from-café", impact: "Tinggi", effort: "Tinggi", timeframe: "6-12 bln" },
  ],
  risks: [
    { risk: "Kenaikan harga bahan baku", prob: "Tinggi", impact: "Sedang", mitigation: "Kontrak jangka panjang dengan supplier" },
    { risk: "Entry kompetitor baru", prob: "Sedang", impact: "Tinggi", mitigation: "Percepat brand differentiation" },
    { risk: "Perubahan preferensi konsumen", prob: "Rendah", impact: "Tinggi", mitigation: "R&D menu berkelanjutan" },
  ],
  claims: [
    { text: "Sentimen positif 71%", source: "Google Maps · Trip Advisor · Instagram (n=847)", conf: 92 },
    { text: "Pasar tumbuh 34% YoY", source: "BPS Jawa Barat · Industry Report 2026", conf: 88 },
    { text: "Proyeksi revenue Q4 Rp790jt", source: "Model DCF internal + benchmark industri", conf: 75 },
    { text: "CAC coffee shop Rp 45rb/pelanggan", source: "Meta Ads benchmark F&B Indonesia", conf: 83 },
    { text: "Dwell time optimal 47 menit", source: "IoT sensor data + observasi lapangan", conf: 90 },
  ],
};

// ─── Utility ──────────────────────────────────────────────────────────────────
function cn(...cls: (string | false | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

function InputField({
  icon: Icon, type = "text", placeholder, value, onChange, right,
}: {
  icon?: React.ElementType; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; right?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] bg-white/[0.055] p-1 ring-1 ring-white/10 transition-[background,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:bg-blue-500/12 focus-within:ring-blue-400/35">
      <div className="flex items-center gap-3 rounded-[calc(1.35rem-0.25rem)] bg-black/22 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        {Icon && <Icon size={17} strokeWidth={1.8} className="text-white/46 shrink-0" />}
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-5 flex-1 bg-transparent text-white text-sm font-['Plus_Jakarta_Sans'] outline-none placeholder:text-white/34"
        />
        {right}
      </div>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, className }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={cn(
        "group inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-[1.35rem] bg-primary px-5 py-3.5 text-sm font-semibold font-['Plus_Jakarta_Sans'] tracking-tight text-primary-foreground shadow-[0_16px_34px_rgba(42,116,196,0.20)]",
        "transition-[transform,background,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#163151] hover:shadow-[0_18px_42px_rgba(12,24,40,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </button>
  );
}

function EvidenceMap() {
  return (
    <div className="relative min-h-44 overflow-hidden rounded-[1.5rem] bg-[#091321] p-4 ring-1 ring-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(110,168,216,0.22),transparent_32%),radial-gradient(circle_at_76%_18%,rgba(11,122,106,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative grid h-full grid-cols-[0.8fr_1fr] gap-3">
        <div className="flex flex-col justify-between rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/10">
          <span className="text-[10px] font-semibold text-[#9CC8EF] font-['Plus_Jakarta_Sans']">Brief</span>
          <span className="text-lg font-bold leading-none text-white font-['Plus_Jakarta_Sans']">5 fields</span>
          <span className="text-[11px] text-white/52 font-['Plus_Jakarta_Sans']">2 asumsi lemah</span>
        </div>
        <div className="grid gap-2">
          {["Google Maps", "Instagram", "BPS Jabar"].map((source, index) => (
            <div key={source} className="flex items-center justify-between rounded-xl bg-white/[0.07] px-3 py-2 ring-1 ring-white/10">
              <span className="text-[11px] text-white/72 font-['Plus_Jakarta_Sans']">{source}</span>
              <span className="font-mono text-[11px] text-[#9CC8EF]">{[312, 284, 88][index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Auth split-panel layout ──────────────────────────────────────────────────
const AUTH_FEATURES = [
  { Icon: Activity, label: "4 AI agents bekerja serial & paralel" },
  { Icon: FileText, label: "Laporan McKinsey SCR framework" },
  { Icon: Globe, label: "Data real-time 1.000+ sumber web" },
];

function AuthSplit({ children, title, subtitle, language, onLanguageChange, theme, onThemeChange }: {
  children: React.ReactNode; title?: string; subtitle?: string;
  language: Language; onLanguageChange: (l: Language) => void;
  theme: ThemeMode; onThemeChange: (t: ThemeMode) => void;
}) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-x-[-22%] top-[-36rem] h-[62rem] rounded-full border-[9rem] border-[#3131f5]/45 blur-[96px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_82px] opacity-70 [mask-image:radial-gradient(52%_52%,white,transparent)]" />
      <div className="pointer-events-none absolute left-[12%] top-28 h-[28rem] w-[76%] rounded-full bg-[#206ce8] opacity-24 blur-[128px] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_32%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.72))]" />

      <header className="relative z-10 flex items-center justify-center px-6 py-5 sm:justify-start sm:px-8">
        <ImageWithFallback src={ConsultinLogo} alt="Consultin" className="h-8 w-auto object-contain brightness-0 invert opacity-95" />
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-5rem)] items-center justify-center px-5 pb-10 pt-3 sm:px-8">
        <section className="w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_32px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-7">
          {title && (
            <div className="mb-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6EA8D8] font-['Plus_Jakarta_Sans']">Consultin Access</p>
              <h1 className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans']">{title}</h1>
              {subtitle && <p className="mt-2 text-sm leading-relaxed text-white/52 font-['Plus_Jakarta_Sans']">{subtitle}</p>}
            </div>
          )}
          {children}
        </section>
      </main>
    </div>
  );
}

// ─── App sidebar ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home" as Screen, Icon: Home, label: "Dashboard" },
  { id: "history" as Screen, Icon: Clock, label: "Riwayat" },
  { id: "subscription" as Screen, Icon: Crown, label: "Pro" },
  { id: "account" as Screen, Icon: User, label: "Akun" },
] as const;

function Sidebar({ active, onNavigate, analysisCount, language }: {
  active: Screen; onNavigate: (s: Screen) => void; analysisCount: number;
  language: Language;
}) {
  const isHomeActive = (s: Screen) => ["home","briefreview","processing","report","fullreport"].includes(s);
  const copy = UI_COPY[language];

  return (
    <aside className="hidden md:flex flex-col shrink-0 w-16 lg:w-[220px] xl:w-[240px] bg-[#0B1628] h-dvh sticky top-0 border-r border-white/[0.04]">
      {/* Logo */}
      <div className="h-[60px] flex items-center px-4 lg:px-5 border-b border-white/[0.05]">
        <div className="lg:hidden">
          <ImageWithFallback src={CLogoImg} alt="C" className="w-6 h-6 object-contain" />
        </div>
        <div className="hidden lg:block">
          <ImageWithFallback src={ConsultinLogo} alt="Consultin" className="h-6 w-auto object-contain brightness-0 invert opacity-90" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-0.5">
        {NAV_ITEMS.filter(item => item.id !== "account").map(({ id, Icon, label }) => {
          const on = id === "home" ? isHomeActive(active) : active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-['Plus_Jakarta_Sans'] font-medium transition-all",
                on
                  ? "bg-primary/15 text-primary ring-1 ring-[var(--primary)]/25 shadow-[inset_0_0_0_1px_rgba(42,116,196,0.12)]"
                  : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]",
              )}
            >
              <Icon size={17} className="shrink-0" />
              <span className="hidden lg:block">{id === "home" ? copy.dashboard : id === "history" ? copy.history : label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-2 lg:px-3 pb-4 border-t border-white/[0.05] pt-3 space-y-2">
        <button
          onClick={() => onNavigate("account")}
          className={cn(
            "w-full flex items-center justify-center lg:justify-start gap-2.5 px-1.5 lg:px-2 py-2 rounded-lg transition-all text-left outline-none cursor-pointer border-0 bg-transparent",
            active === "account"
              ? "bg-primary/15 text-primary ring-1 ring-[var(--primary)]/25 shadow-[inset_0_0_0_1px_rgba(42,116,196,0.12)]"
              : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-b from-primary to-foreground flex items-center justify-center shrink-0">
            <User size={13} className="text-white" />
          </div>
          <div className="hidden lg:flex flex-col min-w-0">
            <span className={cn("text-[12px] font-semibold font-['Plus_Jakarta_Sans'] truncate", active === "account" ? "text-white" : "text-white/80")}>{copy.user}</span>
            <span className="text-white/35 text-[10px] font-['Plus_Jakarta_Sans'] truncate">free@consultin.id</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

// Mobile bottom tab bar
function MobileTabBar({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around px-4 pt-2.5 pb-6 z-40">
      {NAV_ITEMS.map(({ id, Icon, label }) => {
        const on = id === "home" ? ["home","briefreview","processing","report","fullreport","slidedeck"].includes(active) : active === id;
        return (
          <button key={id} onClick={() => onNavigate(id)}
            className={cn("flex flex-col items-center gap-0.5 transition-colors", on ? "text-primary" : "text-muted-foreground")}>
            <Icon size={21} strokeWidth={on ? 2.5 : 1.5} />
            <span className="text-[10px] font-['Plus_Jakarta_Sans']">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// App shell wrapper
function AppShell({ children, screen, onNavigate, analysisCount, language, onLanguageChange, theme, onThemeChange }: {
  children: React.ReactNode; screen: Screen; onNavigate: (s: Screen) => void; analysisCount: number;
  language: Language; onLanguageChange: (language: Language) => void;
  theme: ThemeMode; onThemeChange: (theme: ThemeMode) => void;
}) {
  const copy = UI_COPY[language];

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Sidebar active={screen} onNavigate={onNavigate} analysisCount={analysisCount} language={language} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/75 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("home")}>
            <ImageWithFallback src={CLogoImg} alt="C" className="w-6 h-6 object-contain" />
            <span className="text-sm font-bold font-['Plus_Jakarta_Sans'] text-foreground">Consultin</span>
          </div>
          <button onClick={() => onNavigate("account")} className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <User size={15} />
          </button>
        </header>


        <main id="main-content" className="flex-1 min-w-0 overflow-auto pb-24 md:pb-0 relative z-10">
          {children}
        </main>
      </div>
      <MobileTabBar active={screen} onNavigate={onNavigate} />
    </div>
  );
}

// ─── Splash ──────────────────────────────────────────────────────────────────
function SplashView({ language }: { language: Language }) {
  const copy = UI_COPY[language];
  return (
    <div className="min-h-[100dvh] bg-[#0B1628] flex flex-col items-center justify-center gap-5">
      <ImageWithFallback src={ConsultinLogo} alt="Consultin" className="h-9 w-auto object-contain brightness-0 invert opacity-90 motion-safe:animate-pulse" />
      <p className="text-white/35 text-xs font-['Plus_Jakarta_Sans'] tracking-widest uppercase">{copy.splashSubtitle}</p>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
type OnboardingPreview = "brief" | "followup" | "agents";

const OB_SLIDES: { title: string; sub: string; label: string; preview: OnboardingPreview }[] = [
  {
    label: "Langkah 1",
    title: "Mulai dari ide bisnis mentah",
    sub: "Tulis dengan bahasa biasa. Consultin menyusun brief berisi industri, lokasi, target pembeli, tujuan, dan hal yang masih perlu dicek.",
    preview: "brief",
  },
  {
    label: "Langkah 2",
    title: "Lengkapi informasi sebelum diproses",
    sub: "Jika data kurang, Consultin bertanya singkat dulu. Analisis tidak berjalan sampai brief kamu tinjau.",
    preview: "followup",
  },
  {
    label: "Langkah 3",
    title: "Tim analis menandai bukti dan asumsi",
    sub: "Setiap bagian laporan menunjukkan sumber, risiko, asumsi, dan rekomendasi agar kamu tahu mana yang kuat dan mana yang perlu dicek lagi.",
    preview: "agents",
  },
];

function IllustrationFrame({ src, alt, className, imgClassName = "object-cover" }: { src: string; alt: string; className?: string; imgClassName?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[1.45rem] border border-primary/15 bg-card p-1 shadow-[0_18px_45px_rgba(12,24,40,0.08)] ring-1 ring-white/70", className)}>
      <ImageWithFallback src={src} alt={alt} className={cn("h-full w-full rounded-[1.15rem]", imgClassName)} />
    </div>
  );
}

function ReportSkeleton({ language }: { language: Language }) {
  const rows = ["w-11/12", "w-9/12", "w-10/12", "w-7/12"];
  return (
    <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-[0_18px_52px_rgba(12,24,40,0.08)]" aria-busy="true" aria-label={language === "id" ? "Konten laporan sedang dimuat" : "Report content loading"}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="h-3 w-28 rounded-full bg-muted animate-pulse" />
          <div className="mt-2 h-5 w-56 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-24 rounded-full bg-primary/15 animate-pulse" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-2xl border border-border/80 bg-background/70 p-4">
            <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
            <div className="mt-3 h-8 w-16 rounded-lg bg-muted animate-pulse" />
            <div className="mt-3 h-2 w-full rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_16rem]">
        <div className="rounded-2xl border border-border/80 bg-background/70 p-4">
          {rows.map((w, i) => <div key={i} className={cn("mb-3 h-3 rounded-full bg-muted animate-pulse last:mb-0", w)} />)}
        </div>
        <div className="rounded-2xl border border-border/80 bg-background/70 p-3">
          <div className="h-40 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </section>
  );
}

function BriefPreview() {
  const briefItems = [
    ["Industri", "F&B"],
    ["Lokasi", "Dago"],
    ["Target", "Mahasiswa"],
    ["Perlu dicek", "Kompetitor"],
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground font-mono">Input pengguna</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground font-['Plus_Jakarta_Sans']">Mau buka kafe kecil di Dago buat mahasiswa dan pekerja remote.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {briefItems.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground font-mono">{label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground font-['Plus_Jakarta_Sans']">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-2xl border border-primary/25 bg-primary/10 p-4">
        <p className="text-[12px] font-semibold text-primary font-['Plus_Jakarta_Sans']">Brief awal siap ditinjau</p>
        <p className="mt-1 text-xs leading-relaxed text-primary/80 font-['Plus_Jakarta_Sans']">Consultin menandai bagian yang sudah jelas dan bagian yang perlu ditanya lagi.</p>
      </div>
    </div>
  );
}

function FollowUpPreview() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground font-mono">Pertanyaan lanjutan</p>
        <p className="mt-2 text-sm font-semibold text-foreground font-['Plus_Jakarta_Sans']">Berapa rentang modal awal yang ingin dianalisis?</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {["< Rp50jt", "Rp50-150jt", "> Rp150jt"].map((item, i) => (
          <button key={item} aria-pressed={i === 1} className={cn("min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors font-['Plus_Jakarta_Sans'] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", i === 1 ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted")}>{item}</button>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground font-['Plus_Jakarta_Sans']">Kelengkapan brief</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-['Plus_Jakarta_Sans']">4 dari 5 info utama sudah jelas. Waktu pembukaan masih perlu dijawab.</p>
          </div>
          <p className="shrink-0 text-sm font-bold text-success font-mono">4/5</p>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2">
        {[
          ["Modal", "Lengkap"],
          ["Target", "Lengkap"],
          ["Lokasi", "Lengkap"],
          ["Waktu buka", "Perlu jawaban"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-background px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">{label}</p>
            <p className="mt-1 text-xs font-semibold text-foreground font-['Plus_Jakarta_Sans']">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentPipelinePreview() {
  const agents = [
    ["Bukti", "Sumber akan ditampilkan di laporan", "Dapat dicek"],
    ["Kompetitor", "Brand sekitar dipetakan per lokasi", "Terbuka"],
    ["Risiko", "Asumsi dan data lemah ditandai", "Ditandai"],
    ["Rekomendasi", "Prioritas disusun dari bukti terkuat", "Siap tinjau"],
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      {agents.map(([name, task, meta], index) => (
        <div key={name} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-[12px] font-bold text-primary font-mono">{index + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-foreground font-['Plus_Jakarta_Sans']">{name}</p>
                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground font-mono">{meta}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground font-['Plus_Jakarta_Sans']">{task}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OnboardingPreview({ type }: { type: OnboardingPreview }) {
  if (type === "brief") {
    return (
      <div className="flex h-full flex-col gap-5">
        <IllustrationFrame src={OnboardingBriefImg} alt="Analis menyusun brief bisnis dari catatan pengguna" className="h-52 sm:h-60" />
        <BriefPreview />
      </div>
    );
  }

  if (type === "followup") {
    return (
      <div className="flex h-full flex-col gap-5">
        <IllustrationFrame src={OnboardingEvidenceImg} alt="Peta bukti dan pertanyaan lanjutan sebelum analisis berjalan" className="h-52 sm:h-60" />
        <FollowUpPreview />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <IllustrationFrame src={OnboardingWorkflowImg} alt="Ruang kerja analis dengan alur bukti, risiko, dan rekomendasi" className="h-52 sm:h-60" />
      <AgentPipelinePreview />
    </div>
  );
}

function OnboardingView({ onFinish }: { onFinish: () => void }) {
  const [slide, setSlide] = useState(0);
  const s = OB_SLIDES[slide];
  const isLast = slide === OB_SLIDES.length - 1;

  const next = () => {
    if (isLast) onFinish();
    else setSlide(slide + 1);
  };

  return (
    <div className="min-h-dvh bg-background px-5 py-5 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2.5">
            <ImageWithFallback src={CLogoImg} alt="Consultin" className="size-7 object-contain" />
            <span className="text-sm font-bold tracking-tight font-['Plus_Jakarta_Sans']">Consultin</span>
          </div>
          <button onClick={onFinish} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-['Plus_Jakarta_Sans']">Lewati onboarding</button>
        </header>

        <main className="grid flex-1 items-center gap-8 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <section className="order-2 flex flex-col gap-6 lg:order-1">
            <div className="flex flex-col gap-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-primary font-['Plus_Jakarta_Sans']">{s.label}</p>
              <h1 className="max-w-xl text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl font-['Plus_Jakarta_Sans']">{s.title}</h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground font-['Plus_Jakarta_Sans']">{s.sub}</p>
            </div>

            <div className="rounded-[1.4rem] border border-border bg-card/85 p-2 shadow-[0_16px_44px_rgba(12,24,40,0.05)]" aria-label="Langkah onboarding">
              {OB_SLIDES.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => setSlide(i)}
                  aria-current={i === slide ? "step" : undefined}
                  aria-label={`Langkah ${i + 1} dari ${OB_SLIDES.length}: ${item.title}`}
                  className={cn("group flex min-h-12 w-full items-center gap-3 rounded-[1.05rem] px-3 py-2.5 text-left transition-[background,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", i === slide ? "bg-background shadow-[inset_0_0_0_1px_rgba(42,116,196,0.18),0_10px_24px_rgba(12,24,40,0.06)]" : "hover:bg-muted/70")}
                >
                  <span className={cn("flex size-8 items-center justify-center rounded-xl border text-[11px] font-bold font-mono transition-colors", i === slide ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground group-hover:text-foreground")}>{i + 1}</span>
                  <span className="min-w-0">
                    <span className={cn("block text-sm font-semibold font-['Plus_Jakarta_Sans']", i === slide ? "text-foreground" : "text-foreground/82")}>{item.title}</span>
                    <span className={cn("mt-0.5 block h-1.5 rounded-full transition-all", i === slide ? "w-16 bg-primary" : "w-6 bg-border") } />
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-3">
                <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-['Plus_Jakarta_Sans']">Kembali</button>
                <button onClick={next} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-['Plus_Jakarta_Sans']">
                  {isLast ? "Mulai isi brief" : "Lanjut"}
                </button>
              </div>
              {isLast && <p className="text-xs leading-relaxed text-muted-foreground font-['Plus_Jakarta_Sans']">Analisis berjalan setelah brief kamu tinjau dan lengkapi.</p>}
            </div>
          </section>

          <section className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[2rem] border border-primary/12 bg-card/90 p-4 shadow-[0_22px_70px_-44px_rgba(42,116,196,0.36)] ring-1 ring-white/40 sm:p-6 dark:ring-white/5">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(42,116,196,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(42,116,196,0.055)_1px,transparent_1px)] bg-[size:28px_28px]" />
              <div className="relative min-h-[430px] rounded-[1.5rem] border border-primary/10 bg-background/88 p-4 sm:min-h-[480px] sm:p-5 lg:min-h-[560px]">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground font-mono">Pratinjau alur</p>
                    <p className="mt-1 text-sm font-bold text-foreground font-['Plus_Jakarta_Sans']">Ruang analisis</p>
                  </div>
                  <span className="rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success font-mono">Siap ditinjau</span>
                </div>
                <OnboardingPreview type={s.preview} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginView({ onLogin, onSignup, onForgot, language, theme, onThemeChange, onLanguageChange }: {
  onLogin: () => void; onSignup: () => void; onForgot: () => void;
  language: Language; theme: ThemeMode; onThemeChange: (t: ThemeMode) => void;
  onLanguageChange: (l: Language) => void;
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const copy = UI_COPY[language];

  return (
    <AuthSplit title={copy.loginTitle} subtitle={copy.loginSubtitle} language={language} onLanguageChange={onLanguageChange} theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-4">
        <InputField icon={Mail} placeholder={copy.emailPlaceholder} value={email} onChange={setEmail} />
        <InputField
          icon={Lock} type={showPass ? "text" : "password"} placeholder={copy.passwordPlaceholder}
          value={pass} onChange={setPass}
          right={
            <button onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"} className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
              {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          }
        />
        <div className="flex justify-end">
          <button onClick={onForgot} className="text-[13px] font-['Plus_Jakarta_Sans'] text-primary hover:text-primary transition-colors">
            {copy.forgotPasswordLink}
          </button>
        </div>
        <PrimaryBtn onClick={onLogin}>{copy.loginButton}</PrimaryBtn>
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-['Plus_Jakarta_Sans']">{copy.or}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 rounded-xl border border-gray-200/80 bg-white text-[13px] font-['Plus_Jakarta_Sans'] font-semibold text-[#374151] hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button className="py-3 rounded-xl border border-gray-200/80 bg-white text-[13px] font-['Plus_Jakarta_Sans'] font-semibold text-[#374151] hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer">
            <svg className="w-4.5 h-4.5 text-[#1877F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>

            Facebook
          </button>
        </div>
        <p className="text-center text-[13px] text-muted-foreground font-['Plus_Jakarta_Sans']">
          {copy.noAccount}{" "}
          <button onClick={onSignup} className="text-primary font-semibold hover:text-primary transition-colors">
            {copy.signupLink}
          </button>
        </p>
      </div>
    </AuthSplit>
  );
}

// ─── Signup ───────────────────────────────────────────────────────────────────
function SignupView({ onRegister, onSignIn, language, theme, onThemeChange, onLanguageChange }: {
  onRegister: () => void; onSignIn: () => void;
  language: Language; theme: ThemeMode; onThemeChange: (t: ThemeMode) => void;
  onLanguageChange: (l: Language) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const copy = UI_COPY[language];

  return (
    <AuthSplit title={copy.signupTitle} subtitle={copy.signupSubtitle} language={language} onLanguageChange={onLanguageChange} theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-4">
        <InputField icon={User} placeholder={copy.namePlaceholder} value={name} onChange={setName} />
        <InputField icon={Mail} placeholder={copy.emailPlaceholder} value={email} onChange={setEmail} />
        <InputField
          icon={Lock} type={showPass ? "text" : "password"} placeholder={copy.passwordMinPlaceholder}
          value={pass} onChange={setPass}
          right={
            <button onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"} className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
              {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          }
        />
        <PrimaryBtn onClick={onRegister}>{copy.signupButton}</PrimaryBtn>
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-['Plus_Jakarta_Sans']">{copy.or}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 rounded-xl border border-gray-200/80 bg-white text-[13px] font-['Plus_Jakarta_Sans'] font-semibold text-[#374151] hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button className="py-3 rounded-xl border border-gray-200/80 bg-white text-[13px] font-['Plus_Jakarta_Sans'] font-semibold text-[#374151] hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer">
            <svg className="w-4.5 h-4.5 text-[#1877F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>

            Facebook
          </button>
        </div>
        <p className="text-center text-[13px] text-muted-foreground font-['Plus_Jakarta_Sans']">
          {copy.haveAccount}{" "}
          <button onClick={onSignIn} className="text-primary font-semibold hover:text-primary transition-colors">
            {copy.loginLink}
          </button>
        </p>
      </div>
    </AuthSplit>
  );
}

// ─── Phone number ─────────────────────────────────────────────────────────────
function PhoneNumberView({ onVerify, onLater, language, theme, onThemeChange, onLanguageChange }: {
  onVerify: () => void; onLater: () => void;
  language: Language; theme: ThemeMode; onThemeChange: (t: ThemeMode) => void;
  onLanguageChange: (l: Language) => void;
}) {
  const [phone, setPhone] = useState("");
  const copy = UI_COPY[language];
  return (
    <AuthSplit title={copy.phoneTitle} subtitle={copy.phoneSubtitle} language={language} onLanguageChange={onLanguageChange} theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-3 shrink-0">
            <div className="w-5 h-3.5 flex flex-col rounded-[2px] overflow-hidden border border-gray-200 shrink-0">
              <div className="bg-red-600 flex-1" />
              <div className="bg-white flex-1" />
            </div>
            <span className="text-sm font-['Plus_Jakarta_Sans'] text-white font-medium">+62</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </div>
          <InputField icon={Phone} placeholder={copy.phonePlaceholder} value={phone} onChange={setPhone} />
        </div>
        <PrimaryBtn onClick={onVerify} disabled={!phone.trim()}>{copy.sendVerifyCode}</PrimaryBtn>
        <button onClick={onLater} className="w-full py-3.5 rounded-xl bg-muted text-muted-foreground text-sm font-['Plus_Jakarta_Sans'] font-medium hover:bg-muted/80 transition-all cursor-pointer">
          {copy.later}
        </button>
        <p className="text-center text-[12px] text-muted-foreground font-['Plus_Jakarta_Sans']">
          {copy.phoneFooter}
        </p>
      </div>
    </AuthSplit>
  );
}

// ─── OTP Verify ───────────────────────────────────────────────────────────────
function PhoneVerifyView({ onVerify, onBack, language, theme, onThemeChange, onLanguageChange }: {
  onVerify: () => void; onBack: () => void;
  language: Language; theme: ThemeMode; onThemeChange: (t: ThemeMode) => void;
  onLanguageChange: (l: Language) => void;
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(59);
  const refs = otp.map(() => ({ current: null as HTMLInputElement | null }));
  const copy = UI_COPY[language];

  useEffect(() => {
    const t = setInterval(() => setTimer(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1].current?.focus();
  };

  return (
    <AuthSplit title={copy.otpTitle} subtitle={copy.otpSubtitle} language={language} onLanguageChange={onLanguageChange} theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-6">
        <div className="flex gap-2.5 justify-center">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs[i].current = el; }}
              maxLength={1} value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              className={cn(
                "w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border-2 bg-card text-foreground outline-none transition-all",
                d ? "border-primary shadow-[0_0_0_3px_rgba(42,116,196,0.15)]" : "border-border focus:border-primary",
              )}
            />
          ))}
        </div>
        <PrimaryBtn onClick={onVerify} disabled={otp.some(d => !d)}>{copy.verifyButton}</PrimaryBtn>
        <div className="text-center">
          {timer > 0 ? (
            <p className="text-[13px] text-muted-foreground font-['Plus_Jakarta_Sans']">
              {copy.resendIn} <span className="font-mono text-white font-medium">0:{timer.toString().padStart(2,"0")}</span>
            </p>
          ) : (
            <button onClick={() => setTimer(59)} className="text-[13px] text-primary font-['Plus_Jakarta_Sans'] font-semibold hover:text-primary transition-colors flex items-center gap-1.5 mx-auto cursor-pointer">
              <RefreshCw size={13} /> {copy.resendButton}
            </button>
          )}
        </div>
        <button onClick={onBack} className="w-full text-center text-[13px] text-muted-foreground font-['Plus_Jakarta_Sans'] hover:text-foreground transition-colors cursor-pointer">
          {copy.changePhoneButton}
        </button>
      </div>
    </AuthSplit>
  );
}

// ─── Forgot password ──────────────────────────────────────────────────────────
function ForgotPasswordView({ onNext, onBack, language, theme, onThemeChange, onLanguageChange }: {
  onNext: () => void; onBack: () => void;
  language: Language; theme: ThemeMode; onThemeChange: (t: ThemeMode) => void;
  onLanguageChange: (l: Language) => void;
}) {
  const [method, setMethod] = useState<"email" | "phone" | null>(null);
  const copy = UI_COPY[language];
  return (
    <AuthSplit title={copy.forgotPassTitle} subtitle={copy.forgotPassSubtitle} language={language} onLanguageChange={onLanguageChange} theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-4">
        {[
          { id: "email" as const, Icon: Mail, label: copy.emailMethodLabel, desc: copy.emailMethodDesc },
          { id: "phone" as const, Icon: Phone, label: copy.whatsappMethodLabel, desc: copy.whatsappMethodDesc },
        ].map(({ id, Icon, label, desc }) => (
          <button
            key={id} onClick={() => setMethod(id)}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer",
              method === id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
            )}
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
              method === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold font-['Plus_Jakarta_Sans'] text-foreground">{label}</p>
              <p className="text-[12px] text-muted-foreground font-['Plus_Jakarta_Sans']">{desc}</p>
            </div>
            {method === id && <CheckCircle2 size={18} className="text-primary ml-auto shrink-0" />}
          </button>
        ))}
        <PrimaryBtn onClick={onNext} disabled={!method}>{copy.sendVerifyCode}</PrimaryBtn>
        <button onClick={onBack} className="w-full text-center text-[13px] text-muted-foreground font-['Plus_Jakarta_Sans'] hover:text-foreground transition-colors cursor-pointer">
          ← {language === "id" ? "Kembali ke login" : "Back to login"}
        </button>
      </div>
    </AuthSplit>
  );
}

// ─── Reset password ───────────────────────────────────────────────────────────
function ResetPasswordView({ onDone, language, theme, onThemeChange, onLanguageChange }: {
  onDone: () => void;
  language: Language; theme: ThemeMode; onThemeChange: (t: ThemeMode) => void;
  onLanguageChange: (l: Language) => void;
}) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const copy = UI_COPY[language];

  return (
    <AuthSplit title={copy.resetPassTitle} subtitle={copy.resetPassSubtitle} language={language} onLanguageChange={onLanguageChange} theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-4">
        <InputField icon={Lock} type={showP ? "text" : "password"} placeholder={copy.newPassPlaceholder} value={pass} onChange={setPass}
          right={<button onClick={() => setShowP(!showP)} aria-label={showP ? "Sembunyikan password" : "Tampilkan password"} className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">{showP ? <Eye size={16} /> : <EyeOff size={16} />}</button>} />
        <InputField icon={Lock} type={showC ? "text" : "password"} placeholder={copy.confirmPassPlaceholder} value={confirm} onChange={setConfirm}
          right={<button onClick={() => setShowC(!showC)} aria-label={showC ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"} className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">{showC ? <Eye size={16} /> : <EyeOff size={16} />}</button>} />
        {pass && confirm && pass !== confirm && (
          <p className="text-destructive text-[12px] font-['Plus_Jakarta_Sans'] flex items-center gap-1.5"><AlertTriangle size={12} /> {copy.passNotMatch}</p>
        )}
        <PrimaryBtn onClick={onDone} disabled={!pass || pass !== confirm || pass.length < 8}>{copy.resetPassBtn}</PrimaryBtn>
      </div>
    </AuthSplit>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Kafe spesialti di area Dago Bandung",
  "Minimarket di Depok Timur",
  "Laundry kiloan di Bekasi Barat",
  "Warung makan di kawasan Sunter, Jakarta",
];

const RECENT_ANALYSES = [
  { topic: "Kafe di Dago Bandung", date: "Hari ini", score: 82, sentiment: "Positif", tag: "F&B" },
  { topic: "Minimarket Depok Timur", date: "Kemarin", score: 74, sentiment: "Netral", tag: "Retail" },
  { topic: "Laundry kiloan Bekasi", date: "3 hari lalu", score: 68, sentiment: "Positif", tag: "Jasa" },
];

function HomeView({ onSubmit, onOpenReport, analysisCount, language }: { onSubmit: (q: string) => void; onOpenReport: (q: string) => void; analysisCount: number; language: Language }) {
  const copy = UI_COPY[language];
  const suggestions = language === "id" ? SUGGESTIONS : [
    "Specialty cafe in Dago Bandung",
    "Minimarket in East Depok",
    "Kilo laundry in West Bekasi",
    "Food stall in Sunter, Jakarta",
  ];
  const recentAnalyses = language === "id" ? RECENT_ANALYSES : [
    { topic: "Cafe in Dago Bandung", date: "Today", score: 82, sentiment: "Positive", tag: "F&B" },
    { topic: "Minimarket in East Depok", date: "Yesterday", score: 74, sentiment: "Neutral", tag: "Retail" },
    { topic: "Kilo laundry in Bekasi", date: "3 days ago", score: 68, sentiment: "Positive", tag: "Services" },
  ];
  const [query, setQuery] = useState("");
  const [clarifying, setClarifying] = useState(false);
  const lowerQuery = query.toLowerCase();
  const extractedBrief = [
    { label: language === "id" ? "Industri" : "Industry", value: lowerQuery.includes("kafe") || lowerQuery.includes("cafe") ? "F&B / cafe" : lowerQuery.includes("laundry") ? "Services / laundry" : lowerQuery.includes("minimarket") ? "Retail / minimarket" : "-", complete: /kafe|cafe|laundry|minimarket|warung/.test(lowerQuery) },
    { label: language === "id" ? "Lokasi" : "Location", value: lowerQuery.includes("dago") ? "Dago, Bandung" : lowerQuery.includes("depok") ? "Depok" : lowerQuery.includes("bekasi") ? "Bekasi" : lowerQuery.includes("sunter") ? "Sunter, Jakarta" : "-", complete: /dago|depok|bekasi|sunter|bandung|jakarta/.test(lowerQuery) },
    { label: language === "id" ? "Pelanggan" : "Customer", value: lowerQuery.includes("mahasiswa") ? "Mahasiswa" : lowerQuery.includes("remote") ? "Remote workers" : lowerQuery.includes("b2b") ? "B2B" : lowerQuery.includes("b2c") ? "B2C" : "-", complete: /mahasiswa|remote|b2b|b2c|pekerja|customer|pelanggan/.test(lowerQuery) },
    { label: language === "id" ? "Tujuan" : "Goal", value: lowerQuery.includes("kompetitor") ? "Competitor scan" : lowerQuery.includes("modal") ? "Capital planning" : lowerQuery.includes("analisis") || lowerQuery.includes("analysis") ? "Market analysis" : "-", complete: /kompetitor|modal|analisis|analysis|kelayakan|feasibility/.test(lowerQuery) },
  ];
  const completedBrief = extractedBrief.filter((item) => item.complete).length;

  const handleAsk = () => {
    if (!query.trim()) return;
    if (!clarifying && completedBrief < 4) { setClarifying(true); return; }
    onSubmit(query);
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-x-[-20%] top-[-34rem] h-[58rem] rounded-full border-[9rem] border-[#2A74C4] opacity-40 blur-[92px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:68px_78px] [mask-image:radial-gradient(55%_55%,white,transparent)]" />
      <div className="pointer-events-none absolute left-[12%] top-16 h-72 w-[76%] rounded-full bg-[#206ce8] opacity-35 blur-[120px] mix-blend-screen" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 md:px-8 md:pt-20">
        {/* Greeting */}
        <div className="mx-auto mb-7 max-w-3xl text-center">
          <span className="mb-4 inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CC8EF] font-mono">
            Workspace · Free {3 - analysisCount} {copy.remainingQuota}
          </span>
          <h1 className="mx-auto mb-3 max-w-2xl text-3xl font-semibold leading-tight text-white font-['Plus_Jakarta_Sans'] md:text-5xl">
            {copy.dashboardTable}
          </h1>
          <p className="mx-auto max-w-[58ch] text-sm leading-relaxed text-white/62 font-['Plus_Jakarta_Sans']">{copy.dashboardDesc}</p>
        </div>

        {/* Query card */}
        <div className="mb-6 overflow-hidden rounded-[1.8rem] border border-white/10 bg-gradient-to-r from-neutral-950 via-[#101827] to-neutral-950 text-white shadow-[0_-20px_180px_rgba(9,0,255,0.34)]">
          <div className="border-b border-white/10 bg-white/[0.035] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary font-mono">{copy.dashboardBriefInitial}</p>
                <p className="mt-1 text-sm font-semibold text-white font-['Plus_Jakarta_Sans']">{language === "id" ? "Mulai dari kalimat mentah. Consultin susun brief awal." : "Start with a raw sentence. Consultin drafts the first brief."}</p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary font-mono">{copy.quotaSafeText}</span>
            </div>
          </div>
          <div className="p-5">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-4 focus-within:border-[#2A74C4]/70 focus-within:ring-4 focus-within:ring-[#2A74C4]/20">
              <textarea
                value={query} onChange={(e) => { setQuery(e.target.value); setClarifying(false); }}
                placeholder={copy.dashboardPromptPlaceholder}
                rows={4}
                className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-white outline-none placeholder:text-white/36 font-['Plus_Jakarta_Sans']"
              />
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[12px] leading-relaxed text-white/50 font-['Plus_Jakarta_Sans']">
                  {language === "id" ? "Tulis bebas seperti chat. Detail tambahan ditanya setelah brief dikirim." : "Write freely like chat. Extra details come after submit."}
                </p>
              </div>
            </div>

            {clarifying && (
              <div className="mt-4 rounded-[1.25rem] border border-border bg-background/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold text-foreground font-['Plus_Jakarta_Sans']">{language === "id" ? "Preview brief terdeteksi" : "Detected brief preview"}</p>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold font-mono", completedBrief >= 3 ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{completedBrief}/4</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {extractedBrief.map((item) => (
                    <div key={item.label} className={cn("rounded-xl border px-3 py-2.5", item.complete ? "border-primary/20 bg-primary/8" : "border-dashed border-warning/55 bg-warning/10") }>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground font-mono">{item.label}</p>
                      <p className={cn("mt-1 truncate text-[12px] font-semibold font-['Plus_Jakarta_Sans']", item.complete ? "text-foreground" : "text-warning")}>{item.complete ? item.value : (language === "id" ? "Belum jelas" : "Missing")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clarifying && (
              <div className="mt-4 rounded-[1.25rem] border border-warning/45 bg-warning/10 p-4 text-foreground">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/18 text-warning"><AlertTriangle size={15} /></span>
                  <div>
                    <p className="text-[13px] font-bold font-['Plus_Jakarta_Sans']">{language === "id" ? "Informasi kurang untuk analisis tajam." : "More information needed for sharper analysis."}</p>
                    <p className="mt-1 text-[13px] leading-relaxed font-['Plus_Jakarta_Sans']">{language === "id" ? "Brief awal siap. Lengkapi pertanyaan wajib sebelum kuota dipakai." : "First brief ready. Complete required questions before quota is used."}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-white/50">
                <span className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/6"><MapPin size={13} /></span>
                <span className="text-[12px] font-['Plus_Jakarta_Sans']">{clarifying ? (language === "id" ? "Ada detail yang perlu dilengkapi." : "Some details need completion.") : (language === "id" ? "Tidak ada isian wajib sebelum kirim." : "No required fields before submit.")}</span>
              </div>
              <button
                onClick={handleAsk} disabled={!query.trim()}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-[0_14px_32px_rgba(42,116,196,0.24)] transition-[transform,background,box-shadow] hover:bg-secondary hover:text-secondary-foreground hover:shadow-[0_18px_42px_rgba(42,116,196,0.28)] active:scale-[0.98] disabled:opacity-40 font-['Plus_Jakarta_Sans']">
                <Send size={14} /> {clarifying ? (language === "id" ? "Lengkapi informasi" : "Complete information") : copy.createBriefBtn}
              </button>
            </div>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-white font-['Plus_Jakarta_Sans']">{copy.suggestionsTitle}</p>
            <p className="text-[11px] text-white/45 font-['Plus_Jakarta_Sans']">{copy.suggestionsDesc}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => setQuery(s)}
                className="min-h-10 rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-1.5 text-[13px] text-white/82 transition-[background,border-color,transform] hover:border-[#2A74C4]/65 hover:bg-[#2A74C4]/16 active:scale-[0.98] font-['Plus_Jakarta_Sans']">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Recent analyses */}
        {recentAnalyses.length > 0 && (
          <section aria-labelledby="recent-analyses">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id="recent-analyses" className="text-sm font-semibold text-white font-['Plus_Jakarta_Sans']">{copy.recentAnalysesTitle}</h2>
                <p className="mt-0.5 text-xs text-white/45 font-['Plus_Jakarta_Sans']">{copy.recentAnalysesDesc}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white/[0.055] ring-1 ring-white/10 shadow-[0_18px_65px_rgba(0,0,0,0.28)]">
              {recentAnalyses.map((item, index) => (
                <button key={item.topic} onClick={() => onOpenReport(item.topic)}
                  className={cn("group grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left transition-[background,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2A74C4]/16 active:scale-[0.995] sm:grid-cols-[1fr_5.5rem_6rem]", index > 0 && "border-t border-white/10")}>
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-medium text-white/55 font-['Plus_Jakarta_Sans']">{item.tag}</span>
                      <span className="text-[11px] text-white/42 font-['Plus_Jakarta_Sans']">{item.date}</span>
                    </div>
                    <p className="truncate text-[13px] font-semibold text-white font-['Plus_Jakarta_Sans'] group-hover:text-[#9CC8EF]">{item.topic}</p>
                  </div>
                  <span className={cn("hidden text-[12px] font-semibold sm:block", (item.sentiment === "Positif" || item.sentiment === "Positive") ? "text-success" : "text-warning")}>{item.sentiment}</span>
                  <span className="justify-self-end rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground font-mono">{item.score}/100</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const BRIEF_FIELDS = [
  { label: "Industri", value: "F&B / kafe spesialti", confidence: 78 },
  { label: "Lokasi", value: "Dago, Bandung", confidence: 84 },
  { label: "Target pembeli", value: "Mahasiswa dan pekerja remote", confidence: 66 },
  { label: "Modal awal", value: "Belum disebutkan", confidence: 0, missing: true, question: "Berapa rentang modal awal yang ingin dianalisis?", helper: "Masukkan angka kasar agar proyeksi risiko modal tidak menebak.", placeholder: "Contoh: Rp50-150 juta, termasuk renovasi dan stok awal", suggestions: ["< Rp50 juta", "Rp50-150 juta", "> Rp150 juta"] },
  { label: "Waktu buka", value: "Belum disebutkan", confidence: 0, missing: true, question: "Kapan target bisnis ini mulai berjalan?", helper: "Timeline membantu agent membaca musim, momentum lokasi, dan tekanan kompetitor.", placeholder: "Contoh: 3 bulan lagi, sebelum semester baru", suggestions: ["1 bulan lagi", "3 bulan lagi", "Semester baru"] },
];

function BriefReviewView({ query, onConfirm, onBack, language }: { query: string; onConfirm: (extraContext: string) => void; onBack: () => void; language: Language }) {
  const copy = UI_COPY[language];
  const missing = BRIEF_FIELDS.filter((field) => field.missing);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allAnswered = missing.every((field) => (answers[field.label] || "").trim().length >= 3);
  const extraContext = missing.map((field) => `${field.label}: ${(answers[field.label] || "").trim()}`).join("\n");
  const answeredCount = missing.filter((field) => (answers[field.label] || "").trim().length >= 3).length;
  const progressPct = Math.round((answeredCount / missing.length) * 100);

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/85 px-6 py-4 backdrop-blur-md md:px-8">
        <button onClick={onBack} className="flex size-9 items-center justify-center rounded-xl bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronLeft size={16} />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground font-['Plus_Jakarta_Sans']">{copy.reviewTitle}</p>
          <p className="truncate text-xs text-muted-foreground font-['Plus_Jakarta_Sans']">{copy.reviewSubtitle}</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-8 md:px-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[1.75rem] bg-card p-5 ring-1 ring-border shadow-[0_18px_45px_rgba(12,24,40,0.05)]">
          <div className="mb-5">
            <p className="text-xs font-semibold text-primary font-['Plus_Jakarta_Sans']">Brief pengguna</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground font-['Plus_Jakarta_Sans'] md:text-3xl">Pastikan konteksnya benar dulu.</h1>
            <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted-foreground font-['Plus_Jakarta_Sans']">{query || REPORT_DATA.topic}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {BRIEF_FIELDS.map((field) => (
              <div key={field.label} className={cn("rounded-2xl p-4 ring-1", field.missing ? "bg-warning/10 text-foreground ring-warning/35" : "bg-background text-foreground ring-border")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground font-['Plus_Jakarta_Sans']">{field.label}</p>
                    <p className="mt-1 text-sm font-semibold font-['Plus_Jakarta_Sans']">{field.value}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold font-mono", field.missing ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary")}>{field.missing ? "Perlu" : `${field.confidence}%`}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="flex flex-col rounded-[1.75rem] bg-secondary p-5 text-secondary-foreground shadow-[0_24px_70px_rgba(12,24,40,0.24)]">
          <div>
            <p className="text-xs font-semibold text-[#9CC8EF] font-['Plus_Jakarta_Sans']">{language === "id" ? "Form klarifikasi AI" : "AI clarification form"}</p>
            <h2 className="mt-2 text-xl font-bold leading-tight font-['Plus_Jakarta_Sans']">{language === "id" ? "Jawab" : "Answer"} {missing.length} {language === "id" ? "pertanyaan dulu." : "questions first."}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/62 font-['Plus_Jakarta_Sans']">{language === "id" ? "Agent processing baru berjalan setelah jawaban penting terisi, supaya rekomendasi tidak memakai asumsi kosong." : "Agent processing starts only after key answers are filled, so recommendations do not rely on blank assumptions."}</p>
          </div>

          <div className="mt-5 space-y-4">
            {missing.map((field, index) => (
              <label key={field.label} className="block rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CC8EF] font-mono">{language === "id" ? "Pertanyaan" : "Question"} {index + 1}</span>
                <span className="mt-2 block text-sm font-semibold text-white font-['Plus_Jakarta_Sans']">{field.question}</span>
                <textarea
                  value={answers[field.label] || ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [field.label]: event.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#6EA8D8] focus:ring-2 focus:ring-[#6EA8D8]/35 font-['Plus_Jakarta_Sans']"
                />
              </label>
            ))}
          </div>

          <div className="mt-auto grid gap-3 pt-6">
            <button disabled={!allAnswered} onClick={() => onConfirm(extraContext)} className={cn("min-h-12 rounded-full px-5 text-sm font-semibold transition-[transform,background,opacity] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70", allAnswered ? "bg-white text-secondary hover:bg-primary/10 active:scale-[0.98]" : "cursor-not-allowed bg-white/12 text-white/35") }>
              {language === "id" ? "Lanjut ke agent processing" : "Continue to agent processing"}
            </button>
            <button onClick={onBack} className="min-h-11 rounded-full px-5 text-sm font-semibold text-white/70 ring-1 ring-white/15 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              {language === "id" ? "Edit chat awal" : "Edit initial chat"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Processing ───────────────────────────────────────────────────────────────
const AGENT_STEPS = [
  { id: 1, name: "Mengumpulkan sinyal pasar lokal", desc: "Membaca sumber publik: Google Maps, marketplace, media sosial, dan berita industri.", icon: Globe, time: "~45 detik" },
  { id: 2, name: "Membaca sentimen konsumen", desc: "Mengelompokkan ulasan menjadi tema: harga, lokasi, kualitas, ambience, dan keluhan berulang.", icon: Activity, time: "~50 detik" },
  { id: 3, name: "Membandingkan kompetitor", desc: "Memetakan pemain sekitar, kekuatan relatif, dan ruang diferensiasi yang masih terbuka.", icon: Target, time: "~40 detik" },
  { id: 4, name: "Menyusun rekomendasi dan risiko", desc: "Mengubah bukti menjadi prioritas, asumsi lemah, mitigasi, dan rencana 90 hari.", icon: FileText, time: "~35 detik" },
];

function ProcessingView({ query, onComplete, language }: { query: string; onComplete: () => void; language: Language }) {
  const copy = UI_COPY[language];
  const agentSteps = language === "id" ? AGENT_STEPS : [
    { id: 1, name: "Collecting local market signals", desc: "Reading public sources: Google Maps, marketplaces, social media, and industry news.", icon: Globe, time: "~45 sec" },
    { id: 2, name: "Reading consumer sentiment", desc: "Clustering reviews into themes: price, location, quality, ambience, and recurring complaints.", icon: Activity, time: "~50 sec" },
    { id: 3, name: "Comparing competitors", desc: "Mapping nearby players, relative strengths, and open differentiation gaps.", icon: Target, time: "~40 sec" },
    { id: 4, name: "Preparing risks and recommendations", desc: "Turning evidence into priorities, weak assumptions, mitigation, and a 90-day plan.", icon: FileText, time: "~35 sec" },
  ];
  const [step, setStep] = useState(0);
  const [showTech, setShowTech] = useState(false);

  useEffect(() => {
    if (step < agentSteps.length) {
      const t = setTimeout(() => setStep(s => s + 1), 1800);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [step, onComplete]);

  const pct = Math.round((step / agentSteps.length) * 100);

  return (
    <div className="min-h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 md:px-8 py-4 flex items-center gap-3">
        <ImageWithFallback src={ConsultinLogo} alt="Consultin" className="h-5 w-auto object-contain hidden md:block" />
        <ImageWithFallback src={CLogoImg} alt="C" className="w-5 h-5 object-contain md:hidden" />
        <span className="text-sm text-muted-foreground font-['Plus_Jakarta_Sans']">{copy.processingTitle}</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 md:px-8 py-10 w-full flex-1">
        {/* Topic */}
        <div className="bg-card rounded-xl border border-border p-4 mb-8">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-['Plus_Jakarta_Sans'] mb-1">{language === "id" ? "Topik Analisis" : "Analysis Topic"}</p>
          <p className="text-[15px] font-semibold font-['Plus_Jakarta_Sans'] text-foreground">{query || REPORT_DATA.topic}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-['Plus_Jakarta_Sans'] text-muted-foreground">{language === "id" ? "Progress keseluruhan" : "Overall progress"}</span>
            <span className="text-[13px] font-mono font-medium text-foreground">{pct}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <ReportSkeleton language={language} />

        {/* Steps */}
        <div className="space-y-3 mb-8 mt-6">
          {agentSteps.map((s, i) => {
            const done = step > i;
            const active = step === i;
            const Icon = s.icon;
            return (
              <div key={s.id}
                className={cn("rounded-xl border p-4 transition-all",
                  done ? "bg-card border-emerald-200" :
                  active ? "bg-card border-primary/30 shadow-sm" :
                  "bg-card/50 border-border opacity-50")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    done ? "bg-emerald-500 text-white" :
                    active ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground")}>
                    {done ? <CheckCircle2 size={18} /> : active ? <span className="grid size-4 grid-cols-2 gap-0.5" aria-label={language === "id" ? "Sedang memproses" : "Processing"}><span className="rounded-[2px] bg-white/95 animate-pulse" /><span className="rounded-[2px] bg-white/75 animate-pulse [animation-delay:120ms]" /><span className="rounded-[2px] bg-white/60 animate-pulse [animation-delay:240ms]" /><span className="rounded-[2px] bg-white/85 animate-pulse [animation-delay:360ms]" /></span> : <Icon size={17} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-[13px] font-semibold font-['Plus_Jakarta_Sans']", done ? "text-success" : active ? "text-foreground" : "text-muted-foreground")}>{s.name}</p>
                      <span className="text-[11px] font-mono text-white/45 shrink-0">{s.time}</span>
                    </div>
                    {(done || active) && <p className="text-[12px] text-muted-foreground font-['Plus_Jakarta_Sans'] mt-0.5 leading-relaxed">{s.desc}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tech transparency */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button onClick={() => setShowTech(!showTech)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-muted-foreground" />
              <span className="text-[13px] font-semibold font-['Plus_Jakarta_Sans'] text-foreground">{copy.processingTechnicalDetails}</span>
            </div>
            <ChevronDown size={15} className={cn("text-muted-foreground transition-transform", showTech && "rotate-180")} />
          </button>
          {showTech && (
            <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border pt-4">
              {[
                { label: "GPU", val: "AMD MI300X" },
                { label: "Model", val: "Qwen3-235B" },
                { label: "VRAM", val: "192 GB HBM3" },
                { label: "Precision", val: "BF16 / INT4" },
              ].map(({ label, val }) => (
                <div key={label} className="bg-background rounded-lg p-3 text-center">
                  <p className="text-[11px] text-[13px] font-bold font-mono text-foreground">{val}</p>
                  <p className="text-[10px] text-muted-foreground font-['Plus_Jakarta_Sans'] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Report (two-panel desktop layout) ───────────────────────────────────────
function ReportView({ query, onBack, onNavigate }: {
  query: string; onBack: () => void; onNavigate: (s: Screen) => void;
}) {
  const [openSwot, setOpenSwot] = useState(true);
  const [expandedClaims, setExpandedClaims] = useState<number[]>([]);
  const r = REPORT_DATA;

  const sentimentData = [
    { name: "Positif", value: r.sentimentPos, color: "#2F735F" },
    { name: "Netral", value: r.sentimentNeu, color: "#6C6254" },
    { name: "Negatif", value: r.sentimentNeg, color: "#A23F2F" },
  ];

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-['Plus_Jakarta_Sans']">Laporan Analisis</p>
            <p className="text-sm font-semibold font-['Plus_Jakarta_Sans'] text-foreground truncate max-w-xs md:max-w-lg">{query || r.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onNavigate("fullreport")} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[13px] font-['Plus_Jakarta_Sans'] font-medium text-foreground hover:bg-muted transition-all">
            <FileText size={14} /> Full Report
          </button>
          <button onClick={() => onNavigate("slidedeck")} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D1829] text-white text-[13px] font-['Plus_Jakarta_Sans'] font-medium hover:bg-[#1a2d4a] transition-all">
            <Layers size={14} /> Slide Deck
          </button>
          <button onClick={() => onNavigate("home")} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[13px] font-['Plus_Jakarta_Sans'] font-medium text-foreground hover:bg-muted transition-all">
            <FileText size={14} /> Baru
          </button>
          <button aria-label="Unduh ringkasan laporan" className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Download size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Left: Main content */}
        <div className="flex-1 min-w-0 px-6 md:px-8 py-6 space-y-5">
          {/* Score banner */}
          <div className="grid gap-4 rounded-[1.6rem] bg-[#171D1B] p-5 text-white shadow-[0_22px_58px_-36px_rgba(23,29,27,0.7)] ring-1 ring-white/10 sm:grid-cols-[1fr_10rem] sm:items-center">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06]">
                <span className="text-xl font-bold font-mono">{r.overallScore}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[11px] uppercase tracking-wide text-[#D7B46A] font-['Plus_Jakarta_Sans']">Skor kelayakan pasar</p>
                <p className="text-lg font-semibold leading-snug font-['Plus_Jakarta_Sans']">{query || r.topic}</p>
                <p className="mt-0.5 text-[12px] text-white/62 font-['Plus_Jakarta_Sans']">{r.date} · 4 agen · 2.847 data points</p>
                <span className="mt-3 inline-flex rounded-full border border-[#2F735F]/35 bg-[#2F735F]/20 px-2.5 py-1 text-[11px] font-semibold text-[#A8D7C4] font-['Plus_Jakarta_Sans']">
                  Sentimen {r.sentimentPos}% Positif
                </span>
              </div>
            </div>
            <IllustrationFrame src={NanoReportImg} alt="Dossier laporan analisis berisi skor, sumber, dan rekomendasi" className="hidden h-28 border-white/10 bg-white/[0.04] p-1 ring-white/10 sm:block" imgClassName="object-cover" />
          </div>

          {/* Executive summary */}
          <div className="rounded-[1.4rem] border border-border bg-card p-5 shadow-[0_16px_44px_rgba(12,24,40,0.045)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><FileText size={15} /></span>
                <h3 className="text-[13px] font-bold text-foreground font-['Plus_Jakarta_Sans']">Ringkasan eksekutif</h3>
              </div>
              <span className="rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success font-mono">5 klaim · 86%</span>
            </div>
            <p className="text-[14px] leading-relaxed text-foreground/82 font-['Plus_Jakarta_Sans']">
              Pasar kafe spesialti di area Dago Bandung menunjukkan momentum pertumbuhan yang kuat dengan peningkatan 34% YoY, didorong oleh demografi mahasiswa dan profesional muda. Namun, masuknya jaringan nasional menciptakan tekanan kompetitif yang signifikan. Rekomendasi utama: fokus pada diferensiasi brand, optimasi digital presence, dan program loyalitas dalam 90 hari pertama.
            </p>
          </div>

          {/* Sentiment trend */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[13px] font-bold font-['Plus_Jakarta_Sans'] text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-primary" /> Tren Sentimen (6 Bulan)
            </h3>
            <p className="sr-only">Tren sentimen enam bulan: sentimen positif naik dari 62% pada Januari menjadi 74% pada Juni, sementara sentimen negatif turun dari 18% menjadi 10%.</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={r.sentimentTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Manrope", borderRadius: 8, border: "1px solid #e2e8f2" }} />
                <Line type="monotone" dataKey="pos" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} name="Positif %" />
                <Line type="monotone" dataKey="neg" stroke="var(--destructive)" strokeWidth={2} dot={{ r: 3 }} name="Negatif %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* SWOT */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => setOpenSwot(!openSwot)}
              className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <h3 className="text-[13px] font-bold font-['Plus_Jakarta_Sans'] text-foreground uppercase tracking-wide flex items-center gap-2">
                <Target size={15} className="text-primary" /> Analisis SWOT
              </h3>
              <ChevronDown size={15} className={cn("text-muted-foreground transition-transform", openSwot && "rotate-180")} />
            </button>
            {openSwot && (
              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-border">
                {[
                  { label: "Strengths", items: r.swot.strengths, color: "emerald", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Weaknesses", items: r.swot.weaknesses, color: "red", bg: "bg-red-50 dark:bg-red-950/20" },
                  { label: "Opportunities", items: r.swot.opportunities, color: "blue", bg: "bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Threats", items: r.swot.threats, color: "amber", bg: "bg-amber-50 dark:bg-amber-950/20" },
                ].map(({ label, items, bg }) => (
                  <div key={label} className={cn("p-4 border-border", "border-b sm:even:border-l last:border-b-0 sm:last:border-b-0", bg)}>
                    <p className="text-[11px] font-bold font-['Plus_Jakarta_Sans'] uppercase tracking-wide text-muted-foreground mb-2">{label}</p>
                    <ul className="space-y-1.5">
                      {items.map((item) => (
                        <li key={item} className="text-[13px] font-['Plus_Jakarta_Sans'] text-foreground flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5 shrink-0">·</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strategic priorities */}
          <div className="rounded-[1.4rem] border border-border bg-card p-5 shadow-[0_16px_44px_rgba(12,24,40,0.045)]">
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-bold text-foreground font-['Plus_Jakarta_Sans']">
              <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Target size={15} /></span> Prioritas strategis
            </h3>
            <div className="space-y-2.5">
              {r.priorities.map((p) => (
                <div key={p.rank} className="grid gap-3 rounded-[1.05rem] border border-border bg-background p-3 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-[11px] font-bold text-primary-foreground font-mono">{p.rank}</div>
                  <p className="text-[13px] font-medium text-foreground font-['Plus_Jakarta_Sans']">{p.title}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold font-['Plus_Jakarta_Sans']",
                      p.impact === "Tinggi" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
                      {p.impact} impact
                    </span>
                    <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground font-mono">{p.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile action row */}
          <div className="sm:hidden grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate("fullreport")} className="py-3 rounded-xl border border-border text-[13px] font-['Plus_Jakarta_Sans'] font-semibold text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-all">
              <FileText size={15} /> Full Report
            </button>
            <button onClick={() => onNavigate("slidedeck")} className="py-3 rounded-xl bg-[#0D1829] text-white text-[13px] font-['Plus_Jakarta_Sans'] font-semibold flex items-center justify-center gap-2 hover:bg-[#1a2d4a] transition-all">
              <Layers size={15} /> Slide Deck
            </button>
          </div>
        </div>

        {/* Right: Sticky insights panel */}
        <div className="lg:w-80 xl:w-[340px] shrink-0 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-auto border-t lg:border-t-0 lg:border-l border-border">
          <div className="p-5 space-y-4">
            {/* Sentiment donut */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-bold font-['Plus_Jakarta_Sans'] uppercase tracking-wide text-muted-foreground mb-3">Distribusi Sentimen</p>
              <p className="sr-only">Distribusi sentimen: {r.sentimentPos}% positif, {r.sentimentNeu}% netral, {r.sentimentNeg}% negatif.</p>
              <div className="flex items-center gap-3">
                <PieChart width={90} height={90}>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={27} outerRadius={42} dataKey="value" startAngle={90} endAngle={-270}>
                      {sentimentData.map((entry, i) => <Cell key={`report-donut-${i}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                <div className="space-y-1.5">
                  {sentimentData.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[12px] font-['Plus_Jakarta_Sans'] text-muted-foreground">{name}</span>
                      <span className="text-[12px] font-bold font-mono text-foreground ml-auto">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-bold font-['Plus_Jakarta_Sans'] uppercase tracking-wide text-muted-foreground mb-3">Metrik Kunci</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Skor kelayakan", val: `${r.overallScore}/100`, icon: CircleDot },
                  { label: "Kompetitor", val: "5 aktif", icon: Users },
                  { label: "Data Points", val: "2.847", icon: Activity },
                  { label: "Keyakinan", val: "86%", icon: Shield },
                ].map(({ label, val, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-border bg-background p-3">
                    <div className="mb-2 flex size-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                      <Icon size={13} strokeWidth={1.9} />
                    </div>
                    <p className="text-[13px] font-bold text-foreground font-mono">{val}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground font-['Plus_Jakarta_Sans']">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-bold font-['Plus_Jakarta_Sans'] uppercase tracking-wide text-muted-foreground mb-3">Tingkat Kepercayaan Klaim</p>
              <div className="space-y-2.5">
                {r.claims.slice(0, 3).map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-['Plus_Jakarta_Sans'] text-foreground leading-tight truncate max-w-[160px]">{c.text}</p>
                      <span className="text-[11px] font-mono font-medium text-foreground shrink-0 ml-2">{c.conf}%</span>
                    </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${c.conf}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={() => onNavigate("fullreport")} className="w-full py-3 rounded-xl border border-border text-[13px] font-['Plus_Jakarta_Sans'] font-semibold text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2">
                <FileText size={15} /> Lihat Full Report
              </button>
              <button onClick={() => onNavigate("slidedeck")} className="w-full py-3 rounded-xl bg-[#0D1829] text-white text-[13px] font-['Plus_Jakarta_Sans'] font-semibold hover:bg-[#1a2d4a] transition-all flex items-center justify-center gap-2">
                <Layers size={15} /> Buat Slide Deck
              </button>
              <button onClick={() => onNavigate("home")} className="w-full py-3 rounded-xl border border-border text-[13px] font-['Plus_Jakarta_Sans'] font-medium text-muted-foreground hover:bg-muted transition-all flex items-center justify-center gap-2">
<FileText size={14} /> Analisis Baru
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Full Report ──────────────────────────────────────────────────────────────
const FR_SECTIONS = [
  "Verdict eksekutif", "Konteks pasar", "Sinyal pelanggan dan sentimen",
  "Peta kompetitif", "Analisis SWOT", "Prioritas strategis 30/60/90",
  "Risiko dan asumsi", "Kepercayaan data", "Metodologi dan sumber",
];

function FullReportView({ query, onBack, onSlideDeck }: { query: string; onBack: () => void; onSlideDeck: () => void }) {
  const [open, setOpen] = useState<number[]>([0, 1]);
  const [activeSection, setActiveSection] = useState(0);
  const r = REPORT_DATA;

  const toggle = (i: number) => setOpen(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const sentPie = [
    { name: "Positif", value: r.sentimentPos, color: "#2F735F" },
    { name: "Netral", value: r.sentimentNeu, color: "#6C6254" },
    { name: "Negatif", value: r.sentimentNeg, color: "#A23F2F" },
  ];

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0D1829] text-white px-6 md:px-8 py-3.5 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-['Plus_Jakarta_Sans']">Full Report</p>
          <p className="text-sm font-semibold font-['Plus_Jakarta_Sans'] text-white/90 truncate">{query || r.topic}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onSlideDeck} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-white text-[13px] font-['Plus_Jakarta_Sans'] font-medium hover:bg-white/20 transition-all">
            <Layers size={14} /> Slide Deck
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-['Plus_Jakarta_Sans'] font-medium hover:bg-primary transition-all">
            <Download size={14} /> Unduh PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* TOC sidebar */}
        <div className="hidden xl:flex flex-col w-56 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-auto border-r border-border bg-background">
          <div className="p-5">
            <p className="text-[10px] font-bold font-['Plus_Jakarta_Sans'] uppercase tracking-widest text-muted-foreground mb-3">Daftar Isi</p>
            <nav className="space-y-0.5">
              {FR_SECTIONS.map((sec, i) => (
                <button key={i} onClick={() => setActiveSection(i)}
                  className={cn("w-full text-left px-3 py-2 rounded-lg text-[12px] font-['Plus_Jakarta_Sans'] transition-all",
                    activeSection === i ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                  <span className="font-mono text-[10px] opacity-50 mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                  {sec}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 min-w-0 px-6 md:px-10 py-8 space-y-4 max-w-4xl">
          {FR_SECTIONS.map((title, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <button onClick={() => toggle(i)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-[14px] font-bold font-['Plus_Jakarta_Sans'] text-foreground">{title}</h3>
                </div>
                <ChevronDown size={15} className={cn("text-muted-foreground transition-transform shrink-0", open.includes(i) && "rotate-180")} />
              </button>

              {open.includes(i) && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  {i === 0 && (
                    <p className="text-[14px] font-['Plus_Jakarta_Sans'] text-foreground/80 leading-relaxed">
                      Verdict: peluang layak diuji, bukan langsung ekspansi besar. Bukti mendukung pembukaan kafe spesialti kecil di koridor Dago jika 90 hari pertama dipakai untuk validasi menu, akuisisi komunitas, dan diferensiasi dari jaringan nasional. Skor kelayakan 82/100 didukung 2.847 data points, tetapi asumsi modal awal dan kapasitas tempat masih harus dikunci sebelum keputusan investasi final.
                    </p>
                  )}
                  {i === 1 && (
                    <div>
                      <p className="text-[14px] font-['Plus_Jakarta_Sans'] text-foreground/80 leading-relaxed mb-4">
                        Situasi pasar saat ini menunjukkan pertumbuhan permintaan yang konsisten. Tren work-from-café pasca pandemi belum mencapai titik jenuh, dan segmen premium masih underserved.
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={r.sentimentTrend}>
                          <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                          <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Manrope", borderRadius: 8 }} />
                          <Line type="monotone" dataKey="pos" stroke="#2F735F" strokeWidth={2} name="Sentimen Positif %" />
                          <Line type="monotone" dataKey="neg" stroke="#A23F2F" strokeWidth={2} name="Sentimen Negatif %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[13px] font-['Plus_Jakarta_Sans'] text-foreground/80 leading-relaxed mb-3">
                          Dari 847 ulasan yang dikumpulkan, sentimen positif mendominasi di 71%, dengan driver utama: kualitas kopi, ambience, dan value for money.
                        </p>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={sentPie} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                              {sentPie.map((e, idx) => <Cell key={`fr-sent-${idx}`} fill={e.color} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-muted-foreground font-['Plus_Jakarta_Sans'] uppercase tracking-wide mb-3">Distribusi per Platform</p>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={[{ p: "Google Maps", n: 312 }, { p: "Instagram", n: 284 }, { p: "TripAdvisor", n: 142 }, { p: "Twitter/X", n: 109 }]}>
                            <XAxis dataKey="p" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                            <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontFamily: "Manrope", borderRadius: 8 }} />
                            <Bar dataKey="n" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Ulasan" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {i === 3 && (
                    <div className="overflow-auto">
                      <table className="w-full text-[13px] font-['Plus_Jakarta_Sans']">
                        <thead>
                          <tr className="border-b border-border">
                            {["Kompetitor", "Skor", "Market Share", "YoY Growth"].map(h => (
                              <th key={h} className="text-left py-2 px-3 text-[11px] font-bold text-white/42 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.competitors.map((c) => (
                            <tr key={c.name} className="border-b border-border hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-foreground">{c.name}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${c.score}%` }} />
                                  </div>
                                  <span className="font-mono text-foreground">{c.score}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">{c.share}%</td>
                              <td className="py-2.5 px-3 font-mono text-emerald-600">{c.growth}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {i === 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Strengths", items: r.swot.strengths, cls: "bg-emerald-50 border-emerald-200 text-emerald-800" },
                        { label: "Weaknesses", items: r.swot.weaknesses, cls: "bg-red-50 border-red-200 text-red-800" },
                        { label: "Opportunities", items: r.swot.opportunities, cls: "bg-blue-50 border-blue-200 text-blue-800" },
                        { label: "Threats", items: r.swot.threats, cls: "bg-amber-50 border-amber-200 text-amber-800" },
                      ].map(({ label, items, cls }) => (
                        <div key={label} className={cn("p-3.5 rounded-xl border", cls)}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">{label}</p>
                          <ul className="space-y-1">
                            {items.map(it => <li key={it} className="text-[12px] leading-relaxed flex gap-1.5"><span className="opacity-40 shrink-0">·</span>{it}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 5 && (
                    <div className="space-y-2.5">
                      {r.priorities.map((p) => (
                        <div key={p.rank} className="flex items-center gap-3 p-3.5 rounded-lg bg-background border border-border">
                          <div className="w-7 h-7 rounded-full bg-[#0D1829] text-white text-[12px] font-bold font-mono flex items-center justify-center shrink-0">{p.rank}</div>
                          <div className="flex-1">
                            <p className="text-[13px] font-semibold font-['Plus_Jakarta_Sans'] text-foreground">{p.title}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", p.impact === "Tinggi" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{p.impact}</span>
                            <span className="text-[11px] font-['Plus_Jakarta_Sans'] text-muted-foreground">Upaya {p.effort.toLowerCase()}</span>
                            <span className="text-[11px] font-mono text-muted-foreground">{p.timeframe}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 6 && (
                    <div className="overflow-auto">
                      <table className="w-full text-[13px] font-['Plus_Jakarta_Sans']">
                        <thead>
                          <tr className="border-b border-border">
                            {["Risiko", "Probabilitas", "Dampak", "Mitigasi"].map(h => (
                              <th key={h} className="text-left py-2 px-3 text-[11px] font-bold text-white/42 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.risks.map((ri) => (
                            <tr key={ri.risk} className="border-b border-border hover:bg-muted/20">
                              <td className="py-2.5 px-3 font-medium text-foreground">{ri.risk}</td>
                              <td className="py-2.5 px-3">
                                <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold", ri.prob === "Tinggi" ? "bg-red-100 text-red-700" : ri.prob === "Sedang" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>{ri.prob}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold", ri.impact === "Tinggi" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{ri.impact}</span>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground text-[12px]">{ri.mitigation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {i === 7 && (
                    <div className="space-y-3">
                      {r.claims.map((c, ci) => (
                        <div key={ci} className="p-3.5 bg-background rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[13px] font-semibold font-['Plus_Jakarta_Sans'] text-foreground">{c.text}</p>
                            <span className="text-[12px] font-bold font-mono text-primary shrink-0 ml-3">{c.conf}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${c.conf}%` }} />
                          </div>
                          <p className="text-[11px] text-muted-foreground font-['Plus_Jakarta_Sans']">Sumber: {c.source}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 8 && (
                    <div className="text-[13px] font-['Plus_Jakarta_Sans'] text-foreground/80 leading-relaxed space-y-2">
                      <p>Data dikumpulkan melalui pipeline 4-agen AI yang berjalan di atas AMD MI300X GPU (192 GB HBM3) menggunakan model Qwen3-235B.</p>
                      <p>Sumber data: Google Maps, TripAdvisor, Instagram, Twitter/X, Tokopedia, media berita lokal, dan laporan BPS Jawa Barat 2026.</p>
                      <p>Analisis sentimen menggunakan metode Aspect-Based Sentiment Analysis (ABSA) dengan threshold kepercayaan minimum 70%.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Slide deck ───────────────────────────────────────────────────────────────
const TOTAL_SLIDES = 10;

function SlideDeckView({ query, onBack, onFullReport }: { query: string; onBack: () => void; onFullReport: () => void }) {
  const [slide, setSlide] = useState(0);
  const r = REPORT_DATA;

  const sentPie = [
    { name: "Positif", value: r.sentimentPos, color: "#2F735F" },
    { name: "Netral", value: r.sentimentNeu, color: "#6C6254" },
    { name: "Negatif", value: r.sentimentNeg, color: "#A23F2F" },
  ];

  const SLIDES: React.ReactNode[] = [
    // 0 · Cover
    <div key={0} className="h-full flex flex-col justify-between p-10 md:p-14 bg-gradient-to-br from-[#0B1628] via-[#0D1E3A] to-[#1A3B6E] text-white">
      <div className="flex items-center gap-3">
        <ImageWithFallback src={ConsultinLogo} alt="Consultin" className="h-7 w-auto object-contain brightness-0 invert opacity-70" />
        <div className="h-4 w-px bg-white/20" />
        <span className="text-white/40 text-[11px] font-mono uppercase tracking-widest">Market Intelligence Report</span>
      </div>
      <div>
        <p className="text-primary text-xs font-mono uppercase tracking-widest mb-3">McKinsey SCR Framework</p>
        <h1 className="text-3xl md:text-4xl font-bold font-['Plus_Jakarta_Sans'] leading-snug mb-4">{query || r.topic}</h1>
        <p className="text-white/50 text-[14px] font-['Plus_Jakarta_Sans'] mb-8">Brief keputusan · {r.date} · AMD MI300X + Qwen3-235B</p>
        <div className="flex flex-wrap gap-3">
          {["Sentimen: +71%", "Kelayakan: 82/100", "2.847 data point", "4 tahap analisis"].map(tag => (
            <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[12px] font-['Plus_Jakarta_Sans']">{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-white/25 text-[11px] font-['Plus_Jakarta_Sans']">Consultin · Confidential</p>
        <p className="text-white/25 text-[11px] font-mono">1 / {TOTAL_SLIDES}</p>
      </div>
    </div>,

    // 1 · Situation
    <div key={1} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-mono text-primary uppercase tracking-widest mb-1">01 · Situation</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Kondisi Pasar Saat Ini</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { val: "34% YoY", label: "Pertumbuhan pasar kafe Bandung" },
          { val: "Rp 4,2 T", label: "Nilai pasar F&B Bandung 2026" },
          { val: "2.100+", label: "Outlet kafe aktif di Bandung" },
        ].map(({ val, label }) => (
          <div key={label} className="bg-[#F0F4FA] rounded-xl p-4 border border-[#E2E8F2]">
            <p className="text-2xl font-bold font-mono text-[#0D1829] mb-1">{val}</p>
            <p className="text-[12px] text-[#6C6254] font-['Plus_Jakarta_Sans']">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={r.sentimentTrend}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
            <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} domain={[0, 100]} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Manrope", borderRadius: 8 }} />
            <Line type="monotone" dataKey="pos" stroke="#2F735F" strokeWidth={2.5} dot={{ r: 4 }} name="Sentimen Positif %" />
            <Line type="monotone" dataKey="neg" stroke="#A23F2F" strokeWidth={2.5} dot={{ r: 4 }} name="Sentimen Negatif %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>,

    // 2 · Complication
    <div key={2} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-mono text-amber-500 uppercase tracking-widest mb-1">02 · Complication</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Tantangan & Ancaman Utama</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {r.swot.threats.concat(r.swot.weaknesses).slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[14px] font-['Plus_Jakarta_Sans'] text-amber-900 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>,

    // 3 · Consumer Voice
    <div key={3} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-mono text-primary uppercase tracking-widest mb-1">03 · Analisis Sentimen</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Suara Konsumen</h2>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={sentPie} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({ name, value }) => `${value}%`}>
              {sentPie.map((e, i) => <Cell key={`slide-sent-${i}`} fill={e.color} />)}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {sentPie.map(({ name, value, color }) => (
            <div key={name}>
              <div className="flex justify-between mb-1">
                <span className="text-[13px] font-['Plus_Jakarta_Sans'] font-medium text-[#0D1829]">{name}</span>
                <span className="text-[13px] font-mono font-bold text-[#0D1829]">{value}%</span>
              </div>
              <div className="h-2 bg-[#F0F4FA] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
              </div>
            </div>
          ))}
          <p className="text-[12px] text-[#6C6254] font-['Plus_Jakarta_Sans'] mt-2">Berdasarkan 847 ulasan dari 4 platform</p>
        </div>
      </div>
    </div>,

    // 4 · SWOT
    <div key={4} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-5">
        <p className="text-[11px] font-mono text-primary uppercase tracking-widest mb-1">04 · SWOT Analysis</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Matriks SWOT</h2>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3">
        {[
          { label: "Strengths", items: r.swot.strengths, cls: "bg-emerald-50 border-emerald-200", hcls: "text-emerald-700" },
          { label: "Weaknesses", items: r.swot.weaknesses, cls: "bg-red-50 border-red-200", hcls: "text-red-700" },
          { label: "Opportunities", items: r.swot.opportunities, cls: "bg-blue-50 border-blue-200", hcls: "text-blue-700" },
          { label: "Threats", items: r.swot.threats, cls: "bg-amber-50 border-amber-200", hcls: "text-amber-700" },
        ].map(({ label, items, cls, hcls }) => (
          <div key={label} className={cn("rounded-xl border p-4", cls)}>
            <p className={cn("text-[11px] font-bold uppercase tracking-wide mb-2", hcls)}>{label}</p>
            <ul className="space-y-1">
              {items.slice(0, 2).map(it => (
                <li key={it} className="text-[12px] font-['Plus_Jakarta_Sans'] text-[#0D1829] flex gap-1.5"><span className="opacity-40">·</span>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>,

    // 5 · Resolution
    <div key={5} className="h-full flex flex-col p-8 md:p-12 bg-gradient-to-br from-[#0B1628] to-[#1A3B6E] text-white">
      <div className="mb-6">
        <p className="text-[11px] font-mono text-primary uppercase tracking-widest mb-1">05 · Resolution</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans']">Rekomendasi Strategis</h2>
      </div>
      <div className="flex-1 space-y-3">
        {r.priorities.map((p) => (
          <div key={p.rank} className="flex items-center gap-4 p-4 rounded-xl bg-white/10 border border-white/15">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold font-mono flex items-center justify-center shrink-0">{p.rank}</div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold font-['Plus_Jakarta_Sans']">{p.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold", p.impact === "Tinggi" ? "bg-red-500/30 text-red-200" : "bg-amber-500/30 text-amber-200")}>{p.impact}</span>
              <span className="text-white/50 text-[11px] font-mono">{p.timeframe}</span>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // 6 · Financials
    <div key={6} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-mono text-primary uppercase tracking-widest mb-1">06 · Proyeksi Finansial</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Revenue Forecast 2026</h2>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={r.revenueProjection} barCategoryGap="30%">
            <XAxis dataKey="q" tick={{ fontSize: 12, fontFamily: "JetBrains Mono" }} />
            <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} tickFormatter={v => `${v}jt`} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Manrope", borderRadius: 8 }} formatter={(v: number) => [`Rp ${v}jt`]} />
            <Legend />
            <Bar dataKey="base" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Base Case (Rp jt)" />
            <Bar dataKey="opt" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Optimistic (Rp jt)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>,

    // 7 · Risk
    <div key={7} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-mono text-amber-500 uppercase tracking-widest mb-1">07 · Risk Register</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Matriks Risiko</h2>
      </div>
      <div className="flex-1 space-y-3">
        {r.risks.map((ri) => (
          <div key={ri.risk} className="flex items-start gap-4 p-4 rounded-xl bg-[#F0F4FA] border border-[#E2E8F2]">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold font-['Plus_Jakarta_Sans'] text-[#0D1829] mb-0.5">{ri.risk}</p>
              <p className="text-[12px] text-[#6C6254] font-['Plus_Jakarta_Sans']">{ri.mitigation}</p>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", ri.prob === "Tinggi" ? "bg-red-100 text-red-700" : ri.prob === "Sedang" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>{ri.prob}</span>
              <span className="text-[10px] text-[#6C6254] font-['Plus_Jakarta_Sans']">Prob.</span>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // 8 · Action Plan
    <div key={8} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-mono text-primary uppercase tracking-widest mb-1">08 · Action Plan</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">90-Day Roadmap</h2>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-4">
        {[
          { phase: "Bulan 1", color: "var(--primary)", items: ["Audit digital presence", "Setup Google My Business", "Mulai loyalty program beta"] },
          { phase: "Bulan 2-3", color: "#1F6F64", items: ["Launch Instagram Ads", "Implement menu engineering", "Onboard 500 loyalty members"] },
          { phase: "Bulan 3+", color: "#0B7A6A", items: ["Evaluasi co-working pivot", "Ekspansi ke outlet ke-2", "Scale digital marketing"] },
        ].map(({ phase, color, items }) => (
          <div key={phase} className="p-4 rounded-xl border-2" style={{ borderColor: `${color}30`, background: `${color}08` }}>
            <p className="text-[12px] font-bold font-['Plus_Jakarta_Sans'] mb-3" style={{ color }}>{phase}</p>
            <ul className="space-y-2">
              {items.map(item => (
                <li key={item} className="flex items-start gap-2 text-[12px] font-['Plus_Jakarta_Sans'] text-[#0D1829]">
                  <ArrowRight size={12} className="shrink-0 mt-0.5" style={{ color }} />{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>,

    // 9 · Conclusion
    <div key={9} className="h-full flex flex-col justify-between p-10 md:p-14 bg-gradient-to-br from-[#0B1628] to-[#1A3B6E] text-white">
      <div>
        <p className="text-[11px] font-mono text-primary uppercase tracking-widest mb-2">09 · Kesimpulan</p>
        <h2 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mb-6">Peluang Nyata, Tindakan Segera</h2>
        <p className="text-white/70 text-[15px] font-['Plus_Jakarta_Sans'] leading-relaxed max-w-lg">
          Pasar kafe di Dago layak diuji melalui peluncuran kecil, bukan ekspansi besar sejak hari pertama. Skor kelayakan 82/100 dan sentimen positif 71% cukup kuat untuk memulai validasi 90 hari, dengan fokus pada menu, komunitas, dan disiplin biaya.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ v: "82/100", l: "Skor kelayakan" }, { v: "+71%", l: "Sentimen positif" }, { v: "34% YoY", l: "Pertumbuhan pasar" }, { v: "90 hari", l: "Periode validasi" }].map(({ v, l }) => (
          <div key={l} className="bg-white/10 rounded-xl p-3.5 border border-white/15 text-center">
            <p className="text-lg font-bold font-mono text-white">{v}</p>
            <p className="text-[11px] text-white/50 font-['Plus_Jakarta_Sans'] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-white/25 text-[11px] font-['Plus_Jakarta_Sans']">Consultin · Confidential · {r.date}</p>
        <p className="text-white/25 text-[11px] font-mono">{TOTAL_SLIDES} / {TOTAL_SLIDES}</p>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0D1015] flex flex-col">
      {/* Deck header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[13px] font-['Plus_Jakarta_Sans']">
          <ChevronLeft size={16} /> Kembali ke Report
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-[11px] font-mono">{slide + 1} / {TOTAL_SLIDES}</span>
          <button onClick={onFullReport} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-all text-[12px] font-['Plus_Jakarta_Sans']">
            Full Report
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-['Plus_Jakarta_Sans'] font-medium hover:bg-primary transition-all">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Slide thumbnails */}
      <div className="hidden md:flex items-center gap-1.5 px-6 py-2 overflow-x-auto border-b border-white/5">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            className={cn("shrink-0 w-10 h-6 rounded text-[10px] font-mono transition-all",
              i === slide ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/70")}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl" style={{ aspectRatio: "16/9" }}>
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
            {SLIDES[slide]}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-white/5">
        <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}
          className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={cn("w-1.5 h-1.5 rounded-full transition-all", i === slide ? "w-5 bg-primary" : "bg-white/25 hover:bg-white/50")} />
          ))}
        </div>
        <button onClick={() => setSlide(Math.min(TOTAL_SLIDES - 1, slide + 1))} disabled={slide === TOTAL_SLIDES - 1}
          className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────────────────────
const HISTORY_DATA = [
  { id: 1, topic: "Kafe Spesialti di Area Dago, Bandung", date: "8 Jul 2026", time: "14:22", score: 82, sentiment: "Positif", tag: "F&B", status: "Selesai" },
  { id: 2, topic: "Minimarket Lokal di Depok Timur", date: "7 Jul 2026", time: "09:15", score: 74, sentiment: "Netral", tag: "Retail", status: "Selesai" },
  { id: 3, topic: "Laundry Kiloan di Bekasi Barat", date: "5 Jul 2026", time: "16:48", score: 68, sentiment: "Positif", tag: "Jasa", status: "Selesai" },
  { id: 4, topic: "Warung Makan Padang di Sunter", date: "3 Jul 2026", time: "11:30", score: 77, sentiment: "Positif", tag: "F&B", status: "Selesai" },
  { id: 5, topic: "Toko Baju Online Shopee & TikTok", date: "1 Jul 2026", time: "08:05", score: 65, sentiment: "Negatif", tag: "E-Commerce", status: "Selesai" },
];

function HistoryView({ onNavigate, onOpenReport }: { onNavigate: (s: Screen) => void; onOpenReport: (q: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = HISTORY_DATA.filter(h => h.topic.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative min-h-full overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-x-[-20%] top-[-30rem] h-[54rem] rounded-full border-[8rem] border-[#3131f5]/45 blur-[92px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:70px_80px] [mask-image:radial-gradient(50%_50%,white,transparent)]" />
      <div className="relative px-6 md:px-8 py-7">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6EA8D8] font-['Plus_Jakarta_Sans']">Riwayat</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans']">Analisis tersimpan</h1>
            <p className="mt-1 text-[12px] text-white/46 font-['Plus_Jakarta_Sans']">{HISTORY_DATA.length} laporan siap dibuka ulang</p>
          </div>
          <button onClick={() => onNavigate("home")} className="flex items-center gap-1.5 rounded-full border border-blue-500/50 bg-gradient-to-t from-blue-500 to-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-lg shadow-blue-900/40 transition-all hover:from-blue-400 hover:to-blue-600 font-['Plus_Jakarta_Sans']">
            <FileText size={14} /> Analisis Baru
          </button>
        </div>
        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2.5 bg-white/[0.055] border border-white/10 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            <Search size={15} className="text-white/45 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari analisis..."
              className="flex-1 bg-transparent text-[13px] font-['Plus_Jakarta_Sans'] text-white outline-none placeholder:text-white/36" />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] shadow-[0_22px_90px_rgba(0,0,0,0.25)]">
          <table className="w-full text-[13px] font-['Plus_Jakarta_Sans']">
            <thead className="bg-white/[0.055]">
              <tr>
                {["Topik Analisis", "Tanggal", "Tag", "Sentimen", "Skor", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-white/42 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-white/10 hover:bg-white/[0.055] transition-colors cursor-pointer" onClick={() => onOpenReport(item.topic)}>
                  <td className="px-5 py-3.5 font-medium text-white max-w-xs">
                    <span className="truncate block">{item.topic}</span>
                  </td>
                  <td className="px-5 py-3.5 text-white/48 whitespace-nowrap">
                    <span className="font-mono">{item.date}</span>
                    <span className="text-muted-foreground/50 ml-1.5">{item.time}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/8 text-[11px] font-medium text-white/50">{item.tag}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-[12px] font-semibold", item.sentiment === "Positif" ? "text-emerald-600" : item.sentiment === "Negatif" ? "text-red-600" : "text-amber-600")}>
                      {item.sentiment}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${item.score}%` }} />
                      </div>
                      <span className="font-mono text-white font-medium">{item.score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="px-3 py-1 rounded-lg border border-white/10 text-[12px] font-medium text-white/70 hover:bg-white/8 transition-all">
                      Buka →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-3">
          {filtered.map((item) => (
            <button key={item.id} onClick={() => onOpenReport(item.topic)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-left transition-all hover:border-blue-400/50 hover:bg-white/[0.075]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-white/8 text-[11px] font-medium text-white/50">{item.tag}</span>
                <span className="text-[11px] font-mono text-white/45 shrink-0">{item.date}</span>
              </div>
              <p className="text-[14px] font-semibold font-['Plus_Jakarta_Sans'] text-white mb-2 leading-snug">{item.topic}</p>
              <div className="flex items-center justify-between">
                <span className={cn("text-[12px] font-semibold", item.sentiment === "Positif" ? "text-emerald-600" : item.sentiment === "Negatif" ? "text-red-600" : "text-amber-600")}>{item.sentiment}</span>
                <div className="flex items-center gap-2">
                  <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.score}%` }} />
                  </div>
                  <span className="text-[12px] font-mono text-white font-medium">{item.score}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Account ─────────────────────────────────────────────────────────────────
const JK = "font-['Plus_Jakarta_Sans',_sans-serif]";
const TIERS = [
  {
    id: "free", name: "Cek Arah", eyebrow: "Validasi", price: "Rp 0", period: "/bulan",
    desc: "Untuk cek cepat sebelum ide bisnis dibawa lebih jauh.",
    features: ["3 analisis awal", "Brief awal", "Ringkasan keputusan"],
    cta: "Paket aktif", active: true,
  },
  {
    id: "pro", name: "Rencana Bisnis", eyebrow: "Paling masuk akal", price: "Rp 199K", period: "/bulan",
    desc: "Untuk laporan lengkap yang siap dipakai mengambil keputusan.",
    features: ["25 analisis", "Laporan lengkap", "Deck presentasi", "Ekspor PDF/PNG"],
    cta: "Upgrade ke Pro", active: false,
  },
  {
    id: "agency", name: "Tim & Skala", eyebrow: "Kolaborasi", price: "Rp 699K", period: "/bulan",
    desc: "Untuk tim yang butuh riwayat bersama dan prioritas agent.",
    features: ["Analisis tim", "Riwayat bersama", "Prioritas agent", "Support onboarding"],
    cta: "Bicara dengan tim", active: false,
  },
];

function AccountView({ mode = "account", onLogout, language, onLanguageChange, theme, onThemeChange }: { mode?: "account" | "subscription"; onLogout: () => void; language: Language; onLanguageChange: (l: Language) => void; theme: ThemeMode; onThemeChange: (t: ThemeMode) => void }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const ThemeIcon = theme === "dark" ? Moon : Sun;
  const saveSettings = () => {
    if (saveState !== "idle") return;
    setSaveState("saving");
    window.setTimeout(() => setSaveState("saved"), 500);
    window.setTimeout(() => setSaveState("idle"), 2200);
  };

  return (
    <div className={cn("min-h-full", (mode === "subscription" || mode === "account") && "bg-[#03040a]")}>
      <div className={cn("w-full", mode === "subscription" || mode === "account" ? "p-0" : "px-6 md:px-8 py-6")}>
        {mode === "account" && (
          <section className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden bg-[#030712] px-6 py-7 pb-28 text-white md:px-8 md:pb-10">
            <div className="pointer-events-none absolute inset-x-[-22%] top-[-32rem] h-[56rem] rounded-full border-[8rem] border-[#3131f5]/40 blur-[96px]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(to_right,rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:70px_80px] [mask-image:radial-gradient(50%_50%,white,transparent)]" />
            <div className="relative mx-auto max-w-5xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6EA8D8] ${JK}`}>Account</p>
                  <h1 className={`mt-2 text-2xl font-semibold tracking-[-0.03em] text-white ${JK}`}>Akun & Pengaturan</h1>
                  <p className={`mt-1 text-sm text-white/48 ${JK}`}>Identitas, kuota, dan preferensi bahasa.</p>
                </div>
                <button onClick={onLogout} className={`inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.085] hover:text-white ${JK}`}>
                  <LogOut size={14} /> Keluar
                </button>
              </div>

              <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 text-blue-100">
                    <User size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-lg font-semibold text-white ${JK}`}>CEO Account</h2>
                    <p className={`mt-1 text-[13px] text-white/46 ${JK}`}>free@consultin.id</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:w-72">
                    {[
                      { label: "Analisis", val: "1", sub: "dari 3" },
                      { label: "Member Sejak", val: "Jul 2026", sub: "" },
                    ].map(({ label, val, sub }) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-black/22 px-4 py-3 text-center">
                        <p className="font-mono text-[15px] font-bold text-white">{val} <span className={`text-[11px] font-normal text-white/42 ${JK}`}>{sub}</span></p>
                        <p className={`mt-1 text-[11px] text-white/42 ${JK}`}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-12">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 lg:col-span-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className={`text-[13px] font-semibold text-white ${JK}`}>Penggunaan Bulan Ini</p>
                    <span className="font-mono text-[13px] text-white/50">1 / 3 analisis</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: "33%" }} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-3">
                      <p className={`text-[11px] text-white/42 ${JK}`}>Sisa kuota</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-white">2</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/18 p-3">
                      <p className={`text-[11px] text-white/42 ${JK}`}>Reset berikutnya</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-white">1 Agu</p>
                    </div>
                  </div>
                  <p className={`mt-3 text-[12px] text-white/45 ${JK}`}>Upgrade saat butuh laporan lengkap dan export deck.</p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 lg:col-span-7">
                  <p className={`text-[13px] font-semibold text-white ${JK}`}>Bahasa Workspace</p>
                  <p className={`mt-1 text-[12px] text-white/45 ${JK}`}>Tema utama dikunci dulu agar tampilan stabil. Light theme direncanakan setelah semua halaman konsisten.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {([
                      ["id", "🇮🇩", "Indonesia"],
                      ["en", "🇺🇸", "English"],
                    ] as const).map(([next, flag, label]) => (
                      <button key={next} type="button" aria-pressed={language === next} onClick={() => onLanguageChange(next)}
                        className={cn("min-h-12 rounded-2xl border px-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300", language === next ? "border-blue-400/60 bg-blue-500/18 text-white shadow-[0_14px_42px_rgba(37,99,235,0.20)]" : "border-white/10 bg-black/18 text-white/58 hover:bg-white/[0.075] hover:text-white")}>
                        <span className="mr-2 text-base" aria-hidden="true">{flag}</span>
                        <span className={`text-[12px] font-semibold ${JK}`}>{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3">
                    <p className={`text-[12px] leading-relaxed text-amber-100/80 ${JK}`}>Multi bahasa penuh (中文, 日本語, 한국어, العربية, dll.) butuh i18n dictionary/API agar seluruh copy, laporan, dan export ikut berubah. Selector siap diperluas setelah dictionary masuk.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {[
                  ["Paket saat ini", "Cek Arah", "Gratis · cocok untuk validasi awal"],
                  ["Output terakhir", "1 laporan", "Kafe Dago Bandung · skor 82/100"],
                  ["Keamanan", "Data tersimpan", "Preferensi dan riwayat tetap lokal di prototype"],
                ].map(([label, value, desc]) => (
                  <div key={label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-white/36 ${JK}`}>{label}</p>
                    <p className={`mt-2 text-base font-semibold text-white ${JK}`}>{value}</p>
                    <p className={`mt-1 text-[12px] leading-relaxed text-white/45 ${JK}`}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {mode === "subscription" && (
        <section className="relative min-h-full overflow-hidden bg-[#03040a] text-white">
          <div className="pointer-events-none absolute inset-x-[-25%] top-[-42rem] h-[70rem] rounded-full border-[10rem] border-[#3131f5]/70 blur-[96px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_82px] opacity-70 [mask-image:radial-gradient(50%_50%,white,transparent)]" />
          <div className="pointer-events-none absolute left-[8%] top-24 h-[34rem] w-[84%] rounded-full bg-[#206ce8] opacity-30 blur-[130px] mix-blend-screen" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.72))]" />

          <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-6 md:px-8 md:py-12">
            <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6EA8D8] ${JK}`}>Pricing Consultin</p>
                <h2 className={`text-[2.15rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl ${JK}`}>Paket yang naik saat keputusan makin serius.</h2>
                <p className={`mt-4 max-w-[56ch] text-sm leading-7 text-white/58 ${JK}`}>Mulai validasi ide. Upgrade ketika butuh laporan lengkap, deck, dan kerja bareng tim.</p>
              </div>

              <div className="w-fit rounded-full border border-white/10 bg-neutral-950/85 p-1 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur">
                {(["monthly", "yearly"] as const).map((mode) => (
                  <button key={mode} onClick={() => setBilling(mode)} aria-pressed={billing === mode}
                    className={cn(`relative h-10 rounded-full px-4 text-[12px] font-semibold transition-colors ${JK} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-5`,
                      billing === mode ? "text-white" : "text-white/48 hover:text-white/80")}
                  >
                    {billing === mode && <span className="absolute inset-0 rounded-full border-2 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600 shadow-sm shadow-blue-700" />}
                    <span className="relative">{mode === "monthly" ? "Bulanan" : "Tahunan - hemat 20%"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
              {TIERS.map(({ id, name, eyebrow, price, period, desc, features, cta, active }) => {
                const isPro = id === "pro";
                const displayPrice = billing === "yearly" && id !== "free" ? price.replace("199K", "159K").replace("699K", "559K") : price;
                return (
                  <div key={id}
                    className={cn("relative flex flex-col overflow-hidden rounded-[1.75rem] border p-5 sm:p-6",
                      isPro ? "lg:col-span-6 border-blue-500/45 bg-gradient-to-br from-neutral-900 via-[#101827] to-neutral-950 shadow-[0px_-16px_220px_rgba(9,0,255,0.42)]" :
                      "lg:col-span-3 border-white/10 bg-white/[0.045] shadow-[0_22px_90px_rgba(0,0,0,0.25)] backdrop-blur-sm")}
                  >
                    {isPro && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(42,116,196,0.42),transparent_38%)]" />}
                    <div className="relative flex flex-1 flex-col">
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${isPro ? "text-[#8dc7ff]" : "text-white/36"} ${JK}`}>{eyebrow}</p>
                          <h3 className={cn(`mt-2 font-semibold tracking-[-0.03em] text-white ${JK}`, isPro ? "text-3xl sm:text-4xl" : "text-2xl")}>{name}</h3>
                        </div>
                        {active && <span className={`rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-bold text-white/50 ${JK}`}>Aktif</span>}
                      </div>

                      <p className={cn(`mb-7 max-w-[34ch] text-[13px] leading-6 text-white/56 ${JK}`, isPro && "sm:text-sm sm:leading-7")}>{desc}</p>

                      <div className="mb-7 flex items-end gap-1">
                        <span className={cn(`font-semibold tracking-[-0.04em] text-white ${JK}`, isPro ? "text-5xl sm:text-6xl" : "text-4xl")}>{displayPrice}</span>
                        <span className={`pb-1 text-sm font-medium text-white/42 ${JK}`}>{period}</span>
                      </div>

                      <button
                        className={cn(`mb-7 h-12 w-full rounded-xl px-4 text-[14px] font-semibold transition-all duration-200 active:scale-[0.98] ${JK} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`,
                          active ? "cursor-default border border-white/10 bg-white/8 text-white/42" :
                          isPro ? "border border-blue-500 bg-gradient-to-t from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-900/60 hover:from-blue-400 hover:to-blue-600" :
                          "border border-neutral-800 bg-gradient-to-t from-neutral-950 to-neutral-700 text-white shadow-lg shadow-neutral-950 hover:border-white/18")}
                        disabled={active}
                      >
                        {cta}
                      </button>

                      <div className="mt-auto border-t border-white/10 pt-5">
                        <p className={`mb-3 text-[12px] font-semibold text-white/80 ${JK}`}>{id === "free" ? "Cukup untuk mulai" : id === "pro" ? "Untuk keputusan bisnis" : "Untuk kerja tim"}</p>
                        <div className="grid gap-2.5">
                          {features.map(f => (
                            <div key={f} className={`rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2.5 text-[13px] leading-5 text-white/68 ${JK}`}>{f}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid gap-2 text-center sm:grid-cols-3">
              <p className={`rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-[12px] text-white/42 ${JK}`}>Batal kapan saja.</p>
              <p className={`rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-[12px] text-white/42 ${JK}`}>Data tetap milik Anda.</p>
              <p className={`rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-[12px] text-white/42 ${JK}`}>Upgrade saat output perlu dibawa ke rapat.</p>
            </div>
          </div>
        </section>
        )}
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [query, setQuery] = useState("");
  const [analysisCount, setAnalysisCount] = useState(() => frontendAdapter.getUsage().used);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("consultin-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("consultin-language");
    if (saved === "id" || saved === "en") return saved;
    return "id";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("consultin-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("consultin-language", language);
  }, [language]);

  useEffect(() => {
    if (screen === "splash") {
      const done = localStorage.getItem("consultin-onboarded") === "1";
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const t = setTimeout(() => setScreen(done ? "login" : "onboarding"), reduced ? 350 : 1400);
      return () => clearTimeout(t);
    }
  }, [screen]);

  const navigate = (s: Screen) => setScreen(s);

  const handleQuery = (q: string) => {
    setQuery(q);
    setScreen("briefreview");
  };

  const confirmAnalysis = (extraContext = "") => {
    const fullQuery = extraContext ? `${query || REPORT_DATA.topic}\n\nInformasi tambahan dari user:\n${extraContext}` : (query || REPORT_DATA.topic);
    const analysis = frontendAdapter.createAnalysis(fullQuery);

    setQuery(analysis.topic);
    setAnalysisCount(frontendAdapter.getUsage().used);
    setScreen("processing");
  };

  const openReport = (q: string) => {
    setQuery(q);
    setScreen("report");
  };

  // Auth screens (full-page, no app shell)
  const AUTH_SCREENS: Screen[] = ["splash", "onboarding", "login", "signup", "phonenumber", "phoneverify", "forgotpassword", "reset"];
  const isAuth = AUTH_SCREENS.includes(screen);

  // Slide deck is fullscreen (no sidebar)
  if (screen === "slidedeck") {
    return (
      <SlideDeckView
        query={query || REPORT_DATA.topic}
        onBack={() => navigate("report")}
        onFullReport={() => navigate("fullreport")}
        language={language}
      />
    );
  }

  if (isAuth) {
    switch (screen) {
      case "splash": return <SplashView language={language} />;
      case "onboarding": return <OnboardingView onFinish={() => { localStorage.setItem("consultin-onboarded", "1"); navigate("login"); }} language={language} />;
      case "login": return <LoginView onLogin={() => { frontendAdapter.signIn("email"); navigate("home"); }} onSignup={() => navigate("signup")} onForgot={() => navigate("forgotpassword")} language={language} theme={theme} onThemeChange={setTheme} onLanguageChange={setLanguage} />;
      case "signup": return <SignupView onRegister={() => { frontendAdapter.signIn("email"); navigate("phonenumber"); }} onSignIn={() => navigate("login")} language={language} theme={theme} onThemeChange={setTheme} onLanguageChange={setLanguage} />;
      case "phonenumber": return <PhoneNumberView onVerify={() => navigate("phoneverify")} onLater={() => navigate("home")} language={language} theme={theme} onThemeChange={setTheme} onLanguageChange={setLanguage} />;
      case "phoneverify": return <PhoneVerifyView onVerify={() => navigate("home")} onBack={() => navigate("phonenumber")} language={language} theme={theme} onThemeChange={setTheme} onLanguageChange={setLanguage} />;
      case "forgotpassword": return <ForgotPasswordView onNext={() => navigate("reset")} onBack={() => navigate("login")} language={language} theme={theme} onThemeChange={setTheme} onLanguageChange={setLanguage} />;
      case "reset": return <ResetPasswordView onDone={() => navigate("login")} language={language} theme={theme} onThemeChange={setTheme} onLanguageChange={setLanguage} />;
      default: return null;
    }
  }

  return (
    <AppShell screen={screen} onNavigate={navigate} analysisCount={analysisCount} language={language} onLanguageChange={setLanguage} theme={theme} onThemeChange={setTheme}>
      {screen === "home" && <HomeView onSubmit={handleQuery} onOpenReport={openReport} analysisCount={analysisCount} language={language} />}
      {screen === "briefreview" && <BriefReviewView query={query} onConfirm={confirmAnalysis} onBack={() => navigate("home")} language={language} />}
      {screen === "processing" && <ProcessingView query={query} onComplete={() => navigate("report")} language={language} />}
      {screen === "report" && <ReportView query={query} onBack={() => navigate("home")} onNavigate={navigate} language={language} />}
      {screen === "fullreport" && <FullReportView query={query || REPORT_DATA.topic} onBack={() => navigate("report")} onSlideDeck={() => navigate("slidedeck")} language={language} />}
      {screen === "history" && <HistoryView onNavigate={navigate} onOpenReport={openReport} language={language} />}
      {screen === "subscription" && <AccountView mode="subscription" onLogout={() => { frontendAdapter.signOut(); navigate("login"); }} language={language} onLanguageChange={setLanguage} theme={theme} onThemeChange={setTheme} />}
      {screen === "account" && <AccountView mode="account" onLogout={() => { frontendAdapter.signOut(); navigate("login"); }} language={language} onLanguageChange={setLanguage} theme={theme} onThemeChange={setTheme} />}
    </AppShell>
  );
}
