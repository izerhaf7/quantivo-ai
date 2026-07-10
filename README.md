# Consultin UI

Frontend-only React/Vite prototype for Consultin, an AI business consultant for Indonesian small businesses. User starts with a free-form business idea, reviews a structured brief, answers missing context, watches an analysis flow, then gets report, history, account, pricing, and slide-deck style screens.

Backend, AI orchestration, auth, billing, storage, export, and report generation are intentionally delegated. See `BACKEND_AI_HANDOFF.md`.

## Current status

- Mobile-first product UI, scaled up for desktop.
- Splash + first-visit onboarding.
- Login/signup/reset/phone verification mock flows.
- Dashboard prompt workspace.
- Brief detection and clarification gate before quota use.
- Processing skeleton with analyst-style steps.
- Report, full report, and slide deck surfaces.
- History, account, pricing/subscription, theme toggle, language switch.
- Frontend-only state via local adapter in `src/app/integration.ts`.

## Product flow

```text
first visit
  splash -> onboarding -> auth

returning visit
  splash -> auth

authenticated
  dashboard prompt
  -> brief review / clarification
  -> processing
  -> report
  -> full report or slide deck

supporting screens
  history
  subscription
  account settings
```

Onboarding is shown once per browser using:

```text
localStorage["consultin-onboarded"] = "1"
```

For QA reset:

```js
localStorage.removeItem("consultin-onboarded")
location.reload()
```

## Design direction

- Source reference: Figma `Consultin`, especially `UI/UX Canvas - Light`.
- Local implementation adapts the Figma mobile direction to the actual app flow. Do not copy Figma exports blindly.
- Keep Consultin blue/navy brand language.
- Keep existing typography, logo assets, and curated illustrations.
- Dashboard should feel like a premium analyst workspace, not generic AI SaaS.
- Avoid AI-slop tells: random sparkles, robot/brain icons, fake dashboards, generic three-card sections, decorative status dots.

## Tech stack

```text
React 18
Vite 6
TypeScript
Tailwind CSS v4
Radix/shadcn-style local UI components
lucide-react
recharts
motion
```

## Project structure

```text
src/app/App.tsx                  Main app, screens, flow state
src/app/integration.ts           Frontend adapter/mock product services
src/styles/theme.css             Design tokens and light/dark theme
src/styles/fonts.css             Font setup
src/app/assets/illustrations/    Curated app illustrations
src/imports/                     Active logo assets only
src/app/components/ui/           Local UI component primitives
reference-screenshots/           Figma/API screenshots used as references
docs/                            Component and flow documentation
PRD.md                           Product requirements
DESIGN.md                        Design tokens and visual rules
AGENTS.md                        AI-agent handoff instructions
BACKEND_AI_HANDOFF.md            Backend/AI/auth/billing/storage delegation brief
```

## Local development

```bash
npm install
npm run dev
```

Default URL:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

Expected build warning:

```text
Some chunks are larger than 500 kB after minification
```

This is acceptable for current frontend prototype. Code-split later when backend integration starts or report/slidedeck routes become separate bundles.

## QA checklist

Before pushing UI changes:

1. Run `npm run build`.
2. Smoke mobile viewport around `390x844`.
3. Verify onboarding only appears for a fresh browser.
4. Verify returning user goes to auth after splash.
5. Verify login enters dashboard.
6. Verify prompt submit can reach clarification/processing/report.
7. Verify bottom nav: Dashboard, Riwayat, Pro, Akun.
8. Check dark/light contrast after visual changes.

## Git hygiene

Push only files useful for future developers or agents.

Keep:

```text
src/
docs/
PRD.md
DESIGN.md
AGENTS.md
BACKEND_AI_HANDOFF.md
README.md
package.json
package-lock.json
vite/postcss/tailwind config
curated reference screenshots
curated illustrations used by app
```

Do not push:

```text
Lovable temporary output
Stitch/Figma raw export dumps
unused generated screen folders
local prompts not needed by future agents
build output
node_modules
random screenshots
```

Current known local-only files are intentionally untracked:

```text
Ilustrasi/
Stitch_Export_Attempt/
lovable-design-prompt.md
lovable-output.md
opencode-lovable-adapt-prompt.md
```

## AI handoff notes

Before changing UI:

1. Read `AGENTS.md`, `PRD.md`, and `DESIGN.md`.
2. Check `reference-screenshots/uiux-canvas-light.png` for mobile visual direction.
3. Preserve existing routes/flows unless the task explicitly changes them.
4. Do not show extracted parameter chips while user is typing in the initial chat.
5. Use external references as inspiration, not source of truth.
6. Run build and browser smoke before claiming done.

## Repository

```text
https://github.com/drathekreator/Consultin-UI.git
```
