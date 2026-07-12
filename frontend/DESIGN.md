---
version: alpha
name: Consultin
description: Mobile-first Indonesian AI business intelligence app. Stable blue/navy runtime palette, Figma-derived mobile rhythm, rounded cards, readable reports.
colors:
  background: "#F3F7FC"
  foreground: "#102B46"
  card: "#FFFFFF"
  muted: "#DDE8F4"
  mutedForeground: "#425C76"
  primary: "#2A74C4"
  primaryForeground: "#F7FBFF"
  secondary: "#14385E"
  secondaryForeground: "#F7FBFF"
  accent: "#6EA8D8"
  border: "#D5E2F0"
  darkBackground: "#06111F"
  darkCard: "#10243D"
  darkForeground: "#EAF4FF"
  darkPrimary: "#6EA8D8"
  warning: "#E8B35A"
  success: "#58B8A4"
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.045em"
  title:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: 12px
  md: 18px
  lg: 28px
  xl: 36px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primaryForeground}"
    rounded: "{rounded.xl}"
    padding: 16px
  input-chat:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: 24px
---

## Overview
Consultin should feel like a mobile-first financial/business companion, not a generic SaaS admin dashboard. Current runtime palette is reverted to stable blue/navy because broad green placement looked wrong. Figma mobile remains the layout/rhythm source, not a command to recolor everything green.

## Colors
Use blue/navy runtime tokens until green placement is carefully reintroduced with screenshot comparison. Green may appear as success/accent only where it does not dominate hierarchy.

## Typography
Use Plus Jakarta Sans as primary typeface. Prefer strong compact headings with negative tracking, readable 14–16px body copy, and sparse uppercase labels.

## Layout
Mobile is source of truth. Desktop should scale the same modules into wider columns. Do not invent desktop-only dashboard complexity.

## Elevation & Depth
Use soft shadows and subtle borders. Avoid heavy glassmorphism, neon glow, or generic AI gradients.

## Shapes
Large rounded cards are core. Use 28–36px radius for major mobile surfaces, 16–18px for inner controls.

## Components
Primary CTA uses current stable primary token. Chat input is a large rounded surface. Bottom nav is fixed on mobile and uses clear active color.

## Do's and Don'ts
Do:
- Keep chat free-form first.
- Use skeleton for long loading.
- Preserve dark/light contrast.
- Preserve all flows.

Don't:
- Show parameter chips before submit.
- Use purple AI gradients/sparkles.
- Blanket recolor global UI to green.
- Convert app into generic dashboard.
- Hide features just to match a static Figma screen.
