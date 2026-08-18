# UI Build Plan — HR AI Agent Platform

Companion to [`plan.md`](plan.md) (backend stages) and [`docs/blueprint.md`](docs/blueprint.md).
This plan covers the frontend: a reusable component library plus every screen needed to expose
the full application across all backend stages.

Visual reference: [`docs/assets/ui-reference-dashboard.png`](docs/assets/ui-reference-dashboard.png)
— sidebar with sectioned nav, a page header, KPI
stat cards, a chart card, a data table, a dark "highlight" card, and horizontal progress stats.
That composition (soft cards on a neutral background, generous radius, one warm accent color,
avatars everywhere people are referenced) is the direction for every screen below, not just the
dashboard — it's translated into design tokens and a fixed set of card/table/stat patterns in
§3–4 so it stays consistent instead of being redrawn per screen.

## 1. Goals & non-negotiables

1. **Lightweight.** No heavy pre-styled component framework. A small headless-primitive layer
   (Radix UI) styled with our own tokens, owned as source in this repo — not an installed
   black-box kit. Ship only what's used.
2. **One component library, everywhere.** Every screen composes the same primitive set. A page
   never invents its own button, card, or input — if a screen needs something new, it's added to
   `components/` first, then used, so the next screen gets it for free.
3. **Theme-driven, not hardcoded.** Every color, radius, shadow, and spacing value comes from
   design tokens (§3). Components read tokens; they never hardcode a hex value or a raw pixel
   radius. Light/dark (and any future brand palette) is a token swap, not a per-component rewrite.
4. **Reusable *and* resizable.** Components are container-driven — width/height come from the
   parent via flex/grid — so the same `StatCard` or `ChatPanel` works whether it's in a 3-column
   dashboard, a narrow sidebar drawer, or a full-width mobile view, unmodified.
5. **Composable over configurable.** Prefer small primitives combined (`FormField` = `Label` +
   `Input` + `ErrorText`) over one giant component with twenty boolean props.

## 2. Stack decision

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Matches blueprint §1's frontend row |
| Styling | Tailwind CSS + CSS-variable tokens | Runtime-themeable (no rebuild to switch theme), no separate CSS-in-JS runtime cost |
| Interactive primitives | Radix UI (unstyled, accessible) | Behavior/accessibility (focus trap, keyboard nav, ARIA) for free under Dialog, DropdownMenu, Tabs, Popover, Switch — we own the styling layer on top |
| Style variants | class-variance-authority (cva) | Typed variant props (`intent`, `size`, `tone`) instead of ad hoc className strings |
| Forms | react-hook-form + zod | One schema drives validation *and* (via derived/picked types) the view-only form's field list, so edit and view modes can't drift apart |
| Tables | TanStack Table (headless) | Sorting/pagination/column logic is reusable; presentation stays in our `DataTable` |
| Server/agent state | TanStack Query | One consistent loading/error/retry/streaming pattern for every API and chat call instead of per-screen `fetch` + `useState` |
| Charts | Recharts, wrapped in `ChartCard` | Screens never import the charting lib directly — swappable later without touching pages |
| Icons | lucide-react | Tree-shakeable thin-line icons, matches the reference's icon weight |
| Motion | CSS transitions by default; Framer Motion only for the chat panel/drawers if actually needed | Keeps the bundle light — motion isn't app-wide by default |

## 3. Design tokens (theme system)

Single source of truth: `apps/web/lib/theme/tokens.css`, exposed as Tailwind theme extensions.
Semantic names, not raw colors — every component references these, never a literal value:

```text
--color-bg                 page background (the soft gradient/neutral backdrop in the reference)
--color-surface             default card background
--color-surface-raised      elevated card (e.g. the dark "Upcoming Meeting" card variant)
--color-border
--color-text / --color-text-muted
--color-primary / --color-primary-foreground     the one warm accent color, used sparingly
--color-success / --color-warning / --color-danger / --color-info
--radius-sm / --radius-md / --radius-lg / --radius-xl     reference leans generous (lg–xl)
--shadow-sm / --shadow-md                                  soft, low-opacity elevation only
```

Light and dark are two token sets swapped via a `data-theme` attribute on `<html>`; a
`ThemeProvider` + `useTheme()` hook handles persistence and system-preference detection. A
component that hardcodes a color or a bare `rounded-xl`-with-arbitrary-value instead of a token is
a bug, not a style preference — flag it in review the same way a layering violation is flagged in
the backend.

