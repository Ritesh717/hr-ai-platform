> **Read me first, in this order:** this README describes the whole design in text so you (Claude Code) rarely need to open the HTML at all. Only open `PeopleHR.html` (search for the slide's `data-label`) if you need a value not covered here.

# Handoff: PeopleHR — AI-native HR Platform (Design Concept)

## Overview
A 30-slide UX/UI design concept for an AI-native HR operating system (login, employee home, time/leave/payroll, team & org, careers/jobs, HR admin, analytics, settings), styled in an Apple "liquid-glass" visual language (translucent surfaces, blur, depth, soft shadows). Covers employee, manager, and HR-admin roles, each screen shown at desktop + true-mobile widths, with light and dark mode.

## About the Design Files
The bundled `PeopleHR.html` is a **design reference built in HTML** — a clickable slide deck of static/lightly-interactive mockups showing intended look, structure, and copy. It is **not production code**. Your task is to **recreate these screens in the target codebase's actual stack** (React/Vue/Swift/etc., whichever this repo uses — or the best fit if this is a fresh project), using that stack's real components, routing, and data layer. Treat the HTML purely as a precise visual/behavioral spec.

## Fidelity
**High-fidelity.** Colors, type scale, spacing, radii, and copy are final-intent; recreate them pixel-close using your codebase's own component primitives (don't just port the inline styles verbatim — translate them to your design-token/CSS system).

## Navigation & viewing the reference
Open `PeopleHR.html` in a browser. It's a `<deck-stage>`-based slide deck: arrow keys / click to navigate, thumbnail rail on the left, a light/dark toggle top-right. Each slide's `data-label` (visible in the thumbnail rail and in page source) is the canonical screen name — use it to jump to a screen in source (`grep data-label="0X` ) if you need to check an exact value.

## Design tokens
CSS custom properties defined once in `:root` and overridden under `[data-theme="dark"]`:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--acc` | `#111827` (near-black graphite) | `#eceef3` (near-white) | Primary accent — buttons, active states, gradients |
| `--acc2` | `#3f4a5f` | `#aab2c2` | Accent gradient partner |
| `--accInk` | `#ffffff` | `#111827` | Text/icon color ON accent fills |
| `--accWeak` | `rgba(17,24,39,.08)` | `rgba(236,238,243,.14)` | Tinted accent backgrounds (AI surfaces, active chips) |
| `--ink` / `--ink2` / `--ink3` | `#0c1222` / `#5a6474` / `#98a1b2` | `#eef2fb` / `#aab3c5` / `#727c8f` | Primary / secondary / tertiary text |
| `--line` / `--line2` | `rgba(12,18,40,.08)` / `.05` | `rgba(255,255,255,.09)` / `.05` | Hairline borders |
| `--glass` / `--glassBrd` | `rgba(255,255,255,.55)` / `.78` | `rgba(28,33,48,.55)` / `rgba(255,255,255,.10)` | Glass panel fill / border |
| `--elev` / `--elevBrd` | `rgba(255,255,255,.86)` / `.9` | `rgba(40,46,64,.72)` / `rgba(255,255,255,.10)` | Elevated (modal/card-on-glass) fill / border |
| `--chip` | `rgba(255,255,255,.6)` | `rgba(255,255,255,.06)` | Chip/pill background |
| `--bg` | layered radial gradients, `#e9eeff`→transparent, `#f2ebff`→transparent, over `linear-gradient(180deg,#f6f8fd,#eceff6)` | dark equivalents (`#17203a`, `#1d1636`, over `#0b0e16`→`#090b11`) | Page background |
| `--sh` / `--shSm` | `0 30px 70px rgba(24,34,64,.16)` / `0 12px 30px rgba(24,34,64,.10)` | darker/stronger equivalents | Elevation shadows (large/small) |
| `--good` / `--warn` / `--bad` | `#2fb673` / `#f5a524` / `#f2545b` | `#3ad18b` / `#ffbe4d` / `#ff6b72` | Status colors (success/warning/error) |

**Typography:** system font stack `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Helvetica Neue", sans-serif`. Type scale used throughout: Display 56px/740 weight, Page title 34–46px/680–720, Section heading 22px/620, Body 16px/400 (`--ink2`, line-height 1.5), Secondary metadata 12–13px uppercase tracked (`--ink3`), Numeric/financial figures use `font-variant-numeric: tabular-nums` at 34–40px/740.

**Radii:** 12–16px small elements, 16–20px cards, 24–28px large glass panels, 999px pills/toggles.

**Blur:** `backdrop-filter: blur(20–30px) saturate(1.4–1.5)` on every glass surface — this is the signature effect; without it surfaces read as flat instead of "liquid glass."

**Spacing:** page padding 56–72px; grid/flex gaps mostly 22–48px between major panels, 8–16px inside components.

## Screens
Desktop layout is consistently: a laptop-bezel mock of the primary experience on the left/center, a phone-bezel mock of the mobile equivalent alongside, and light annotation callouts (block type / fields / states / AI actions) labeling key regions. Each screen also carries an AI-specific surface (an accent-tinted glass panel or chat-style element) — AI is treated as a persistent layer, not a separate page.

