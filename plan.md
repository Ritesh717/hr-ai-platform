# Build Plan — HR AI Agent Platform

Full architectural reference: [`docs/blueprint.md`](docs/blueprint.md). This file tracks the
staged build sequence (blueprint §46) and what's actually done. Update the checkboxes as stages
land — this is the fastest way for a future session to know real status without re-reading code.

## Backend implementations

- **`apps/api/`** — NestJS + Mongoose + MongoDB. The active, fully self-contained backend
  implementation (owns its own domain logic, tests, CI, Docker — nothing outside `apps/api/`).
- **`apps/deprecated/api/`** — FastAPI + PostgreSQL + SQLAlchemy. The original Stage 1
  implementation the roadmap below and blueprint §1–§53 were written against. Kept only as a
  **frozen, non-runnable code snapshot** for reference — its supporting Python packages
  (`domain/`, `infrastructure/`, `shared/`), `migrations/`, `tests/`, `pyproject.toml`/
  `poetry.lock`, the root Python `Dockerfile`, and the `.venv` were all deleted once the Node
  backend was confirmed working end-to-end, since nothing else in the repo depended on them.
  `apps/deprecated/api/` cannot be imported, run, linted, or tested anymore — don't try.

The roadmap table and Stage 1 write-up below describe the original (now-deprecated) Python build
as a historical record. Stage 2+ hasn't started under either backend, so which stack it targets
is still an open decision — see the note in `CLAUDE.md`'s "Backend implementations" section.

## Roadmap (blueprint §46 / §47)

| Stage | Adds | Status |
|---|---|---|
| 1 | FastAPI + PostgreSQL + SQLAlchemy + Alembic + Auth + Employee CRUD | ✅ done (now under `apps/deprecated/api/`) |
| 2 | Employee Agent + tool calling + tracing (first tool-using agent) | ⏳ in progress (stories #1, #2 done) |
| 3 | RAG + pgvector + Policy Agent | not started |
| 4 | Leave Agent + human approval + audit logs (first action-taking agent) | not started |
| 5 | Expense Agent + document processing (OCR/extraction) | not started |
| 6 | Temporal + Onboarding workflow (durable execution) | not started |
| 7 | Kafka/Redpanda + event-driven architecture | not started |
| 8 | Analytics Agent + text-to-SQL (read-only, guardrailed) | not started |
| 9 | Recruitment Agent + Interview + Scheduling agents | not started |
| 10 | Supervisor / multi-agent architecture | not started |
| 11 | Production hardening: security, observability, evals, load testing, DR, cost | not started |

Do not start a stage's infrastructure before its turn (e.g. no Kubernetes/Kafka/Temporal during
Stage 1) — see blueprint §52 for why.

---

## Stage 1 — Engineering Foundation (done, Python build now deleted)

Goal: a normal, production-shaped HR backend with no agents yet. Everything later stages add
(agents, RAG, workflows) plugs into this without a rewrite.

**This whole section is a historical record of the deprecated Python build.** The `pyproject.toml`,
`poetry`, `pytest`, `ruff`/`mypy`, and Docker commands referenced below no longer exist in the
repo — only `apps/deprecated/api/`'s source files remain, unrunnable. Stage 1's actual current
implementation is `apps/api/` (NestJS/Mongoose); see the "Backend implementations" section above.

### Scaffold
- [x] Repo created, monorepo layout per blueprint §4
- [x] `pyproject.toml` with Stage 1 deps (FastAPI, SQLAlchemy async, Alembic, Pydantic v2, Redis, pytest)
- [x] `docker-compose.yml` (Postgres, Redis)
- [x] `.env.example`

### Core modules (domain/)
- [x] `tenant` (incl. `TenantService.bootstrap` — the one actor-less/system-level operation in the
      codebase, reachable only from the CLI), `department`, `rbac`, `employee`, `audit_log` — no
      separate `organization` module; `tenant` fills that role for now (single org per tenant)
- [x] `employee` (CRUD)
- [x] `audit_log`

### API (apps/api/)
- [x] App factory with lifespan events (`apps/api/main.py`)
- [x] `/health`, `/ready`, `/live`
- [x] `/api/v1/employees` (full CRUD, request/response schemas, pagination)
- [x] `/api/v1/departments`
- [x] `/api/v1/roles` (full CRUD) + `/api/v1/permissions` (read-only catalog) — HR-admin-only,
      gated on the `rbac.manage` permission
- [x] Global exception handler + structured error responses
- [x] Request ID middleware
- [x] Structured JSON logging

