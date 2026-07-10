# Dashboard Chat Intake

Most important screen.

Purpose: user writes free-form business idea.

Rules:
- Initial state is free chat, not a parameter form.
- No extracted chips/fields while user types.
- Suggestion chips may exist outside chat as examples only.
- Submit button label: `Susun brief` / English equivalent.
- After submit, app detects completeness.

If incomplete:
- Show detected brief preview.
- Show completeness count.
- Show missing fields as missing.
- CTA becomes `Lengkapi informasi`.
- Next click routes to clarification/review form.

If complete enough:
- Continue to review/processing flow.

Visual:
- Mobile-Figma-derived large rounded card.
- Clean surface with current stable primary CTA. Do not force green globally.
- No generic dashboard-blue styling.
