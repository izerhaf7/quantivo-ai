# Agent Instructions for Consultin

## Project
Path: `/home/anomalindra/Documents/Project_Code/AI Business Consultant App`

Stack:
- React 18
- Vite 6
- Tailwind CSS v4
- lucide-react
- shadcn/radix-style UI components

Scope:
- This repository is frontend-only.
- Do not add backend servers, databases, AI provider calls, payment processors, storage clients, or secrets here.
- Backend/AI/payment/file-upload work belongs behind API contracts documented in `BACKEND_AI_HANDOFF.md`.

Commands:
```bash
npm run dev
npm run build
```
Dev URL:
```text
http://localhost:3000
```

## Hard rules
- Do not remove product flows to match Figma literally.
- Preserve all features listed in `PRD.md`.
- Treat Figma mobile light export as visual source of truth.
- `UI/UX Canvas - Dark` is sparse/incomplete; derive dark mode from complete light frames with accessible dark tokens, not 1:1 dark-canvas copying.
- Build mobile first, then scale to desktop.
- Do not make generic SaaS dashboard.
- Do not add dependencies unless absolutely required.
- Prefer edits in `src/app/App.tsx`, `src/styles/theme.css`, and docs.
- Run `npm run build` before claiming done.

## Visual direction
- Source: `/home/anomalindra/Downloads/Consultin/UI/UX Canvas - Light.svg`
- Current runtime palette was reverted to the stable blue/navy token set because broad green placement looked wrong.
- If reintroducing Figma green, use it only as a careful accent after screenshot comparison, not as the global primary color.
- Large rounded cards, clean spacing, mobile-first.
- Avoid blue generic dashboard look unless feature needs it.
- Avoid AI slop: purple gradients, sparkles, magic wand, brain/robot icons, fake enterprise microcopy.

## Chat behavior rule
Initial dashboard input is a free-form chat surface.
Do not show extracted parameter chips while typing.
After user submits:
- parse/detect completeness
- if incomplete: show detected brief preview and `Lengkapi informasi`
- then route to clarification form
- disable continue until required answers are filled

## Logo rule
- Desktop dashboard page header: no brand logo inside page content/header.
- Mobile: show brand logo in top header because bottom nav has no brand anchor.

## Loading rule
- Splash: blinking/pulsing Consultin logo only, no progress bar.
- Long content loading: skeleton layout.

## Verification checklist
1. `npm run build`
2. open `http://localhost:3000`
3. skip onboarding/login
4. dashboard visible
5. type incomplete query, verify no preview while typing
6. click `Susun brief`, verify preview + `Lengkapi informasi`
7. fill clarification, verify processing skeleton and report
8. check dark/light mode and ID/EN
9. check mobile bottom nav and desktop sidebar/topbar

## Known issues
- Vision tool previously failed with `401 invalid_api_key`; do not rely on it.
- OpenCode drifted into generic dashboard polish and got stuck dumping graph output. Manual/SVG-structure-driven edits are safer.
- Current UI was partially moved toward Figma but may still need mobile screenshot comparison.
