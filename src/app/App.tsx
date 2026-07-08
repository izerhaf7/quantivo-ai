import { useState, useEffect } from "react";
import {
  Home, Clock, User, Send, ChevronLeft, ChevronRight,
  Search, LogOut, Lock, Eye, EyeOff, CheckCircle2,
  TrendingUp, Download, BarChart2, MapPin, FileText,
  ChevronDown, Shield, Zap, Crown, Sparkles,
  AlertTriangle, ArrowRight, Phone, Mail,
  Building2, Users, Activity, Target,
  Globe, Layers, RefreshCw, Star, Menu, X,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, Cell, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import CLogoImg from "@/imports/C-Logo-1.png";
import ConsultinLogo from "@/imports/Consultin_1-1.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | "splash" | "onboarding" | "login" | "signup"
  | "phonenumber" | "phoneverify" | "forgotpassword" | "reset"
  | "home" | "processing" | "report" | "fullreport"
  | "slidedeck" | "history" | "account";

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
    { name: "Target UMKM", score: 68, share: 6, growth: "New" },
  ],
  swot: {
    strengths: ["Lokasi strategis dekat kampus ITB & Unpad", "Konsep specialty coffee yang unik & Instagram-worthy", "Harga premium terjangkau (Rp 32–58k)"],
    weaknesses: ["Brand awareness masih rendah vs. chain nasional", "Kapasitas seating terbatas (max 40 pax)", "Keterbatasan modal untuk ekspansi"],
    opportunities: ["Pertumbuhan komunitas coffee enthusiast Bandung +34% YoY", "Tren work-from-café pasca pandemi belum jenuh", "Potensi kolaborasi dengan local roaster"],
    threats: ["Masuknya chain nasional Kopi Kenangan di koridor Dago", "Kenaikan harga biji kopi arabica +22% (2026)", "Regulasi UMKM digital belum jelas"],
  },
  priorities: [
    { rank: 1, title: "Optimasi Digital Presence", impact: "High", effort: "Low", timeframe: "0–3 bln" },
    { rank: 2, title: "Loyalty Program & CRM", impact: "High", effort: "Med", timeframe: "1–4 bln" },
    { rank: 3, title: "Menu Engineering", impact: "Med", effort: "Low", timeframe: "Segera" },
    { rank: 4, title: "Co-working Space Pivot", impact: "High", effort: "High", timeframe: "6–12 bln" },
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
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#2A74C4]/20 focus-within:border-[#2A74C4]/50 transition-all">
      {Icon && <Icon size={17} className="text-muted-foreground shrink-0" />}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-foreground text-sm font-['Inter'] outline-none placeholder:text-muted-foreground"
      />
      {right}
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
        "w-full py-3.5 bg-[#0D1829] text-white rounded-xl text-sm font-semibold font-['Inter'] tracking-tight",
        "active:scale-[0.99] transition-all disabled:opacity-40 hover:bg-[#1a2d4a]",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ─── Auth split-panel layout ──────────────────────────────────────────────────
const AUTH_FEATURES = [
  { Icon: Activity, label: "4 AI agents bekerja serial & paralel" },
  { Icon: FileText, label: "Laporan McKinsey SCR framework" },
  { Icon: Globe, label: "Data real-time 1.000+ sumber web" },
];

function AuthSplit({ children, title, subtitle }: {
  children: React.ReactNode; title?: string; subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] shrink-0 bg-[#0B1628] flex-col">
        <div className="p-7 flex items-center gap-2.5">
          <ImageWithFallback src={CLogoImg} alt="Consultin" className="w-6 h-6 object-contain" />
          <span className="text-white/60 text-xs font-semibold font-['Inter'] tracking-widest uppercase">Consultin</span>
        </div>
        <div className="flex-1 flex flex-col justify-center px-10 pb-10">
          <div className="mb-8">
            <ImageWithFallback src={CLogoImg} alt="Consultin" className="w-16 h-16 object-contain mb-7" />
            <h2 className="text-[28px] font-bold font-['Plus_Jakarta_Sans'] text-white leading-snug mb-3">
              AI Business Intelligence<br />untuk UMKM Indonesia
            </h2>
            <p className="text-white/50 text-[13px] font-['Inter'] leading-relaxed">
              Diperkuat AMD MI300X GPU & Qwen3 — analisis kompetitor, sentimen pasar, dan strategi bisnis dalam hitungan menit.
            </p>
          </div>
          <div className="space-y-3.5">
            {AUTH_FEATURES.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2A74C4]/15 flex items-center justify-center shrink-0 border border-[#2A74C4]/20">
                  <Icon size={15} className="text-[#6EA8D8]" />
                </div>
                <p className="text-white/65 text-[13px] font-['Inter']">{label}</p>
              </div>
            ))}
          </div>
          {/* AMD badge */}
          <div className="mt-10 flex items-center gap-2">
            <div className="px-2.5 py-1 bg-[#2A74C4]/10 border border-[#2A74C4]/20 rounded-md">
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#6EA8D8] uppercase tracking-widest">AMD MI300X</span>
            </div>
            <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md">
              <span className="text-[10px] font-['JetBrains_Mono'] text-white/40 uppercase tracking-widest">Qwen3-235B</span>
            </div>
          </div>
        </div>
        <div className="p-7 border-t border-white/5">
          <p className="text-white/25 text-[11px] font-['Inter'] text-center">
            AMD Developer Hackathon 2026 · Open Source
          </p>
        </div>
      </div>

      {/* Right form area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden border-b border-border bg-card px-6 py-4 flex items-center gap-2.5">
          <ImageWithFallback src={CLogoImg} alt="Consultin" className="w-6 h-6 object-contain" />
          <span className="font-bold text-sm font-['Plus_Jakarta_Sans'] text-foreground">Consultin</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-[420px]">
            {title && (
              <div className="mb-8">
                <h1 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-foreground mb-1.5 leading-snug">{title}</h1>
                {subtitle && <p className="text-muted-foreground text-sm font-['Inter']">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App sidebar ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home" as Screen, Icon: Home, label: "Dashboard" },
  { id: "history" as Screen, Icon: Clock, label: "History" },
  { id: "account" as Screen, Icon: User, label: "Akun" },
] as const;

function Sidebar({ active, onNavigate, analysisCount }: {
  active: Screen; onNavigate: (s: Screen) => void; analysisCount: number;
}) {
  const isHomeActive = (s: Screen) => ["home","processing","report","fullreport"].includes(s);

  return (
    <aside className="hidden md:flex flex-col shrink-0 w-16 lg:w-[220px] xl:w-[240px] bg-[#0B1628] h-screen sticky top-0 border-r border-white/[0.04]">
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
        {NAV_ITEMS.map(({ id, Icon, label }) => {
          const on = id === "home" ? isHomeActive(active) : active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-['Inter'] font-medium transition-all",
                on
                  ? "bg-[#2A74C4]/15 text-[#7BB8F0] border-l-2 border-[#2A74C4] pl-[10px]"
                  : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]",
              )}
            >
              <Icon size={17} className="shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tier + user */}
      <div className="px-2 lg:px-3 pb-4 border-t border-white/[0.05] pt-3 space-y-2">
        <div className="hidden lg:block bg-[#2A74C4]/10 rounded-lg p-3 border border-[#2A74C4]/15">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold font-['Inter'] text-[#7BB8F0]">Free Plan</span>
            <span className="text-[10px] font-['JetBrains_Mono'] text-white/35">{analysisCount}/3</span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-2.5">
            <div className="h-full bg-gradient-to-r from-[#2A74C4] to-[#7BB8F0] rounded-full transition-all" style={{ width: `${(analysisCount / 3) * 100}%` }} />
          </div>
          <button onClick={() => onNavigate("account")} className="w-full text-center text-[11px] font-semibold font-['Inter'] text-[#7BB8F0] hover:text-white transition-colors">
            Upgrade ke Pro →
          </button>
        </div>
        <div className="flex items-center gap-2.5 px-1 lg:px-2 py-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#2A74C4] to-[#14385E] flex items-center justify-center shrink-0">
            <User size={13} className="text-white" />
          </div>
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="text-white/80 text-[12px] font-semibold font-['Inter'] truncate">CEO Account</span>
            <span className="text-white/35 text-[10px] font-['Inter'] truncate">free@consultin.id</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Mobile bottom tab bar
function MobileTabBar({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-border flex items-center justify-around px-4 pt-2.5 pb-6 z-40">
      {NAV_ITEMS.map(({ id, Icon, label }) => {
        const on = id === "home" ? ["home","processing","report","fullreport","slidedeck"].includes(active) : active === id;
        return (
          <button key={id} onClick={() => onNavigate(id)}
            className={cn("flex flex-col items-center gap-0.5 transition-colors", on ? "text-[#0D1829]" : "text-muted-foreground")}>
            <Icon size={21} strokeWidth={on ? 2.5 : 1.5} />
            <span className="text-[10px] font-['Inter']">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// App shell wrapper
function AppShell({ children, screen, onNavigate, analysisCount }: {
  children: React.ReactNode; screen: Screen; onNavigate: (s: Screen) => void; analysisCount: number;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={screen} onNavigate={onNavigate} analysisCount={analysisCount} />
      <main className="flex-1 min-w-0 overflow-auto pb-24 md:pb-0">
        {children}
      </main>
      <MobileTabBar active={screen} onNavigate={onNavigate} />
    </div>
  );
}

// ─── Splash ──────────────────────────────────────────────────────────────────
function SplashView() {
  return (
    <div className="min-h-screen bg-[#0B1628] flex flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="absolute inset-0 bg-[#2A74C4]/20 rounded-full blur-2xl scale-150 animate-pulse" />
        <ImageWithFallback src={CLogoImg} alt="Consultin" className="relative w-20 h-20 object-contain" />
      </div>
      <div className="text-center">
        <p className="text-white/80 text-lg font-bold font-['Plus_Jakarta_Sans'] tracking-wide">Consultin</p>
        <p className="text-white/35 text-xs font-['Inter'] mt-1 tracking-widest uppercase">AI Business Intelligence</p>
      </div>
      <div className="flex gap-1.5 mt-4">
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#2A74C4] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
const OB_SLIDES = [
  {
    Icon: Activity,
    color: "#2A74C4",
    title: "AI Agent Pipeline",
    sub: "4 agen AI bekerja serial secara otomatis",
    body: "Scraping → Analisis Sentimen → SWOT Generation → Executive Summary. Didukung AMD MI300X GPU 192GB HBM3 dan model Qwen3-235B.",
    stats: [{ label: "Waktu Proses", val: "< 3 menit" }, { label: "Data Sources", val: "1.000+" }, { label: "Model Params", val: "235B" }],
  },
  {
    Icon: FileText,
    color: "#7C3AED",
    title: "Laporan Gaya McKinsey",
    sub: "Framework SCR: Situation – Complication – Resolution",
    body: "Output terstruktur mengikuti metodologi konsultan top: situational analysis, SWOT, competitive landscape, strategic priorities, dan risk matrix.",
    stats: [{ label: "Seksi Laporan", val: "9 modul" }, { label: "Slide Template", val: "10 slides" }, { label: "Framework", val: "SWOT + 5F" }],
  },
  {
    Icon: TrendingUp,
    color: "#0B7A6A",
    title: "Keputusan Lebih Cerdas",
    sub: "Insight berbasis data untuk CEO UMKM Indonesia",
    body: "Dari warung makan hingga toko online — Consultin membantu Anda memahami pasar, mengantisipasi risiko, dan bersaing lebih efektif.",
    stats: [{ label: "Akurasi Sentimen", val: "94.2%" }, { label: "UMKM Terbantu", val: "2.800+" }, { label: "Avg ROI", val: "+127%" }],
  },
];

function OnboardingView({ onFinish }: { onFinish: () => void }) {
  const [slide, setSlide] = useState(0);
  const s = OB_SLIDES[slide];
  const Icon = s.Icon;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {OB_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={cn("h-1.5 rounded-full transition-all", i === slide ? "w-8 bg-[#2A74C4]" : "w-1.5 bg-border")} />
          ))}
        </div>

        {/* Slide card */}
        <div className="bg-card rounded-2xl border border-border p-10 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <Icon size={22} style={{ color: s.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground leading-tight">{s.title}</h2>
              <p className="text-muted-foreground text-sm font-['Inter']">{s.sub}</p>
            </div>
          </div>
          <p className="text-[15px] font-['Inter'] text-foreground/80 leading-relaxed mb-8">{s.body}</p>
          <div className="grid grid-cols-3 gap-4">
            {s.stats.map(({ label, val }) => (
              <div key={label} className="bg-background rounded-xl p-3.5 border border-border text-center">
                <p className="text-lg font-bold font-['JetBrains_Mono'] text-foreground">{val}</p>
                <p className="text-[11px] text-muted-foreground font-['Inter'] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={onFinish} className="text-sm text-muted-foreground font-['Inter'] hover:text-foreground transition-colors px-2">
            Lewati
          </button>
          <div className="flex gap-3">
            {slide > 0 && (
              <button onClick={() => setSlide(slide - 1)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-['Inter'] font-medium text-foreground hover:bg-muted transition-all">
                Kembali
              </button>
            )}
            <button
              onClick={() => slide < OB_SLIDES.length - 1 ? setSlide(slide + 1) : onFinish()}
              className="px-6 py-2.5 rounded-xl bg-[#0D1829] text-white text-sm font-['Inter'] font-semibold hover:bg-[#1a2d4a] transition-all flex items-center gap-2">
              {slide < OB_SLIDES.length - 1 ? "Lanjut" : "Mulai Sekarang"}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginView({ onLogin, onSignup, onForgot }: {
  onLogin: () => void; onSignup: () => void; onForgot: () => void;
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  return (
    <AuthSplit title="Masuk ke Akun" subtitle="Selamat datang kembali, CEO 👋">
      <div className="space-y-4">
        <InputField icon={Mail} placeholder="Email" value={email} onChange={setEmail} />
        <InputField
          icon={Lock} type={showPass ? "text" : "password"} placeholder="Password"
          value={pass} onChange={setPass}
          right={
            <button onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-foreground transition-colors">
              {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          }
        />
        <div className="flex justify-end">
          <button onClick={onForgot} className="text-[13px] font-['Inter'] text-[#2A74C4] hover:text-[#1a5490] transition-colors">
            Lupa password?
          </button>
        </div>
        <PrimaryBtn onClick={onLogin}>Masuk</PrimaryBtn>
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-['Inter']">atau</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 rounded-xl border border-border text-[13px] font-['Inter'] font-medium text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[rgba(212,70,56,0.2)] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#d44638]" />
            </div>
            Google
          </button>
          <button className="py-3 rounded-xl border border-border text-[13px] font-['Inter'] font-medium text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded bg-[#4267b2] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">f</span>
            </div>
            Facebook
          </button>
        </div>
        <p className="text-center text-[13px] text-muted-foreground font-['Inter']">
          Belum punya akun?{" "}
          <button onClick={onSignup} className="text-[#2A74C4] font-semibold hover:text-[#1a5490] transition-colors">
            Daftar
          </button>
        </p>
      </div>
    </AuthSplit>
  );
}

// ─── Signup ───────────────────────────────────────────────────────────────────
function SignupView({ onRegister, onSignIn }: { onRegister: () => void; onSignIn: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  return (
    <AuthSplit title="Buat Akun Baru" subtitle="Bergabung dengan 2.800+ CEO UMKM Indonesia">
      <div className="space-y-4">
        <InputField icon={User} placeholder="Nama Lengkap" value={name} onChange={setName} />
        <InputField icon={Mail} placeholder="Email" value={email} onChange={setEmail} />
        <InputField
          icon={Lock} type={showPass ? "text" : "password"} placeholder="Password (min. 8 karakter)"
          value={pass} onChange={setPass}
          right={
            <button onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-foreground transition-colors">
              {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          }
        />
        <PrimaryBtn onClick={onRegister}>Buat Akun</PrimaryBtn>
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-['Inter']">atau</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 rounded-xl border border-border text-[13px] font-['Inter'] font-medium text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[rgba(212,70,56,0.15)] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#d44638]" />
            </div>
            Google
          </button>
          <button className="py-3 rounded-xl border border-border text-[13px] font-['Inter'] font-medium text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded bg-[#4267b2] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">f</span>
            </div>
            Facebook
          </button>
        </div>
        <p className="text-center text-[13px] text-muted-foreground font-['Inter']">
          Sudah punya akun?{" "}
          <button onClick={onSignIn} className="text-[#2A74C4] font-semibold hover:text-[#1a5490] transition-colors">
            Masuk
          </button>
        </p>
      </div>
    </AuthSplit>
  );
}

// ─── Phone number ─────────────────────────────────────────────────────────────
function PhoneNumberView({ onVerify, onLater }: { onVerify: () => void; onLater: () => void }) {
  const [phone, setPhone] = useState("");
  return (
    <AuthSplit title="Tambah Nomor Telepon" subtitle="Opsional — untuk keamanan akun dan notifikasi analisis">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-3 shrink-0">
            <span className="text-base">🇮🇩</span>
            <span className="text-sm font-['Inter'] text-foreground font-medium">+62</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </div>
          <InputField icon={Phone} placeholder="8xx xxxx xxxx" value={phone} onChange={setPhone} />
        </div>
        <PrimaryBtn onClick={onVerify} disabled={!phone.trim()}>Kirim Kode Verifikasi</PrimaryBtn>
        <button onClick={onLater} className="w-full py-3.5 rounded-xl bg-muted text-muted-foreground text-sm font-['Inter'] font-medium hover:bg-muted/80 transition-all">
          Nanti Saja
        </button>
        <p className="text-center text-[12px] text-muted-foreground font-['Inter']">
          Nomor telepon Anda hanya digunakan untuk keamanan dan tidak akan dibagikan kepada pihak ketiga.
        </p>
      </div>
    </AuthSplit>
  );
}

// ─── OTP Verify ───────────────────────────────────────────────────────────────
function PhoneVerifyView({ onVerify, onBack }: { onVerify: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(59);
  const refs = otp.map(() => ({ current: null as HTMLInputElement | null }));

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
    <AuthSplit title="Verifikasi Nomor" subtitle="Masukkan kode 6 digit yang dikirim ke nomor Anda">
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
                "w-11 h-13 text-center text-xl font-bold font-['JetBrains_Mono'] rounded-xl border-2 bg-card text-foreground outline-none transition-all",
                d ? "border-[#2A74C4] shadow-[0_0_0_3px_rgba(42,116,196,0.15)]" : "border-border focus:border-[#2A74C4]",
              )}
            />
          ))}
        </div>
        <PrimaryBtn onClick={onVerify} disabled={otp.some(d => !d)}>Verifikasi</PrimaryBtn>
        <div className="text-center">
          {timer > 0 ? (
            <p className="text-[13px] text-muted-foreground font-['Inter']">
              Kirim ulang dalam <span className="font-['JetBrains_Mono'] text-foreground font-medium">0:{timer.toString().padStart(2,"0")}</span>
            </p>
          ) : (
            <button onClick={() => setTimer(59)} className="text-[13px] text-[#2A74C4] font-['Inter'] font-semibold hover:text-[#1a5490] transition-colors flex items-center gap-1.5 mx-auto">
              <RefreshCw size={13} /> Kirim ulang kode
            </button>
          )}
        </div>
        <button onClick={onBack} className="w-full text-center text-[13px] text-muted-foreground font-['Inter'] hover:text-foreground transition-colors">
          ← Ganti nomor telepon
        </button>
      </div>
    </AuthSplit>
  );
}

// ─── Forgot password ──────────────────────────────────────────────────────────
function ForgotPasswordView({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [method, setMethod] = useState<"email" | "phone" | null>(null);
  return (
    <AuthSplit title="Reset Password" subtitle="Pilih metode untuk menerima kode verifikasi">
      <div className="space-y-4">
        {[
          { id: "email" as const, Icon: Mail, label: "Via Email", desc: "Kode dikirim ke c**o@gmail.com" },
          { id: "phone" as const, Icon: Phone, label: "Via WhatsApp", desc: "Kode dikirim ke +62 8xx xxxx xx89" },
        ].map(({ id, Icon, label, desc }) => (
          <button
            key={id} onClick={() => setMethod(id)}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4",
              method === id ? "border-[#2A74C4] bg-[#EBF3FD]" : "border-border bg-card hover:border-[#2A74C4]/40",
            )}
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
              method === id ? "bg-[#2A74C4] text-white" : "bg-muted text-muted-foreground")}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold font-['Inter'] text-foreground">{label}</p>
              <p className="text-[12px] text-muted-foreground font-['Inter']">{desc}</p>
            </div>
            {method === id && <CheckCircle2 size={18} className="text-[#2A74C4] ml-auto shrink-0" />}
          </button>
        ))}
        <PrimaryBtn onClick={onNext} disabled={!method}>Kirim Kode Verifikasi</PrimaryBtn>
        <button onClick={onBack} className="w-full text-center text-[13px] text-muted-foreground font-['Inter'] hover:text-foreground transition-colors">
          ← Kembali ke login
        </button>
      </div>
    </AuthSplit>
  );
}

// ─── Reset password ───────────────────────────────────────────────────────────
function ResetPasswordView({ onDone }: { onDone: () => void }) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  return (
    <AuthSplit title="Buat Password Baru" subtitle="Password harus minimal 8 karakter">
      <div className="space-y-4">
        <InputField icon={Lock} type={showP ? "text" : "password"} placeholder="Password baru" value={pass} onChange={setPass}
          right={<button onClick={() => setShowP(!showP)} className="text-muted-foreground hover:text-foreground transition-colors">{showP ? <Eye size={16} /> : <EyeOff size={16} />}</button>} />
        <InputField icon={Lock} type={showC ? "text" : "password"} placeholder="Konfirmasi password" value={confirm} onChange={setConfirm}
          right={<button onClick={() => setShowC(!showC)} className="text-muted-foreground hover:text-foreground transition-colors">{showC ? <Eye size={16} /> : <EyeOff size={16} />}</button>} />
        {pass && confirm && pass !== confirm && (
          <p className="text-destructive text-[12px] font-['Inter'] flex items-center gap-1.5"><AlertTriangle size={12} /> Password tidak cocok</p>
        )}
        <PrimaryBtn onClick={onDone} disabled={!pass || pass !== confirm || pass.length < 8}>Reset Password</PrimaryBtn>
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

function HomeView({ onSubmit, analysisCount }: { onSubmit: (q: string) => void; analysisCount: number }) {
  const [query, setQuery] = useState("");
  const [clarifying, setClarifying] = useState(false);

  const handleAsk = () => {
    if (!query.trim()) return;
    if (!clarifying) { setClarifying(true); return; }
    onSubmit(query);
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <ImageWithFallback src={CLogoImg} alt="C" className="w-7 h-7 object-contain" />
          </div>
          <div className="hidden md:block">
            <ImageWithFallback src={ConsultinLogo} alt="Consultin" className="h-6 w-auto object-contain" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-['JetBrains_Mono'] text-[#2A74C4] bg-[#EBF3FD] border border-[#2A74C4]/20 px-2.5 py-1 rounded-md">
            Free · {3 - analysisCount} tersisa
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-8 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-foreground mb-1.5">
            Halo, CEO! 👋
          </h1>
          <p className="text-muted-foreground font-['Inter']">Ingin analisis bisnis apa hari ini?</p>
        </div>

        {/* Query card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 mb-6">
          <textarea
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Contoh: analisis kompetitor kafe di area Dago Bandung..."
            rows={3}
            className="w-full bg-transparent text-foreground text-[15px] font-['Inter'] outline-none placeholder:text-muted-foreground resize-none leading-relaxed"
          />
          {/* Clarification bubble */}
          {clarifying && (
            <div className="mt-3 p-3.5 bg-[#EBF3FD] rounded-xl border border-[#2A74C4]/20">
              <p className="text-[13px] text-[#1a5490] font-['Inter'] font-medium mb-1">Agen AI perlu klarifikasi:</p>
              <p className="text-[13px] text-[#1a5490] font-['Inter']">Apakah target pasar Anda B2C (konsumen langsung) atau B2B (bisnis ke bisnis)?</p>
              <div className="flex gap-2 mt-2.5">
                {["B2C — Konsumen Langsung", "B2B — Bisnis ke Bisnis"].map(opt => (
                  <button key={opt} onClick={() => onSubmit(query)}
                    className="px-3 py-1.5 rounded-lg bg-[#2A74C4] text-white text-[12px] font-['Inter'] font-semibold hover:bg-[#1a5490] transition-all">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin size={13} />
              <span className="text-[12px] font-['Inter']">Lokasi terdeteksi otomatis</span>
            </div>
            <button
              onClick={handleAsk} disabled={!query.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D1829] text-white rounded-lg text-[13px] font-['Inter'] font-semibold disabled:opacity-40 hover:bg-[#1a2d4a] active:scale-95 transition-all">
              <Send size={14} /> Analisis
            </button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mb-8">
          <p className="text-[12px] font-semibold font-['Inter'] text-muted-foreground uppercase tracking-wide mb-3">Coba tanyakan</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => setQuery(s)}
                className="px-3.5 py-1.5 rounded-full bg-card border border-border text-[13px] font-['Inter'] text-foreground hover:border-[#2A74C4]/50 hover:bg-accent transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Recent analyses */}
        {RECENT_ANALYSES.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold font-['Inter'] text-muted-foreground uppercase tracking-wide mb-3">Analisis Terakhir</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECENT_ANALYSES.map((item) => (
                <button key={item.topic} onClick={() => onSubmit(item.topic)}
                  className="bg-card rounded-xl border border-border p-4 text-left hover:border-[#2A74C4]/40 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-['Inter'] font-medium text-muted-foreground">{item.tag}</span>
                    <span className="text-[11px] text-muted-foreground font-['Inter']">{item.date}</span>
                  </div>
                  <p className="text-[13px] font-semibold font-['Inter'] text-foreground mb-2 leading-snug group-hover:text-[#2A74C4] transition-colors">{item.topic}</p>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[11px] font-['Inter'] font-medium", item.sentiment === "Positif" ? "text-emerald-600" : "text-amber-500")}>{item.sentiment}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-[#2A74C4] rounded-full" style={{ width: `${item.score}%` }} />
                      </div>
                      <span className="text-[11px] font-['JetBrains_Mono'] text-muted-foreground">{item.score}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Processing ───────────────────────────────────────────────────────────────
const AGENT_STEPS = [
  { id: 1, name: "Web Scraping Agent", desc: "Mengumpulkan data dari 1.000+ sumber: Google Maps, Tokopedia, media sosial, berita industri.", icon: Globe, time: "~45 detik" },
  { id: 2, name: "Sentiment Analysis Agent", desc: "Qwen3-235B menganalisis 2.800+ ulasan & mention untuk scoring sentimen publik.", icon: Activity, time: "~50 detik" },
  { id: 3, name: "SWOT Generator Agent", desc: "Membangun matrix SWOT berbasis data kompetitif dan tren pasar real-time.", icon: Target, time: "~40 detik" },
  { id: 4, name: "Executive Summary Agent", desc: "Menyusun laporan eksekutif gaya McKinsey dalam format SCR framework.", icon: FileText, time: "~35 detik" },
];

function ProcessingView({ query, onComplete }: { query: string; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [showTech, setShowTech] = useState(false);

  useEffect(() => {
    if (step < AGENT_STEPS.length) {
      const t = setTimeout(() => setStep(s => s + 1), 1800);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [step, onComplete]);

  const pct = Math.round((step / AGENT_STEPS.length) * 100);

  return (
    <div className="min-h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 md:px-8 py-4 flex items-center gap-3">
        <ImageWithFallback src={ConsultinLogo} alt="Consultin" className="h-5 w-auto object-contain hidden md:block" />
        <ImageWithFallback src={CLogoImg} alt="C" className="w-5 h-5 object-contain md:hidden" />
        <span className="text-sm text-muted-foreground font-['Inter']">Memproses analisis...</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 md:px-8 py-10 w-full flex-1">
        {/* Topic */}
        <div className="bg-card rounded-xl border border-border p-4 mb-8">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-['Inter'] mb-1">Topik Analisis</p>
          <p className="text-[15px] font-semibold font-['Plus_Jakarta_Sans'] text-foreground">{query || REPORT_DATA.topic}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-['Inter'] text-muted-foreground">Progress keseluruhan</span>
            <span className="text-[13px] font-['JetBrains_Mono'] font-medium text-foreground">{pct}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#2A74C4] to-[#6EA8D8] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {AGENT_STEPS.map((s, i) => {
            const done = step > i;
            const active = step === i;
            const Icon = s.icon;
            return (
              <div key={s.id}
                className={cn("rounded-xl border p-4 transition-all",
                  done ? "bg-card border-emerald-200" :
                  active ? "bg-card border-[#2A74C4]/30 shadow-sm" :
                  "bg-card/50 border-border opacity-50")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    done ? "bg-emerald-500 text-white" :
                    active ? "bg-[#2A74C4] text-white" :
                    "bg-muted text-muted-foreground")}>
                    {done ? <CheckCircle2 size={18} /> : active ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon size={17} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-[13px] font-semibold font-['Inter']", done ? "text-emerald-700" : active ? "text-foreground" : "text-muted-foreground")}>{s.name}</p>
                      <span className="text-[11px] font-['JetBrains_Mono'] text-muted-foreground shrink-0">{s.time}</span>
                    </div>
                    {(done || active) && <p className="text-[12px] text-muted-foreground font-['Inter'] mt-0.5 leading-relaxed">{s.desc}</p>}
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
              <span className="text-[13px] font-semibold font-['Inter'] text-foreground">Detail Teknis & Transparansi</span>
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
                  <p className="text-[11px] text-[13px] font-bold font-['JetBrains_Mono'] text-foreground">{val}</p>
                  <p className="text-[10px] text-muted-foreground font-['Inter'] mt-0.5">{label}</p>
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
    { name: "Positif", value: r.sentimentPos, color: "#22C55E" },
    { name: "Netral", value: r.sentimentNeu, color: "#64748B" },
    { name: "Negatif", value: r.sentimentNeg, color: "#EF4444" },
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
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-['Inter']">Laporan Analisis</p>
            <p className="text-sm font-semibold font-['Inter'] text-foreground truncate max-w-xs md:max-w-lg">{query || r.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onNavigate("fullreport")} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[13px] font-['Inter'] font-medium text-foreground hover:bg-muted transition-all">
            <FileText size={14} /> Full Report
          </button>
          <button onClick={() => onNavigate("slidedeck")} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D1829] text-white text-[13px] font-['Inter'] font-medium hover:bg-[#1a2d4a] transition-all">
            <Layers size={14} /> Slide Deck
          </button>
          <button onClick={() => onNavigate("home")} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[13px] font-['Inter'] font-medium text-foreground hover:bg-muted transition-all">
            <Sparkles size={14} /> Baru
          </button>
          <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <Download size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Left: Main content */}
        <div className="flex-1 min-w-0 px-6 md:px-8 py-6 space-y-5">
          {/* Score banner */}
          <div className="bg-gradient-to-r from-[#0B1628] to-[#1A3B6E] rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center shrink-0 bg-white/10">
              <span className="text-xl font-bold font-['JetBrains_Mono']">{r.overallScore}</span>
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-[11px] font-['Inter'] uppercase tracking-wide mb-0.5">Skor Kelayakan Pasar</p>
              <p className="text-lg font-bold font-['Plus_Jakarta_Sans'] leading-snug">{query || r.topic}</p>
              <p className="text-white/50 text-[12px] font-['Inter'] mt-0.5">{r.date} · 4 agents · 2.847 data points</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-['Inter'] font-semibold border border-emerald-500/30">
                Sentimen {r.sentimentPos}% Positif
              </span>
            </div>
          </div>

          {/* Executive summary */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[13px] font-bold font-['Plus_Jakarta_Sans'] text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText size={15} className="text-[#2A74C4]" /> Ringkasan Eksekutif
            </h3>
            <p className="text-[14px] font-['Inter'] text-foreground/80 leading-relaxed">
              Pasar kafe spesialti di area Dago Bandung menunjukkan momentum pertumbuhan yang kuat dengan peningkatan 34% YoY, didorong oleh demografi mahasiswa dan profesional muda. Namun, masuknya jaringan nasional menciptakan tekanan kompetitif yang signifikan. Rekomendasi utama: fokus pada diferensiasi brand, optimasi digital presence, dan program loyalitas dalam 90 hari pertama.
            </p>
          </div>

          {/* Sentiment trend */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[13px] font-bold font-['Plus_Jakarta_Sans'] text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-[#2A74C4]" /> Tren Sentimen (6 Bulan)
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={r.sentimentTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Inter", borderRadius: 8, border: "1px solid #e2e8f2" }} />
                <Line type="monotone" dataKey="pos" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} name="Positif %" />
                <Line type="monotone" dataKey="neg" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="Negatif %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* SWOT */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => setOpenSwot(!openSwot)}
              className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <h3 className="text-[13px] font-bold font-['Plus_Jakarta_Sans'] text-foreground uppercase tracking-wide flex items-center gap-2">
                <Target size={15} className="text-[#2A74C4]" /> Analisis SWOT
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
                    <p className="text-[11px] font-bold font-['Inter'] uppercase tracking-wide text-muted-foreground mb-2">{label}</p>
                    <ul className="space-y-1.5">
                      {items.map((item) => (
                        <li key={item} className="text-[13px] font-['Inter'] text-foreground flex items-start gap-1.5">
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
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[13px] font-bold font-['Plus_Jakarta_Sans'] text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <Sparkles size={15} className="text-[#2A74C4]" /> Prioritas Strategis
            </h3>
            <div className="space-y-2.5">
              {r.priorities.map((p) => (
                <div key={p.rank} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                  <div className="w-6 h-6 rounded-full bg-[#0D1829] text-white text-[11px] font-bold font-['JetBrains_Mono'] flex items-center justify-center shrink-0">{p.rank}</div>
                  <p className="flex-1 text-[13px] font-['Inter'] font-medium text-foreground">{p.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-['Inter'] font-semibold",
                      p.impact === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                      {p.impact} impact
                    </span>
                    <span className="text-[11px] font-['JetBrains_Mono'] text-muted-foreground">{p.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile action row */}
          <div className="sm:hidden grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate("fullreport")} className="py-3 rounded-xl border border-border text-[13px] font-['Inter'] font-semibold text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-all">
              <FileText size={15} /> Full Report
            </button>
            <button onClick={() => onNavigate("slidedeck")} className="py-3 rounded-xl bg-[#0D1829] text-white text-[13px] font-['Inter'] font-semibold flex items-center justify-center gap-2 hover:bg-[#1a2d4a] transition-all">
              <Layers size={15} /> Slide Deck
            </button>
          </div>
        </div>

        {/* Right: Sticky insights panel */}
        <div className="lg:w-80 xl:w-[340px] shrink-0 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-auto border-t lg:border-t-0 lg:border-l border-border">
          <div className="p-5 space-y-4">
            {/* Sentiment donut */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-bold font-['Inter'] uppercase tracking-wide text-muted-foreground mb-3">Distribusi Sentimen</p>
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
                      <span className="text-[12px] font-['Inter'] text-muted-foreground">{name}</span>
                      <span className="text-[12px] font-bold font-['JetBrains_Mono'] text-foreground ml-auto">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-bold font-['Inter'] uppercase tracking-wide text-muted-foreground mb-3">Metrik Kunci</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Market Score", val: `${r.overallScore}/100`, icon: Star },
                  { label: "Kompetitor", val: "5 aktif", icon: Users },
                  { label: "Data Points", val: "2.847", icon: Activity },
                  { label: "Keyakinan", val: "86%", icon: Shield },
                ].map(({ label, val, icon: Icon }) => (
                  <div key={label} className="bg-background rounded-lg p-3 border border-border">
                    <p className="text-[13px] font-bold font-['JetBrains_Mono'] text-foreground">{val}</p>
                    <p className="text-[10px] text-muted-foreground font-['Inter'] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-bold font-['Inter'] uppercase tracking-wide text-muted-foreground mb-3">Tingkat Kepercayaan Klaim</p>
              <div className="space-y-2.5">
                {r.claims.slice(0, 3).map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-['Inter'] text-foreground leading-tight truncate max-w-[160px]">{c.text}</p>
                      <span className="text-[11px] font-['JetBrains_Mono'] font-medium text-foreground shrink-0 ml-2">{c.conf}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#2A74C4] to-[#6EA8D8] transition-all" style={{ width: `${c.conf}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={() => onNavigate("fullreport")} className="w-full py-3 rounded-xl border border-border text-[13px] font-['Inter'] font-semibold text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2">
                <FileText size={15} /> Lihat Full Report
              </button>
              <button onClick={() => onNavigate("slidedeck")} className="w-full py-3 rounded-xl bg-[#0D1829] text-white text-[13px] font-['Inter'] font-semibold hover:bg-[#1a2d4a] transition-all flex items-center justify-center gap-2">
                <Layers size={15} /> Buat Slide Deck
              </button>
              <button onClick={() => onNavigate("home")} className="w-full py-3 rounded-xl border border-border text-[13px] font-['Inter'] font-medium text-muted-foreground hover:bg-muted transition-all flex items-center justify-center gap-2">
                <Sparkles size={14} /> Analisis Baru
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
  "Ringkasan Eksekutif", "Analisis Situasional", "Sentimen & Opini Publik",
  "Peta Kompetitif", "Analisis SWOT", "Prioritas Strategis",
  "Matriks Risiko", "Kepercayaan Data", "Metodologi",
];

function FullReportView({ query, onBack, onSlideDeck }: { query: string; onBack: () => void; onSlideDeck: () => void }) {
  const [open, setOpen] = useState<number[]>([0, 1]);
  const [activeSection, setActiveSection] = useState(0);
  const r = REPORT_DATA;

  const toggle = (i: number) => setOpen(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const sentPie = [
    { name: "Positif", value: r.sentimentPos, color: "#22C55E" },
    { name: "Netral", value: r.sentimentNeu, color: "#64748B" },
    { name: "Negatif", value: r.sentimentNeg, color: "#EF4444" },
  ];

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0D1829] text-white px-6 md:px-8 py-3.5 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-['Inter']">Full Report</p>
          <p className="text-sm font-semibold font-['Plus_Jakarta_Sans'] text-white/90 truncate">{query || r.topic}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onSlideDeck} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-white text-[13px] font-['Inter'] font-medium hover:bg-white/20 transition-all">
            <Layers size={14} /> Slide Deck
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2A74C4] text-white text-[13px] font-['Inter'] font-medium hover:bg-[#1a5490] transition-all">
            <Download size={14} /> Unduh PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* TOC sidebar */}
        <div className="hidden xl:flex flex-col w-56 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-auto border-r border-border bg-background">
          <div className="p-5">
            <p className="text-[10px] font-bold font-['Inter'] uppercase tracking-widest text-muted-foreground mb-3">Daftar Isi</p>
            <nav className="space-y-0.5">
              {FR_SECTIONS.map((sec, i) => (
                <button key={i} onClick={() => setActiveSection(i)}
                  className={cn("w-full text-left px-3 py-2 rounded-lg text-[12px] font-['Inter'] transition-all",
                    activeSection === i ? "bg-[#EBF3FD] text-[#2A74C4] font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                  <span className="font-['JetBrains_Mono'] text-[10px] opacity-50 mr-1.5">{String(i + 1).padStart(2, "0")}</span>
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
                  <span className="text-[11px] font-['JetBrains_Mono'] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-[14px] font-bold font-['Plus_Jakarta_Sans'] text-foreground">{title}</h3>
                </div>
                <ChevronDown size={15} className={cn("text-muted-foreground transition-transform shrink-0", open.includes(i) && "rotate-180")} />
              </button>

              {open.includes(i) && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  {i === 0 && (
                    <p className="text-[14px] font-['Inter'] text-foreground/80 leading-relaxed">
                      Pasar kafe spesialti di area Dago Bandung menunjukkan momentum pertumbuhan yang kuat dengan CAGR 34% YoY, didorong oleh demografi mahasiswa dan profesional muda yang kian meningkat. Analisis komprehensif terhadap 2.847 data points dari berbagai sumber menunjukkan bahwa bisnis ini memiliki kelayakan pasar 82/100. Namun, entry pemain jaringan nasional dalam 6 bulan terakhir menciptakan tekanan kompetitif yang membutuhkan respons strategis segera.
                    </p>
                  )}
                  {i === 1 && (
                    <div>
                      <p className="text-[14px] font-['Inter'] text-foreground/80 leading-relaxed mb-4">
                        Situasi pasar saat ini menunjukkan pertumbuhan permintaan yang konsisten. Tren work-from-café pasca pandemi belum mencapai titik jenuh, dan segmen premium masih underserved.
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={r.sentimentTrend}>
                          <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                          <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Inter", borderRadius: 8 }} />
                          <Line type="monotone" dataKey="pos" stroke="#22C55E" strokeWidth={2} name="Sentimen Positif %" />
                          <Line type="monotone" dataKey="neg" stroke="#EF4444" strokeWidth={2} name="Sentimen Negatif %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[13px] font-['Inter'] text-foreground/80 leading-relaxed mb-3">
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
                        <p className="text-[11px] font-bold text-muted-foreground font-['Inter'] uppercase tracking-wide mb-3">Distribusi per Platform</p>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={[{ p: "Google Maps", n: 312 }, { p: "Instagram", n: 284 }, { p: "TripAdvisor", n: 142 }, { p: "Twitter/X", n: 109 }]}>
                            <XAxis dataKey="p" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                            <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontFamily: "Inter", borderRadius: 8 }} />
                            <Bar dataKey="n" fill="#2A74C4" radius={[4, 4, 0, 0]} name="Ulasan" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {i === 3 && (
                    <div className="overflow-auto">
                      <table className="w-full text-[13px] font-['Inter']">
                        <thead>
                          <tr className="border-b border-border">
                            {["Kompetitor", "Skor", "Market Share", "YoY Growth"].map(h => (
                              <th key={h} className="text-left py-2 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.competitors.map((c) => (
                            <tr key={c.name} className="border-b border-border hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-foreground">{c.name}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-[#2A74C4] rounded-full" style={{ width: `${c.score}%` }} />
                                  </div>
                                  <span className="font-['JetBrains_Mono'] text-foreground">{c.score}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-muted-foreground">{c.share}%</td>
                              <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-emerald-600">{c.growth}</td>
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
                          <div className="w-7 h-7 rounded-full bg-[#0D1829] text-white text-[12px] font-bold font-['JetBrains_Mono'] flex items-center justify-center shrink-0">{p.rank}</div>
                          <div className="flex-1">
                            <p className="text-[13px] font-semibold font-['Inter'] text-foreground">{p.title}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", p.impact === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{p.impact}</span>
                            <span className="text-[11px] font-['Inter'] text-muted-foreground">{p.effort} effort</span>
                            <span className="text-[11px] font-['JetBrains_Mono'] text-muted-foreground">{p.timeframe}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 6 && (
                    <div className="overflow-auto">
                      <table className="w-full text-[13px] font-['Inter']">
                        <thead>
                          <tr className="border-b border-border">
                            {["Risiko", "Probabilitas", "Dampak", "Mitigasi"].map(h => (
                              <th key={h} className="text-left py-2 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
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
                            <p className="text-[13px] font-semibold font-['Inter'] text-foreground">{c.text}</p>
                            <span className="text-[12px] font-bold font-['JetBrains_Mono'] text-[#2A74C4] shrink-0 ml-3">{c.conf}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                            <div className="h-full bg-gradient-to-r from-[#2A74C4] to-[#6EA8D8] rounded-full" style={{ width: `${c.conf}%` }} />
                          </div>
                          <p className="text-[11px] text-muted-foreground font-['Inter']">Sumber: {c.source}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 8 && (
                    <div className="text-[13px] font-['Inter'] text-foreground/80 leading-relaxed space-y-2">
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
    { name: "Positif", value: r.sentimentPos, color: "#22C55E" },
    { name: "Netral", value: r.sentimentNeu, color: "#64748B" },
    { name: "Negatif", value: r.sentimentNeg, color: "#EF4444" },
  ];

  const SLIDES: React.ReactNode[] = [
    // 0 — Cover
    <div key={0} className="h-full flex flex-col justify-between p-10 md:p-14 bg-gradient-to-br from-[#0B1628] via-[#0D1E3A] to-[#1A3B6E] text-white">
      <div className="flex items-center gap-3">
        <ImageWithFallback src={ConsultinLogo} alt="Consultin" className="h-7 w-auto object-contain brightness-0 invert opacity-70" />
        <div className="h-4 w-px bg-white/20" />
        <span className="text-white/40 text-[11px] font-['JetBrains_Mono'] uppercase tracking-widest">Market Intelligence Report</span>
      </div>
      <div>
        <p className="text-[#6EA8D8] text-xs font-['JetBrains_Mono'] uppercase tracking-widest mb-3">McKinsey SCR Framework</p>
        <h1 className="text-3xl md:text-4xl font-bold font-['Plus_Jakarta_Sans'] leading-snug mb-4">{query || r.topic}</h1>
        <p className="text-white/50 text-[14px] font-['Inter'] mb-8">Analisis Komprehensif · {r.date} · Powered by AMD MI300X + Qwen3-235B</p>
        <div className="flex flex-wrap gap-3">
          {["Sentiment: +71%", "Score: 82/100", "2.847 data points", "4 AI Agents"].map(tag => (
            <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[12px] font-['Inter']">{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-white/25 text-[11px] font-['Inter']">Consultin · Confidential</p>
        <p className="text-white/25 text-[11px] font-['JetBrains_Mono']">1 / {TOTAL_SLIDES}</p>
      </div>
    </div>,

    // 1 — Situation
    <div key={1} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-['JetBrains_Mono'] text-[#2A74C4] uppercase tracking-widest mb-1">01 — Situation</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Kondisi Pasar Saat Ini</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { val: "34% YoY", label: "Pertumbuhan pasar kafe Bandung" },
          { val: "Rp 4,2 T", label: "Nilai pasar F&B Bandung 2026" },
          { val: "2.100+", label: "Outlet kafe aktif di Bandung" },
        ].map(({ val, label }) => (
          <div key={label} className="bg-[#F0F4FA] rounded-xl p-4 border border-[#E2E8F2]">
            <p className="text-2xl font-bold font-['JetBrains_Mono'] text-[#0D1829] mb-1">{val}</p>
            <p className="text-[12px] text-[#64748B] font-['Inter']">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={r.sentimentTrend}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
            <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} domain={[0, 100]} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Inter", borderRadius: 8 }} />
            <Line type="monotone" dataKey="pos" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} name="Sentimen Positif %" />
            <Line type="monotone" dataKey="neg" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} name="Sentimen Negatif %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>,

    // 2 — Complication
    <div key={2} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-['JetBrains_Mono'] text-amber-500 uppercase tracking-widest mb-1">02 — Complication</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Tantangan & Ancaman Utama</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {r.swot.threats.concat(r.swot.weaknesses).slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[14px] font-['Inter'] text-amber-900 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>,

    // 3 — Consumer Voice
    <div key={3} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-['JetBrains_Mono'] text-[#2A74C4] uppercase tracking-widest mb-1">03 — Analisis Sentimen</p>
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
                <span className="text-[13px] font-['Inter'] font-medium text-[#0D1829]">{name}</span>
                <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[#0D1829]">{value}%</span>
              </div>
              <div className="h-2 bg-[#F0F4FA] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
              </div>
            </div>
          ))}
          <p className="text-[12px] text-[#64748B] font-['Inter'] mt-2">Berdasarkan 847 ulasan dari 4 platform</p>
        </div>
      </div>
    </div>,

    // 4 — SWOT
    <div key={4} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-5">
        <p className="text-[11px] font-['JetBrains_Mono'] text-[#2A74C4] uppercase tracking-widest mb-1">04 — SWOT Analysis</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Matrix SWOT</h2>
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
                <li key={it} className="text-[12px] font-['Inter'] text-[#0D1829] flex gap-1.5"><span className="opacity-40">·</span>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>,

    // 5 — Resolution
    <div key={5} className="h-full flex flex-col p-8 md:p-12 bg-gradient-to-br from-[#0B1628] to-[#1A3B6E] text-white">
      <div className="mb-6">
        <p className="text-[11px] font-['JetBrains_Mono'] text-[#6EA8D8] uppercase tracking-widest mb-1">05 — Resolution</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans']">Rekomendasi Strategis</h2>
      </div>
      <div className="flex-1 space-y-3">
        {r.priorities.map((p) => (
          <div key={p.rank} className="flex items-center gap-4 p-4 rounded-xl bg-white/10 border border-white/15">
            <div className="w-8 h-8 rounded-full bg-[#2A74C4] text-white text-sm font-bold font-['JetBrains_Mono'] flex items-center justify-center shrink-0">{p.rank}</div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold font-['Inter']">{p.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold", p.impact === "High" ? "bg-red-500/30 text-red-200" : "bg-amber-500/30 text-amber-200")}>{p.impact}</span>
              <span className="text-white/50 text-[11px] font-['JetBrains_Mono']">{p.timeframe}</span>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // 6 — Financials
    <div key={6} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-['JetBrains_Mono'] text-[#2A74C4] uppercase tracking-widest mb-1">06 — Proyeksi Finansial</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Revenue Forecast 2026</h2>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={r.revenueProjection} barCategoryGap="30%">
            <XAxis dataKey="q" tick={{ fontSize: 12, fontFamily: "JetBrains Mono" }} />
            <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} tickFormatter={v => `${v}jt`} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Inter", borderRadius: 8 }} formatter={(v: number) => [`Rp ${v}jt`]} />
            <Legend />
            <Bar dataKey="base" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Base Case (Rp jt)" />
            <Bar dataKey="opt" fill="#2A74C4" radius={[4, 4, 0, 0]} name="Optimistic (Rp jt)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>,

    // 7 — Risk
    <div key={7} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-['JetBrains_Mono'] text-amber-500 uppercase tracking-widest mb-1">07 — Risk Register</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">Matriks Risiko</h2>
      </div>
      <div className="flex-1 space-y-3">
        {r.risks.map((ri) => (
          <div key={ri.risk} className="flex items-start gap-4 p-4 rounded-xl bg-[#F0F4FA] border border-[#E2E8F2]">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold font-['Inter'] text-[#0D1829] mb-0.5">{ri.risk}</p>
              <p className="text-[12px] text-[#64748B] font-['Inter']">{ri.mitigation}</p>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", ri.prob === "Tinggi" ? "bg-red-100 text-red-700" : ri.prob === "Sedang" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>{ri.prob}</span>
              <span className="text-[10px] text-[#64748B] font-['Inter']">Prob.</span>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // 8 — Action Plan
    <div key={8} className="h-full flex flex-col p-8 md:p-12 bg-white">
      <div className="mb-6">
        <p className="text-[11px] font-['JetBrains_Mono'] text-[#2A74C4] uppercase tracking-widest mb-1">08 — Action Plan</p>
        <h2 className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#0D1829]">90-Day Roadmap</h2>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-4">
        {[
          { phase: "Bulan 1", color: "#2A74C4", items: ["Audit digital presence", "Setup Google My Business", "Mulai loyalty program beta"] },
          { phase: "Bulan 2–3", color: "#7C3AED", items: ["Launch Instagram Ads", "Implement menu engineering", "Onboard 500 loyalty members"] },
          { phase: "Bulan 3+", color: "#0B7A6A", items: ["Evaluasi co-working pivot", "Ekspansi ke outlet ke-2", "Scale digital marketing"] },
        ].map(({ phase, color, items }) => (
          <div key={phase} className="p-4 rounded-xl border-2" style={{ borderColor: `${color}30`, background: `${color}08` }}>
            <p className="text-[12px] font-bold font-['Inter'] mb-3" style={{ color }}>{phase}</p>
            <ul className="space-y-2">
              {items.map(item => (
                <li key={item} className="flex items-start gap-2 text-[12px] font-['Inter'] text-[#0D1829]">
                  <ArrowRight size={12} className="shrink-0 mt-0.5" style={{ color }} />{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>,

    // 9 — Conclusion
    <div key={9} className="h-full flex flex-col justify-between p-10 md:p-14 bg-gradient-to-br from-[#0B1628] to-[#1A3B6E] text-white">
      <div>
        <p className="text-[11px] font-['JetBrains_Mono'] text-[#6EA8D8] uppercase tracking-widest mb-2">09 — Kesimpulan</p>
        <h2 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mb-6">Peluang Nyata, Tindakan Segera</h2>
        <p className="text-white/70 text-[15px] font-['Inter'] leading-relaxed max-w-lg">
          Pasar kafe di Dago memiliki potensi besar namun jendela peluang ini terbatas. Dengan skor kelayakan 82/100 dan sentimen positif 71%, bisnis ini siap untuk scale-up jika langkah strategis diambil dalam 90 hari ke depan.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ v: "82/100", l: "Market Score" }, { v: "+71%", l: "Sentimen Positif" }, { v: "34% YoY", l: "Pertumbuhan Pasar" }, { v: "90 Hari", l: "Window of Opportunity" }].map(({ v, l }) => (
          <div key={l} className="bg-white/10 rounded-xl p-3.5 border border-white/15 text-center">
            <p className="text-lg font-bold font-['JetBrains_Mono'] text-white">{v}</p>
            <p className="text-[11px] text-white/50 font-['Inter'] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-white/25 text-[11px] font-['Inter']">Consultin · Confidential · {r.date}</p>
        <p className="text-white/25 text-[11px] font-['JetBrains_Mono']">{TOTAL_SLIDES} / {TOTAL_SLIDES}</p>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#0D1015] flex flex-col">
      {/* Deck header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[13px] font-['Inter']">
          <ChevronLeft size={16} /> Kembali ke Report
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-[11px] font-['JetBrains_Mono']">{slide + 1} / {TOTAL_SLIDES}</span>
          <button onClick={onFullReport} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-all text-[12px] font-['Inter']">
            Full Report
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A74C4] text-white text-[12px] font-['Inter'] font-medium hover:bg-[#1a5490] transition-all">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Slide thumbnails */}
      <div className="hidden md:flex items-center gap-1.5 px-6 py-2 overflow-x-auto border-b border-white/5">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            className={cn("shrink-0 w-10 h-6 rounded text-[10px] font-['JetBrains_Mono'] transition-all",
              i === slide ? "bg-[#2A74C4] text-white" : "bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/70")}>
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
              className={cn("w-1.5 h-1.5 rounded-full transition-all", i === slide ? "w-5 bg-[#2A74C4]" : "bg-white/25 hover:bg-white/50")} />
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
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 md:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-foreground">History Analisis</h1>
          <p className="text-[12px] text-muted-foreground font-['Inter']">{HISTORY_DATA.length} analisis tersimpan</p>
        </div>
        <button onClick={() => onNavigate("home")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D1829] text-white text-[13px] font-['Inter'] font-semibold hover:bg-[#1a2d4a] transition-all">
          <Sparkles size={14} /> Analisis Baru
        </button>
      </div>

      <div className="px-6 md:px-8 py-6">
        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#2A74C4]/20 focus-within:border-[#2A74C4]/50 transition-all">
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari analisis..."
              className="flex-1 bg-transparent text-[13px] font-['Inter'] text-foreground outline-none placeholder:text-muted-foreground" />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-[13px] font-['Inter']">
            <thead className="bg-muted/50">
              <tr>
                {["Topik Analisis", "Tanggal", "Tag", "Sentimen", "Skor", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-border hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => onOpenReport(item.topic)}>
                  <td className="px-5 py-3.5 font-medium text-foreground max-w-xs">
                    <span className="truncate block">{item.topic}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                    <span className="font-['JetBrains_Mono']">{item.date}</span>
                    <span className="text-muted-foreground/50 ml-1.5">{item.time}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-muted-foreground">{item.tag}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-[12px] font-semibold", item.sentiment === "Positif" ? "text-emerald-600" : item.sentiment === "Negatif" ? "text-red-600" : "text-amber-600")}>
                      {item.sentiment}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#2A74C4] rounded-full" style={{ width: `${item.score}%` }} />
                      </div>
                      <span className="font-['JetBrains_Mono'] text-foreground font-medium">{item.score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="px-3 py-1 rounded-lg border border-border text-[12px] font-medium text-foreground hover:bg-muted transition-all">
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
              className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-[#2A74C4]/40 transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-medium text-muted-foreground">{item.tag}</span>
                <span className="text-[11px] font-['JetBrains_Mono'] text-muted-foreground shrink-0">{item.date}</span>
              </div>
              <p className="text-[14px] font-semibold font-['Inter'] text-foreground mb-2 leading-snug">{item.topic}</p>
              <div className="flex items-center justify-between">
                <span className={cn("text-[12px] font-semibold", item.sentiment === "Positif" ? "text-emerald-600" : item.sentiment === "Negatif" ? "text-red-600" : "text-amber-600")}>{item.sentiment}</span>
                <div className="flex items-center gap-2">
                  <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-[#2A74C4] rounded-full" style={{ width: `${item.score}%` }} />
                  </div>
                  <span className="text-[12px] font-['JetBrains_Mono'] text-foreground font-medium">{item.score}</span>
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
const TIERS = [
  {
    id: "free", name: "Free", price: "Rp 0", period: "/bulan", Icon: Shield, color: "#64748B",
    features: ["3 analisis/bulan", "Laporan ringkas", "Ekspor PNG", "Support email"],
    cta: "Paket Aktif", active: true,
  },
  {
    id: "pro", name: "Pro", price: "Rp 199K", period: "/bulan", Icon: Zap, color: "#2A74C4",
    features: ["30 analisis/bulan", "Full McKinsey Report", "Slide Deck export", "API access", "Priority support"],
    cta: "Upgrade ke Pro", active: false,
  },
  {
    id: "agency", name: "Agency", price: "Rp 699K", period: "/bulan", Icon: Crown, color: "#7C3AED",
    features: ["Unlimited analisis", "Multi-user (5 seat)", "White-label report", "Custom AI fine-tuning", "Dedicated AM"],
    cta: "Hubungi Sales", active: false,
  },
];

function AccountView({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 md:px-8 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-foreground">Akun &amp; Langganan</h1>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-[13px] font-['Inter'] text-muted-foreground hover:text-foreground transition-colors">
          <LogOut size={15} /> Keluar
        </button>
      </div>

      <div className="px-6 md:px-8 py-6 max-w-5xl">
        {/* Profile card */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#2A74C4] to-[#14385E] flex items-center justify-center shrink-0">
            <User size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-foreground">CEO Account</h2>
            <p className="text-muted-foreground text-[13px] font-['Inter']">free@consultin.id</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Analisis", val: "1", sub: "dari 3" },
              { label: "Member Sejak", val: "Jul 2026", sub: "" },
            ].map(({ label, val, sub }) => (
              <div key={label} className="bg-background rounded-xl px-4 py-2.5 border border-border text-center">
                <p className="text-[15px] font-bold font-['JetBrains_Mono'] text-foreground">{val} <span className="text-muted-foreground text-[11px] font-['Inter'] font-normal">{sub}</span></p>
                <p className="text-[11px] text-muted-foreground font-['Inter']">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Usage bar */}
        <div className="bg-card rounded-xl border border-border p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold font-['Inter'] text-foreground">Penggunaan Bulan Ini</p>
            <span className="text-[13px] font-['JetBrains_Mono'] text-muted-foreground">1 / 3 analisis</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#2A74C4] to-[#6EA8D8] rounded-full transition-all" style={{ width: "33%" }} />
          </div>
          <p className="text-[12px] text-muted-foreground font-['Inter'] mt-2">Reset pada 1 Agustus 2026</p>
        </div>

        {/* Tiers */}
        <p className="text-[12px] font-bold font-['Inter'] uppercase tracking-widest text-muted-foreground mb-4">Pilih Paket</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map(({ id, name, price, period, Icon, color, features, cta, active }) => (
            <div key={id}
              className={cn("bg-card rounded-2xl border p-6 flex flex-col transition-all",
                active ? "border-[#2A74C4]/50 ring-2 ring-[#2A74C4]/15" :
                id === "pro" ? "border-border hover:border-[#2A74C4]/40 hover:shadow-md" :
                "border-border hover:border-[#7C3AED]/40")}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon size={19} style={{ color }} />
                </div>
                <div>
                  <p className="font-bold font-['Plus_Jakarta_Sans'] text-foreground text-[15px]">{name}</p>
                  {active && <span className="text-[10px] font-['Inter'] font-bold text-[#2A74C4] bg-[#EBF3FD] px-1.5 py-0.5 rounded">Aktif</span>}
                </div>
              </div>
              <div className="mb-5">
                <span className="text-2xl font-bold font-['JetBrains_Mono'] text-foreground">{price}</span>
                <span className="text-muted-foreground text-sm font-['Inter']">{period}</span>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] font-['Inter'] text-foreground">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={cn("w-full py-3 rounded-xl text-[13px] font-['Inter'] font-semibold transition-all",
                  active ? "bg-muted text-muted-foreground cursor-default" :
                  id === "pro" ? "bg-[#0D1829] text-white hover:bg-[#1a2d4a] active:scale-[0.99]" :
                  "border-2 text-foreground hover:bg-muted active:scale-[0.99]")}
                style={!active && id === "agency" ? { borderColor: `${color}40` } : {}}
                disabled={active}
              >
                {cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [query, setQuery] = useState("");
  const [analysisCount] = useState(1);

  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("onboarding"), 2200);
      return () => clearTimeout(t);
    }
  }, [screen]);

  const navigate = (s: Screen) => setScreen(s);

  const handleQuery = (q: string) => {
    setQuery(q);
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
      />
    );
  }

  if (isAuth) {
    switch (screen) {
      case "splash": return <SplashView />;
      case "onboarding": return <OnboardingView onFinish={() => navigate("login")} />;
      case "login": return <LoginView onLogin={() => navigate("home")} onSignup={() => navigate("signup")} onForgot={() => navigate("forgotpassword")} />;
      case "signup": return <SignupView onRegister={() => navigate("phonenumber")} onSignIn={() => navigate("login")} />;
      case "phonenumber": return <PhoneNumberView onVerify={() => navigate("phoneverify")} onLater={() => navigate("home")} />;
      case "phoneverify": return <PhoneVerifyView onVerify={() => navigate("home")} onBack={() => navigate("phonenumber")} />;
      case "forgotpassword": return <ForgotPasswordView onNext={() => navigate("reset")} onBack={() => navigate("login")} />;
      case "reset": return <ResetPasswordView onDone={() => navigate("login")} />;
      default: return null;
    }
  }

  return (
    <AppShell screen={screen} onNavigate={navigate} analysisCount={analysisCount}>
      {screen === "home" && <HomeView onSubmit={handleQuery} analysisCount={analysisCount} />}
      {screen === "processing" && <ProcessingView query={query} onComplete={() => navigate("report")} />}
      {screen === "report" && <ReportView query={query} onBack={() => navigate("home")} onNavigate={navigate} />}
      {screen === "fullreport" && <FullReportView query={query || REPORT_DATA.topic} onBack={() => navigate("report")} onSlideDeck={() => navigate("slidedeck")} />}
      {screen === "history" && <HistoryView onNavigate={navigate} onOpenReport={openReport} />}
      {screen === "account" && <AccountView onLogout={() => navigate("login")} />}
    </AppShell>
  );
}
