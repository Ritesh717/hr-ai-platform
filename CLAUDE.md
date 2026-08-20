# Project Instructions — hr-ai-platform

## Who this is for

The user is a **senior backend developer** using this project to learn production AI agent
engineering (tool-calling, RAG, action-taking agents, durable workflows, multi-agent
orchestration, guardrails, evaluation) inside a real, growing application rather than toy
scripts. They are not a beginner at backend engineering — don't explain general
programming/FastAPI concepts already covered in the sibling `python-fastapi-mastery` project.
Do explain agent-engineering-specific concepts as they're introduced (tool schemas, guardrails,
handoffs, evaluation harnesses, durable execution) since that's the new territory here.

## Source of truth

[`docs/blueprint.md`](docs/blueprint.md) is the full design doc this project implements. When in
doubt about architecture, phase order, or a naming convention, check it before improvising.
[`plan.md`](plan.md) tracks the build sequence and what's actually been built — keep it updated
as stages complete so a future session knows the true state without re-deriving it from the code.

## Non-negotiable architectural rules

These come directly from the blueprint and should not be relaxed for convenience:

1. **Agent → Tool → Domain Service → Repository → PostgreSQL.** Agents never touch the database
   or raw SQL directly (the one sanctioned exception is the read-only analytics/text-to-SQL agent
   in Stage 8, which uses a locked-down read-only DB role with statement/table/column allowlists).
2. **Agents orchestrate; services enforce business rules.** An agent decides *which tool to call*.
   The domain service decides *whether the operation is allowed*. Never trust the LLM to enforce
   authorization, policy, or business invariants.
3. **Every tool declares the permission it requires** (e.g. `create_leave_request` →
   `employee.leave.write`). The authorization layer — not the LLM — decides if the caller has it.
4. **Human-in-the-loop for high-impact actions**: hiring decisions, compensation, termination,
   payroll changes, access provisioning, compliance actions. The agent assists; it does not
   unilaterally decide.
5. **Retrieved/external content is untrusted.** RAG chunks, uploaded documents, and tool output
   must be clearly separated from system instructions in the prompt and must never be allowed to
   redefine agent behavior (prompt injection defense).
6. **Authorize before retrieving, not after.** Vector search must be filtered by the caller's
   identity/tenant/access level *before* results are returned, not filtered afterward.
7. **Don't reach for multi-agent architecture early.** Start with a single agent per the blueprint's
   staged sequence (§46); only split into specialist agents when tools become numerous, permissions
   diverge, or evaluation needs isolation (§14).
8. **Prompts are versioned artifacts**, not inline strings tweaked in place — treat a prompt change
   like a behavior change, not a harmless config edit (§31, §45).

## Build order

Follow the staged sequence in blueprint §46 (`Stage 1` → `Stage 11`) and don't skip ahead to
infrastructure (Kubernetes, Kafka, Temporal) before the stage that introduces it — the blueprint's
explicit point is that the learning curve depends on this ordering. Use the `phase-gate` skill
before declaring a stage done.

## Backend implementations

`apps/api/` (NestJS + Mongoose + MongoDB) is the active backend implementation. The original
FastAPI + PostgreSQL + SQLAlchemy backend has moved to `apps/deprecated/api/` — kept as a frozen
code snapshot for reference, not runnable. Its supporting Python packages (`domain/`,
`infrastructure/`, `shared/`), `migrations/`, `tests/`, `pyproject.toml`/`poetry.lock`, the root
Python `Dockerfile`, and the `.venv` have all been deleted (nothing else in the repo depended on
them — `apps/api` is fully self-contained). Don't try to `import`, run, lint, or test
`apps/deprecated/api/` — it will fail; it's kept only as a readable reference for the design it
implemented. See `docs/blueprint.md` §54 and `plan.md`'s backend-implementation section for the
history and design deltas between the two.

Note: rule 1 above and the blueprint's Stage 2–11 roadmap (§46) were written against the
PostgreSQL/SQLAlchemy/pgvector stack and the Python agent SDK — they have **not** been updated
for the Mongo/NestJS backend. Treat "→ PostgreSQL" as "→ the active database" until/unless the
blueprint is explicitly revised; flag it if a stage's Python-specific assumptions (Alembic,
pgvector, OpenAI Agents SDK for Python) need re-deciding for the new backend before building on
top of them.

The non-negotiable rules above are otherwise stack-agnostic and apply to both backends
unchanged — authorization lives in domain services, not controllers or the LLM; tenant scoping is
explicit on every query; audit logging, human-in-the-loop, and prompt hygiene rules don't depend
on which backend they attach to.

## Common commands

Infra (needed before running the backend or its e2e tests):

```bash
docker compose up -d mongo mongo-rs-init redis   # Mongo as a single-node replica set (rs0) — required for Mongoose transactions
```

Backend (`apps/api/`):

