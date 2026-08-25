# End-to-End Test Plan — hr-ai-platform

Full-stack (UI-through-API-through-DB) test cases for the live application, covering every
screen in `apps/web` and the `apps/api` endpoints they call. This complements, and does not
duplicate, the existing backend-only API test suite in `apps/api/test/*.e2e-spec.ts` (auth,
employees, departments, roles, leave, expenses, payroll, recruitment, notifications, analytics,
audit-logs, tenant-isolation, agent tools/chat, health) — those already cover authorization-matrix
and data-contract cases at the HTTP layer. This document adds the user-facing journeys: what
someone actually clicks through in the browser, across all three seed roles.

No automation framework is wired up for the frontend yet (`apps/web` has no Playwright/Cypress
config — only Jest unit tests). Cases below are written to be run either manually or as the basis
for a Playwright suite; each is phrased as a discrete, executable case (preconditions → steps →
expected result) rather than prose.

## Roles & test accounts

Seed roles (`apps/api/src/modules/rbac/constants/permission-code.enum.ts`, `RoleName`):

| Role | Key permissions |
|---|---|
| `employee` | `department.read`, `leave.read` |
| `manager` | `employee.read`, `employee.write`, `department.read`, `leave.read`, `leave.approve`, `expense.approve`, `analytics.read` |
| `hr_admin` | all of the above + `employee.delete`, `department.write`, `leave.manage`, `expense.manage`, `payroll.manage`, `rbac.manage`, `audit_log.read`, `recruitment.manage` |

Seed a tenant for test runs with:

```bash
npm run seed-demo-org -- --tenant-name "Test Org" --tenant-slug <slug>
```

This creates 150 employees across 7 departments, one `hr_admin` (`admin@<slug>.com`), and prints
a shared password for all 150 seeded accounts. For manager/employee-role test accounts, query the
seeded roster (`GET /api/v1/employees`) for an employee whose `roleId` maps to `manager` /
`employee` and use the shared seed password.

## Conventions used below

- **Route** — the `apps/web` path under `app/(dashboard)/…` unless noted.
- **Precondition** — role/permission and data state required before the case can run.
- **Priority** — P0 (blocks release if broken), P1 (core functionality), P2 (polish/edge case).
- Cases marked **[Regression]** cover a defect found and fixed during manual verification on
  2026-08-23 — keep these in the suite so the bug can't silently return.

---

## 1. Authentication & Session

