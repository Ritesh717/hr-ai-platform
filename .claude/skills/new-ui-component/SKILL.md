---
name: new-ui-component
description: "Scaffold a new reusable UI component (foundation primitive, composite pattern, or layout/nav piece) following ui-plan.md's token-only, resizable, composable rules. Use when a screen needs something that doesn't exist yet in components/ — never invent a one-off component inline in a screen."
---

# /new-ui-component

Scaffolds a component under `apps/web/components/` per [`ui-plan.md`](../../../ui-plan.md) §4/§8.
The point of this skill is the same as the backend's `new-domain-module`: make the repo's rules —
token-only styling, container-driven sizing, no domain logic below `features/` — the default shape
instead of something to remember per component.

## Usage

```
/new-ui-component <Name> --layer <ui|patterns|layout>
  e.g. /new-ui-component StatCard --layer patterns
  e.g. /new-ui-component Combobox --layer ui
```

Chat/agent components (`ChatPanel`, `ChatMessage`, block renderers, …) are not this skill's job —
use `new-response-block` for a new `ResponseRenderer` block type, or scaffold `ChatPanel`-tier
components here with `--layer chat` only if genuinely adding to the chat shell itself, not a block.

## Prerequisites

This assumes the F1 foundation already exists: `apps/web/` Next.js app, Tailwind configured with
the token set from `ui-plan.md` §3, and a `ThemeProvider`. If `apps/web/lib/theme/tokens.css`
doesn't exist yet, stop and say so — bootstrapping the whole frontend app is a one-time setup step,
not something to do as a side effect of adding one component.

## What to create

1. `apps/web/components/<layer>/<Name>.tsx`:
   - Token-only styling — every color/radius/shadow value must come from the Tailwind theme
     extension backed by `tokens.css` (ui-plan.md §3), never a literal hex or arbitrary px radius.
   - If the component has style variants (intent, size, tone), use `class-variance-authority` for
     a typed variants API, matching `Button`'s pattern — not a pile of boolean props.
   - If it's interactive (menu, dialog, tabs, switch, etc.), build it on the matching Radix
     primitive rather than hand-rolling focus management/ARIA.
   - Sizing must be container-driven (flex/grid, `w-full`/`h-full`, no hardcoded fixed pixel
     width/height) so it holds up in both a narrow drawer and a wide dashboard panel — this is the
     "resizable" requirement from ui-plan.md §1, check it concretely, don't assume it.
   - No screen-specific or domain-specific logic (no HR business rules, no direct API calls) if
     `--layer` is `ui` or `patterns` — those belong in `features/`. `layout` components may know
     about the app's nav structure but still take that structure as props/config, not hardcode it.
2. If the component is genuinely new (not a variant of an existing one), add a one-line entry to
   the relevant table in `ui-plan.md` §4 so the inventory stays accurate — don't let the plan drift
   from what's actually built.
3. A minimal render check: render the component in both `data-theme="light"` and
   `data-theme="dark"` (a quick dev-only fixture page or existing kitchen-sink route is fine) and
   confirm it's legible in both — don't ship a component that was only ever eyeballed in one theme.

## After scaffolding

- Check it against the Definition of Done in `ui-plan.md` §8 before calling it done: tokens only,
  works narrow and wide, light+dark checked, keyboard-accessible with visible focus, no
  screen-specific logic if it's a `ui`/`patterns` component.
- If this component was scaffolded because a screen needed it, return to building that screen with
  `new-screen` (or continue the current screen work) — this skill's output should be a dependency,
  not a detour.
