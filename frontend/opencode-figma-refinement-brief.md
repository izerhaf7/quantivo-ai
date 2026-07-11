# OpenCode task: Consultin Figma-first UI/UX refinement

User request: perform maximum UI/UX refinement, supervised by Hermes. Use Figma API exports already inside repo as source of truth.

## Hard goal
Make the original app visually and structurally adapt the user's Figma mobile design (`UI/UX Canvas - Light`) to the existing app features and flows. Mobile first. After mobile is coherent, scale up to desktop.

## Source references
- `reference-screenshots/uiux-canvas-light.png` — full Figma light canvas export.
- `reference-screenshots/uiux-canvas-dark.png` — dark canvas export.
- `reference-screenshots/uiux-components.png` — component reference.
- Figma frame inventory from API:
  - Splash-Light
  - On-Boarding 7 / 8 / 9
  - Welcome
  - Register / Phone Number / Verify Phone / Login / Forget Password / Reset
  - Welcome Home
  - Brainbox-Chat Intro
  - Brainbox-Instructions v2
  - Brainbox-Send Message / Active
  - Brainbox-Chat / Regenerate / Edit / Delete / Share
  - Ai-Assistant
  - Subscription
  - Services / Card Setting / Add New Card / Card Details
  - Profile / Support / Preferences / Edit Information / Invite Friend / History

## Current product rules to preserve
- Existing features must not disappear.
- Initial dashboard chat is free-form. Do NOT show extracted parameter chips while user is typing.
- After submit, if brief lacks detail, show detected brief preview and route to clarification form.
- Splash: logo pulse/blink only, no progress/level bar.
- Processing/report loading: use skeleton.
- Preserve ID/EN switch.
- Preserve dark/light mode.
- Desktop dashboard header should not show brand logo; mobile may show logo.
- Do not blanket recolor global UI green. Prior attempt looked bad. Use current stable blue/navy palette unless Figma placement clearly supports a small accent.

## Requested implementation scope
1. Inspect `reference-screenshots/uiux-canvas-light.png` and align mobile screens:
   - onboarding/auth visual rhythm
   - chat/Brainbox workspace
   - history/profile/subscription/wallet-like screens where current app has matching features
2. Refine `src/app/App.tsx` and theme/UI files only as needed.
3. Keep current app route/state flow working.
4. Do not replace the app with a static mock.
5. Do not work on experiment duplicate; work only this original repo.
6. Run `npm run build` before finishing.

## Expected output
- Changed files only where needed.
- Final app builds.
- Short final summary with files changed and remaining tradeoffs.
