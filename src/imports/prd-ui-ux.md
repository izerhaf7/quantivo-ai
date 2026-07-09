# PRD — UI/UX: AI Business Intelligence Agent
### Mobile-to-Desktop Scale-Up Methodology | Figma-Agent Executable

```yaml
doc_type: prd_ui_ux
version: 1.0
methodology: mobile_first_scale_up
color_palette: OUT_OF_SCOPE  # deliberately excluded — design agent to define tokens separately, reference: design.md
target_executor: figma_ai_agent
companion_docs:
  - uiux-spec-agent-readable.md
  - uiux-spec-human-readable-mckinsey.md
  - design.md
```

---

## 0. APP CONTEXT — READ BEFORE EXECUTING

```yaml
# Bagian ini memberi agent pemahaman menyeluruh tentang APA yang sedang dibangun
# dan KENAPA, sebelum membaca spesifikasi UI/UX di section 1 dan seterusnya.
# Tanpa konteks ini, agent bisa menghasilkan UI yang secara struktur benar
# tapi kehilangan nuansa bisnis yang menjadi alasan desain ini dibuat.

context_summary: >
  Ini adalah AI Business Intelligence Agent: aplikasi yang membantu CEO/pemilik
  UMKM di Indonesia mengambil keputusan ekspansi bisnis (buka usaha baru, buka
  cabang, atau product development) berbasis data — bukan intuisi. User cukup
  mengetik topik bisnis + lokasi (contoh: "kafe di area Dago Bandung"), dan
  sistem AI di baliknya melakukan scraping data (Google Maps reviews + web/berita),
  lalu menganalisisnya lewat 4 AI agent berurutan (Scraping, Sentiment, SWOT,
  Summary) untuk menghasilkan laporan lengkap: analisis sentimen pasar, SWOT
  matrix, dan confidence score per klaim.

origin_and_purpose:
  event: "AMD Developer Hackathon 2026, Track 3 (Unicorn Track — Build Your Startup)"
  deadline: "2026-07-07"
  team_size: 4
  role_creating_this_doc: ui_ux_designer
  post_hackathon_intent: "dirancang sebagai fondasi produk nyata (startup), bukan sekadar demo sekali pakai"

problem_being_solved:
  - "Riset pasar/konsultan bisnis tradisional (McKinsey-style) mahal dan lambat (mingguan) — tidak terjangkau UMKM."
  - "Tools AI sejenis yang ada (Competely, ToolsKit, Sai by Simular, Compttr) tidak punya geo-based analysis, tidak multi-agent, dan tidak transparan soal tingkat kepercayaan datanya."
  - "User awam (CEO non-teknis) butuh insight yang bisa langsung dipercaya dan ditindaklanjuti, bukan output AI generik yang terasa 'black box'."

target_user_persona:
  name: "CEO/pemilik UMKM Indonesia"
  technical_literacy: low_to_medium
  goals: ["memutuskan ekspansi bisnis dengan lebih percaya diri", "menghemat biaya riset pasar", "mendapat laporan yang bisa langsung dibawa ke rapat/investor"]
  pain_points: ["tidak paham istilah teknis AI", "butuh cepat, tidak sabar menunggu tanpa kejelasan", "sulit percaya pada AI tanpa bukti sumber data"]

what_makes_this_different:
  - differentiator: geo_based_analysis
    detail: "analisis berbasis lokasi memakai Google Maps reviews, tidak ada kompetitor yang punya ini"
  - differentiator: multi_agent_architecture
    detail: "4 agent spesialis berurutan, bukan satu pipeline generik"
  - differentiator: confidence_per_claim
    detail: "setiap klaim di laporan (bukan skor tunggal di akhir) punya persentase kepercayaan + link sumber — inti dari rasa percaya user awam"
  - differentiator: bahasa_indonesia_native
    detail: "dibangun untuk pasar Indonesia, bukan produk global yang di-translate"
  - differentiator: interactive_clarification_loop
    detail: "AI bertanya balik jika input kurang jelas, alih-alih menebak diam-diam atau memaksa user isi form panjang"

underlying_technical_reality:
  # Agent UI/UX TIDAK PERLU menampilkan istilah-istilah ini ke end user,
  # tapi perlu tahu proses ini ada agar bisa merancang state loading/progress
  # yang jujur secara struktur (bukan sekadar spinner generik).
  pipeline: "CrewAI orchestration -> Scraping Agent -> Sentiment Agent -> SWOT Agent -> Summary Agent"
  infra: "AMD MI300X GPU menjalankan 3 model Qwen3 (32B, 8B, 1.5B) secara simultan"
  why_infra_matters_for_ui: >
    Karena ini hackathon dengan kriteria wajib 'Use of AMD Platforms', UI harus
    punya cara menampilkan bukti penggunaan AMD ini secara visual (lihat
    transparency_panel_persistent di section 5.3/5.4) — bukan hanya diklaim di
    marketing copy.

business_model_context:
  pricing_tiers: ["Free: 3 analisis/bulan", "Pro: $10/bulan, unlimited + full report", "Agency: $30/bulan, white-label + API access"]
  why_ui_needs_this: "tier dan sisa kuota harus terlihat jelas di UI (bukan tersembunyi di settings) karena ini bagian dari pembuktian 'Product/Market Potential' ke juri, dan bagian dari user journey nyata pasca-hackathon"

locked_product_decisions:
  # Sudah difinalkan tim, agent tidak perlu mempertanyakan ulang ini saat membangun UI
  - "Input UX: Interactive Clarification Loop (chat multi-step), bukan form panjang"
  - "Limits: Tier-based (Free/Pro/Agency)"
  - "Confidence: per-claim + source link, bukan skor tunggal"
  - "AMD angle di UI: Full Transparency Dashboard"

related_documents:
  - name: uiux-spec-agent-readable.md
    contains: "spesifikasi fitur & komponen level YAML"
  - name: uiux-spec-human-readable-mckinsey.md
    contains: "narasi bisnis & justifikasi desain, gaya McKinsey"
  - name: design.md
    contains: "design tokens, palet warna, tipografi, layout referensi Hermes Agent Desktop"
```

