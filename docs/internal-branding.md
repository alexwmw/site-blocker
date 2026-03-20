# Hold internal branding guide

## Minimal branding spec

### Logo usage
- Use the `BrandMark` lockup for product-facing headers in popup, options, and blocked-page surfaces.
- Prefer the compact lockup when space is tight; do not stretch, outline, or recolor the mark outside the brand token set.
- The mark should appear on calm surfaces with enough padding to preserve its rounded-square silhouette.

### Color palette
- **Primary brand:** `--color-brand` / `--color-brand-strong` for primary actions, active tabs, and key emphasis.
- **Brand surface:** `--color-brand-surface` for onboarding cards, guidance, and soft highlights.
- **Success:** `--color-success` and `--color-success-surface` for healthy states like “protected” or “URL supported”.
- **Warning:** `--color-warning` and `--color-warning-surface` for recoverable friction, schedule caveats, and temporary unblock messaging.
- **Danger:** `--color-danger` only for destructive actions.

### Typography
- Use the shared sans stack from `--font-family-base`.
- Headlines should feel compact and confident; supporting copy should stay short and plain.
- Eyebrows and helper labels use uppercase or small-label styling to create structure, not decoration.

### Tone
- Voice should be calm, practical, and lightly encouraging.
- Focus on “what to do next” and “why it matters” instead of guilt-heavy language.
- Prefer direct phrases like “Stay on track”, “Review your rules”, and “Temporarily allowed” over punitive copy.

### Icon style
- Prefer simple geometric marks and rounded outline icons.
- Keep icon use sparse; it should support scanning, not become the visual centerpiece.
- When adding new icons, match the softness of the rounded corners and avoid multicolor icon sets.

## Good enough threshold

### Must ship now
- Shared brand tokens for color, type scale, spacing, focus ring, and elevation.
- Consistent branded headers across popup, options, and blocked-page entry points.
- Reusable callout/status patterns for onboarding and major interaction states.
- Clear styling for hover, focus, selected, success, warning, and destructive states.
- This guide so future contributors can extend the system without inventing new styles ad hoc.

### Can wait
- Redesigning the exported extension artwork or browser-store imagery.
- A larger icon set or custom illustrations.
- Full motion guidelines, advanced accessibility audits, or dark-mode refinements beyond the token system.
- Marketing pages or a more opinionated external brand voice.

## Implementation rules for contributors
- Start from shared CSS tokens in `src/entries/shared/theme.css` before introducing new colors or radii.
- Reuse `BrandMark`, `Hero`, `Callout`, `Button`, `Card`, `Tabs`, and `StatusItem` before creating a one-off section shell.
- If a new state is needed, name it semantically (`success`, `warning`, `danger`) rather than by raw color.
- Keep onboarding copy actionable and no longer than two short paragraphs.
