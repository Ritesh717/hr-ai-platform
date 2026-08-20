---
name: modern-glass-ux
description: "Applies the repo's token-driven glass UX system — translucent surfaces, blur tiers, glass borders, and the decorative backdrop they need to read as glass — to any new or existing component/screen. Use when building or restyling any card, overlay, floating control, or page chrome so it matches the app's modern glass visual direction."
---

# Modern Glass UX

This is the app's visual direction: translucent, frosted surfaces floating over a soft decorative
backdrop, not flat solid cards. It supersedes the old "soft cards on a neutral background" wording
in [`ui-plan.md`](../../../ui-plan.md) §0/§3. Every rule from §1/§8 still applies unchanged — this
skill is *how* that token-only rule is satisfied for glass: **a literal `bg-black/NN`,
`bg-white/NN`, or `backdrop-blur-[Npx]` instead of a token below is a bug, not a style choice.**

The model is Apple's iOS/macOS "vibrancy" material (`UIVisualEffectView`, and iOS 26's Liquid
Glass), not generic web glassmorphism tutorials. Three things distinguish it from a plain blurred
box, and all three are non-optional parts of the recipe below:

1. **Saturation, not just blur.** Apple's materials boost the saturation of whatever's behind them
   (`backdrop-filter: blur() saturate()`) — colors behind the glass look richer, not washed out.
   Every glass surface pairs `backdrop-blur-glass-*` with `backdrop-saturate-150`. Skipping the
   saturate half is the single most common way to make glass look like a flat tinted box instead.
2. **A specular top-edge highlight**, not a uniform border. `--shadow-glass-md`'s
   `inset 0 1px 0 0 var(--color-glass-highlight)` mimics the thin light-catching rim iOS glass has
   along its top edge, layered with `--color-glass-border`/`-strong` for the rest of the outline.
3. **Something colorful behind the glass to distort.** iOS glass is legible as glass because it
   sits over content, wallpaper, or a colored surface — never a flat single-hue background. That's
   what `.glass-backdrop` (§ Background & Depth) exists to provide app-wide.

## Core Glass Recipe

The canonical "standard tier" combo — everything else is a variation of this:

```tsx
<div className="rounded-xl border border-glass-border bg-glass-surface backdrop-blur-glass-md backdrop-saturate-150 shadow-glass-sm transition-shadow hover:shadow-glass-md">
  ...
</div>
```

## Glass Levels

Every tier below pairs its blur with `backdrop-saturate-150` — that pairing is the recipe, not an
optional extra.

| Level | Classes | Blur | When to use |
|---|---|---|---|
| Subtle | `bg-glass-surface-subtle backdrop-blur-glass-sm backdrop-saturate-150 border-glass-border` | `blur-glass-sm` | App chrome that shouldn't compete with content (Sidebar, TopBar) |
| Standard | `bg-glass-surface backdrop-blur-glass-md backdrop-saturate-150 border-glass-border shadow-glass-sm` | `blur-glass-md` | Default panel — Card, Popover, DropdownMenu, Toast |
| Strong | `bg-glass-surface-strong backdrop-blur-glass-lg backdrop-saturate-150 border-glass-border-strong shadow-glass-md` | `blur-glass-lg` | Focal surfaces — Dialog/Drawer content, HighlightCard |
| Scrim | `bg-overlay-scrim backdrop-blur-glass-lg backdrop-saturate-150` | `blur-glass-lg` | Dialog/Drawer overlay behind the focal content |

There's also `bg-glass-surface-inverse` — an always-dark translucent chip (same in both themes),
reserved for `Tooltip` where a small transient label needs guaranteed contrast regardless of theme.

## Component Mapping

