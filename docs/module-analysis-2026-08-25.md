# Module Analysis Report — Employee, Leave, Expense, Payroll, Recruitment, Notification

**Date:** 2026-08-25
**Scope:** `apps/api` (NestJS + Mongoose) and `apps/web` (Next.js) — the active backend/frontend
stack per `CLAUDE.md`. `apps/deprecated/api/` (frozen FastAPI snapshot) is out of scope.
**Provenance:** All six modules landed as part of Stage 2's frontend-integration epics
(`plan.md`: INT-2 Employees, INT-6 Leave, INT-8 Payroll, INT-9 Expenses, INT-10 Notifications,
INT-12 Recruitment) plus a subsequent "Stage 2 Close-Gaps" pass that added cross-module
notification wiring, extended seed data, and e2e tests.

---

## Summary table

| Module | Backend | Frontend wiring | Unit tests | E2E tests | Emits notifications | Notable status |
|---|---|---|---|---|---|---|
| Employee | Full CRUD + self-access rules | Live | None | 177-line spec, well covered | No | Solid |
| Leave | Full CRUD + approval workflow | **Split**: `/time-off` live, `/leave` mostly mock | None | 171-line spec | Yes (approve/reject) | Frontend gap |
| Expense | Full CRUD + approval workflow | Live (OCR intentionally simulated) | None | 132-line spec, gaps in coverage | Yes (submit/approve/reject) | Minor coverage gaps |
| Payroll | Read-heavy + admin write | Live | None | 136-line spec, **write paths untested** | **No** | Config-write bug |
| Recruitment | Thin CRUD, partial workflow | Live | None | present, one stale assertion | **No** | Workflow incomplete |
| Notification | Read + fire-and-forget `emit()` | Live (inbox + bell, polling only) | None | present | N/A (is the emitter) | No push/SSE yet |

Zero `*.spec.ts` unit tests exist across all six modules — every module relies entirely on the
e2e layer (`apps/api/test/*.e2e-spec.ts`) for automated coverage.

---

## 1. Employee module

**Backend:** `apps/api/src/modules/employee/` — `employee.controller.ts` (thin),
`employee.service.ts` (all authz/business logic), `employee.repository.ts`,
`schemas/employee.schema.ts`, `dto/employee-{create,update,response}.dto.ts`.

**Schema** (`employees` collection): `tenantId`, `departmentId`, `managerId` (self-ref for
reporting hierarchy), `roleId`, `email` (unique per `{tenantId,email}`), `hashedPassword`,
`fullName`, `jobTitle`, `status` (`active|on_leave|terminated`), `hireDate`, `location`. This
schema doubles as the login identity — there is no separate User/Account collection.

**Endpoints** (all behind `JwtAuthGuard`):

| Method | Route | Gate |
|---|---|---|
| GET | `/employees` | paginated list + search |
| GET | `/employees/:id` | self or `EMPLOYEE_READ` |
| POST | `/employees` | `EMPLOYEE_WRITE` |
| PATCH | `/employees/:id` | self or `EMPLOYEE_WRITE`, privileged-field carve-out |
| DELETE | `/employees/:id` | `EMPLOYEE_DELETE` |

**Business rules:**
- Self-access bypass — an employee can always read/update their own record.
- `PRIVILEGED_UPDATE_FIELDS = {roleId, status, departmentId, managerId}` — a self-updating
  non-privileged user is blocked (403) from touching these, preventing self role-escalation.
- PATCH uses `Object.keys(dto)` (exclude-unset) semantics, not just non-`undefined`-filtering.
- Per-tenant email uniqueness enforced (409); create/update/delete run inside a Mongo transaction
  alongside an `AuditLogService.log()` call so the write and its audit record commit atomically.
- `authenticate()` returns a uniform "Invalid email or password" for unknown-email vs.
  wrong-password (anti-enumeration), and rejects `TERMINATED` status.
- `getManager()` treats a stale/deleted `managerId` as "no manager" rather than a 404 (deliberate).

**Authorization:** `EMPLOYEE_READ`, `EMPLOYEE_WRITE`, `EMPLOYEE_DELETE`.

**Notifications:** none emitted.

**Tests:** `apps/api/test/employees.e2e-spec.ts` (177 lines) — HR-admin create, non-privileged
create rejected, duplicate-email 409, self-read, cross-read 403, list gating, self-update of
non-privileged field, self role-escalation 403, HR-admin vs. manager delete, 404 on unknown id.
No unit specs.