```bash
npm install
npm run start:dev            # nest start --watch, http://localhost:3001
npm run build                # nest build
npm run lint                 # eslint src/scripts/test
npm test                     # jest unit tests (*.spec.ts, co-located with source)
npm run test:watch
npm run test:e2e             # jest -e2e config, apps/api/test/*.e2e-spec.ts, needs mongo+redis up
npx jest path/to/file.spec.ts                                   # single unit test
npx jest --config ./test/jest-e2e.json path/to/file.e2e-spec.ts # single e2e test
npm run sync-indexes
npm run bootstrap-tenant -- --name "Acme Corp" --slug acme --admin-email admin@acme.io --admin-password "..." --admin-name "Admin User"
npm run seed-demo-org -- --tenant-slug globex   # 7 departments, 150 employees, 4-level hierarchy
```

Frontend (`apps/web/`):

```bash
npm install
npm run dev     # http://localhost:3000 -> redirects to /dashboard; runs against mock data (lib/api/)
npm run build
npm run lint
```

## Architecture — `apps/api`

- Every module under `src/modules/` (auth, tenant, employee, department, rbac, leave, audit-log,
  health) follows **Controller → Service → Repository → Mongoose schema**. Controllers hold no
  business logic or authorization checks; services enforce rules and call repositories for
  persistence — the same shape as the Agent → Tool → Domain Service → Repository rule above, one
  layer down.
- Every query is tenant-scoped (`tenantId` threaded through repository calls). Multi-step writes
  (e.g. `TenantService.bootstrap`, `EmployeeService`'s write+audit-log flows) use Mongoose
  transactions, which is why `docker-compose.yml` runs Mongo as a replica set even for local dev.
  `test/tenant-isolation.e2e-spec.ts` exists specifically to guard against cross-tenant leaks.
- Authorization is RBAC: permissions are `PermissionCode` enum values
  (`modules/rbac/constants/permission-code.enum.ts`), checked via `requirePermission`/
  `hasPermission` (`modules/rbac/authorization.ts`) at the top of service methods — never in
  controllers, never left to a decorator alone. See `employee.service.ts` for the pattern.
- `common/auth` — JWT strategy/guard, password hashing. `common/errors/app.error.ts` — typed error
  hierarchy (`AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, …)
  mapped to HTTP responses by `common/errors/http-exception.filter.ts`. `common/logging` — pino
  wiring.
- Comments like `// Mirrors domain/employee/service.py's EmployeeService.` point at the equivalent
  code in `apps/deprecated/api/` for design lineage — read-only reference, never runnable (see
  "Backend implementations" above).

## Architecture — `apps/web`

- Next.js App Router. Route groups `app/(auth)/` and `app/(dashboard)/` separate the
  unauthenticated login flow from the authenticated shell (`components/layout/app-shell.tsx`,
  `sidebar.tsx`, `top-bar.tsx`).
- Each screen pairs a thin route file under `app/(dashboard)/<screen>/` with its implementation in
  `features/<screen>/` (data fetching, local state) — see `features/{dashboard,employees,roles,
  time-off,audit-log,departments}`.
- `components/ui/` = foundation primitives, mostly Radix-based (dialog, dropdown-menu, popover,
  toast, tooltip, drawer, card…). `components/patterns/` = composed patterns built from primitives
  (e.g. `highlight-card`). `components/layout/` = nav/shell chrome. `components/chat/` = the agent
  chat surface for when agent work lands. Never build a one-off component inline in a screen — use
  the `new-ui-component` skill.
- Design tokens live in `lib/theme/tokens.css` + `app/globals.css`. The "modern glass UX" visual
  system (translucent surfaces, blur tiers, glass borders, decorative backdrop) is applied via the
  `modern-glass-ux` skill — don't hand-roll glass effects inline.
- The frontend currently runs against mock data (`lib/api/`) ahead of the backend being wired up —
  see `ui-plan.md` §6 for build order and which screens are mocked vs. live.
- `apps/web/CLAUDE.md` re-exports `apps/web/AGENTS.md`, which Next.js itself regenerates on
  `next dev` — it flags breaking API/convention changes for the installed Next.js version. Read it
  before writing App Router code, since training data may be stale for this version.

## Working conventions

- Prefer running the actual code/tests over eyeballing them before calling something done —
  same expectation as `python-fastapi-mastery`.
- Keep `plan.md`'s stage checklist current as work lands.
- New UI component → `new-ui-component`. New screen → `new-screen`. New chat response block →
  `new-response-block`. These exist so the frontend rules in `ui-plan.md` are structural, not
  something to remember by hand each time.
- The `new-domain-module` and `new-agent-tool` skills scaffold the deprecated FastAPI/`domain/`
  pattern and no longer apply (that code is deleted) — there's no equivalent yet for `apps/api`.
  `agent-eval-case` is stack-agnostic and still applies once agent work starts.
- Never log secrets, tokens, full payslips, or unredacted HR documents (blueprint §28).