| Component | Level | Notes |
|---|---|---|
| `Card` (`surface="glass"`, default) | standard | |
| `Card` (`surface="glass-strong"`) | strong | used by `HighlightCard` |
| `HighlightCard` | strong + `shadow-[var(--shadow-glass-md),var(--shadow-glass-glow)]` | the accent glow layers on top of the strong-tier shadow, not instead of it |
| `StatCard`, `ChartCard` | standard | inherit from `Card` automatically |
| `Dialog` / `Drawer` content | strong | focal, needs highest legibility |
| `Dialog` / `Drawer` overlay | scrim | replaces the old flat `bg-black/40` |
| `Popover`, `DropdownMenu` | standard | the classic floating-glass case |
| `Toast` | standard | floating notification |
| `Tooltip` | `glass-surface-inverse` | intentionally theme-independent for small transient text |
| `Sidebar`, `TopBar` | subtle | must stay legible over the decorative backdrop without stealing focus |
| `Card` (`surface="solid"`) | — | explicit escape hatch when a screen needs zero blur |
| `DataTable`, `Skeleton`, `Badge`, `Button`, `IconButton` | **not glass** | dense data, loading placeholders, and small controls stay solid — glass is for panels/overlays, not tiny controls or blur-sensitive loading states |

## Background & Depth

Flat single-hue backgrounds make `backdrop-blur` invisible — there has to be something behind the
glass for it to visibly distort. Every full-bleed screen/page wrapper (auth pages, the `AppShell`
root, full-page loading states) must use the `.glass-backdrop` utility instead of a bare `bg-bg`:

```tsx
<div className="glass-backdrop flex h-dvh w-full">...</div>
```

`.glass-backdrop` layers `--gradient-decorative` (soft accent-colored blobs, reusing
`--color-primary`/`-info`/`-success` at low alpha) over `--color-bg`. Don't reach for a bare `bg-bg`
on a new full-bleed wrapper — that's a Definition-of-Done violation below. Small flat-chrome uses of
`bg-bg` (hover states, skeletons, table header tint) are unaffected and should stay as they are.

## Text Contrast on Glass

| Level | Light theme | Dark theme |
|---|---|---|
| Subtle | `text-text` (avoid `text-text-muted` — a 35%-alpha near-white panel over a bright backdrop is a real contrast risk) | `text-text` / `text-text-muted` both fine |
| Standard | `text-text` / `text-text-muted` | `text-text` / `text-text-muted` |
| Strong | `text-surface-raised-foreground` | `text-surface-raised-foreground` |
| Scrim / inverse chip | `text-surface-raised-foreground` (always-light-on-dark) | same |

## Motion & Hover

- Hover/focus raises one shadow tier: `shadow-glass-sm` → `shadow-glass-md`, and brightens the
  border: `border-glass-border` → `border-glass-border-strong`.
- `transition-shadow` / `transition-colors` only — CSS transitions, matching `ui-plan.md` §2's
  Motion row (no Framer Motion for this).
- Respect `prefers-reduced-motion`.
- Keep the Radix focus ring (`focus-visible:ring-2 ring-primary`) fully opaque — never dim it to
  match the glass surface. Keyboard focus must stay visible on blurred backgrounds.

## Performance Note

- Don't stack more than ~3 blurred layers (backdrop → card → popover is fine; a popover-over-a-card
  -over-another-glass-layer is not).
- Prefer `backdrop-blur-glass-sm` for large-area or frequently-animating regions.
- Test on lower-end devices/mobile — `backdrop-filter` is not free.

## Definition of Done

- [ ] Tokens only — no literal `bg-black/NN`, `bg-white/NN`, or arbitrary blur/opacity value.
- [ ] Correct tier chosen per the Component Mapping table above.
- [ ] Any new full-bleed screen/page wrapper uses `.glass-backdrop`, not bare `bg-bg`.
- [ ] Text contrast checked against the glass surface in both light and dark themes.
- [ ] Hover/focus raises shadow + border tier as described above.
- [ ] Keyboard focus ring stays visible against the blurred surface.
- [ ] Everything else from `ui-plan.md` §8 still holds: resizable/container-driven, no
      screen-specific logic in `ui/`/`patterns/`, loading/empty/error states present.