**Frontend:** `app/(dashboard)/employees/` → `features/employees/employees-screen.tsx` (list) and
`employee-detail-screen.tsx` (detail). `lib/api/employees.ts` calls the real
`/api/v1/employees` endpoints — fully live. List screen has search, department filter, status
badges, bulk-select action bar, `AIInsightPanel`, create dialog, and a permission-gated
per-row lifecycle action menu.

**Findings:**
- `features/employees/employees-directory-screen.tsx` exists but is **dead code** — nothing
  imports `EmployeesDirectoryScreen`. (A separate, unrelated `/directory` route/screen is a
  different, still-used org-directory search feature.)
- Otherwise the most complete module in this set — well tested, live end to end, no stubs found.

---

## 2. Leave module

**Backend:** `apps/api/src/modules/leave/` — `leave.controller.ts` (`/leave/requests`,
`/leave/balance`, `/leave/team`), `holiday.controller.ts` (`/leave/holidays`), single
`leave.service.ts` backing both, `leave-request.repository.ts`, `holiday.repository.ts`,
`schemas/leave-request.schema.ts`, `schemas/holiday.schema.ts`, `leave-dates.util.ts`.

**Schemas:**
- `LeaveRequest` (`leave_requests`): `tenantId`, `employeeId`, `type`
  (`vacation|sick|personal`), `startDate`, `endDate`, `status` (`pending|approved|rejected`),
  `reason`, `approverId`, `approverComment`, `respondedAt`.
- `Holiday` (`holidays`): `tenantId`, `name`, `date`.
- **No `LeaveBalance` collection** — balance is always derived live from approved requests
  (explicit design choice per in-code comment), never persisted per-employee.

**Endpoints:**

| Method | Route | Gate |
|---|---|---|
| GET | `/leave/requests?employeeId=` | self or `LEAVE_READ` |
| POST | `/leave/requests` | none (create own) |
| PATCH | `/leave/requests/:id/status` | `LEAVE_APPROVE` |
| PATCH | `/leave/requests/:id` | owner, pending-only |
| GET | `/leave/balance?employeeId=&year=` | self or `LEAVE_READ` |
| GET | `/leave/team?status=` | manager (direct reports) |
| GET/POST/DELETE | `/leave/holidays` | read open to all; write `LEAVE_MANAGE` |

**Business rules:**
- Create validates `endDate >= startDate`.
- `updateStatus` (approve/reject) requires `LEAVE_APPROVE`, stamps
  `approverId`/`approverComment`/`respondedAt`, and fires a notification to the requester.
- `editRequest`: owner-only, and only while `status === PENDING` — no editing after a decision.
- `DEFAULT_ANNUAL_LEAVE_DAYS = 20` flat allocation for every employee; balance = 20 − sum of days
  in approved requests within the requested year.
- `/leave/team` resolves the caller's direct reports and their leave, optionally filtered by a
  comma-separated `status` query param.
- Holiday create/delete require the separate `LEAVE_MANAGE` permission (distinct from
  `LEAVE_APPROVE`).

**Authorization:** `LEAVE_READ`, `LEAVE_APPROVE`, `LEAVE_MANAGE`.

**Notifications:** on approve/reject via `NotificationService.emit()` — approved → `UPDATE`
category, rejected → `ACTION` category, linking to `/time-off`.

**Tests:** `apps/api/test/leave.e2e-spec.ts` (171 lines) — self-request needs no permission,
approval gating, self-vs-others balance gating, approved-leave counting toward balance, team
visibility + status filter, holiday read-open/write-gated. No unit specs.

**Frontend — two overlapping screens:**
- **`/leave`** (`features/leave/leave-screen.tsx`, personal/self-service): balances, history, and
  the `AIInsightPanel`'s coverage/approval-risk predictions are **100% mocked** —
  `lib/api/leave-screen.ts` uses static data and `setTimeout` delays, no `apiFetch` calls at all.
  However, submitting a new request calls the real `createLeaveRequest` from `lib/api/leave.ts`
  (POST `/api/v1/leave/requests`) — the write path is live even though the read/display path
  isn't.
