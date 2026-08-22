# UI Build Plan — HR AI Agent Platform

**UX source of truth:** `UX_Designs/PeopleHR.html` (30-slide design reference, open in a browser — arrow keys to navigate) and `UX_Designs/README.md` (full screen-by-screen text description, read this first).  
Each slide's `data-label` is the canonical screen name used throughout this document.  
This plan is the implementation contract: it translates the UX designs into epics, stories, components, and build order for the Next.js frontend in `apps/web/`.

---

## 1. Goals & non-negotiables

1. **The UX designs are the acceptance criterion.** Every screen is built pixel-close to `PeopleHR.html`. "Close enough" is not enough — the glass, blur, type scale, spacing, and copy in the designs are final-intent. Translate them through the codebase's token/component system; do not port inline styles verbatim.
2. **Lightweight.** No heavy pre-styled component framework. Radix UI (headless, accessible) styled with our own tokens — owned as source in this repo.
3. **One component library, everywhere.** Every screen composes the same primitive set. A screen never invents its own button, card, or input — if a screen needs something new it's added to `components/` first.
4. **Theme-driven, not hardcoded.** Every color, radius, shadow, and spacing comes from design tokens (§3). No hardcoded hex values or bare pixel values in component files.
5. **AI is a persistent layer, not a page.** The UX designs place an AI surface on every screen (an insight rail, an accent-tinted glass panel, or the global floating chat panel). The AI drawer is a global overlay reachable from any screen — not a page route.
6. **Desktop + mobile for every screen.** Each UX slide shows a desktop layout and a phone-bezel equivalent. Both breakpoints are a DoD requirement, not a stretch goal.
7. **Role-aware navigation.** The UX designs define three role lenses on one nav structure: Everyone / Manager / HR Admin. The shell renders the correct nav items based on the authenticated user's role.

---

## 2. Stack decision

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Matches blueprint §1 |
| Styling | Tailwind CSS + CSS-variable tokens | Runtime-themeable; no rebuild to switch theme |
| Interactive primitives | Radix UI | Behavior/accessibility free — Dialog, DropdownMenu, Tabs, Popover, Switch, etc. |
| Style variants | class-variance-authority (cva) | Typed variant props instead of ad hoc className strings |
| Forms | react-hook-form + zod | One schema drives validation and view-mode field list |
| Tables | TanStack Table (headless) | Sorting/pagination/column logic reusable |
| List virtualization | TanStack Virtual | ChatMessageList virtualized scroll |
| Server/agent state | TanStack Query | Consistent loading/error/retry/streaming for every API and chat call |
| Charts | Recharts, wrapped in `ChartCard` | Never import charting lib directly from pages |
| Icons | lucide-react | Tree-shakeable thin-line icons |
| Motion | CSS transitions by default; Framer Motion for chat panel/drawers and payslip bar animation | Keep bundle light |
| Component tests | Jest + React Testing Library | Unit tests co-located or in `__tests__/`; `npm test` |

---

## 3. Design tokens

**Primary source:** `apps/web/lib/theme/tokens.css`, extended in `tailwind.config.ts`.

The PeopleHR UX designs define a specific token vocabulary. The table below maps the design's CSS custom properties to our semantic token names. When implementing a screen, use our token names — not the raw values — so the design system remains a single swap point.

### 3.1 Color tokens

| Our token | PeopleHR token | Light value | Dark value | Use |
|---|---|---|---|---|
| `--color-primary` | `--acc` | `#111827` (near-black graphite) | `#eceef3` (near-white) | Primary accent — buttons, active states, gradients |
| `--color-primary-alt` | `--acc2` | `#3f4a5f` | `#aab2c2` | Accent gradient partner |
| `--color-primary-foreground` | `--accInk` | `#ffffff` | `#111827` | Text/icon ON accent fills |
| `--color-primary-weak` | `--accWeak` | `rgba(17,24,39,.08)` | `rgba(236,238,243,.14)` | Tinted accent backgrounds — AI surfaces, active chips |
| `--color-text` | `--ink` | `#0c1222` | `#eef2fb` | Primary text |
| `--color-text-muted` | `--ink2` | `#5a6474` | `#aab3c5` | Secondary text |
| `--color-text-subtle` | `--ink3` | `#98a1b2` | `#727c8f` | Tertiary / metadata text |
| `--color-border` | `--line` | `rgba(12,18,40,.08)` | `rgba(255,255,255,.09)` | Hairline borders |
| `--color-border-subtle` | `--line2` | `rgba(12,18,40,.05)` | `rgba(255,255,255,.05)` | Subtle dividers |
| `--color-glass-surface` | `--glass` | `rgba(255,255,255,.55)` | `rgba(28,33,48,.55)` | Glass panel fill |
| `--color-glass-border` | `--glassBrd` | `rgba(255,255,255,.78)` | `rgba(255,255,255,.10)` | Glass panel border |
| `--color-surface` | `--elev` | `rgba(255,255,255,.86)` | `rgba(40,46,64,.72)` | Elevated card fill (modal/card-on-glass) |
| `--color-surface-border` | `--elevBrd` | `rgba(255,255,255,.90)` | `rgba(255,255,255,.10)` | Elevated card border |
| `--color-chip` | `--chip` | `rgba(255,255,255,.60)` | `rgba(255,255,255,.06)` | Chip / pill background |
| `--color-bg` | `--bg` | Layered radial gradients over `linear-gradient(180deg,#f6f8fd,#eceff6)` | Dark equivalents over `#0b0e16`→`#090b11` | Page background |
| `--color-success` | `--good` | `#2fb673` | `#3ad18b` | Success / positive |
| `--color-warning` | `--warn` | `#f5a524` | `#ffbe4d` | Warning |
| `--color-danger` | `--bad` | `#f2545b` | `#ff6b72` | Error / destructive |