---

## 1. OVERVIEW

```yaml
product_name: "AI Business Intelligence Agent"
product_type: mobile_and_desktop_web_app
primary_user: umkm_ceo_indonesia
core_job_to_be_done: >
  User memasukkan topik bisnis + lokasi, menerima laporan market intelligence
  (sentimen, SWOT, confidence per-claim) dalam waktu singkat, tanpa perlu
  memahami proses AI di baliknya.
design_methodology: >
  Mobile-first. Setiap screen dirancang dan diverifikasi terlebih dahulu
  pada breakpoint mobile (360-428px), kemudian di-scale-up secara progresif
  ke tablet (768px) dan desktop (1280px+), bukan sebaliknya. Scale-up berarti
  MENAMBAH informasi/layout kompleksitas (multi-column, panel tambahan),
  BUKAN memperbesar elemen mobile secara proporsional.
breakpoints:
  mobile: "360px - 767px"
  tablet: "768px - 1023px"
  desktop: "1024px - 1439px"
  desktop_wide: "1440px+"
```

---

## 2. DESIGN PRINCIPLES

```yaml
principles:
  - id: P1
    name: progressive_disclosure
    rule: "Mobile menampilkan 1 fokus per layar. Desktop boleh menampilkan multi-panel bersamaan (lihat section 6 IA scale-up)."
  - id: P2
    name: transparency_over_black_box
    rule: "Setiap state pemrosesan AI harus punya representasi visual — tidak ada layar kosong/blank loading tanpa konteks."
  - id: P3
    name: plain_language_default
    rule: "Nama teknis (agent, model, RAG, top-k) tidak pernah muncul di copy user-facing di layar manapun."
  - id: P4
    name: claim_level_trust
    rule: "Confidence selalu ditampilkan per-klaim + sumber, tidak pernah sebagai skor tunggal agregat di semua breakpoint."
  - id: P5
    name: reversible_input
    rule: "User selalu bisa kembali/edit input sebelumnya tanpa kehilangan progress yang sudah berjalan."
```

---

## 3. INFORMATION ARCHITECTURE

```yaml
site_map:
  - screen: onboarding
    children: []
  - screen: home_input
    children: [clarification_flow]
  - screen: processing
    children: [transparency_detail_modal]
  - screen: report
    children: [claim_detail_expand, export_modal]
  - screen: history
    children: [report]  # re-opens a past report
  - screen: account_tier
    children: [upgrade_modal]
```

---

## 4. USER FLOW (Primary Path)