- **`/time-off`** (`features/time-off/time-off-screen.tsx`, team/admin-facing): **fully live** —
  `features/time-off/api.ts` wraps the real leave endpoints via TanStack Query with cache
  invalidation. Shows personal balance cards, a mini team calendar, a requests table with an
  approval flow (gated on `leave.approve`), and holiday management (gated on `leave.manage`).

**Findings:**
- **The `/leave` screen's read side is stale mock data** while a fully-live equivalent
  (`/time-off`) exists — two screens covering overlapping ground, one live, one not. This is the
  clearest frontend/backend integration gap in the whole audit.
- No endpoint to cancel/withdraw an *approved* request (only pending requests are editable).
- No configurable per-employee/per-type leave allocation — the 20-day annual figure is hardcoded,
  and there's no leave-type-specific accrual logic.

---

## 3. Expense module

**Backend:** `apps/api/src/modules/expenses/` — `expense.controller.ts`, `expense.service.ts`,
`expense.repository.ts`, `schemas/expense-report.schema.ts`,
`dto/expense-report-{create,response}.dto.ts`.

**Schema** (`expense_reports`, indexed `{tenantId, employeeId, submittedAt:-1}`): `tenantId`,
`employeeId`, `title`, `submittedAt?`, `status`
(`draft|submitted|approved|rejected|reimbursed`), `total`, `currency`, `items: ExpenseItem[]`
(`{id, category, description, amount, currency, date, status, receiptFilename?}`), `notes?`,
`approvedById?`. `ExpenseCategory`: `travel|accommodation|meals|equipment|training|other`.

**Endpoints:**

| Method | Route | Gate |
|---|---|---|
| GET | `/expenses` | own reports |
| GET | `/expenses/pending-approval` | direct reports' submitted reports |
| POST | `/expenses` | none (create own) |
| PATCH | `/expenses/:id/submit` | owner, draft-only |
| PATCH | `/expenses/:id/approve` \| `/reject` | `EXPENSE_APPROVE` |
| DELETE | `/expenses/:id` | owner, draft-only |

**Business rules:**
- `createReport`: `total` is server-computed from item amounts (client total ignored); items get
  server-assigned UUIDs and inherit the report's status.
- `submitReport`: owner-only, `DRAFT → SUBMITTED` only; notifies the employee's manager.
- `approveReport`/`rejectReport`: require `EXPENSE_APPROVE`, `SUBMITTED`-only, stamp
  `approvedById`; notify the report's employee.
- `getPendingApprovals`: resolves the manager's direct reports and their submitted reports — this
  path is **not gated by any permission code**, relying purely on "you have direct reports" as
  the filter (approve/reject itself is still permission-gated).
- `deleteReport`: owner-only, draft-only — no HR/admin override/delete path.

**Authorization:** `EXPENSE_APPROVE` (enforced). `EXPENSE_MANAGE` is defined in the enum and
included in the HR-admin default role template but **never referenced** anywhere in
`expense.service.ts`/`expense.controller.ts` — a defined-but-unused permission with no
corresponding bulk-management or org-wide-visibility endpoint.

**Notifications:** on submit (to manager, `ACTION`, "awaiting approval") and on approve/reject
(to employee, `UPDATE`/`ACTION`), linking to `/expenses`.

**Tests:** `apps/api/test/expenses.e2e-spec.ts` (132 lines) — create draft, list own-only, delete
draft, approve-rejects-non-submitted (400), approve submitted (200), 401 unauthenticated. **Not
covered:** the `submit` endpoint, the `reject` endpoint, the `pending-approval` endpoint, or the
403 case for approve/reject without `EXPENSE_APPROVE`. No unit specs.

**Frontend:** `app/(dashboard)/expenses/` → `features/expenses/expenses-screen.tsx` — fully live
via `lib/api/expenses.ts` (real `apiFetch` for list/create/submit/approve/reject/delete). The one
mock function, `simulateOcrExtraction()`, is **intentionally** simulated (explicit code comment:
"OCR integration is a stretch goal (INT-9.2)") — not a hidden gap. Shows report submission form,
receipt upload + OCR-confirm step, expense history with status badges, `AIInsightPanel`.

**Findings:**
- `reimbursed` is defined in the status enum but **no service code ever transitions a report into
  it** — a dead enum value with no reachable path.
