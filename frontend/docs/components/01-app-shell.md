# AppShell

Purpose: authenticated layout wrapper with desktop sidebar/topbar and mobile bottom navigation.

Requirements:
- Desktop: sidebar for navigation, plan/account, primary sections.
- Desktop page header: utility controls for language and theme near account/status.
- Mobile: top header with logo/utility controls and bottom nav.
- Do not put language/theme deep in primary nav.
- Preserve screen routing state.

Screens contained:
- home/dashboard
- briefreview
- processing
- report
- fullreport
- slidedeck
- history
- account

Contrast:
- Sidebar uses dark ink surface.
- Active items use current stable primary token. Do not force green globally.