### Data
- [x] SQLAlchemy 2.x async engine + session dependency
- [x] Alembic initialized, two migrations: schema (tenant/department/employee/rbac/audit_log) +
      global permission catalog seed (from `domain/rbac/constants.py`'s `PermissionCode` — the
      fixed, code-defined vocabulary tenants pick subsets of, never invent new codes)
- [x] `tenant_id` on all tenant-owned tables, **including `roles`** (RLS deferred to Stage 11
      hardening)

### Auth & RBAC
- [x] JWT-based auth (`shared/auth/security.py`, `/api/v1/auth/login`); full OIDC/Keycloak wiring
      still deferred, as originally planned
- [x] **Fully dynamic, per-tenant RBAC** (`domain/rbac/service.py::RoleService`) — HR admins create
      arbitrary roles with arbitrary permission sets via `/api/v1/roles`, not just the 3 seeded
      starter roles (Employee/Manager/HR Admin, from `DEFAULT_ROLE_TEMPLATES`). Authorization is
      driven live from each employee's `Role.permissions` in the database — nothing is hardcoded
      into a Python dict anymore. A role reassignment or permission change takes effect on the
      caller's very next request; `get_current_employee` never trusts the JWT's `role_id` claim,
      only the employee's current DB row. `update_role` blocks changes that would leave a tenant
      with zero employees holding `rbac.manage` (self-lockout guard).
- [x] Tenant bootstrap: `poetry run start bootstrap-tenant --name ... --slug ... --admin-email ...
      --admin-password ... --admin-name ...` (`apps/api/cli.py`) creates the first tenant + HR
      admin — there's no public signup endpoint by design.

### Definition of Done for Stage 1 (blueprint §50, backend-relevant subset)
- [x] API tests (httpx + pytest-asyncio) — `tests/api/`
- [x] Unit tests for domain services — `tests/unit/`
- [x] Authorization tests (role can't access what it shouldn't) — `tests/api/test_employees_api.py`,
      `test_departments_api.py`, `test_audit_logs_api.py`, `test_roles_api.py`,
      `test_tenant_isolation.py`, `tests/unit/test_role_service.py`
- [x] Structured logging — JSON via `shared/logging/setup.py`, verified in the built Docker image
- [x] Error handling + correlation IDs — `shared/errors/`, `apps/api/middleware/request_id.py`
- [x] Docker image for `api` — `Dockerfile`, built and smoke-tested against Postgres
- [x] Basic CI (lint + type check + tests) via GitHub Actions — `.github/workflows/ci.yml`

Verified 2026-08-19: 68/68 tests pass, `ruff check .` clean, `mypy apps domain infrastructure
shared` clean (strict mode), Docker image builds and serves the full login → roles → employees
loop against a real Postgres container, `bootstrap-tenant` CLI smoke-tested end to end (including
the duplicate-slug rejection path).

Bugs found and fixed while gating this stage:
- `passlib[bcrypt]` was incompatible with the installed `bcrypt` (≥4.1) — passlib is unmaintained;
  swapped to calling `bcrypt` directly in `shared/auth/security.py`.
- `EmailStr` fields required `email-validator`, which wasn't declared as a dependency — added.
- `domain/employee/` was missing `__init__.py` (had only `.gitkeep`) — added for consistency with
  the other domain packages.
- RBAC gave base `EMPLOYEE` role the `EMPLOYEE_READ` permission, letting any employee list/read
  every other employee's profile — contradicted both the service's own docstring ("Employee: own
  profile; Manager/HR Admin: broader access") and `ui-plan.md` §5 (Employees Directory is an
  HR-admin screen, section G, not employee self-service). Fixed by moving RBAC to the fully
  dynamic per-tenant model above (base `EMPLOYEE` template no longer includes `EMPLOYEE_READ`;
  self-access still works via the `actor_id == employee_id` bypass in `EmployeeService.get_employee`).
- There was no way to create the first tenant — `POST /api/v1/employees` requires an
  already-authenticated HR admin. Added the `bootstrap-tenant` CLI command
  (`TenantService.bootstrap`).
- `apps/api/cli.py`'s bootstrap path only imported `domain.tenant`/`domain.employee`/`domain.rbac`
  models, not `domain.department`/`domain.audit_log` — SQLAlchemy couldn't resolve
  `employees.department_id`'s FK against `Base.metadata` at flush time
  (`NoReferencedTableError`), since a model's table only registers once its module is imported.
  Fixed by importing every domain model module before the first flush, same as `migrations/env.py`
  already does.
