# Dark Mode Direction

`UI/UX Canvas - Dark` in Figma is sparse/incomplete. Do not treat it as a full frame-by-frame source of truth.

Use `UI/UX Canvas - Light` as the complete visual/layout source, then derive dark mode from the light design:

- preserve same information architecture, spacing, radius, hierarchy, and component rhythm
- invert surfaces carefully for contrast
- keep text WCAG-readable
- keep semantic colors clear for success/warning/error
- do not force green globally
- use dark mode as a theming adaptation, not a separate redesign
- do not block UI refinement because dark canvas lacks frames

Implementation rule:

Light mode = Figma frame fidelity.
Dark mode = equivalent layout + accessible dark tokens.