## 4. Component library inventory

Four layers. Lower layers know nothing about HR domain concepts; only `features/` screens do.

### 4.1 Foundation primitives (`components/ui/`)

| Component | Notes |
|---|---|
| `Button` | Variants: `primary / secondary / ghost / destructive / link`; sizes `sm/md/lg`; loading state built in (spinner replaces label, width doesn't jump) |
| `IconButton` | Same variant system as `Button`, square, for toolbar/table-row actions |
| `Input`, `Textarea`, `Select`, `Combobox`, `DatePicker`, `Checkbox`, `Switch`, `RadioGroup` | Each a thin, token-styled wrapper over a Radix primitive where one exists |
| `Card` | The single card shell every StatCard/ChartCard/ListCard/etc. builds on — owns radius/shadow/padding tokens once |
| `Badge` | Status pills (leave status, approval status, employee status) — tone-driven (`success/warning/danger/neutral`), not per-screen colors |
| `Avatar`, `AvatarGroup` | Matches the reference's stacked-avatar meeting/team lists |
| `Dialog`, `Drawer/Sheet`, `Popover`, `DropdownMenu`, `Tabs`, `Tooltip` | Radix-backed overlays, one set reused for every modal/side-panel/menu in the app |
| `Toast` | Global notification system (success/error/info), one queue |
| `Skeleton` | Loading placeholder, used by every async card/table instead of ad hoc spinners |

### 4.2 Composite patterns (`components/patterns/`) — still domain-agnostic

| Component | Notes |
|---|---|
| `FormField` | Editable unit: label + input (any `ui/` input) + help text + error text. **The** building block for every editable form in the app. |
| `ViewField` | Read-only counterpart: label + rendered value, same grid position/spacing as `FormField` so a screen can toggle edit/view mode without the layout jumping. |
| `Form` | react-hook-form + zod wrapper; lays out a list of `FormField`s from a schema, handles submit/dirty/error state consistently. |
| `ViewOnlyForm` | Same schema-driven layout as `Form`, rendered with `ViewField`s — e.g. an employee profile in view mode vs. edit mode is the *same* schema through two renderers. |
| `DataTable` | TanStack-Table-backed: sorting, pagination, row actions (`…` menu), empty/loading states built in. Powers Employees, Candidates, Expenses, Audit Log, Approvals. |
| `StatCard` | The KPI tiles in the reference ("Total Employees 49,229") — icon, label, value, optional delta. |
| `ChartCard` | `Card` + a Recharts chart + a period selector (`Past 3 months ▾`), matching the reference's "Average KPI Score" card. |
| `ProgressStat` | The horizontal "Working Format" bars — label, value, percentage bar. |
| `HighlightCard` | The dark elevated card variant (`--color-surface-raised`) for spotlighted content like Upcoming Meetings/Approvals-needing-attention. |
| `KanbanBoard` / `KanbanCard` | Recruitment pipeline (Stage 9). |
| `WorkflowStatusTimeline` | Renders a Temporal workflow's step state (Stage 6 onboarding) — pending/active/done/failed per step. |
| `EmptyState`, `ErrorState` | Consistent "nothing here yet" / "something broke" treatment app-wide. |
| `ConfirmDialog` | Built on `Dialog`; the one path for destructive or high-impact confirmations (ties to human-in-the-loop actions, blueprint §34). |

### 4.3 Layout & navigation (`components/layout/`)

| Component | Notes |
|---|---|
| `AppShell` | Sidebar + TopBar + content slot — the frame every authenticated screen renders inside, exactly like the reference's overall composition. |
| `Sidebar` / `NavItem` / `NavSection` | Sectioned nav ("Main Menu" / "Team Management" in the reference); collapsible to icon-only rail for narrow viewports — this is the "resizable" requirement applied to nav. |
| `TopBar` | Page title + breadcrumb slot + user menu (`Carla Sanford ▾` in the reference) + notification bell. |
| `PageHeader` | Title + optional actions row, used under `TopBar` on every screen for consistency. |

### 4.4 Agent / chat (`components/chat/`)

This is the newest and most important surface — it's how every agent from backend Stage 2 onward
reaches the user, so it's built once and reused, not rebuilt per agent.

| Component | Notes |
|---|---|
| `ChatPanel` | The chat container itself; usable as a persistent right-side `Drawer` (global copilot, launchable from any screen) *or* as a full-page view — same component, different host. |
| `ChatMessageList` | Virtualized message scroll. |
| `ChatMessage` | Role (`user`/`assistant`/`system`), avatar, timestamp, renders its content via `ResponseRenderer`. |
| `ChatComposer` | Input box, send/stop (streaming) button, attachment button (receipts, resumes). |
| `ChatTypingIndicator` | Streaming/"thinking" state. |
| `ResponseRenderer` | **The piece that makes agents extensible without redesigning the chat.** Agent responses are a list of typed content blocks; `ResponseRenderer` maps each block type to a renderer via a registry: `TextBlock` (markdown), `CitationBlock` (source doc + version, expandable — RAG grounding from blueprint §7), `ToolCallBlock` (collapsed "used `get_leave_balance`" trace, expandable — transparency into what the agent did), `DataTableBlock` / `ChartBlock` (structured tool results, e.g. analytics agent output), `ApprovalRequestCard` (human-in-the-loop action awaiting approval — Approve/Reject inline, blueprint §34), `ActionConfirmationCard` (e.g. "Leave request created ✅" linking to the record), `RefusalBlock` (guardrail refusal, styled distinctly from a normal error). Adding a new agent capability later means registering a new block renderer, not touching the chat shell. |

## 5. Screens, by section

Each maps to the backend stage that makes it real (blueprint §46); UI work can run ahead of that
stage using mocked API responses (§6).

### A. Shell & auth
- Login / SSO callback
- `AppShell` itself (every screen below renders inside it)
- Global chat drawer affordance (wired up properly in Stage 2, but the shell reserves the slot from the start)

### B. Dashboard (Stage 1, enriched every stage after)
- Home/Dashboard — role-aware `StatCard` row, `ChartCard`, `DataTable` preview, `HighlightCard` (approvals/meetings needing attention), `ProgressStat` panel. Directly modeled on `image.png`.

### C. Employee self-service (Stages 1–4)
- My Profile (`ViewOnlyForm`, toggles to `Form` for edit)
- My Leave — balance, apply (`Form`), history (`DataTable`)
- My Payslips — list + view-only detail
- Policy Library / "Ask HR" — RAG search + chat page (Stage 3)
- My Team / org chart

### D. Manager views (Stage 4+)
- Approvals Center — generic queue (leave, expense, others) using the same `ApprovalRequestCard` pattern as in chat, so approving from the inbox and approving from the copilot look identical
- Team Leave Calendar
- Team Performance table (mirrors the reference's Employees table, with a performance bar column)

### E. Expense (Stage 5)
- Submit Expense — `Form` + file upload + OCR-extracted-field confirm step
- My Expenses (`DataTable`, status `Badge`s)
- Expense Approvals (manager)

### F. Onboarding (Stage 6)
- Onboarding Tracker — `WorkflowStatusTimeline` of a running Temporal workflow
- New-hire onboarding checklist (employee-facing)

### G. HR admin (Stages 1, 7, 11)
- Employees Directory (`DataTable` — this is the reference's "Employees" table)
- Employee Detail (`ViewOnlyForm`/`Form` tabs)
- Departments & Org Settings
- Roles & Permissions
- Audit Log Viewer (filterable `DataTable`, blueprint §35)

### H. Recruitment (Stage 9)
- Jobs list + Job Detail/JD (agent-assisted drafting)
- Candidate Pipeline (`KanbanBoard`)
- Candidate Profile (resume, extracted structured data, match rationale)
- Interview Scheduling
- Interview Feedback (`Form`, rubric-based)

### I. Analytics (Stage 8)
- Analytics Dashboard (chart-heavy, same `ChartCard`/`StatCard` set as the main dashboard)
- Ask Analytics — text-to-SQL chat page (reuses `ChatPanel` + `ResponseRenderer`'s `ChartBlock`/`DataTableBlock`)
- Saved Reports

### J. Copilot (Stage 10)
- Full-page HR Copilot for deep, cross-domain sessions (the global drawer covers quick asks)

### K. Settings & system
- Account settings, notification preferences, theme toggle
- 404, Access Denied, error boundary, and `EmptyState` coverage for every list screen above

## 6. Frontend build order

Mirrors `plan.md`'s backend stages but isn't blocked by them — early UI stages use a mocked API
layer (typed against the same schemas the backend will expose) so component/screen work isn't
idle waiting on the backend.

| UI Stage | Delivers | Backend stage it pairs with | Status |
|---|---|---|---|
| F1 | Tokens, theme provider, all §4.1/4.3 primitives, `AppShell`, Login, Dashboard shell (mock data), Employees Directory + Detail | Stage 1 | 🟡 built, pending visual QA |
| F2 | `ChatPanel`/`ResponseRenderer` foundation, global drawer wired to the Employee Agent | Stage 2 | not started |
| F3 | Policy Library / "Ask HR" page | Stage 3 | not started |
| F4 | My Leave apply/history, Approvals Center, `ApprovalRequestCard` | Stage 4 | not started |
| F5 | Expense submit/list/approve incl. file upload + OCR confirm step | Stage 5 | not started |
| F6 | Onboarding Tracker, `WorkflowStatusTimeline` | Stage 6 | not started |
| F7 | Realtime notification toast (SSE/WebSocket) for event-driven updates | Stage 7 | not started |
| F8 | Analytics Dashboard + Ask Analytics | Stage 8 | not started |
| F9 | Recruitment screens + `KanbanBoard` | Stage 9 | not started |
| F10 | Full-page Copilot, cross-domain polish | Stage 10 | not started |
| F11 | Accessibility pass, responsive/resize QA across all screens, perf budget, full loading/empty/error coverage | Stage 11 | not started |

F1 implementation lives in `apps/web/`. Build (`npm run build`) and lint (`npm run lint`) are clean,
and all four routes (`/login`, `/dashboard`, `/employees`, `/employees/[id]`) render correctly via a
dev-server smoke test. Not yet done: an actual visual pass (light **and** dark, narrow **and** wide
viewport per §8's DoD) — that requires eyeballing in a real browser, which wasn't available in the
session that built this. Do that pass, plus a `/phase-gate --ui-stage F1` check, before flipping this
to done and moving to F2.

## 7. Frontend folder structure

```text
apps/web/
├── app/                      # Next.js App Router — one route group per section (§5)
│   ├── (auth)/login/
│   ├── (dashboard)/dashboard/
│   ├── (dashboard)/employees/[id]/
│   ├── (dashboard)/leave/
│   └── ...
├── components/
│   ├── ui/                   # §4.1 — foundation primitives, zero domain knowledge
│   ├── patterns/             # §4.2 — composite, still domain-agnostic
│   ├── layout/                # §4.3 — AppShell, Sidebar, TopBar, PageHeader
│   └── chat/                  # §4.4 — ChatPanel, ResponseRenderer + block renderers
├── features/                  # screen-specific composition + logic, one folder per domain
│   ├── employees/ leave/ expense/ recruitment/ analytics/ onboarding/ ...
├── lib/
│   ├── theme/                 # tokens.css, ThemeProvider, useTheme
│   ├── api/                   # typed client (ideally generated from the FastAPI OpenAPI schema)
│   └── forms/                 # shared zod schemas, mirrored against backend Pydantic schemas
```

## 8. Definition of done — component or screen

- Reads only design tokens; no hardcoded color/radius/shadow value.
- Works at both a narrow (drawer/mobile) and wide (dashboard panel) container width without breaking — this is the "resizable" requirement, checked, not assumed.
- Rendered and eyeballed in both light and dark.
- Keyboard-navigable with a visible focus state (mostly free from Radix, but verify).
- No screen-specific logic inside `components/ui/` or `components/patterns/` — that belongs in `features/`.
- Loading, empty, and error states exist for anything that fetches data.

## 9. Repo skills for this plan

Three skills in `.claude/skills/` keep the rules above structural rather than remembered by hand:

- **new-ui-component** — scaffolds a `components/ui`/`patterns`/`layout` piece: token-only
  styling, Radix-backed where interactive, container-driven sizing.
- **new-screen** — scaffolds a screen from §5: composes existing components only, wires in
  loading/empty/error states, uses `ConfirmDialog`/`ApprovalRequestCard` for high-impact actions.
- **new-response-block** — adds a new `ResponseRenderer` block type so a new agent capability gets
  a chat renderer without touching the chat shell.

`phase-gate` also checks UI stages (`--ui-stage F4`, checking §6/§8 here) in addition to backend
stages.