- `RoleRepository` originally named a method `list`, shadowing the builtin inside the class body —
  a later method's `list[Permission]` annotation then resolved to that method instead of the
  builtin, breaking both at runtime (`TypeError`) and under mypy. Renamed to `list_roles`.

Use the `phase-gate` skill to check this list before calling Stage 1 done.

---

## Backend history: Node.js/MongoDB port → active backend

`apps/api/` (originally scaffolded at `apps/api-node/`) is a NestJS + Mongoose port of Stage 1's
scope, built initially as a parallel/comparison implementation alongside the Python backend, then
promoted to the active backend — the original FastAPI implementation moved to
`apps/deprecated/api/` at that point (git history preserved via `git mv`; the Node project itself
was untracked when moved, so it has no pre-move history). See the `docs/blueprint.md` appendix
("Node.js/MongoDB port") for the design deltas (no RLS equivalent → app-level tenant filtering on
every query; no Alembic → `scripts/sync-indexes.ts`; embedded `permissions: string[]` on Role
instead of a Permission table + join table; Mongoose `session.withTransaction()` in place of the
shared-transaction-per-request pattern `get_db()` gives the Python side).

- [x] Scaffold: NestJS project, TypeScript config, ESLint, Docker, `.env.example`
- [x] `tenant` module (repository + service; `bootstrap()` is CLI-only via
      `scripts/bootstrap-tenant.ts`, same as the Python side's `bootstrap-tenant` command)
- [x] `rbac` module — `Role`/`PermissionCode` + the two guardrails (role-in-use delete block,
      RBAC_MANAGE self-lockout block) + `/api/v1/roles`, `/api/v1/permissions`
- [x] `department` module — CRUD + `/api/v1/departments` (delete orphans `departmentId`,
      intentionally not blocked, matching the Python asymmetry vs. Role)
- [x] `employee` module — CRUD, self-access/self-update carve-outs, audit logging on mutations,
      `/api/v1/employees`
- [x] `audit-log` module — internal `log()` + `/api/v1/audit-logs` (read-only)
- [x] `auth` module — `/api/v1/auth/login`, JWT strategy resolving permissions fresh from Mongo
      on every request (never from the token)
- [x] Structured error envelope, request-id correlation, structured JSON logging (nestjs-pino)
- [x] Tests: e2e suite (`test/*.e2e-spec.ts`, mongodb-memory-server replica set) covering the
      same case set as `tests/api/*.py` (auth, tenant isolation, roles incl. the self-lockout
      guardrail, departments, employees, audit logs); focused unit specs for the pure
      authorization/security primitives (`src/**/*.spec.ts`) — the request/permission-recompute
      and business-rule paths are covered at the e2e layer instead of re-mocked at the unit
      layer, since Mongo service-level tests without a real DB would mostly re-test the mocks
- [x] Docker image (`apps/api/Dockerfile`), `docker-compose.yml` `mongo` service (single-node
      replica set, required for Mongoose transactions)
- [x] CI: `test-node` job in `.github/workflows/ci.yml` (the Python `test` job was removed when
      the Python backend's supporting code was deleted, below)
- [x] End-to-end verified against a real (non-memory-server) mongod: `bootstrap-tenant` CLI →
      `sync-indexes` → started the actual server → full `login → roles → departments → create
      employee → audit-logs` loop over real HTTP, matching the Python image's original Stage 1
      smoke test
- [x] `scripts/seed_demo_org.py` (150-employee, 4-level-hierarchy demo data generator) ported to
      `apps/api/scripts/seed-demo-org.ts` — same algorithm (Fisher-Yates name sampling, an
      optional `--seed` for reproducible runs via a small mulberry32 PRNG in place of Python's
      `random.seed`), verified against a real mongod (7 departments, 40 employees, correct
      head/team-lead/IC hierarchy and role assignments)
- [x] All Python infrastructure outside `apps/deprecated/api/` deleted: `domain/`,
      `infrastructure/`, `shared/`, `migrations/`, `tests/`, `pyproject.toml`, `poetry.lock`,
      `alembic.ini`, the root Python `Dockerfile`, `.venv`, and the CI `test` job — confirmed
      nothing else in the repo referenced them first

Two real bugs were caught during this verification, worth knowing if the schemas are extended
further: (1) `@Prop({ type: Types.ObjectId })` is wrong — `mongoose.Types.ObjectId` (the BSON
value class) isn't `mongoose.Schema.Types.ObjectId` (the actual SchemaType); using the former
silently produces a `Mixed` field that never casts query strings to ObjectIds, breaking every
tenant-scoped lookup. Every `@Prop` on an ObjectId-ref field must use `SchemaTypes.ObjectId`.
(2) `mongodb-memory-server` in replica-set mode needs an explicit `storageEngine: 'wiredTiger'`
on Windows, or the underlying mongod immediately crashes (`fassert()` failure) on startup.

Re-verified after the `apps/api-node` → `apps/api` rename and the Python backend's move to
`apps/deprecated/api`: build/lint/unit tests/e2e (33/33) all pass at the new `apps/api/` path.

---

## Notes for future sessions

- This project intentionally does **not** front-load Kubernetes, Kafka, or Temporal — those show
  up at the stage that introduces them (6, 7, 11).
- Frontend (Next.js) implementation is not part of Stage 1, but its plan is: see
  [`ui-plan.md`](ui-plan.md) for the component library and full screen list, staged as F1–F11
  running alongside the backend stages. The API stays usable via `/docs` (OpenAPI) until F1 lands.
  UI stage F1 has landed in `apps/web/` (mocked API, ahead of Stage 1) — see ui-plan.md §6 for
  its status and what's still open before it's marked done.
- When Stage 2 starts, the OpenAI Agents SDK for Python is the intended agent framework (see
  blueprint §1, §51); LangGraph is introduced only where explicit graph/state semantics earn their
  keep (blueprint suggests this becomes relevant around Stage 4+/10). **This assumed a Python
  backend** — now that `apps/api` is Node/NestJS and Python is gone outside the frozen
  `apps/deprecated/api/` snapshot, Stage 2 needed an explicit decision, made in story #1: the
  **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/openai`), hand-rolled around it in
  `apps/api/src/modules/agent/` rather than a separate agent service. Rationale and design deltas
  recorded in `docs/blueprint.md` §54.

## Stage 2 — Employee Agent (`apps/api/src/modules/agent/`)

- [x] Story #1 — Agent runtime decision + scaffold: Vercel AI SDK chosen (see blueprint §54);
      `EmployeeAgentService` (tool-calling loop via `generateText`/`stepCountIs`), an empty
      `AgentToolDefinition[]` registry (`tools/employee-agent.tools.ts`) ready for stories #2/#3,
      env-driven model provider/name config (`AGENT_MODEL_PROVIDER` ∈ `anthropic`/`openai`/
      `deepseek`, `AGENT_MODEL_NAME`, one of `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/
      `DEEPSEEK_API_KEY`, all optional at boot — fails loudly at first `chat()` call instead), and
      a versioned system prompt (`prompts/employee-agent/v1.md`,
      `AGENT_PROMPT_VERSION` selects which). `POST /api/v1/agent/employee/chat` (JWT-guarded) is
      the request/response contract the frontend will call. No-tool round trip verified against
      `ai/test`'s `MockLanguageModelV3` in `employee-agent.service.spec.ts` (no real API key/
      network call needed for CI).