```yaml
primary_flow:
  - step: 1
    screen: onboarding
    action: "user melihat value prop singkat, tap 'Mulai'"
    exit_condition: "first-time user only, skip on subsequent visits"
  - step: 2
    screen: home_input
    action: "user mengetik topik bisnis + lokasi dalam satu input field"
  - step: 3
    screen: home_input
    condition: "input ambiguous or incomplete"
    action: "clarification_bubble muncul, max 3 pertanyaan, user reply atau tap skip"
  - step: 4
    screen: processing
    action: "progress stepper berjalan, transparency panel tersedia (collapsed default di mobile)"
  - step: 5
    screen: report
    action: "user melihat executive summary, expand section, tap claim badge untuk lihat sumber"
  - step: 6
    screen: report
    action: "user export ke PDF/pitch deck ATAU simpan otomatis ke history"

alternate_flows:
  - id: A1
    trigger: "user kehabisan kuota tier (Free)"
    screen: home_input
    action: "soft prompt upgrade muncul sebelum submit, tidak memblokir alur baca report lama"
  - id: A2
    trigger: "user membuka dari history"
    screen: history -> report
    action: "report lama terbuka langsung, ada indikator 'versi ke-N' jika pernah di-re-run"
```

---

## 5. SCREEN SPECIFICATIONS

> Format tiap screen: Mobile base spec (wajib diselesaikan dulu) → Scale-up notes per breakpoint.
> Setiap komponen diberi `component_id` konsisten untuk dipakai ulang sebagai Figma component/variant.

### 5.1 Screen: Onboarding

```yaml
screen_id: onboarding
mobile_base:
  layout: single_column_full_bleed
  components:
    - component_id: onboarding_illustration
      type: image_placeholder
      notes: "abstract, bukan literal robot/AI icon (lihat design.md iconography rule)"
    - component_id: onboarding_headline
      type: text_serif_large
      content_guideline: "1 kalimat value prop, bahasa non-teknis"
    - component_id: onboarding_cta_primary
      type: button_primary
      label: "Mulai"
      full_width: true
  interaction: "swipeable if multi-slide (max 3 slides), else single static screen"

scale_up:
  tablet: "layout tetap single-column, tapi konten center dengan max-width constraint, tidak full-bleed"
  desktop: "split layout: illustration di kiri (50%), headline+CTA di kanan (50%), vertically centered"
```

### 5.2 Screen: Home / Input

```yaml
screen_id: home_input
mobile_base:
  layout: single_column
  components:
    - component_id: app_header_minimal
      type: header
      contents: [logo_mark, tier_indicator_compact]
    - component_id: topic_location_input
      type: single_field_input
      placeholder_guideline: "contoh: 'kafe di area Dago Bandung'"
      behavior: "expands to multi-line if text wraps, no separate location field"
    - component_id: input_submit_button
      type: button_primary
      label: "Analisis Sekarang"
    - component_id: recent_history_snippet
      type: horizontal_scroll_list
      max_items_visible: 2
      notes: "collapsed teaser of history, full list only in dedicated history screen"
  states:
    - state: default
    - state: input_focused
      notes: "keyboard-safe area, submit button remains reachable (sticky bottom)"
    - state: clarification_active
      component_id: clarification_bubble
      behavior: "replaces submit button area with chat-style bubble + reply field + skip button"
      max_clarifications: 3

scale_up:
  tablet: "input field width constrained to ~60% viewport, centered; history snippet shows 4 items"
  desktop: >
    Introduce persistent left sidebar (component_id: sidebar_nav) containing full history list +
    tier_indicator_full. Main input area becomes centered column (~700px max-width) within remaining space.
    This is an ADDED panel, not a resized mobile layout.
  desktop_wide: "sidebar remains fixed width (~280px), main column max-width capped at 720px, remaining space is neutral margin — do not stretch input field full-width."
```

### 5.3 Screen: Processing

