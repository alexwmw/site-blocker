# Time Out – Minimal Branding Spec (v1)

## 1) Logo usage
- **Primary mark:** Use the existing extension icon/mark as the single source of truth.
- **Safe area:** Keep at least `--brand-logo-clearspace` around all sides.
- **Minimum size:** Never render below `--brand-logo-min-width`.
- **Placement:** Use logo in top-level surfaces only (popup header, options hero, block page card header) and avoid repeating inside dense controls.

## 2) Color palette
- **Base semantic palette (from tokens):**
  - Background/surfaces: `--color-bg`, `--color-bg-elevated`, `--color-bg-muted`
  - Text hierarchy: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`
  - Borders: `--color-border`, `--color-border-strong`, `--color-border-muted`
  - Actions/states: `--color-accent`, `--color-accent-strong`, `--color-accent-soft`, `--color-danger`, `--color-success`
- **Theme variants:** Focus / Mindful / Intention themes remap the same semantic tokens instead of introducing one-off colors.

## 3) Typography
- **Body:** `--font-family-base` for all body text and controls.
- **Display/headings:** `--font-family-display` for hero and major section titles.
- **Scale baseline:**
  - Hero: 1.2rem+
  - Section titles: ~1rem
  - Body: 0.9–1rem
  - Helper/meta: 0.8–0.88rem

## 4) Voice and tone
- **Default voice:** calm, direct, non-judgmental.
- **Interaction copy:** action-first and concise (e.g., “Hold to continue”).
- **State copy:** communicate outcome + next step (e.g., “Success! Redirecting…”).

## 5) Icon style
- Use Lucide icons with shared stroke token `--icon-stroke-width`.
- Keep icons supportive (status/context), not decorative clutter.
- In compact UI (popup), icons should be one per message row.

---

## “Good enough” threshold (ship now vs wait)

### Must ship now
1. **Tokenized states** for primary/secondary/ghost actions and focus ring.
2. **Consistent tab/button interaction states** (hover, focus-visible, active).
3. **Onboarding consistency** via a shared checklist pattern.
4. **Block-page hold interaction polish** with ring progress + success animation behavior.
5. **No new ad-hoc hardcoded colors** in touched files.

### Can wait
1. Full logo lockup system (horizontal/stacked variants).
2. Expanded type ramp and responsive typography matrix.
3. Illustration/photo guidelines beyond current block-page backgrounds.
4. Full accessibility color contrast audit report for all themes.
5. Advanced motion system documentation (durations/easings for all surfaces).