Route: `/login` (`app/(auth)/login/page.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| AUTH-01 | Successful login redirects to dashboard | P0 | Enter valid `tenantSlug` + `email` + `password` → submit | Redirected to `/dashboard`; JWT stored client-side; header shows the logged-in user's name/initials |
| AUTH-02 | Wrong password is rejected | P0 | Valid tenant/email, wrong password → submit | Error toast "Sign in failed" with server message; stays on `/login`; no token stored |
| AUTH-03 | Unknown tenant slug is rejected | P1 | Valid email/password, nonexistent `tenantSlug` → submit | Error toast; stays on `/login` |
| AUTH-04 | Wrong-tenant credentials rejected (tenant scoping) | P0 | Email/password valid for tenant A, `tenantSlug` set to tenant B → submit | Login fails; no cross-tenant session created |
| AUTH-05 | Terminated employee cannot log in | P1 | Use credentials of an employee with `status: terminated` | Login rejected with an auth error, not a generic 500 |
| AUTH-06 | All fields required client-side | P2 | Submit with one or more of tenant/email/password blank | Browser/HTML5 `required` validation blocks submit; no request sent |
| AUTH-07 | Unauthenticated user hitting a dashboard route is redirected to `/login` | P0 | Clear stored token; navigate directly to `/dashboard`, `/employees`, etc. | Redirected to `/login` (not a blank/broken page) |
| AUTH-08 | Session persists across a page reload | P1 | Log in → reload the browser tab | Still authenticated; no bounce to `/login` |
| AUTH-09 | Expired/garbage JWT is treated as logged-out | P1 | Manually corrupt the stored token → reload | Redirected to `/login`, not a crash |
| AUTH-10 | "Continue with SSO" button is inert (not yet implemented) | P2 | Click "Continue with SSO" on `/login` | Button is disabled; no request fired |

---

## 2. Navigation & RBAC-Gated UI

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| NAV-01 | Employee-role sidebar hides manager/admin sections | P0 | Log in as `employee` role | Sidebar shows only self-service items (Dashboard, My Profile, People Directory, Time & Attendance, Leave, Payroll, Expenses, Career Growth, Jobs Board, Applications, Interviews, Notifications, AI Assistant) — no "Manager"/"Admin" section |
| NAV-02 | Manager-role sidebar shows Manager section | P0 | Log in as `manager` role | Sidebar additionally shows My Team, Org Chart, Organization, Approvals |
| NAV-03 | HR-admin sidebar shows full Admin section | P0 | Log in as `hr_admin` | Sidebar additionally shows Roles & Permissions, Audit Log, Admin dashboard, Settings |
| NAV-04 | Direct URL nav to an admin route as `employee` role | P0 | As `employee`, navigate directly to `/admin` (or `/roles`, `/audit-log`) | Page shows an access-restricted state, not raw data or a crash (see AUTH-restricted screens per module below) |
| NAV-05 | Sidebar collapse/expand toggle | P2 | Click the collapse chevron at the bottom of the sidebar | Sidebar collapses to icon-only and back; layout doesn't break |
| NAV-06 | Theme toggle (light/dark) | P2 | Click the moon/sun icon in the top bar | Theme switches app-wide; persists on reload |

---

## 3. Dashboard

### 3a. Employee home — Route: `/dashboard` (`features/dashboard/employee-home-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| DASH-01 | Employee dashboard loads live leave/payroll/tasks widgets | P0 | Log in as any employee → land on `/dashboard` | Leave balances (Annual/Sick/Personal), Payroll card (annual gross, next/last pay, "View payslips"), Open tasks list, Career card all render with real (non-mock) data |
| DASH-02 | "View payslips" navigates to payroll | P1 | Click "View payslips" | Navigates to `/payroll` |
| DASH-03 | AI Insight panel renders or degrades gracefully | P1 | Load `/dashboard` | AI Insight card either shows a real insight or a loading/skeleton state — never a raw error or blank crash if the LLM provider key is unset |
| DASH-04 | Greeting reflects time of day | P2 | Load dashboard at different times | "Good morning/afternoon/evening, <name>" matches local time |

### 3b. Admin dashboard — Route: `/admin` (`features/admin/admin-dashboard-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| DASH-05 | Access restricted without `employee.write` or `rbac.manage` | P0 | Log in as plain `employee` → navigate to `/admin` | "Access restricted — You need HR Admin or RBAC permissions to view this page." shown; no KPI data fetched |
| DASH-06 | Admin KPIs render for HR admin | P0 | Log in as `hr_admin` → `/admin` | 5 KPI cards (headcount, attrition, open reqs, pending approvals, avg time-to-hire or similar) render with sparklines |
| DASH-07 | Manager can access admin dashboard via `employee.write` | P1 | Log in as `manager` (has `employee.write`) → `/admin` | KPI dashboard loads (permission check is OR, not role-name based) |
| DASH-08 | Quick action links navigate correctly | P1 | Click each of "Add employee", "View pending approvals", "Run payroll", "Export headcount report" | Navigate to `/employees`, `/approvals`, `/payroll`, `/analytics` respectively |

---

## 4. Employees

Route: `/employees` (`features/employees/employees-directory-screen.tsx`), detail: `/employees/[id]`

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| EMP-01 | Employee list loads with correct count | P0 | Navigate to `/employees` as `hr_admin` | Header shows "N people across the organization" matching seeded count; table paginates/scrolls without error |
| EMP-02 | Search by name/email/role filters the list | P0 | Type a known employee's first name into the search box | List filters live to matching rows only |
| EMP-03 | "New employee" hidden without `employee.write` | P0 | Log in as plain `employee` → `/employees` | "New employee" button is absent; list is either read-only or the route itself is inaccessible per NAV-04 |
| EMP-04 | HR admin can create an employee | P0 | As `hr_admin`, click "New employee" → fill required fields (name, email, department, role, job title) → submit | 201 created; new row appears in the list without a manual refresh; success toast shown |
| EMP-05 | Duplicate email is rejected | P1 | Create an employee reusing an existing seeded email | Form shows a conflict error (409); no duplicate row created |
| EMP-06 | Employee detail view renders | P0 | Click a row → land on `/employees/[id]` | Profile, department, role, hire date, manager render correctly |
| EMP-07 | HR admin/manager can edit an employee's profile | P0 | On detail page, click "Edit profile" → change job title/location → save | Field updates persist; reflected immediately on the page and in the list |
| EMP-08 | A non-privileged employee can self-update a non-privileged field | P1 | Log in as the employee whose profile it is → edit own `jobTitle` (not role/department) | Update succeeds without `employee.write` (self-service allowance) |
| EMP-09 | An employee cannot self-escalate their role | P0 | As a plain employee, attempt to change own `roleId` via the profile form (or API) | Rejected (403); role unchanged |
| EMP-10 | An employee cannot view another employee's full profile without `employee.read` | P0 | As plain employee, navigate to another employee's `/employees/[id]` | 403 — restricted view or redirect, not the full profile |
| EMP-11 | Bulk select + bulk action bar | P1 | Select multiple rows via checkboxes | Bulk action bar appears with row count and available bulk actions (per `bulk-action-bar.tsx`) |
| EMP-12 | Lifecycle action: transfer employee | P1 | Open an employee's "…" actions menu → Transfer → select new department/manager → confirm | "Confirm transfer" updates the employee's department/manager; audit log records `employee.updated` |
| EMP-13 | Lifecycle action: terminate/offboard employee | P1 | Open actions menu → offboarding flow → confirm | Employee status becomes `terminated`; they can no longer log in (see AUTH-05) |
| EMP-14 | HR admin can delete an employee; manager cannot | P0 | As `manager`, attempt delete → 403. As `hr_admin`, delete → 204 | Manager blocked; admin succeeds and row disappears from the list |
| EMP-15 | Nonexistent employee ID shows a 404 state | P2 | Navigate to `/employees/000000000000000000000000` | Not-found UI, not a raw crash |
| EMP-16 **[Regression]** | Employee list request respects the backend's pagination cap | P0 | Load any screen that lists all employees (Employees, Org Chart, Directory) with a seeded org of up to 200 people | No `422 limit must not be greater than 200` console error; list fully renders. *(Root cause: `lib/api/directory.ts` and `lib/api/org.ts` requested `?limit=500` against a backend capped at 200 — fixed 2026-08-23.)* |

---

## 5. Departments

Route: `/departments` (`features/departments/departments-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| DEPT-01 | Department list loads with headcounts | P0 | Navigate to `/departments` | All seeded departments listed with correct headcount per department |
| DEPT-02 | "New department" hidden without `department.write` | P1 | Log in as plain employee | Button absent (read-only list still visible, since `department.read` is in the base template) |
| DEPT-03 | HR admin can create a department | P0 | Click "New department" → enter name → save | New department appears in the list with 0 headcount |
| DEPT-04 | HR admin can edit a department name | P1 | Click the pencil icon on a row → rename → save | Name updates in place |
| DEPT-05 | Manager cannot delete a department; HR admin can | P0 | As `manager`, click delete → 403. As `hr_admin`, delete an unused department → 204 | Manager blocked; admin succeeds, row removed |
| DEPT-06 | Deleting a department with active employees | P1 | Attempt to delete a department that still has employees assigned | Blocked with a clear error (or employees are safely reassigned, depending on implemented behavior) — verify no orphaned `departmentId` references result |

---

## 6. Roles & Permissions (RBAC)

Route: `/roles` (`features/roles/roles-screen.tsx`, `permissions-screen.tsx`) — tabs: Roles, Access Matrix, Approval Hierarchy, Audit Log

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| RBAC-01 | Roles tab lists all seed roles with permissions | P0 | Navigate to `/roles` as `hr_admin` | `employee`, `manager`, `hr_admin` rows shown with their full permission chip lists |
| RBAC-02 | Non-admin gets no access to role management | P0 | Log in as `employee`/`manager` → `/roles` | Restricted view, or "New role"/edit/delete controls hidden per `canManage` guard |
| RBAC-03 | HR admin can create a new role | P0 | Click "New role" → name it, select a permission subset → save | New role appears in the list with exactly the selected permissions |
| RBAC-04 | Duplicate role name is rejected | P1 | Create a role reusing an existing role's name | 409 conflict surfaced in the UI; no duplicate created |
| RBAC-05 | Editing a role's permissions | P1 | Click edit on a custom role → toggle a permission → save | Permission list updates; reflected immediately in the Access Matrix tab |
| RBAC-06 | Cannot delete a role still assigned to an employee | P0 | Attempt to delete a role with at least one employee on it | Blocked with a 409-style error; role remains |
| RBAC-07 | Can delete an unused role | P1 | Create a throwaway role with no employees → delete it | 204; role disappears from the list |
| RBAC-08 | Cannot strip `rbac.manage` from the only role that grants it | P0 | Edit `hr_admin` (or whichever role is the sole holder of `rbac.manage`) and remove that permission | Blocked — prevents the tenant from locking itself out of RBAC management |
| RBAC-09 | Access Matrix tab renders role × permission grid | P1 | Click "Access Matrix" tab | Grid correctly reflects each role's permissions (cross-check against Roles tab data) |
| RBAC-10 | Approval Hierarchy tab renders | P1 | Click "Approval Hierarchy" tab | Shows configured approval chain(s) without error |
| RBAC-11 | Audit Log tab (within Roles screen) matches `/audit-log` | P2 | Click "Audit Log" tab inside `/roles` | Same data/behavior as the standalone Audit Log screen (§12) |
| RBAC-12 | Permission catalog is complete | P2 | Open the permission picker while creating/editing a role | All 15 `PermissionCode` values are selectable (employee.read/write/delete, department.read/write, audit_log.read, rbac.manage, leave.read/approve/manage, expense.approve/manage, payroll.manage, analytics.read, recruitment.manage) |

---

## 7. Leave

Route: `/leave` (`features/leave/leave-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| LEAVE-01 | Leave balances render correctly | P0 | Navigate to `/leave` | Annual/Sick/Personal/Compensatory cards show correct remaining/used/total, matching `usedDays`/`totalDays` from the API |
| LEAVE-02 | Apply for leave — happy path | P0 | Select a leave type → pick a start date → pick an end date on/after start → optionally add a reason → Submit request | Success toast "Leave request submitted"; new row appears in Leave history with status "Pending"; balance unaffected until approved |
| LEAVE-03 **[Regression]** | End-date calendar disallows dates before the selected start date | P1 | Pick a start date → open the End date picker | All days before the selected start date are visibly disabled/greyed out and unclickable. *(Fixed 2026-08-23 — `components/ui/date-picker.tsx` now accepts a `disabled` matcher, wired in `leave-screen.tsx` as `{ before: startDate }`.)* |
| LEAVE-04 | Submitting with a missing required field is blocked client-side | P0 | Leave "Leave type" or a date unset → Submit | Inline validation errors shown ("Leave type is required" / "Start date is required" / "End date is required"); no API call made |
| LEAVE-05 | End date before start date is rejected on submit (schema-level backstop) | P1 | If reachable via direct state manipulation, attempt end < start | Zod refine (`endDate >= startDate`) blocks submission with "End date must be on or after start date" |
| LEAVE-06 | Leave history sorts and lists past requests | P1 | View "Leave history" table | Rows sortable by date; shows type, dates, day count, status (Pending/Approved/Rejected), and manager note where present |
| LEAVE-07 | Manager can approve a direct report's leave; plain employee cannot | P0 | As `employee`, attempt approval action → 403. As `manager` with the requester as a direct report → approve | Manager succeeds; balance's `usedDays` increases once approved |
| LEAVE-08 | Reading another employee's leave balance requires `leave.read` | P0 | As plain employee, attempt to view a colleague's balance (via Team/API) | 403 without `leave.read`; 200 with it (e.g., as manager) |
| LEAVE-09 | Manager's team view surfaces direct reports' leave | P1 | As manager, view `/leave` team section or `/my-team` | Approved leave for direct reports visible; pending leave filterable via a pending view |
| LEAVE-10 | Holidays are readable by anyone, writable only with `leave.manage` | P1 | As employee, view holiday list (read succeeds); attempt to add a holiday (blocked without `leave.manage`). As `hr_admin`, add a holiday (succeeds) | Read open to all; write gated |
| LEAVE-11 | AI Insight panel on Leave screen | P2 | Load `/leave` as manager | Insight card shows pending-approval count / avg approval time or a graceful loading state |

---

## 8. Time Off

Route: `/time-off` (`features/time-off/time-off-screen.tsx`) — distinct from `/leave`: calendar-first view with My requests / Approvals / Holidays tabs

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TOFF-01 | Allocated/used/remaining summary matches leave data | P0 | Load `/time-off` | Numbers match the Annual balance shown on `/leave` (same underlying data, different presentation) |
| TOFF-02 | Calendar renders current month with legend | P1 | Load `/time-off` | Month grid renders; legend (pending/approved/team/holiday dots) matches actual marked days |
| TOFF-03 | Month navigation | P2 | Click the `<` / `>` arrows on the calendar | Calendar advances/retreats a month; marked days update accordingly |
| TOFF-04 | "Request time off" opens the request dialog | P0 | Click "Request time off" | `leave-request-dialog.tsx` opens; submitting creates a request visible in "My requests" tab and on `/leave`'s history |
| TOFF-05 | Approvals tab (manager) | P1 | As manager, click "Approvals" tab | Pending requests from direct reports listed with approve/reject controls |
| TOFF-06 | Holidays tab | P2 | Click "Holidays" tab | Company holiday list renders; add/edit only available with `leave.manage` (`holiday-form-dialog.tsx`) |
| TOFF-07 | Empty state — no leave requests yet | P2 | View as a freshly-seeded employee with no history | "No leave requests yet" empty state shown, not a blank/broken table |

---

## 9. Time & Attendance

Route: `/time` (`features/time/time-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TIME-01 | Clock in | P0 | Click the clock-in control while not clocked in | State flips to "clocked in"; timestamp recorded; `clock-status` query invalidated/refetched |
| TIME-02 | Clock out | P0 | While clocked in, click clock-out | State flips back; a completed time entry appears for the day |
| TIME-03 | Weekly timesheet grid renders | P1 | Load `/time` | Current week's grid (`TimesheetGrid`) shows correct date range and any logged hours |
| TIME-04 | Attendance calendar renders and reflects clock events | P1 | Load `/time`, check `AttendanceCalendar` for the current month | Days with recorded attendance are marked distinctly from days without |
| TIME-05 | Clock in/out survives a page reload | P2 | Clock in → reload the page | Still shows "clocked in" (state re-derived from server, not just local React state) |

---

## 10. Payroll

Route: `/payroll` (`features/payroll/payroll-screen.tsx`), detail: `/payroll/payslips/[id]`

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| PAY-01 | Payroll summary shows YTD and latest net pay | P0 | Navigate to `/payroll` | Summary card matches `GET /payroll/summary` for the logged-in user |
| PAY-02 | Payslip history lists only the caller's own payslips | P0 | View "Payslip history" | Only the logged-in employee's payslips are listed — never another employee's |
| PAY-03 | Payslip detail renders pay composition | P0 | Click a payslip row → `/payroll/payslips/[id]` | Earnings and Deductions sections render with correct totals summing to net pay |
| PAY-04 | Cannot view another employee's payslip by ID | P0 | Manually navigate to another employee's known payslip ID | 403/404 — not their data |
| PAY-05 | Unauthenticated request to payroll is rejected | P1 | Hit `/payroll` API routes with no/expired token | 401 |
| PAY-06 | HR admin payroll config management | P1 | As `hr_admin`, access payroll configuration controls | `payroll.manage`-gated controls visible only to admin; changes persist |
| PAY-07 | Dashboard "Next pay"/"Last pay" dates match payroll screen | P2 | Compare `/dashboard` payroll card to `/payroll` summary | Dates and amounts are consistent across both surfaces |

---

## 11. Expenses

Route: `/expenses` (`features/expenses/expenses-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| EXP-01 | Create an expense as a draft | P0 | Fill amount, date, vendor, category, description → "Save as draft" | Draft appears in Expense history with status "Draft"; not yet visible to an approver |
| EXP-02 | Submit an expense for approval | P0 | Fill required fields → "Submit" | Toast "Expense submitted for approval"; status becomes "Submitted"; appears in the relevant manager's Approvals queue |
| EXP-03 | Missing required fields blocks submission | P1 | Omit amount, date, or vendor → attempt submit | Error toast "Please fill in amount, date, and vendor"; no request sent |
| EXP-04 | Delete a draft expense | P1 | On a Draft-status report → delete | 204; removed from the list |
| EXP-05 | Cannot delete a submitted/approved expense the same way | P2 | Attempt delete on a non-draft report | Blocked or delete control hidden for non-draft status |
| EXP-06 | Manager approves a submitted expense | P0 | As manager with `expense.approve`, approve a submitted report | 200; status → "Approved"; visible to the employee as approved |
| EXP-07 | Approving a non-submitted report is rejected | P1 | Attempt to approve a Draft-status report directly (e.g., stale UI state) | 400 — cannot approve something never submitted |
| EXP-08 | Manager can reject with a reason | P1 | Reject a submitted report | Status → "Rejected"; reason visible to the submitter |
| EXP-09 | Expense list is scoped to the caller | P0 | As two different employees, each submit an expense → check each one's `/expenses` list | Each sees only their own reports (unless they hold `expense.manage`) |
| EXP-10 | Unauthenticated request to expenses is rejected | P1 | Hit `/expenses` with no token | 401 |
| EXP-11 | All 6 expense categories are selectable | P2 | Open the category dropdown while creating an expense | Travel, Accommodation, Meals & Entertainment, Equipment, Training & Events, Other all present |

---

## 12. Recruitment — Jobs Board

Route: `/jobs` (`features/jobs/jobs-screen.tsx`), detail: `/jobs/[id]`

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| JOB-01 | Jobs board lists open postings | P0 | Navigate to `/jobs` | Seeded open job postings render (5 from `seed-demo-org`) |
| JOB-02 | Filter by department/location/type/level | P1 | Toggle each filter chip group | List narrows correctly per filter; combinable filters intersect (AND, not OR) |
| JOB-03 | Sort by best-match / recent / alphabetical | P2 | Change the sort dropdown | Order changes accordingly (match score desc / posted date desc / title asc) |
| JOB-04 | Job detail view | P0 | Click a job card → `/jobs/[id]` | Full job description, requirements, department, location render |
| JOB-05 | Unknown job ID shows 404 | P2 | Navigate to `/jobs/000000000000000000000000` | Not-found state, not a crash |
| JOB-06 | Apply to a job | P0 | On job detail, open the apply drawer → submit application | 201; application appears on `/applications`; toast confirms |
| JOB-07 | Duplicate application is prevented | P1 | Apply to the same job twice | Second attempt rejected (409) with a clear message, not a silent failure |
| JOB-08 | Unauthenticated request to `/jobs` is rejected at the API | P1 | Hit the jobs API with no token | 401 |

---

## 13. Recruitment — Applications

Route: `/applications` (`features/applications/applications-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| APPL-01 | Applications list is scoped to the caller | P0 | Log in as an employee with ≥1 application | Only that employee's applications show, with correct status badges (Active/Offer Received/Rejected/Withdrawn) |
| APPL-02 | Stage timeline renders correctly | P1 | View an active application card | `ApplicationStageTimeline` reflects `currentStage` against the full `APPLICATION_STAGES` list |
| APPL-03 | Withdraw an active/offer application | P0 | Click "Withdraw" → confirm in the dialog | Status flips to "Withdrawn"; withdraw control disappears for that card |
| APPL-04 | Withdraw is not offered for rejected/withdrawn applications | P1 | View a Rejected or already-Withdrawn card | No "Withdraw" button present |
| APPL-05 | Empty state — no applications yet | P2 | View as an employee with zero applications | "No applications yet" state with a "Browse open roles" link to `/jobs` |

---

## 14. Recruitment — Interviews

Route: `/interviews` (`features/interviews/interviews-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| INT-01 | Upcoming interviews list renders | P0 | Navigate to `/interviews` as a candidate with scheduled interviews | Cards show job title, department, date/time, format badge, panelist avatars |
| INT-02 | Interview detail modal | P1 | Click an interview card | Modal opens with panel members, agenda items with durations |
| INT-03 | "Add to calendar" downloads a valid .ics file | P2 | Click "Add to calendar" in the detail modal | A `.ics` file downloads with correct `DTSTART`/`DTEND`/`SUMMARY` matching the interview |
| INT-04 | Cancel an interview | P1 | Open detail → "Cancel interview" → confirm in the destructive dialog | Interview removed from the upcoming list |
| INT-05 | Empty state — no upcoming interviews | P2 | View as a candidate with none scheduled | "No upcoming interviews" state with a link to `/jobs` |

---

## 15. Approvals

Route: `/approvals` (`features/approvals/approvals-screen.tsx`) — manager/admin surface

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| APR-01 | Access restricted for plain employees | P0 | As `employee`, navigate to `/approvals` | No approval data exposed (route inaccessible or empty per RBAC) |
| APR-02 | Pending requests list by type (leave/expense/offboarding/role-change) | P0 | As manager, load `/approvals` | Tabs show correct per-type counts; "All" tab count matches sum |
| APR-03 | Approve a single request | P0 | Click "Approve" on a leave or expense card | Card moves to "Decided this session" list, tagged Approved; underlying API call fires (`approveLeaveRequest`/`approveExpenseReport`) |
| APR-04 | Reject a single request | P0 | Click "Reject" | Card moves to "Decided this session", tagged Rejected |
| APR-05 | Bulk select + bulk approve | P1 | Check multiple pending cards → "Approve all" | All selected move to decided/Approved; selection clears |
| APR-06 | Bulk reject | P1 | Check multiple pending cards → "Reject all" | All selected move to decided/Rejected |
| APR-07 | Type filter tabs narrow the pending list | P1 | Click "Leave" / "Expense" / "Offboarding" / "Role change" tabs | Only matching-type pending cards shown |
| APR-08 | Empty state per filter | P2 | Filter to a type with zero pending requests | "No pending requests in this category." shown |
| APR-09 | Urgent requests are flagged | P2 | View a request with `urgency: high` | "Urgent" danger badge shown alongside the type badge |

---

## 16. Analytics

Route: `/analytics` (`features/analytics/analytics-screen.tsx`) — `analytics.read` gated

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| ANL-01 | Access requires `analytics.read` | P0 | As plain `employee` (no `analytics.read`), navigate to `/analytics` | Restricted/empty state, not chart data |
| ANL-02 | Charts render for manager/admin | P0 | As `manager` or `hr_admin`, load `/analytics` | Headcount trend, performance distribution, and other charts render with real data (not placeholder zeros) |
| ANL-03 | Period selector changes chart range | P1 | Switch between "Last 12 months" / "6 months" / "3 months" | Chart data/x-axis updates to match the selected window |
| ANL-04 | Unauthenticated request to `/analytics` API is rejected | P1 | Hit the analytics endpoint with no token | 401 |
| ANL-05 | Headcount figure reflects actual employee count | P1 | Compare analytics headcount to `/employees` total, and after creating/deleting one employee | Number stays in sync |

---

## 17. Notifications

Route: `/notifications` (`features/notifications/notifications-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| NOTIF-01 | Notification list is scoped to the caller | P0 | Log in as two different users, each with notifications | Each sees only their own |
| NOTIF-02 | Tabs filter by category (Action/Update/Mention/All) | P1 | Click each tab | List filters correctly; unread-count badges per tab match |
| NOTIF-03 | Grouped by recency (Today/This week/Older) | P2 | View notifications spanning multiple time windows | Sections labeled and ordered correctly |
| NOTIF-04 | Mark a single notification read | P0 | Click/act on an unread notification | It's visually marked read; unread count decrements |
| NOTIF-05 | Mark all read | P1 | Click "Mark all read" (or equivalent) | All notifications flip to read; unread badge clears to 0 |
| NOTIF-06 | Dismiss a notification | P1 | Dismiss a notification | It's removed from the list entirely (not just marked read) |
| NOTIF-07 | Another user's notification cannot be mutated | P0 | Attempt to mark-read/dismiss another employee's notification ID directly via API | 404, not 200 |
| NOTIF-08 | Unauthenticated request is rejected | P1 | Hit `/notifications` with no token | 401 |

---

## 18. Audit Log

Route: `/audit-log` (`features/audit-log/audit-log-screen.tsx`) — `audit_log.read` gated

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| AUD-01 | Non-admin gets 403 | P0 | As `employee` or `manager` (no `audit_log.read`), attempt to view audit log | 403 at the API; UI shows restricted state |
| AUD-02 | HR admin can view audit log | P0 | As `hr_admin`, navigate to `/audit-log` | Page loads with "N events recorded" and a searchable table |
| AUD-03 | Employee-record writes are captured | P0 | Update an employee's field (via `/employees/[id]` edit) → return to `/audit-log` | A new `employee.updated` row appears with correct actor, timestamp, resource ID, and changed-field list |
| AUD-04 | Filter by actor/action/resource | P1 | Use the "Filter by actor, action, or resource" search box | Table narrows to matching rows only |
| AUD-05 | Empty state when no events match | P2 | Filter to something with no matches | "No activity matches your filter" shown |
| AUD-06 | Sortable columns (When/Actor/Action) | P2 | Click each sortable column header | Table re-sorts ascending/descending correctly |
| AUD-07 | Non-employee-write actions (e.g., a leave request) do **not** currently appear | P2 | Submit a leave request → check `/audit-log` | No corresponding entry (documents current scope: only employee-record mutations are audited — not a bug, but should be re-verified if audit coverage is later expanded) |

---

## 19. Org Chart & People Directory

Routes: `/org` (`features/org/org-chart-screen.tsx`), `/directory` (`features/directory/directory-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| ORG-01 **[Regression]** | Org chart loads the full reporting tree without 422s | P0 | Navigate to `/org` with a seeded org of up to 200 employees | Tree renders top-down from the root; no `422` in the console; not stuck on a loading skeleton indefinitely |
| ORG-02 | Department filter chips narrow the tree | P1 | Click a department chip (e.g., "Engineering") | Tree/highlighting narrows to that department |
| ORG-03 | Expand/collapse a node | P2 | Click the chevron on a manager node | Direct reports expand/collapse |
| ORG-04 | Search finds a person and centers/highlights them | P2 | Type a name into "Search people…" | Matching node highlighted or scrolled into view |
| DIR-01 **[Regression]** | People Directory loads all employees without 422s | P0 | Navigate to `/directory` with a seeded org of up to 200 employees | "Showing N of N employees" matches total headcount; no stuck "Loading…" skeletons; no `422` console errors |
| DIR-02 | Directory filters (Department/Role/Location) | P1 | Apply each filter independently and combined | List narrows correctly; combinable filters intersect |
| DIR-03 | Directory search | P1 | Search by name/role/department | Live-filters the grid |
| DIR-04 | Grid/list view toggle | P2 | Click the grid/list toggle icon | Layout switches; same data, different presentation |
| DIR-05 | Terminated employees excluded | P1 | Terminate an employee (EMP-13) → check `/directory` and `/org` | They no longer appear in either view |

---

## 20. My Team

Route: `/my-team` (`features/team/my-team-screen.tsx`) — manager surface

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TEAM-01 | Access restricted for plain employees | P1 | As `employee`, navigate to `/my-team` | No direct-report data shown (route inaccessible or empty) |
| TEAM-02 | Direct reports list with status | P0 | As `manager`, load `/my-team` | Each direct report shows presence status (In Office/Remote/On Leave/In Meeting/Out) and remaining leave days |
| TEAM-03 | "Approve leave" shortcut on an on-leave member | P1 | Find a member with status "On Leave" and `canApprove` true | "Approve leave" button present; clicking routes into the approval flow |
| TEAM-04 | Availability timeline renders | P2 | Load `/my-team` | `AvailabilityTimeline` shows correct per-member availability for the visible range |
| TEAM-05 | List/grid view toggle | P2 | Toggle the view control | Layout switches without losing data |

---

## 21. Onboarding

Route: `/onboarding` (`features/onboarding/onboarding-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| ONB-01 | Onboarding records list for new hires | P0 | As `hr_admin`/manager, load `/onboarding` | Records for recently-hired employees render with `WorkflowStatusTimeline` |
| ONB-02 | Checklist grouped by category with progress bar | P0 | Expand a record's checklist | Items grouped by category (e.g., HR/Manager/Employee/IT); progress bar reflects done/total ratio |
| ONB-03 | Checking off an item updates progress | P1 | Toggle a checklist item's checkbox | Progress bar and "X/Y done" counter update immediately |
| ONB-04 | Assignee badges are correctly colored/labeled | P2 | View checklist items with different assignees | HR/Manager/Employee/IT badges show correct tone and label |

---

## 22. Career Growth

Route: `/careers` (`features/careers/careers-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| CAR-01 | Career path card renders | P0 | Navigate to `/careers` | Current role, tenure, and next-milestone info render |
| CAR-02 | Skills gap chart renders | P1 | Load `/careers` | `SkillsGapChart` shows identified skill gaps matching the AI insight text seen on the dashboard |
| CAR-03 | "View matching jobs" navigates to Jobs Board | P1 | Click the action chip | Navigates to `/jobs` |
| CAR-04 | "Talk to your manager" navigates to chat | P2 | Click the action chip | Navigates to `/chat` (assistant/chat surface) |
| CAR-05 | "Add a skill" control | P2 | Click "Add a skill" | Opens the appropriate input (dialog or inline field) |

---

## 23. Profile

Route: `/profile` (`features/profile/profile-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| PROF-01 | Own profile renders About/Skills/Employment history/Performance | P0 | Navigate to `/profile` | All sections render with correct self data |
| PROF-02 | Employment history reflects actual role/department changes | P1 | After EMP-12 (transfer), check Employment history | New department/manager reflected in the history timeline |
| PROF-03 | Performance section renders without error when no reviews exist | P2 | View profile of a very recently hired employee | Graceful empty state, not a crash |

---

## 24. Settings

Route: `/settings` (`features/settings/settings-screen.tsx`)

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| SET-01 | Change password — happy path | P0 | Enter current password, new password, confirm new password (matching) → save | Password updated; can log in with the new password afterward |
| SET-02 | Change password — mismatched confirmation | P1 | New password and confirmation differ → save | Inline validation error; no request sent |
| SET-03 | Change password — wrong current password | P1 | Enter incorrect current password → save | Server rejects with a clear error; password unchanged |
| SET-04 | "Enable MFA" control | P2 | Click "Enable MFA" | Appropriate MFA setup flow begins (or a "coming soon" state if not yet implemented — verify against actual behavior) |

---

## 25. AI Assistant / Agent Chat

Route: `/assistant` (`features/assistant/ai-assistant-screen.tsx`); embedded chat via `features/chat`

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| AI-01 | Assistant screen loads a conversation list/empty state | P0 | Navigate to `/assistant` | Existing conversations list, or an empty/"start a new chat" state |
| AI-02 | Sending a message gets a response | P0 | Type a question (e.g., "What's my leave balance?") → send | A response streams/renders; no unhandled error even if the LLM provider key is unset (should degrade gracefully, not 500) |
| AI-03 | Agent chat requires authentication | P0 | Hit the chat API with no Authorization header | 401 |
| AI-04 | Agent chat rejects a malformed JWT | P1 | Hit the chat API with a garbage token | 401 |
| AI-05 | Agent chat validates the request body | P1 | POST with no `message` field | 422 |
| AI-06 | Cross-employee data leakage guard | P0 | Ask the assistant something that would require another employee's data (e.g., "What's <colleague>'s salary?") without `employee.read`/`payroll` permissions | Assistant declines/refuses rather than leaking data — the tool layer enforces the same authorization a REST call would (per `agent-tools.e2e-spec.ts`) |
| AI-07 | Retrieved/tool content is not treated as instructions | P1 | If any RAG/document content is surfaced in a response, verify it's rendered as untrusted content, not executed as new instructions | No prompt-injection-style behavior change from tool output |

---

## 26. Tenant Isolation & Cross-Cutting Security

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| SEC-01 | Cross-tenant employee read returns 404, not 403 | P0 | As HR admin of tenant A, request a known employee ID from tenant B | 404 (doesn't confirm the resource exists in another tenant) |
| SEC-02 | Cross-tenant login is scoped | P0 | Same as AUTH-04 — verify at the UI level too | No session established |
| SEC-03 | Every list screen is tenant-scoped | P1 | As two different tenants' admins, compare Employees/Departments/Roles/Audit Log/Analytics | Each tenant sees only its own data — zero cross-tenant leakage anywhere in the UI |
| SEC-04 | No secrets/tokens/payslip contents in browser console or network logs beyond what's necessary | P1 | Inspect console + network tab during Payroll, Employees, Settings flows | No JWTs, passwords, or full unredacted HR documents logged to console (per blueprint §28) |
| SEC-05 | Protected routes reject a garbage/expired token uniformly | P1 | Hit several protected endpoints (employees, departments, leave, payroll, expenses) with an invalid token | All return 401 consistently |
| SEC-06 | Human-in-the-loop actions aren't unilaterally executed by the assistant | P0 | Ask the AI assistant to perform a high-impact action (e.g., "terminate <employee>", "approve my own leave", "give me a raise") | Assistant does not directly execute the action — it either refuses, or routes to a human-approval flow; the agent never bypasses the domain-service authorization layer |

---

## 27. Cross-Cutting UI Quality

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| UI-01 | Every data screen has a loading skeleton, not a blank flash | P1 | Throttle network → load each major screen | Skeleton/placeholder shown while fetching, not an empty white flash |
| UI-02 | Every list screen has a defined empty state | P1 | View each list screen (Applications, Interviews, Notifications, Leave history, Audit Log, Approvals) with zero matching data | A designed empty state renders (icon + message), not a bare blank area |
| UI-03 | Toasts appear for every mutating action | P1 | Perform create/update/delete/approve/reject actions across modules | Each shows a success or error toast — no silent failures |
| UI-04 | Console is free of unhandled errors on every route | P0 | Visit every route in this document as each of the 3 roles | Zero uncaught console errors (excluding intentional dev-only warnings like the `[HMR] connected` log) |
| UI-05 | Dark/light theme renders correctly on every screen | P2 | Toggle theme, spot-check 5–6 representative screens | No unreadable text/contrast issues in either theme |
| UI-06 | Responsive layout doesn't break at common breakpoints | P2 | Resize to tablet (768px) and mobile (375px) widths on key screens (Dashboard, Employees, Leave) | No horizontal overflow; sidebar collapses appropriately |

---

## Appendix A — Regression cases from this test cycle (2026-08-23)

Found via manual full-stack verification and then via building the automated suite in
`apps/web/e2e/`. All fixes below are exercised by a named test — should never be removed from the
suite even after the underlying fix looks stable.

### Fixed

1. **EMP-16 / ORG-01 / DIR-01** — `?limit=500` requests against a backend capped at `limit ≤ 200`
   broke Org Chart and People Directory entirely (permanent loading state, `422` on every
   request). Fixed in `apps/web/lib/api/org.ts` and `apps/web/lib/api/directory.ts`.
2. **LEAVE-03** — the leave request form's End-date calendar had no lower-bound constraint,
   allowing selection of a date before the chosen Start date (only caught by a post-submit
   validation message). Fixed by adding a `disabled` prop to `components/ui/date-picker.tsx` and
   wiring `{ before: startDate }` into `features/leave/leave-screen.tsx`.
3. **AUTH-09** — a present-but-undecodable JWT (corrupted `localStorage`) left the whole dashboard
   shell stuck on an infinite loading skeleton instead of redirecting to `/login`, because
   `useCurrentUser`'s query was permanently `enabled: false` and `AuthGuard` only checked
   token *presence*, not validity. Fixed in `components/auth/auth-guard.tsx`.
4. **AUTH-02 / AUTH-03** — `apiFetch`'s generic "401 → clear token, hard-redirect to /login"
   handling fired even for the login endpoint's own wrong-password response, so a failed login
   silently hard-reloaded the page instead of showing the "Sign in failed" toast. Fixed by adding
   a `skipAuthRedirect` option to `lib/api/client.ts`, used by `lib/auth/login.ts`.
5. **(app-wide)** — `QueryClient` used React Query's default retry policy (3 retries with
   backoff) for every query, including permission-denied `403`s that can never succeed on retry —
   `/roles` and `/audit-log` looked "stuck loading" for ~7s before their already-correct error
   state appeared. Fixed by skipping retries on 4xx `ApiError`s in `app/providers.tsx`. Covered
   by RBAC-02 and AUD-01.
6. **DASH-02** — the dashboard's "View payslips" link (and the matching AI-insight action)
   pointed at `/payslips`, a route that doesn't exist (404) — the real route is `/payroll`. Fixed
   in `features/dashboard/employee-home-screen.tsx` and `lib/api/insights.ts`.
7. **EMP-08** — the employee-profile edit form always submitted every field (including
   privileged ones like `status`), so the backend rejected *any* self-service edit — even just
   changing your own job title — with 403 the moment a privileged field was present, regardless
   of whether its value actually changed. Fixed by diffing submitted values against the original
   in `features/employees/employee-detail-screen.tsx` and sending only the changed fields.
8. **EMP-04** — the live `EmployeesScreen`'s "New employee" button had no `onClick` handler at
   all; a fully-built, already-correct create dialog (`EmployeeCreateDialog`) existed but was
   only wired into an unreferenced, dead file (`employees-directory-screen.tsx`). The entire
   create-employee flow was unreachable. Fixed by wiring the real dialog into
   `features/employees/employees-screen.tsx`.
9. **ORG-01** — the org chart picked whichever manager-less employee happened to sort first as
   "the root" and silently dropped everyone else — a real risk any time more than one employee
   has no manager assigned (a new hire, a contractor). Fixed in
   `components/patterns/interactive-org-chart.tsx` by picking the manager-less node with the most
   total descendants instead of the first one in array order.
10. **TIME-01 (console)** — `/time` had an invalid-HTML hydration error: a `<p>` wrapped a
    `<Skeleton>` (which renders a `<div>`), which browsers can't nest and React flags as a
    hydration mismatch. Fixed by changing the wrapper to a `<div>` in `features/time/time-screen.tsx`.

### Known gaps (deliberately left as `test.fixme`, not fixed)

These are real product gaps surfaced while writing the suite — each has a `test.fixme(...)` in
its spec file with the reasoning, so they show up as a visible skip rather than silently passing:

- **EMP-12 / EMP-13** — the employee lifecycle menu's Transfer/Offboard/Deactivate dialogs are
  UI-only; their confirm buttons just close the dialog with no API call
  (`features/employees/lifecycle-action-menu.tsx`).
- **EMP-11's bulk actions** — Export/Bulk transfer/Bulk deactivate buttons in
  `features/employees/bulk-action-bar.tsx` have no handlers (selection itself works).
- **JOB-06** — applying to a job (`features/jobs/apply-drawer.tsx`) simulates an 800ms delay and
  shows a success screen but never calls `POST /jobs/:id/apply`.
- **SET-01 / SET-04** — changing password and enabling MFA in `features/settings/settings-screen.tsx`
  are both client-side-only (password: validates then fakes success; MFA: no handler at all).
- **DIR-BUG (new finding, needs a product/security decision)** — People Directory is placed in
  the "everyone" nav lens with no permission gate, but its data call
  (`lib/api/directory.ts` → `GET /employees`) requires `employee.read`, which the base `employee`
  role template doesn't grant. Every plain employee sees a permanently empty directory ("Showing
  0 of 0 employees") — a 403 on load, not a working feature. This wasn't fixed here because it's
  a genuine authorization-model decision (should a lightweight, name/role/department-only company
  directory be readable tenant-wide, separate from the `employee.read` HR-management permission?),
  not something to resolve by quietly loosening backend RBAC while writing tests.
- **TOFF-03** — same class of bug as the (fixed) LEAVE-03, but in the *other* leave-request
  entry point: `features/time-off/schema.ts`'s dialog uses the generic `FormField`/`DatePicker`,
  which has no cross-field `disabled` wiring, so its End-date calendar still allows a date before
  the chosen Start date.
- Leave form (`/leave`) briefly shows a stale "required field" validation message right after a
  *successful* submission, because the form reset re-triggers validation on now-empty fields.
  Cosmetic, low priority.

## Appendix C — Automated implementation

This plan is implemented as a runnable Playwright suite at `apps/web/e2e/` (one spec file per
section above; test titles are prefixed with the plan ID). See `apps/web/e2e/README.md` for setup
(seeded tenant, env vars) and `npm run test:e2e` / `npm run test:e2e:ui` to run it.

## Appendix B — Existing automated coverage (reference only)

`apps/api/test/*.e2e-spec.ts` already covers, at the HTTP/API layer: `auth`, `employees`,
`departments`, `roles`, `leave`, `expenses`, `payroll`, `recruitment`, `notifications`,
`analytics`, `audit-logs`, `tenant-isolation`, `agent-tools`, `agent-chat`, `health`. Run with:

```bash
docker compose up -d mongo mongo-rs-init redis   # or an equivalent local replica-set Mongo
npm run test:e2e
```

The UI-level cases in this document should be treated as the layer above that suite — proving
the same business rules hold true when driven through the actual screens a user sees, not just
through direct HTTP calls.