```yaml
screen_id: processing
mobile_base:
  layout: single_column_focused
  components:
    - component_id: progress_stepper
      type: vertical_stepper
      steps: ["Mengambil data ulasan...", "Menganalisis sentimen...", "Menyusun SWOT...", "Menyusun laporan..."]
      state_per_step: [pending, active, complete]
    - component_id: transparency_toggle
      type: expandable_section
      default_state: collapsed
      label: "Lihat detail proses AI"
    - component_id: transparency_detail_modal
      type: bottom_sheet_modal
      trigger: transparency_toggle
      contents: [active_model_name, duration_per_stage, cost_estimate]
      mode: simple_default_detail_on_expand
  states:
    - state: in_progress
    - state: error_retry
      notes: "if any agent stage fails, show plain-language error + retry button, never raw error/stack trace"

scale_up:
  tablet: "progress_stepper and transparency_detail shown side-by-side (2-column) instead of modal"
  desktop: >
    transparency_detail becomes a permanent right-side panel (component_id: transparency_panel_persistent,
    ~30% width), always visible without needing a toggle. Progress_stepper occupies main center column.
    This matches the 3-panel IA scale-up described in design.md section 3.
```

### 5.4 Screen: Report

```yaml
screen_id: report
mobile_base:
  layout: single_column_scroll
  components:
    - component_id: executive_summary_card
      type: card_serif_text
      position: top
      notes: "scannable in 30s, no jargon"
    - component_id: claim_confidence_badge
      type: inline_badge
      repeatable: true
      interaction: "tap expands inline accordion showing source link"
    - component_id: collapsible_section
      type: accordion
      instances: [swot_matrix, sentiment_breakdown, market_insight]
      default_state: collapsed
      exception: "first section (swot_matrix) default expanded"
    - component_id: export_action_bar
      type: sticky_bottom_bar
      actions: [export_pdf, export_pitch_deck, save_to_history]
  states:
    - state: default
    - state: claim_expanded
    - state: assumption_disclosed
      notes: "if any clarification was skipped, show a distinct callout listing assumptions used"

scale_up:
  tablet: "collapsible_section instances shown 2 at a time side-by-side when expanded"
  desktop: >
    Layout becomes 2-column: executive_summary_card + collapsible sections in main column (~65%),
    claim source references and export_action_bar move to a persistent right rail (~35%) instead of
    sticky bottom bar. Sidebar_nav (from home_input) remains visible on the left.
  desktop_wide: "3-column possible: sidebar_nav | report content | claim-source detail rail — mirrors transparency_panel pattern from processing screen for visual consistency across the app."
```

### 5.5 Screen: History

```yaml
screen_id: history
mobile_base:
  layout: single_column_list
  components:
    - component_id: history_list_item
      type: list_item_card
      contents: [topic_location_label, date, tier_badge_if_relevant, version_count_if_multiple]
      repeatable: true
    - component_id: history_grouping_header
      type: section_header
      grouping_logic: "by topic/location, not by raw session"

scale_up:
  tablet: "list becomes 2-column grid of cards"
  desktop: "history_list absorbed into sidebar_nav (from home_input desktop scale-up); this screen becomes redundant on desktop, redirect not needed if sidebar always visible — full history screen still reachable via 'lihat semua' for edge case of long lists"
```

### 5.6 Screen: Account / Tier

```yaml
screen_id: account_tier
mobile_base:
  layout: single_column
  components:
    - component_id: tier_comparison_card
      type: stacked_cards
      instances: [free, pro, agency]
      notes: "stacked vertically, current tier visually distinct (not via color — use border weight/badge icon per design.md)"
    - component_id: upgrade_cta
      type: button_primary
      conditional: "hidden if already on agency tier"

scale_up:
  tablet: "tier_comparison_card becomes 3-column row instead of stacked"
  desktop: "same 3-column layout, presented within main content area alongside persistent sidebar_nav"
```

---

## 6. COMPONENT LIBRARY (Figma Build Reference)

```yaml
# Setiap entry = 1 Figma component dengan variants sesuai state yang disebutkan di section 5.
components_master_list:
  - component_id: app_header_minimal
    variants: [default]
  - component_id: sidebar_nav
    variants: [collapsed, expanded]
    breakpoint_scope: [desktop, desktop_wide]
  - component_id: topic_location_input
    variants: [default, focused, error]
  - component_id: clarification_bubble
    variants: [question_active, skipped, answered]
  - component_id: progress_stepper
    variants: [step_pending, step_active, step_complete, step_error]
  - component_id: transparency_toggle
    variants: [collapsed, expanded]
    breakpoint_scope: [mobile, tablet]
  - component_id: transparency_panel_persistent
    variants: [mode_simple, mode_detail]
    breakpoint_scope: [desktop, desktop_wide]
  - component_id: executive_summary_card
    variants: [default]
  - component_id: claim_confidence_badge
    variants: [collapsed, expanded, confidence_high, confidence_medium, confidence_low]
  - component_id: collapsible_section
    variants: [collapsed, expanded]
  - component_id: export_action_bar
    variants: [sticky_bottom, persistent_rail]
    breakpoint_scope_mapping:
      sticky_bottom: [mobile, tablet]
      persistent_rail: [desktop, desktop_wide]
  - component_id: history_list_item
    variants: [single_version, multi_version]
  - component_id: tier_comparison_card
    variants: [current_tier, other_tier]
  - component_id: button_primary
    variants: [default, disabled, loading]
```

