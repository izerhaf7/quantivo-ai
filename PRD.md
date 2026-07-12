# Consultin PRD

## Ringkasan produk
Consultin adalah web app AI business intelligence untuk UMKM/founder awal. User menulis ide bisnis mentah seperti chat biasa, lalu Consultin menyusun brief, meminta detail tambahan hanya jika perlu, memproses analisis, dan menghasilkan report/dossier bisnis.

## Tujuan utama
- Membantu user non-teknis mengubah ide bisnis mentah menjadi laporan analisis yang bisa ditindaklanjuti.
- Menjaga flow terasa seperti chat bebas, bukan form panjang di awal.
- Menghasilkan laporan yang jelas: asumsi, risiko, kompetitor, SWOT, prioritas aksi, metrik, dan evidence.
- Tetap usable di mobile dan desktop.

## Target user
- Pelaku UMKM.
- Founder kecil/awal.
- Mahasiswa/pekerja yang ingin validasi ide usaha.
- User Indonesia, bahasa utama ID dengan opsi EN.

## Source of truth desain
- Mobile Figma export: `/home/anomalindra/Downloads/Consultin/UI/UX Canvas - Light.svg`
- Mobile dulu, lalu scale ke desktop.
- Jangan generic SaaS/dashboard. Visual harus mengikuti rhythm Figma mobile, tetapi jangan blanket recolor global ke hijau. Green/hijau hanya accent terkontrol setelah compare screenshot.

## Fitur wajib
- Splash loading: logo Consultin blinking/pulsing, tanpa progress/level bar.
- Onboarding 3 langkah.
- Login/signup.
- Phone number, OTP verify.
- Forgot/reset password.
- Dashboard/home chat intake.
- Free-form chat first: tidak ada parameter wajib sebelum submit.
- Setelah submit, AI mendeteksi kelengkapan brief.
- Jika kurang detail: tampil preview brief + CTA `Lengkapi informasi`.
- Clarification form dengan pertanyaan AI, suggestion chips, required validation.
- Processing screen + skeleton loading.
- Report summary.
- Full report.
- Slide deck.
- History.
- Account/pricing.
- Logout.
- Light/dark mode.
- ID/EN switch.
- Desktop sidebar/topbar.
- Mobile bottom nav.
- Usage quota free/pro.

## UX prinsip
1. Chat terasa bebas.
2. Form muncul setelah AI butuh detail, bukan sebelum user submit.
3. Kuota aman sampai user setuju lanjut processing.
4. Skeleton selalu dipakai untuk loading panjang.
5. Semua mode light/dark harus readable.
6. Mobile harus menjadi baseline.
7. Desktop hanya scale-up dari mobile, bukan desain baru yang generic.

## Non-goals sekarang
- Integrasi backend real.
- Auth real.
- Payment real.
- AI real.
- Database real.

Current app masih prototype frontend dengan state lokal/simulasi.

## Acceptance criteria
- `npm run build` pass.
- `npm run dev` jalan di `http://localhost:3000`.
- Browser smoke: onboarding → login → dashboard → chat submit → clarification → processing → report → full report → slide deck → history/account.
- Chat preview tidak muncul ketika user baru mengetik.
- Preview hanya muncul setelah submit.
- Dark mode contrast jelas.
- UI mobile terlihat dekat Figma canvas, bukan generic dashboard.