- [x] Story #2 — Employee & org read tools: `get_employee_profile`, `get_manager`,
      `get_department` (`tools/employee-agent.tools.ts`'s `buildEmployeeAgentTools()`), wired to
      the real `EmployeeService`/`DepartmentService` via `AgentModule` now importing
      `EmployeeModule`/`DepartmentModule`. Results are mapped through the existing
      `EmployeeResponseDto`/`DepartmentResponseDto` (never a raw Mongoose document — those carry
      `hashedPassword`).
      - `get_employee_profile`/`get_manager` take an optional `employeeId` (default: caller's own
        id from `AgentToolContext`, never LLM-supplied for the default case) and delegate
        authorization entirely to `EmployeeService.getEmployee()`'s existing self-or-EMPLOYEE_READ
        gate — this required making `AgentToolDefinition.requiredPermission` **optional**
        (`tools/agent-tool.ts`): declaring a blanket `EMPLOYEE_READ` there would have made the
        tool *more* restrictive than the REST endpoint it wraps (blocking a base employee, who
        doesn't hold `EMPLOYEE_READ` by default, from asking about their own profile). See that
        file's doc comment for the full rationale; still satisfies CLAUDE.md rule 3 — the
        declaration is "no blanket permission, defer to the domain service," not "no
        authorization."
      - `get_manager` is new business logic in `EmployeeService.getManager()` (not a REST wrapper
        — there's no `GET .../manager` REST route), built on the existing `managerId` field;
        reuses `getEmployee()`'s gate on the target employee, then resolves the manager record
        directly rather than re-gating it (documented in the method's own comment).
      - `get_department` takes a `name` (case-insensitive exact match, new
        `DepartmentRepository.getByName()`/`DepartmentService.getDepartmentByName()`) since the
        model has no way to know a department's ObjectId; keeps `buildToolSet()`'s central
        `DEPARTMENT_READ` gate since `DepartmentService` has no self-access nuance to defer to.
      - System prompt bumped to `prompts/employee-agent/v2.md` (`v1.md` left untouched, per
        CLAUDE.md rule 8) describing the three new tools; `AGENT_PROMPT_VERSION` default is now
        `v2`.
      - `EmployeeAgentChatResult.toolCalls[].output` now carries the matching tool result
        alongside `name`/`input` — the minimal "tool call + result visible" this story's own
        acceptance criteria need; full OpenTelemetry tracing is story #5's scope, not attempted
        here.
      - Golden-dataset cases added under `tests/evaluation/employee-agent/cases/` (tool_selection,
        tool_arguments, safety) plus a minimal standalone runner
        (`scripts/run-agent-eval.ts`, `npm run eval:employee-agent`) per the `agent-eval-case`
        skill — deliberately not wired into `npm test`/CI since it makes a real, non-deterministic
        model API call per case; a fuller harness is story #6's scope.
      - Tests: `tools/employee-agent.tools.spec.ts` (mocked services, unit level) and
        `test/agent-tools.e2e-spec.ts` (real Mongo-backed `EmployeeService`/`DepartmentService`,
        proving cross-employee/cross-permission rejection matches REST exactly) — 9/9 new e2e
        cases pass alongside the existing 39.
- [x] Story #3 — Leave & payroll read tools: `get_leave_balance`, `get_pending_requests`,
      `get_payslip` (stub — no payroll module yet, returns `{status:'unavailable'}` with no salary
      data; documented in the tool and guarded by `payslip-no-raw-data-leak.json` eval case).
      `LeaveService` injected into `EmployeeAgentService`; `LeaveModule` added to `AgentModule`
      imports. Tests: 6 new unit cases in `tools/employee-agent.tools.spec.ts`; 7 new e2e cases
      in `test/agent-tools.e2e-spec.ts` (self-access, LEAVE_READ gate, pending-only filter,
      payslip stub, no raw salary fields).
- [x] Story #4 — Authentication propagation: JWT→`AgentToolContext` wiring confirmed implemented
      in Story #1/#2 (controller uses `@UseGuards(JwtAuthGuard)` + `@CurrentEmployee()`).
      Added `test/agent-chat.e2e-spec.ts` with explicit HTTP-level coverage: 401 with no
      Authorization header, 401 with malformed JWT, 422 on missing `message` body.
- [x] Story #5 — OTel tracing: `src/tracing.ts` (idempotent `initTracing()`, `NodeSDK` +
      `ConsoleSpanExporter`); `main.ts` calls `initTracing()` before NestJS bootstrap. `chat()`
      wrapped in a custom `employee_agent.chat` span carrying only safe attributes (tenant.id,
      actor.id, agent metadata — never message content per blueprint §28). `generateText()`
      receives `experimental_telemetry` with `recordInputs/recordOutputs: false`.
- [x] Story #6 — Eval harness: 9 golden-dataset cases under
      `tests/evaluation/employee-agent/cases/` covering all 6 tools + 4 safety scenarios
      (prompt injection role escalation, tenant switch, unauthorized cross-employee, payslip
      no-raw-data-leak). Runner at `scripts/run-agent-eval.ts` (`npm run eval:employee-agent`),
      not wired into CI (requires a real LLM API key).

### Stage 2 UI stories (F2)

- [x] Story #65 — Chat surface foundation: `ChatPanel`, `ChatMessageList`, `ChatComposer`
      (mocked, building block for #66–#67).
- [x] Story #66 — `ResponseRenderer` + block registry: `TextBlock` (react-markdown/skipHtml),
      `ToolCallBlock` (collapsible input trace), `RefusalBlock` (alert styling). Registry-based
      dispatch in `response-renderer.tsx` — future block types (`CitationBlock`, `DataTableBlock`)
      add a REGISTRY entry only.
- [x] Story #67 — Chat drawer wired to live endpoint: `lib/api/agent.ts`
      (`postAgentChat`, `toToolCallTrace`), `useCopilotChat` replaced with real
      `POST /api/v1/agent/employee/chat` call + AbortController, `AppShell` passes
      `renderMessageContent={(msg) => <ResponseRenderer message={msg} />}`.
- [ ] Story #68 — End-to-end validation (Definition of Done): code parts done (e2e chat
      endpoint coverage in `test/agent-chat.e2e-spec.ts`, this plan.md update); **manual
      browser pass with real LLM API key not yet run** — requires Docker + a configured
      `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` in a real dev environment.