---

## 7. INTERACTION & MOTION SPEC

```yaml
interactions:
  - trigger: "screen transition (e.g. home_input -> processing)"
    pattern: "slide-in from right (mobile), cross-fade (desktop)"
  - trigger: "clarification_bubble appears"
    pattern: "fade + slight upward motion, not instant snap"
  - trigger: "claim_confidence_badge tap/click"
    pattern: "inline accordion expand, not modal popup"
  - trigger: "collapsible_section toggle"
    pattern: "height auto-animate, 200-300ms ease"
  - trigger: "progress_stepper step completion"
    pattern: "checkmark morph, no abrupt jump cut"
notes: "Full motion timing/easing values are a design-system-agent decision, not fixed here."
```

---

## 8. CONTENT & COPY GUIDELINES

```yaml
copy_rules:
  - "Tidak boleh muncul istilah: agent, model, RAG, top-k, rerank, orchestration — di layar manapun yang dilihat end-user."
  - "Semua progress step ditulis sebagai kalimat aktif berorientasi hasil (‘Menganalisis...’), bukan status pasif (‘Processing...’)."
  - "Assumption disclosure (saat user skip clarification) wajib eksplisit, contoh pola: 'Karena informasi X tidak diisi, kami asumsikan Y.'"
  - "CTA button label berbasis aksi konkret ('Analisis Sekarang'), hindari label generik ('Submit', 'OK')."
```

---

## 9. ACCESSIBILITY REQUIREMENTS

```yaml
accessibility:
  - "Semua interactive component (button, badge, accordion) harus punya focus state yang terlihat jelas, terlepas dari palet warna final."
  - "claim_confidence_badge tidak boleh mengandalkan warna saja untuk membedakan level confidence — wajib disertai ikon/label teks (tinggi/sedang/rendah)."
  - "Minimum tap target: 44x44px di breakpoint mobile untuk semua elemen interaktif."
  - "Transparency panel mode_detail harus tetap dapat dinavigasi via keyboard di desktop (tab order logis)."
```

---

## 10. FIGMA-AGENT EXECUTION NOTES

```yaml
execution_instructions:
  - "Bangun mobile_base frame untuk setiap screen di section 5 TERLEBIH DAHULU sebagai source of truth, sebelum membuat frame tablet/desktop."
  - "Scale-up bukan resize proporsional — ikuti field 'scale_up' di tiap screen spec secara literal (menambah kolom/panel, bukan memperbesar elemen mobile)."
  - "Gunakan Auto Layout untuk seluruh component agar scale-up antar breakpoint konsisten secara struktural."
  - "component_id di section 6 harus menjadi nama Figma component/frame secara langsung (tanpa terjemahan), agar traceable ke spec ini."
  - "Warna TIDAK didefinisikan di dokumen ini. Terapkan design tokens dari design.md (Ink & Brass palette) sebagai fill/stroke default, dapat disesuaikan oleh design-system agent tanpa mengubah struktur di dokumen ini."
  - "Setelah seluruh mobile_base frame selesai dan divalidasi, baru eksekusi scale_up per breakpoint secara berurutan: tablet -> desktop -> desktop_wide."
  - "Setiap state yang disebut di 'states' per screen wajib punya frame/variant tersendiri, tidak boleh diasumsikan otomatis oleh interaksi Figma prototyping saja."
```

---

*Dokumen ini melengkapi `uiux-spec-agent-readable.md` (spec fitur), `uiux-spec-human-readable-mckinsey.md` (narasi bisnis), dan `design.md` (design tokens/visual language). PRD ini fokus murni pada struktur UI/UX dan metodologi scale-up, tanpa keputusan warna.*
