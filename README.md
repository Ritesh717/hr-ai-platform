# HR AI Agent Platform

A production-oriented HR platform built as a learning path for AI agent engineering: tool-using agents, RAG, action-taking agents, durable workflows, event-driven systems, text-to-SQL, multi-agent orchestration, human-in-the-loop, and observability — all inside one real, evolving codebase.

The full design reference lives in [`docs/blueprint.md`](docs/blueprint.md) (§54 covers the backend history below). The backend build sequence and current status live in [`plan.md`](plan.md); the frontend component library and screen plan live in [`ui-plan.md`](ui-plan.md).

## Stack (active)

NestJS · Mongoose · MongoDB · Passport JWT · nestjs-pino · TypeScript

Stage 1 (employee/department/RBAC/audit-log/auth) is built and verified. Stage 2+ (agent tool-calling, RAG, durable workflows, event-driven architecture, text-to-SQL, multi-agent orchestration — see the blueprint for the full phase-by-phase rollout) hasn't started; which stack it targets isn't decided yet — see `plan.md`.

## Backend history

This project originally staged Stage 1 on FastAPI + PostgreSQL + SQLAlchemy + Alembic. That implementation was ported to NestJS + MongoDB, verified working end-to-end, then promoted to the active backend. The original Python app code is kept as a frozen, non-runnable reference snapshot at `apps/deprecated/api/` — its supporting Python packages, tests, migrations, and project config have been deleted. See `docs/blueprint.md` §54 and `plan.md`'s "Backend implementations" section for the full history and design deltas.

## Repository layout

```text
apps/
  api/              NestJS app: the active backend (modules, common infra, scripts, tests)
  deprecated/api/   frozen reference snapshot of the original FastAPI backend (not runnable)
  agent_service/    agents, tools, prompts, policies (from Stage 2)
  workflow_worker/  Temporal workflows + activities (from Stage 6)
  event_consumer/   Kafka/Redpanda consumers (from Stage 7)
  web/              Next.js frontend (see ui-plan.md) — component library + screens, staged F1-F11
docker/ helm/ terraform/   deployment (later stages)
docs/               blueprint + design notes
```

This mirrors the monorepo architecture in the blueprint (§4) so that later phases (agents, workflows, events) drop into an existing structure instead of requiring a rewrite.

## Getting started

```bash
docker compose up -d mongo mongo-rs-init redis
cd apps/api
npm install
npm run sync-indexes
npm run bootstrap-tenant -- --name "Acme Corp" --slug acme --admin-email admin@acme.io --admin-password "correct-horse-battery-staple" --admin-name "Admin User"
npm run start:dev   # http://localhost:3001
```

Optional: seed a full demo organization (7 departments, 150 employees in a 4-level reporting hierarchy):

```bash
npm run seed-demo-org -- --tenant-slug globex
```

The frontend is runnable against mock data, ahead of full backend wiring:

```bash
cd apps/web
npm install
npm run dev   # http://localhost:3000 -> redirects to /dashboard
```

## Working with this repo in Claude Code

See [`CLAUDE.md`](CLAUDE.md) for how this project should be built (architectural non-negotiables from the blueprint) and [`.claude/skills/`](.claude/skills/) for repo-specific skills.