1. **Cover** — Title slide: product mark, name "PeopleHR," headline "The HR operating system, reimagined," tag pills (24 screens, Desktop + mobile, Light + dark, Persistent AI layer).
2. **Design System** — Foundation slide documenting color, surface elevation (Background → Glass → Elevated → Modal), type scale, and core components (buttons, chips, toggle, floating card, AI insight surface).
3. **IA & Navigation** — Primary nav model: one nav structure shared by three role lenses (Everyone / Manager / HR Admin), AI shown as a cross-cutting layer.
4. **01 · Login / SSO** — Single glass card, SSO-first entry, over the ambient gradient background.
5. **02 · Employee Home** — Primary employee experience: AI-personalized hero + Today / Leave / Payroll / Tasks / Career blocks + AI insight rail.
6. **03 · Time** — Live attendance, editable timesheet, status calendar, AI trend commentary.
7. **04 · Leave** — Balances, coverage-aware request form, AI approval-risk prediction.
8. **05 · Payroll** — Salary hero, pay breakdown, payslip history, conversational payroll assistant.
9. **06 · Payslip** — Detailed payslip document, animated composition bar (breakdown of pay components), AI explanation of the numbers.
10. **07 · Team** — Manager view: team pulse, live availability timeline, member list, AI workload insights.
11. **08 · Organization** — Interactive drag/zoom org chart, live status indicators, search & filter, AI workforce insights.
12. **09 · Directory** — People search with faceted filters and skill-rich employee cards.
13. **10 · Profile** — Employee identity hero, about & skills, employment history, performance, AI-generated summary.
14. **11 · Knowledge** — Ask-anything search over company knowledge, categories, cited AI answers.
15. **12 · AI Assistant** — Full-screen conversational AI: rich response cards, action confirmation flows, context awareness.
16. **13 · Careers** — Career journey visualization, skills-gap analysis, AI career coach.
17. **14 · Jobs** — Internal job board with AI-matched roles and a transparent match score.
18. **15 · Job Details** — Full role detail page with match-score ring and AI-suggested actions.
19. **16 · Applications** — Application tracking with a stage timeline.
20. **17 · Interviews** — Upcoming interview list, details, AI interview prep.
21. **18 · Notifications** — Unified, categorized, action-ready notification center.
22. **19 · HR Admin** — Executive dashboard: KPI tiles with sparklines, natural-language AI summary of org health.
23. **20 · Employees** — HR admin employee directory table, filters, lifecycle actions (onboard/offboard/etc).
24. **21 · Analytics** — Interactive analytics across six HR domains (headcount, attrition, comp, etc.), with AI-generated explanations of trends.
25. **22 · Settings** — Sectioned preferences: appearance, AI behavior, security, accessibility.
26. **23 · Permissions** — Role management, access matrix, approval hierarchy, audit log.
27. **24 · Responsive & States** — Cross-cutting reference: per-breakpoint layout changes, full component state matrix (default/hover/active/disabled/error), accessibility notes.
28. **Closing** — One-line thesis restatement / summary slide.

Exact copy, per-field labels, and numeric sample data for each screen are visible directly in `PeopleHR.html` — open the slide and read the rendered text rather than guessing at exact strings.

## Interactions & Behavior
- **Theme toggle**: fixed top-right pill button switches `data-theme="light"/"dark"` on the root, swapping the CSS custom properties above. Persist as a user preference in the real app (e.g. `prefers-color-scheme` + manual override, stored in local settings).
- **AI panel**: conceptually a floating panel that can overlay any screen (see slide 12 for its full-screen form) — implement as a global overlay/drawer, not a page route, so it's reachable from every screen.
- **Org chart** (screen 8): drag-to-pan, pinch/scroll-to-zoom, click node to expand/focus.
- **Payslip breakdown** (screen 6): an animated bar/segment showing gross → deductions → net composition; animate the segments in on load.
- **Team availability timeline** (screen 7): horizontal live timeline of team members' current status/availability.
- **Notifications** (screen 18): grouped by category, each item is directly actionable (approve/dismiss/view) inline, not just a link out.
- Callout annotations on each screen are design documentation only — they should NOT be recreated in the shipped product; they exist to tell you what each block is, its states, and any AI behavior attached to it.

## State Management
Not applicable as literal code — this is a static mockup. When implementing, plan for: auth/session state (login), per-screen data fetching (time entries, leave balances, payroll figures, team roster, org tree, directory, notifications, analytics datasets), AI conversation/session state for the assistant panel, and theme preference (light/dark).

## Assets
No external image assets — the mockups use only CSS (gradients, blur, SVG-free vector-style icons via inline shapes/emoji-free glyphs, and typographic marks). No fonts are self-hosted; it relies on the system font stack listed above. If your target platform doesn't ship SF Pro, substitute a similar geometric/humanist sans (e.g. Inter, or the platform's default system font) rather than importing SF Pro (Apple font, licensing-restricted).

## Files
- `PeopleHR.html` — the full 28-slide standalone design reference (self-contained, works offline, open directly in a browser).