### 3.2 Surface elevation model

The UX designs use four elevation tiers (PeopleHR README §Design tokens / §Design System slide):

```
Background  →  Glass  →  Elevated  →  Modal
  --color-bg    --color-glass-surface   --color-surface    --color-surface (+ overlay scrim)
```

Every component declares which tier it occupies via the `surface` prop on `Card`: `"bg" | "glass" | "elevated" | "modal"`.

### 3.3 Typography

System font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Helvetica Neue", Inter, sans-serif` (use Inter as the web-safe fallback — SF Pro is Apple-licensed and must not be self-hosted).

| Role | Size | Weight | Color |
|---|---|---|---|
| Display | 56px | 740 | `--color-text` |
| Page title | 34–46px | 680–720 | `--color-text` |
| Section heading | 22px | 620 | `--color-text` |
| Body | 16px | 400 | `--color-text-muted` (line-height 1.5) |
| Secondary / metadata | 12–13px uppercase tracked | 500 | `--color-text-subtle` |
| Financial / numeric | 34–40px | 740 | `--color-text` + `font-variant-numeric: tabular-nums` |

### 3.4 Radii, blur, and spacing

| Property | Values |
|---|---|
| Radius | 12–16px small elements; 16–20px cards; 24–28px large glass panels; 999px pills/toggles |
| Blur | `backdrop-filter: blur(20–30px) saturate(1.4–1.5)` on every glass surface — this is the signature effect; without it surfaces read flat |
| Page padding | 56–72px |
| Panel/grid gaps | 22–48px between major panels; 8–16px inside components |

### 3.5 Shadows

| Token | Light | Dark |
|---|---|---|
| `--shadow-glass-md` (`--sh`) | `0 30px 70px rgba(24,34,64,.16)` | stronger dark equivalent |
| `--shadow-glass-sm` (`--shSm`) | `0 12px 30px rgba(24,34,64,.10)` | stronger dark equivalent |

---

## 4. Component library

Four layers. Lower layers know nothing about HR domain concepts; only `features/` screens do.

### 4.1 Foundation primitives (`components/ui/`)

