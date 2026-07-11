# Theme + Language Controls

Requirements:
- Preserve light/dark mode.
- Preserve ID/EN language switch.
- Controls belong in app-wide utility area, not buried in sidebar nav.
- Update `document.documentElement.lang` and theme state/localStorage if used.

Contrast:
- Never hardcode black text on dark surfaces or white text on light primary unless checked.
- Prefer theme tokens: `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`.