- No receipt file-storage integration — `receiptFilename` is just a free string field.
- `EXPENSE_MANAGE` unused (see above) — worth deciding whether to wire it up or remove it.
- E2E coverage gaps on `submit`/`reject`/`pending-approval` and the 403 path.
- No standalone "Expense Approvals" screen surfaced in the UI yet (the generic `/approvals`
  Approvals Center may be intended to cover this — not confirmed in this audit).

---

## 4. Payroll module

**Backend:** `apps/api/src/modules/payroll/` — `payroll.controller.ts`, `payroll.service.ts`,
`payroll-config.repository.ts`, `payslip.repository.ts`, `schemas/payroll-config.schema.ts`,
`schemas/payslip.schema.ts`, `dto/payroll-config-upsert.dto.ts`,
`dto/payroll-summary-response.dto.ts`, `dto/payslip-{create,response}.dto.ts`.

**Schemas:**
- `PayrollConfig` (`payroll_configs`, unique on `employeeId`): `tenantId`, `employeeId`,
  `grossSalary` (annual), `currency`, `employmentType`
  (`Full-time|Part-time|Contractor`), `nextPayDate`.
- `Payslip` (`payslips`, unique compound `{tenantId, employeeId, periodStart}`): `tenantId`,
  `employeeId`, `month` (display string), `periodStart`/`periodEnd`, `grossAmount`, `netAmount`,
  `currency`, `status` (`Paid|Processing`), `breakdown: {label, amount, isDeduction?, isNet?}[]`.

**Endpoints:**

| Method | Route | Gate |
|---|---|---|
| GET | `/payroll/summary` | self |
| GET | `/payroll/payslips` | self |
| GET | `/payroll/payslips/:id` | self |
| PUT | `/payroll/config` | `PAYROLL_MANAGE` |
| POST | `/payroll/payslips` | `PAYROLL_MANAGE` |