| Component | Notes |
|---|---|
| `Button` | Variants: `primary / secondary / ghost / destructive / link`; sizes `sm/md/lg`; loading state (spinner, width doesn't jump) |
| `IconButton` | Same variant system as `Button`, square |
| `Input`, `Textarea`, `Select`, `Combobox`, `DatePicker`, `Checkbox`, `Switch`, `RadioGroup` | Token-styled Radix wrappers |
| `Card` | Single shell every surface variant builds on — `surface: "glass" \| "elevated" \| "modal"` picks the tier; radius/shadow/border from tokens |
| `Badge` | Status pills — tone-driven (`success/warning/danger/neutral`), not per-screen colors |
| `Avatar`, `AvatarGroup` | Stacked-avatar meeting/team lists |
| `Dialog`, `Drawer/Sheet`, `Popover`, `DropdownMenu`, `Tabs`, `Tooltip` | Radix-backed overlays |
| `Toast` | Global notification queue (success/error/info) |
| `Skeleton` | Loading placeholder for every async card/table |
| `Chip` / `TagPill` | Chip/pill using `--color-chip` background — faceted filters, skill tags, status badges |
| `ProgressBar` | Horizontal bar — leave balances, pay composition segments, skills |
| `Sparkline` | Inline mini-chart (single data series) for KPI stat cards — Recharts `AreaChart` wrapper, no axes |

### 4.2 Composite patterns (`components/patterns/`)

| Component | Notes |
|---|---|
| `FormField` | Label + input + help + error. The building block for every editable form |
| `ViewField` | Label + rendered value, same grid/spacing as `FormField` |
| `Form` | react-hook-form + zod wrapper |
| `ViewOnlyForm` | Schema-driven layout with `ViewField`s |
| `DataTable` | TanStack-Table: sorting, pagination, row actions, empty/loading states |
| `StatCard` | KPI tile: icon, label, value, optional delta. Used on Dashboard + HR Admin |
| `SparklineStatCard` | `StatCard` + inline `Sparkline` — used on HR Admin executive dashboard (slide 19) |
| `ChartCard` | `Card` + Recharts chart + period selector |
| `ListView` / `ViewModeToggle` | List/grid/minigrid switcher for item collections |
| `OrgChart` | Immediate org context: manager above, self highlighted, peers beside, direct reports below |
| `InteractiveOrgChart` | Full drag-pan / pinch-zoom org chart (slide 8) — `d3-zoom` or `react-zoom-pan-pinch`; click node to expand/focus; live presence indicators on nodes |
| `AvailabilityTimeline` | Horizontal timeline of team members' live status/availability (slide 7 · Team) |
| `PayCompositionBar` | Animated segmented bar showing gross → deductions → net (slide 6 · Payslip); segments animate in on mount |
| `CareerJourneyCard` | Career path visualization — current role, progression steps, milestone markers (slide 13 · Careers) |
| `SkillsGapChart` | Current skills vs. role requirements bar chart (slide 13 · Careers) |
| `JobMatchCard` | Job listing card with AI match score ring (slide 14 · Jobs) |
| `MatchScoreRing` | Circular progress ring showing AI match % — SVG-based, animated on mount |
| `ApplicationStageTimeline` | Horizontal stage-by-stage application progress (slide 16 · Applications) |
| `KanbanBoard` / `KanbanCard` | Recruitment pipeline (Stage 9) |
| `WorkflowStatusTimeline` | Temporal workflow step state: pending/active/done/failed (Stage 6) |
| `AIInsightPanel` | Accent-tinted glass panel (`--color-primary-weak` background) showing AI commentary, trend predictions, or summaries — appears as a persistent rail or embedded block on most screens |
| `AttendanceCalendar` | Month-grid with per-day attendance status indicators (slide 3 · Time) |
| `TimesheetGrid` | Editable weekly timesheet grid — date columns, entry rows, total row (slide 3 · Time) |
| `TeamCalendar` | Double-sized calendar for manager's team leave view — per-day multi-member dots, click-to-open leave detail modal |
| `ProgressStat` | Horizontal stat: label, value, percentage bar ("Working Format" bars in dashboard) |
| `HighlightCard` | Elevated card variant for spotlighted content (approvals needing attention, upcoming meetings) |
| `EmptyState`, `ErrorState` | Consistent "nothing here yet" / "something broke" treatment |
| `ConfirmDialog` | Built on `Dialog`; the one path for destructive / high-impact confirmations (blueprint §34) |
| `FacetedSearch` | Search input + filter chip row — department, role, location, skill facets (slide 9 · Directory) |
| `ActionableNotification` | Notification item with inline approve/dismiss/view actions — no navigation required (slide 18 · Notifications) |

### 4.3 Layout & navigation (`components/layout/`)

| Component | Notes |
|---|---|
| `AppShell` | Sidebar + TopBar + content slot — frame every authenticated screen renders inside |
| `Sidebar` / `NavItem` / `NavSection` | Role-aware nav: shows Employee / Manager / HR Admin sections based on permissions; collapsible to icon-only rail; section headers match UX slide 3 IA model |
| `TopBar` | Page title + breadcrumb + user menu + notification bell (links to slide 18 notification center) + AI panel trigger |
| `PageHeader` | Title + optional actions row used on every screen |
| `AIDrawerTrigger` | Floating action button / TopBar icon that opens the global AI panel overlay — visible on every screen |

### 4.4 Agent / chat (`components/chat/`)

| Component | Notes |
|---|---|
| `ChatPanel` | AI chat container; as a right-side `Drawer` (global, any screen) or full-page (slide 12 · AI Assistant) — same component, different host |
| `ChatMessageList` | Virtualized message scroll (`@tanstack/react-virtual`) |
| `ChatMessage` | Role, avatar, timestamp, renders via `ResponseRenderer` |
| `ChatComposer` | Input, send/stop, attachment button |
| `ChatTypingIndicator` | Streaming / thinking state |
| `ResponseRenderer` | Block registry: `TextBlock`, `CitationBlock`, `ToolCallBlock`, `DataTableBlock`, `ChartBlock`, `ApprovalRequestCard`, `ActionConfirmationCard`, `RefusalBlock` |

---

## 5. Epics

Eight epics organized by user-facing scope, not stage number. Each epic has a clear objective, user/business outcome, and hard boundaries. Backend stages are noted where applicable — they indicate when backend work must be complete before the screen can go live, but UI work can run ahead using mocked data.

---

### Epic A — Design Foundation & Shell

**Scope:** Design token system, AppShell, role-aware sidebar, auth (login/SSO), global AI drawer affordance, theme toggle, responsive grid baseline.

**Objective:** Establish the visual and structural foundation every other screen builds on. A new screen added after this epic renders correctly inside the shell, uses the token system automatically, and costs nothing to make responsive.

**User / business outcome:** Users see a cohesive, polished shell the moment they log in; the three role lenses (Employee / Manager / HR Admin) surface the right nav automatically. Light/dark theme persists across sessions.

**Boundaries:** No domain data; no business logic; no AI content. Purely the skeleton and token system.

**UX slides:** 2 (Design System), 3 (IA & Navigation), 4 (01 · Login), 27 (24 · Responsive & States)

**Stories:**
- ✅ F1 — Tokens, AppShell, Sidebar, TopBar, Login, Dashboard shell (mock), Employees Directory + Detail (built, pending visual QA against UX designs)
- 🆕 #UI-A1 — Align design tokens to PeopleHR token spec (add missing tokens: `--color-glass-surface`, `--color-primary-weak`, `--color-chip`, `--color-bg` layered gradients, typography scale, blur values — map existing token names to PeopleHR equivalents)
- 🆕 #UI-A2 — Login screen redesign: single glass card centred over ambient gradient backdrop, SSO-first entry (slide 01)
- 🆕 #UI-A3 — Role-aware sidebar: three nav lenses (Everyone / Manager / HR Admin) matching slide 3 IA model; notification bell in TopBar linking to notification center; AI drawer trigger visible at all times
- 🆕 #UI-A4 — Responsive baseline: verify AppShell collapses to icon-rail on tablet, full-stack mobile layout on phone — per slide 24 breakpoint spec

---

### Epic B — Employee Self-Service

**Scope:** Employee Home, Time tracking, Leave (balances + apply + history), Payroll (salary hero + breakdown), Payslip detail, and the self-service parts of My Profile.

**Objective:** An employee can manage their entire day-to-day HR life — check in, request leave, read their payslip, and update their profile — without visiting HR.

**User / business outcome:** Employees self-serve for routine requests; HR admin workload drops for leave requests and payslip queries. Time-to-action on employee tasks is measured in seconds, not days.

**Boundaries:** Employee-role only (or role-neutral where all users see the same thing); read-only for payroll/payslip; create/edit only for self-service actions (leave request, profile update, timesheet). No manager approval flows (Epic F).

**UX slides:** 5 (02 · Employee Home), 6 (03 · Time), 7 (04 · Leave), 8 (05 · Payroll), 9 (06 · Payslip), 13 (10 · Profile)

**Depends on backend:** Stage 2 (employee reads), Stage 3 (knowledge/policy context in AI rail), Stage 4 (leave write + approval), Stage 5 (payslip data)

**Stories:**
- 🆕 #UI-B1 — Employee Home (slide 02): AI-personalized hero greeting, Today block (schedule/next action), Leave balance tiles, Payroll summary tile, Tasks tile, Career highlight tile, persistent `AIInsightPanel` rail — mocked data initially, live once backend stages land
- 🆕 #UI-B2 — Time tracking screen (slide 03): live attendance status indicator, editable `TimesheetGrid` (weekly view), `AttendanceCalendar` (month status view), AI trend commentary in `AIInsightPanel`
- 🆕 #UI-B3 — Leave screen (slide 04): leave balance cards per type, coverage-aware apply form (shows who's already off during the requested period), leave history `DataTable`, AI approval-risk prediction badge on the apply form
- 🆕 #UI-B4 — Payroll screen (slide 05): salary hero card (current gross, next pay date), pay breakdown table, payslip history list with download links, conversational payroll assistant (opens `ChatPanel` in payroll context)
- 🆕 #UI-B5 — Payslip detail (slide 06): full payslip document view, animated `PayCompositionBar` (gross → deductions → net segments animate on mount), AI "explain these numbers" block
- 🆕 #UI-B6 — My Profile (slide 10): identity hero (name, role, dept, avatar), About & skills section (skill chips, edit inline), employment history timeline, performance summary, AI-generated profile summary card (read-only); profile edit modal via `Form`

---

### Epic C — AI Assistant Layer

**Scope:** Persistent global AI drawer (accessible from every screen), full-screen AI Assistant page, `AIInsightPanel` component reused across all screens, response block registry, streaming, tool-call transparency.

**Objective:** AI is a first-class, cross-cutting capability. Every screen has an AI surface; the full-screen assistant handles deep, multi-turn conversations.

**User / business outcome:** Any user — employee, manager, or HR admin — can ask HR questions in natural language from any screen and receive grounded, explainable answers. Managers get proactive AI insights on their team screens. HR admins get an AI org-health summary on the admin dashboard.

**Boundaries:** This epic owns the AI rendering and interaction patterns — it does not own the business data. Business data comes from domain modules (Stage 2–10). The AI drawer is a global overlay, not a page route; routing to `/assistant` is the full-screen form, but the same `ChatPanel` component hosts both.

**UX slides:** 15 (12 · AI Assistant), plus AI insight surfaces on slides 5, 6, 7, 8, 9, 10, 11, 13, 14, 22 (appears on almost every screen)

**Depends on backend:** Stage 2 (Employee Agent, live endpoint), Stage 3 (RAG + citations), Stage 4+ (action tools, approval cards)

**Stories:**
- ✅ #65 — Chat surface foundation (`ChatPanel`, `ChatMessageList`, `ChatComposer`) — built
- ✅ #66 — `ResponseRenderer` + block registry (`TextBlock`, `ToolCallBlock`, `RefusalBlock`) — built
- ✅ #67 — Chat drawer wired to live `POST /api/v1/agent/employee/chat` — built
- 📋 #68 — E2E validation (manual browser pass with real API key) — in progress
- 📋 #73 — `CitationBlock` for RAG policy citations — not started
- 🆕 #UI-C1 — Full-screen AI Assistant page (slide 12, route `/assistant`): same `ChatPanel` full-page, conversation history in sidebar, rich response cards per `ResponseRenderer`, action confirmation flow (ApprovalRequestCard inline) — this is the `/assistant` route, Epic J in old plan
- 🆕 #UI-C2 — `AIInsightPanel` component: accent-tinted glass panel (`--color-primary-weak`), AI-generated text + optional action chip, used as a persistent rail/block on Employee Home, Time, Leave, Payroll, Team, Org, Profile, Analytics, HR Admin; wires to a thin `GET /api/v1/agent/insights?context=<screen>` endpoint (or rendered as part of the chat conversation history for that screen)
- 🆕 #UI-C3 — `ApprovalRequestCard` response block: inline Approve/Reject buttons in chat, optimistic UI, connects to leave/expense approval endpoint; ties to Stage 4 HITL requirement (blueprint §34)
- 🆕 #UI-C4 — `DataTableBlock` + `ChartBlock` response blocks: structured tool results rendered as a `DataTable` or `ChartCard` inline in chat — used by analytics agent (Stage 8)

---

### Epic D — Team, Org & People

**Scope:** Team view (manager), Interactive org chart, People directory, Employee profile (view-only for non-self), Knowledge / Ask HR.

**Objective:** Everyone can understand the org structure and find colleagues; managers have live team intelligence.

**User / business outcome:** Managers spend less time manually tracking team availability and workload; employees find colleagues and company knowledge in seconds. The org structure is always up to date and browsable.

**Boundaries:** Includes manager-specific views (team pulse, availability timeline) but not approval workflows (those are Epic F). Knowledge/Ask HR is the entry point for policy questions; the RAG backend is Stage 3.

**UX slides:** 10 (07 · Team), 11 (08 · Organization), 12 (09 · Directory), 13 (10 · Profile), 14 (11 · Knowledge)

**Depends on backend:** Stage 2 (employee reads, org tools), Stage 3 (RAG for Knowledge)

**Stories:**
- 🟡 My Team (built as `apps/web/features/team/my-team-screen.tsx`) — needs visual QA against slide 07 and `AIInsightPanel` integration
- 📋 #74 — Policy Library / Ask HR page (slide 11, route `/knowledge`) — not started; update story body with slide 11 UX spec: ask-anything search bar over a category grid, cited AI answers using `CitationBlock`, document browser sidebar
- 📋 #75 — Policy document management screen (HR admin upload/version tracking) — not started
- 🆕 #UI-D1 — Team screen update (slide 07): team pulse KPI row, live `AvailabilityTimeline` (horizontal, per-member status), team member list with view-mode toggle, `AIInsightPanel` showing workload commentary; manager-only actions gate on `leave.approve` permission
- 🆕 #UI-D2 — Interactive org chart (slide 08, route `/org`): `InteractiveOrgChart` component — drag-to-pan, pinch/scroll-to-zoom, click-to-expand node, live presence indicators, search/filter bar, `AIInsightPanel` workforce insights
- 🆕 #UI-D3 — People directory (slide 09, route `/directory`): `FacetedSearch` with department/role/location/skill chips, skill-rich employee cards (`Avatar`, name, role, dept, skill `Chip`s), list/grid view toggle, quick-profile popover on hover

---

### Epic E — Career & Growth

**Scope:** Careers screen (career journey + skills gap), Jobs board, Job Detail, Applications tracking, Interviews.

**Objective:** Employees can see their career trajectory, find internal opportunities, and track applications — all within the platform.

**User / business outcome:** Internal mobility increases; employees feel the platform invests in their growth. Time-to-fill internal roles decreases when match scores surface the right candidates.

**Boundaries:** Employee/manager-facing only. The recruiter-facing pipeline management (ATS, bulk candidate actions) belongs in Epic G. Match scores are AI-generated by the Recruitment Agent (Stage 9).

**UX slides:** 16 (13 · Careers), 17 (14 · Jobs), 18 (15 · Job Details), 19 (16 · Applications), 20 (17 · Interviews)

**Depends on backend:** Stage 9 (Recruitment Agent, match scoring)

**Stories:**
- 🆕 #UI-E1 — Careers screen (slide 13, route `/careers`): `CareerJourneyCard` (current role → progression path milestones), `SkillsGapChart` (current skills vs. target-role requirements), AI career coach `AIInsightPanel` with suggested next steps
- 🆕 #UI-E2 — Jobs board (slide 14, route `/jobs`): internal job listings grid, `JobMatchCard` per role (title, dept, location, `MatchScoreRing`), faceted filters (dept, location, type), AI "best match" highlighted section at top
- 🆕 #UI-E3 — Job detail (slide 15, route `/jobs/[id]`): full role description, `MatchScoreRing` prominent, skills match breakdown, AI-suggested actions ("Apply", "Talk to your manager"), apply drawer
- 🆕 #UI-E4 — Applications (slide 16, route `/applications`): list of the user's own applications, `ApplicationStageTimeline` per item (Applied → Screening → Interview → Offer), status `Badge`, withdraw action
- 🆕 #UI-E5 — Interviews (slide 17, route `/interviews`): upcoming interview list with date/time/panel info, interview detail modal (job, format, panel members, agenda), AI interview prep `AIInsightPanel` (suggested questions, role context, tips)

---

### Epic F — Approvals & Workflows

**Scope:** Approvals center (universal queue), leave approval flows (within My Team), expense submit/approve, onboarding workflow tracker.

**Objective:** High-impact HR actions require explicit human approval and leave an auditable trail. The platform makes the approval workflow faster, not just more visible.

**User / business outcome:** Managers approve or reject requests in one tap without leaving the platform. Employees know their request status in real time. New hires have a guided, trackable onboarding experience.

**Boundaries:** No unilateral AI decisions — every approval requires explicit human confirmation via `ConfirmDialog` or `ApprovalRequestCard` (blueprint §34). Expense capture (OCR, extraction) is Stage 5. Onboarding workflow state comes from Temporal (Stage 6).

**UX slides:** Approval patterns visible in slide 07 (Team), slide 04 (Leave apply), and in the AI Assistant response cards (slide 12)

**Depends on backend:** Stage 4 (Leave Agent + approval), Stage 5 (Expense Agent), Stage 6 (Temporal onboarding)

**Stories:**
- 🆕 #UI-F1 — Approvals center (route `/approvals`): universal queue of pending approvals across leave/expense/other; each row is an `ApprovalRequestCard` (matches the in-chat version exactly so approving from inbox and from copilot look identical); bulk-approve action; manager-only, gates on `leave.approve` / `expense.approve`
- 🆕 #UI-F2 — Expense submit screen (route `/expenses/submit`): `Form` with file upload (receipt image), OCR-extracted-field confirmation step (user reviews extracted amount/vendor/date before submit), expense history `DataTable` with status `Badge`s
- 🆕 #UI-F3 — Onboarding tracker (route `/onboarding`): `WorkflowStatusTimeline` of a running Temporal workflow (HR step, IT step, orientation, training, manager check-in — pending/active/done/failed per step); new-hire-facing checklist alongside

---

### Epic G — HR Admin & Analytics

**Scope:** HR Admin executive dashboard, Employees management table (full lifecycle), Analytics (6 domains), Permissions / role management, Audit log viewer.

**Objective:** HR admins have complete operational visibility and control — they can monitor org health, manage the employee lifecycle, configure access, and query analytics, all without leaving the platform.

**User / business outcome:** HR admin time spent on manual reporting drops. Lifecycle actions (onboard/offboard/transfer) are traceable. Permissions are auditable. Analytics surfaces insights that previously required a data analyst.

**Boundaries:** HR Admin role only (gates on `employee.write`, `rbac.manage`, `audit.read`). Analytics is read-only; text-to-SQL AI queries belong to Epic C's AI layer (Stage 8). This epic owns the UI screens, not the backend query engine.

**UX slides:** 22 (19 · HR Admin), 23 (20 · Employees), 24 (21 · Analytics), 25 (22 · Settings), 26 (23 · Permissions)

**Depends on backend:** Stage 1 (employee CRUD, RBAC), Stage 7 (event-driven notifications), Stage 8 (analytics data)

**Stories:**
- 🟡 Employees Directory (built, pending visual QA against slide 20 UX)
- 🟡 Employee Detail (built, pending visual QA against slide 10 profile spec)
- 🟡 Roles & Permissions screen (basic, needs update to slide 23 UX: access matrix table, approval hierarchy config, audit log tab within the screen)
- 🟡 Audit Log Viewer (built, pending visual QA)
- 🆕 #UI-G1 — HR Admin executive dashboard (slide 19, route `/admin`): `SparklineStatCard` row (headcount, attrition rate, open roles, pending approvals — each with inline sparkline trend), NL AI org-health summary in a large `AIInsightPanel`, quick-action shortcuts (add employee, view pending approvals)
- 🆕 #UI-G2 — Employees management table update (slide 20): lifecycle action menu per row (Onboard / Transfer / Offboard / Deactivate), column set matches UX design exactly (name, dept, role, hire date, status, actions), bulk-select with bulk lifecycle action
- 🆕 #UI-G3 — Analytics dashboard (slide 21, route `/analytics`): six domain panels (Headcount, Attrition, Compensation, Leave, Performance, Recruitment) each as a `ChartCard`, AI-generated trend explanation below each chart, domain tabs + time-range selector, "Ask Analytics" entry point that opens the `ChatPanel` in analytics context
- 🆕 #UI-G4 — Permissions screen update (slide 23): access matrix (role × permission grid), approval hierarchy config (who must approve what), integrated audit log tab (reuses `DataTable` from Audit Log Viewer)

---

### Epic H — Platform Hardening

**Scope:** Notifications center, Settings (appearance + AI behavior + security + accessibility), full responsive/accessibility pass for all screens, loading/empty/error state coverage.

**Objective:** The platform is production-ready: accessible on any device, configurable by the user, and robust against network failures.

**User / business outcome:** Users on mobile get the same experience as desktop. Screen reader users can navigate the full platform. AI behavior is configurable so power users can tune verbosity. Notifications are actionable inline so users never miss a required action.

**Boundaries:** No new features — quality and completeness of existing screens. Settings is the one screen where new domain logic (AI behavior preferences, notification preferences) lands.

**UX slides:** 21 (18 · Notifications), 25 (22 · Settings), 27 (24 · Responsive & States)

**Stories:**
- 🆕 #UI-H1 — Notifications center (slide 18, route `/notifications`): categorized tabs (Action required / Updates / Mentions), `ActionableNotification` per item (approve/dismiss/view inline, no page navigation for simple actions), mark-all-read, filter by category
- 🆕 #UI-H2 — Settings screen (slide 22, route `/settings`): Appearance tab (theme toggle, density), AI behavior tab (response verbosity, preferred AI model, data-sharing consent), Security tab (sessions, MFA), Accessibility tab (reduced motion, font size); all settings persist via user-preferences API or localStorage
- 🆕 #UI-H3 — Responsive pass: for every screen in Epics B–G, verify the phone-bezel mobile layout matches slide 24's breakpoint spec — navigation collapses to bottom tab bar on mobile, glass panels stack vertically, `DataTable` collapses to card-list view
- 🆕 #UI-H4 — Accessibility pass: keyboard navigation verified for all interactive elements, ARIA labels on all icon-only buttons, focus-visible states, skip-to-content link in `AppShell`, screen-reader-friendly `DataTable` headers

---

## 6. Screen inventory

Full mapping of the 24 UX screens to routes, epics, and implementation status.

| Slide | Screen | Route | Epic | Status |
|---|---|---|---|---|
| 01 | Login / SSO | `/login` | A | 🟡 built, needs UX visual pass |
| 02 | Employee Home | `/dashboard` | B | 🔴 needs rewrite to UX spec |
| 03 | Time | `/time` | B | 🔴 new screen |
| 04 | Leave | `/leave` | B | 🔴 new screen |
| 05 | Payroll | `/payroll` | B | 🔴 new screen |
| 06 | Payslip detail | `/payroll/payslips/[id]` | B | 🔴 new screen |
| 07 | Team | `/my-team` | D | 🟡 built, needs `AvailabilityTimeline` + AI rail |
| 08 | Organization | `/org` | D | 🔴 new screen |
| 09 | Directory | `/directory` | D | 🟡 basic built, needs faceted search + skill cards |
| 10 | Profile | `/employees/[id]` | B/D | 🟡 built, needs skills/performance/AI summary sections |
| 11 | Knowledge | `/knowledge` | D | 🔴 new screen (#74) |
| 12 | AI Assistant | `/assistant` | C | 🔴 new full-page form of ChatPanel |
| 13 | Careers | `/careers` | E | 🔴 new screen |
| 14 | Jobs | `/jobs` | E | 🔴 new screen |
| 15 | Job Details | `/jobs/[id]` | E | 🔴 new screen |
| 16 | Applications | `/applications` | E | 🔴 new screen |
| 17 | Interviews | `/interviews` | E | 🔴 new screen |
| 18 | Notifications | `/notifications` | H | 🔴 new screen |
| 19 | HR Admin | `/admin` | G | 🔴 new dashboard (current `/dashboard` is generic) |
| 20 | Employees (HR admin) | `/employees` | G | 🟡 built, needs lifecycle actions + UX visual pass |
| 21 | Analytics | `/analytics` | G | 🔴 new screen |
| 22 | Settings | `/settings` | H | 🔴 new screen |
| 23 | Permissions | `/roles` | G | 🟡 basic built, needs access matrix + approval hierarchy |
| 24 | Responsive & States | — (cross-cutting) | H | 🔴 not started |

🟡 = built in earlier session, needs visual QA and/or feature additions to match UX designs  
🔴 = not started or needs full rewrite

---

## 7. Build order

Build by epic, in dependency order. UI work can run ahead of the backend using mocked data — the mocked API layer (`lib/api/`) is typed against the same schemas the backend exposes.

| Priority | Epic | Backend dependency | Key deliverables |
|---|---|---|---|
| 1 | A — Design Foundation | Stage 1 ✅ | Token alignment, login redesign, role-aware nav, responsive baseline |
| 2 | C — AI Assistant Layer | Stage 2 ✅ | AIInsightPanel, full-screen AI Assistant, ApprovalRequestCard block |
| 3 | B — Employee Self-Service | Stages 2–5 | Employee Home, Time, Leave, Payroll, Payslip, Profile |
| 4 | D — Team, Org & People | Stages 2–3 | Team update, Org chart, Directory, Knowledge page |
| 5 | G — HR Admin & Analytics | Stages 1, 7–8 | HR Admin dashboard, Employees update, Analytics, Permissions |
| 6 | F — Approvals & Workflows | Stages 4–6 | Approvals center, Expense submit, Onboarding tracker |
| 7 | E — Career & Growth | Stage 9 | Careers, Jobs, Applications, Interviews |
| 8 | H — Platform Hardening | All stages complete | Notifications, Settings, Responsive pass, Accessibility pass |

---

## 8. Frontend folder structure

```text
apps/web/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── dashboard/          # 02 · Employee Home
│   │   ├── time/               # 03 · Time
│   │   ├── leave/              # 04 · Leave
│   │   ├── payroll/            # 05 · Payroll
│   │   │   └── payslips/[id]/  # 06 · Payslip detail
│   │   ├── my-team/            # 07 · Team
│   │   ├── org/                # 08 · Organization
│   │   ├── directory/          # 09 · Directory
│   │   ├── employees/[id]/     # 10 · Profile
│   │   ├── knowledge/          # 11 · Knowledge
│   │   ├── assistant/          # 12 · AI Assistant (full page)
│   │   ├── careers/            # 13 · Careers
│   │   ├── jobs/               # 14 · Jobs
│   │   │   └── [id]/           # 15 · Job Details
│   │   ├── applications/       # 16 · Applications
│   │   ├── interviews/         # 17 · Interviews
│   │   ├── notifications/      # 18 · Notifications
│   │   ├── admin/              # 19 · HR Admin dashboard
│   │   ├── employees/          # 20 · Employees (HR admin table)
│   │   ├── analytics/          # 21 · Analytics
│   │   ├── settings/           # 22 · Settings
│   │   ├── roles/              # 23 · Permissions
│   │   └── approvals/          # Approvals center (Epic F)
├── components/
│   ├── ui/                     # §4.1 foundation primitives
│   ├── patterns/               # §4.2 composite (domain-agnostic)
│   ├── layout/                 # §4.3 AppShell, Sidebar, TopBar
│   └── chat/                   # §4.4 ChatPanel + ResponseRenderer
├── features/                   # screen-specific composition + logic
│   ├── dashboard/ time/ leave/ payroll/ team/ org/ directory/
│   ├── careers/ jobs/ applications/ interviews/
│   ├── knowledge/ assistant/ notifications/ settings/
│   ├── admin/ employees/ analytics/ roles/ approvals/
│   └── chat/
├── lib/
│   ├── theme/                  # tokens.css, ThemeProvider, useTheme
│   ├── api/                    # typed client (generated from NestJS/Swagger OpenAPI)
│   └── forms/                  # shared zod schemas
```

---

## 9. Definition of done — component or screen

- Visual match to the corresponding `PeopleHR.html` slide (open side-by-side in browser to verify).
- Reads only design tokens; no hardcoded color/radius/shadow/blur value.
- `backdrop-filter: blur(20–30px) saturate(1.4–1.5)` present on every glass surface.
- Works at desktop width (1280px+) and mobile width (390px) without layout breaking — this is checked, not assumed.
- Rendered and eyeballed in both light and dark mode.
- Keyboard-navigable with a visible focus state (mostly free from Radix, but verify).
- Loading, empty, and error states exist for anything that fetches data.
- `AIInsightPanel` wired (or mocked with realistic content) on every screen that the UX designs show an AI surface.
- `phase-gate --ui-epic <A|B|C|D|E|F|G|H>` passes before the epic is marked complete.

---

## 10. Repo skills for this plan

- **new-ui-component** — scaffolds `components/ui/`, `patterns/`, or `layout/` pieces with token-only styling
- **new-screen** — scaffolds a screen from the inventory above: composes existing components, wires loading/empty/error states, uses `ConfirmDialog`/`ApprovalRequestCard` for high-impact actions
- **new-response-block** — adds a new `ResponseRenderer` block type
- **modern-glass-ux** — ensures every new card/overlay uses the correct glass tier and backdrop blur
- **phase-gate** — checks DoD requirements for a UI epic (use `--ui-epic <letter>`) or a backend stage (use `--stage <number>`)