**Business rules:**
- `getSummary`: gross from config (0 if none); net uses the **latest actual payslip's
  `netAmount`** if one exists, else falls back to `grossSalary * 0.71` as an estimate (avoids
  drift when a raise isn't retroactively reflected in old payslips, per in-code comment).
- YTD earnings = sum of `grossAmount` across payslips whose `periodStart` starts with the current
  year prefix — a string-prefix match rather than a real date-range query.
- `getPayslip(s)` are strictly self-scoped: even an HR admin only sees their own via these GET
  routes (ownership checked against the caller's own employee id, not permission-gated).

**Authorization:** `PAYROLL_MANAGE` only. No read-permission code — reads are self-only by
construction, so there is currently **no way for HR to view another employee's payslips/summary
through this API** at all (see bug below — the write side has the matching problem).

**Notifications:** **none.** `PayrollModule` does not import `NotificationModule`; neither
`upsertConfig` nor `createPayslip` emits anything (no "new payslip available" notice), unlike
leave/expenses.

**Tests:** `apps/api/test/payroll.e2e-spec.ts` (136 lines) — covers only the **read** paths
(`GET /payroll/payslips` own vs. cross-employee 404, `GET /payroll/payslips/:id`,
`GET /payroll/summary`, 401 unauthenticated). **Zero e2e coverage for either write endpoint**
(`PUT /payroll/config`, `POST /payroll/payslips`). No unit specs.

**Frontend:** `app/(dashboard)/payroll/` → `features/payroll/payroll-screen.tsx` +
`app/(dashboard)/payroll/payslips/[id]/page.tsx`. Fully live via `lib/api/payroll.ts`. Shows
summary (gross/net/YTD/breakdown), payslip list with status and download links,
`AIInsightPanel`.

**Findings — highest-priority bug in this audit:**
- **`PUT /payroll/config` cannot actually manage another employee's payroll.** The DTO
  (`PayrollConfigUpsertDto`) has no `employeeId` field, and the controller passes
  `current.employeeId` (the *caller's own* id) into `payrollService.upsertConfig(...)`. So an HR
  admin gated behind `PAYROLL_MANAGE` — the permission that exists specifically for this
  admin use case — can currently only ever set **their own** payroll config. This looks like an
  incomplete feature (missing `employeeId` in the DTO/route) rather than an intentional
  self-service design, and it has no e2e coverage that would have caught it.
- The agent tool `get_payslip` (`apps/api/src/modules/agent/tools/employee-agent.tools.ts`,
  lines 165–201) is still a **hardcoded stub** returning `status: 'unavailable'` with a
  "payroll module is a planned future feature" message — written (Stage 2 Story #3) before this
  `PayrollModule` existed, and never updated to call the real `PayrollService`/
  `PayslipRepository` once it landed. The agent chat surface will currently give a wrong answer
  ("payroll unavailable") even though the data exists.
- No payslip PDF/document generation; no approval workflow — pure CRUD once wired.

---

## 5. Recruitment module

**Backend:** `apps/api/src/modules/recruitment/` — `recruitment.module.ts`; controllers
`job.controller.ts`, `application.controller.ts`, `interview.controller.ts`; services
`job.service.ts`, `application.service.ts`, `interview.service.ts`; repositories
`job.repository.ts`, `application.repository.ts`, `interview.repository.ts`; schemas
`job.schema.ts`, `application.schema.ts`, `interview.schema.ts`; DTOs `job.dto.ts`,
`application.dto.ts`, `interview.dto.ts`.

**Schemas:**
- `Job` (`jobs`, index `{tenantId, status, postedAt:-1}`): `tenantId`, `title`, `department`,
  `location`, `type` (`Full-time|Part-time|Contract|Remote`), `experienceLevel`
  (`Entry|Mid|Senior|Lead|Director`), `description`, `sections: {heading,body}[]`, `postedAt`,
  `status` (`open|closed|draft`, default open).
- `Application` (`applications`, unique `{tenantId, jobId, employeeId}`): `tenantId`, `jobId`,
  `employeeId`, denormalized `jobTitle`/`department`, `coverNote?`, `appliedAt`, `currentStage`
  (0-based index — see findings), `status` (`active|offer|rejected|withdrawn`, default active).
- `Interview` (`interviews`): `tenantId`, `applicationId`, `candidateId`, denormalized
  `jobTitle`/`department`, `scheduledAt`, `format` (`Video|In-person|Phone`),
  `panelists: {id,name,role}[]`, `agenda: {topic,durationMin}[]`, `status`
  (`scheduled|completed|cancelled`, default scheduled).

**Endpoints:**

| Method | Route | Gate |
|---|---|---|
| GET | `/jobs` | authenticated (open jobs) |
| GET | `/jobs/:id` | authenticated |
| POST | `/jobs` | `RECRUITMENT_MANAGE` |
| GET | `/applications` | own applications |
| POST | `/jobs/:jobId/apply` | authenticated |
| PATCH | `/applications/:id/withdraw` | owner |
| GET | `/interviews` | own interviews |
| PATCH | `/interviews/:id/cancel` | owner (candidate) |

All controllers use `JwtAuthGuard` only — **`RECRUITMENT_MANAGE` gates job creation and nothing
else**; every other route (apply, withdraw, view own applications/interviews, cancel) is open to
any authenticated employee with no separate recruiter/HR-side gate, because no recruiter-side
advancement endpoints exist yet (see findings).

**Business rules:**
- `apply()` verifies the job exists/belongs to the caller's tenant; duplicate applications are
  rejected via the unique Mongo index (surfaces as a 409 from the global exception filter, not an
  explicit service check).
- `withdraw()` guards against double-withdrawal and tenant/owner mismatch (404).
- `cancel()` (interview) guards tenant/candidate ownership (404) and sets `status: CANCELLED`.

**Authorization:** `RECRUITMENT_MANAGE` only (used solely in `JobService.createJob`).

**Notifications:** **none.** `RecruitmentModule` does not import `NotificationModule`; no
service takes a `NotificationService` dependency. Applying, withdrawing, being moved through a
pipeline stage, or having an interview scheduled/cancelled produces no in-app notification —
a real gap relative to leave/expenses.

**Seed data:** `seed-demo-org.ts` seeds only `Job` records (5 postings across
Engineering/Product/Design/Sales) — no seeded `Application`, `Interview`, or recruitment-triggered
`Notification` records.

**Tests:** `apps/api/test/recruitment.e2e-spec.ts` — covers list/detail/create-gating, apply,
duplicate-apply 409, withdraw, cancel. No unit specs.

**Frontend:** `app/(dashboard)/jobs/` (+`[id]`), `/applications`, `/interviews`, `/careers` →
matching `features/{jobs,applications,interviews,careers}/`. Fully live via `lib/api/{jobs,
applications,interviews}.ts`. Jobs list/detail show a `matchScore` and skill-match breakdown;
applications screen shows a pipeline concept (`APPLICATION_STAGES`: Applied → Screening →
Interview → Offer → Decision — this stage list is UI-only, see findings); interviews screen
supports scheduling display, panelists, agenda, format. `ui-plan.md` §5.H additionally calls for
a Kanban pipeline board and an interview-feedback rubric form — no file names matching those were
found, so they appear not yet built.

**Findings — the least complete backend workflow in this audit:**
- **The application pipeline has no forward transitions implemented.** The schema and frontend
  both model an `ACTIVE → OFFER/REJECTED` (and a multi-stage `currentStage`) progression, but the
  service layer only ever implements `ACTIVE → WITHDRAWN`. There is no HR/recruiter-facing
  endpoint to advance an application's stage or set it to `offer`/`rejected`.
- **Interview creation is dead code.** `InterviewRepository.create()` exists but is never called
  from any service or controller — interviews can only enter the system via direct DB/seed
  insertion (the e2e test itself inserts directly into the Mongoose model to set up its cancel
  test). There is no "schedule an interview" endpoint.
- `Job.matchScore` in the response DTO is hardcoded to `0` with an explicit
  `// Stage 9 agent will compute AI-powered match score` comment — an intentional stub, not a bug.
- `Application.currentStage`'s doc comment references an `APPLICATION_STAGES` constant that
  **does not exist anywhere in the codebase** — scaffolding for a not-yet-built feature.
- Minor: `recruitment.e2e-spec.ts` line 72 asserts `Array.isArray(res.body.skillsMatch)) ===
  true` on the job-detail response, but `JobResponseDto` has no `skillsMatch` field at all (only
  `matchScore`). This test assertion appears stale/mismatched against the current DTO shape and
  is worth a follow-up look (it's unclear from static inspection whether the test currently
  passes).

---

## 6. Notification module

**Backend:** `apps/api/src/modules/notifications/` — `notification.controller.ts`,
`notification.service.ts`, `notification.repository.ts`, `schemas/notification.schema.ts`,
`dto/notification-response.dto.ts`.

**Schema** (`notifications`, index `{tenantId, recipientId, createdAt:-1}`): `tenantId`,
`recipientId`, `type` (`leave|expense|mention|system|policy`), `category`
(`action|update|mention`), `title`, `body`, `read` (default false), `dismissed` (default false),
`href?`, `actions: {label, variant: primary|secondary|destructive}[]`. No separate
`NotificationPreference` entity — there is no opt-out/preferences mechanism.

**Endpoints:**

| Method | Route | Notes |
|---|---|---|
| GET | `/notifications` | own notifications |
| PATCH | `/notifications/read-all` | declared before `:id` routes to avoid route-shadowing (explicit code comment) |
| PATCH | `/notifications/:id/read` | own only (404 on tenant/recipient mismatch) |
| PATCH | `/notifications/:id/dismiss` | own only |

All guarded by `JwtAuthGuard` only — ownership enforced in the service, not by a permission code
(there is no notification-specific `PermissionCode`).

**Service-layer behavior:** the sole "publish" primitive other modules use is
`NotificationService.emit(opts): Promise<void>` — a direct injected-service method call
(fire-and-forget; callers `void` the promise, so emission errors are not surfaced to the caller).
There is no event bus / `@nestjs/event-emitter` / pub-sub — this is a synchronous in-process call,
not a decoupled event system.

**Confirmed producers (grepped across all modules):**
- `LeaveService.updateStatus()` — approve/reject.
- `ExpenseService.approveReport()` / `rejectReport()` / `notifyManagerOnSubmit()` (private, only
  fires if the employee has a `managerId`).

**Confirmed non-producers:** Recruitment, Employee, Department, Payroll, Time, Analytics, Tenant,
and Agent modules never call `NotificationService`.

**Tests:** `apps/api/test/notifications.e2e-spec.ts` (134 lines) — covers the CRUD/state
endpoints themselves. No unit specs.

**Frontend:** `app/(dashboard)/notifications/` → `features/notifications/notifications-screen.tsx`
— inbox grouped by Today/This week/Older, tabs (action/update/mention/all), mark-read/dismiss/
mark-all-read, rendered via the `ActionableNotification` pattern component. Fully live via
`lib/api/notifications.ts`.

**Notification UI surfaces:**
- **Bell icon** — `components/layout/top-bar.tsx`, unread-count badge, links to `/notifications`.
  The count comes from `app-shell.tsx`'s `useQuery(["notifications"], fetchNotifications)` with a
  60s `staleTime` — this is **polling**, not push.
- **Inbox page** — `/notifications`, as above.
- **Toasts** — a generic `useToast()` pattern used ad hoc for local action feedback (e.g. "Leave
  request submitted," "Request approved/rejected," "Expense submitted for approval"). These are
  client-side, triggered by the mutation's own success/error handler — **not** driven by the
  notifications backend/inbox at all; they're a separate feedback mechanism.

**Findings:**
- **No real-time push (SSE/WebSocket)** — confirmed by both code inspection and `ui-plan.md`,
  which lists this as UI Stage F7, "not started." The bell-icon badge only updates on the next
  60s poll cycle or page load.
- `seed-demo-org.ts` seeds no `Notification` documents at all — demo data never shows a populated
  inbox out of the box.
- No preferences/opt-out mechanism (e.g. mute a notification type).
- The module itself is solid and well-scoped; the gaps are entirely in the modules that *don't*
  call it (payroll, recruitment, employee — see their sections above).

---

## Cross-cutting findings

Ranked roughly by how much they'd surprise or affect a user of the system:

1. **Payroll config write bug** (§4) — the one functional bug in this audit with a concrete
   user-facing failure mode: an HR admin literally cannot set another employee's salary/payroll
   config through the API despite the endpoint and permission existing for exactly that. No e2e
   test would have caught it because none exist for that route.
2. **Agent `get_payslip` tool is stale** (§4) — the employee-facing chat agent will tell users
   payroll is "unavailable" even though a working `PayrollModule` has existed since Stage 2's
   close-gaps pass. This is a cross-module integration gap between Stage 2's agent stories
   (written first) and the later payroll module (added after).
3. **Notification coverage is uneven** — leave and expenses are fully wired; payroll, recruitment,
   and employee are not. Recruitment is the most conspicuous absence given how naturally
   "application status changed" / "interview scheduled" map to the existing notification model.
4. **Recruitment's workflow is CRUD-thin** (§5) — no application-stage advancement, no interview
   creation path exist server-side yet. The frontend already renders pipeline/stage concepts the
   backend can't currently produce through any real flow other than direct DB writes (seed/test
   only), which is worth flagging before anyone builds further UI on top of it.
5. **`/leave` vs `/time-off` frontend duplication** (§2) — one fully-live screen and one
   partially-mocked screen cover overlapping ground; worth consolidating or finishing the wiring
   before this diverges further.
6. **`EXPENSE_MANAGE` defined-but-unused permission** (§3) — either dead config or a half-shipped
   feature; worth a deliberate decision either way.
7. **`ui-plan.md` §6's status table is stale** relative to the actual `apps/web` tree — it marks
   leave/expenses/payroll/recruitment/analytics as "not started" when they're substantially built
   and live-wired. This is a documentation-hygiene issue, not a build gap, but risks misleading
   future planning if treated as authoritative (the code should be treated as the source of truth
   over that table until it's refreshed).
8. **Zero unit tests across all six modules** — every module's service/repository logic is
   validated only at the e2e layer (`apps/api/test/*.e2e-spec.ts`), which requires a real MongoDB
   replica set to run (`mongodb-memory-server` can't fetch its binary in network-restricted
   CI/cloud environments, per `plan.md`). There's no fast, isolated unit-test signal for business
   logic changes in these modules.
9. **Minor:** `recruitment.e2e-spec.ts`'s `skillsMatch` assertion doesn't match
   `JobResponseDto`'s actual shape (§5) — worth a quick look to confirm the test still passes as
   written.

## What's solid

Not everything is a gap — worth stating plainly: the **Employee** module is the most complete and
best-tested of the six (full self-access model, audit-logged transactional writes, thorough e2e
coverage, live frontend, no stubs found). **Leave** and **Expense**'s backend approval workflows
are both correctly permission-gated and notification-wired, matching the pattern the other three
modules should eventually follow. **Notifications** itself does exactly what it claims to do,
cleanly, with no surprises — its gaps are entirely about which *other* modules haven't adopted it
yet, not about defects in the module itself.
