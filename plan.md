# Build Plan — HR AI Agent Platform

Full architectural reference: [`docs/blueprint.md`](docs/blueprint.md). This file tracks the
staged build sequence (blueprint §46) and what's actually done. Update the checkboxes as stages
land — this is the fastest way for a future session to know real status without re-reading code.

## Roadmap (blueprint §46 / §47)

| Stage | Adds | Status |
|---|---|---|
| 1 | FastAPI + PostgreSQL + SQLAlchemy + Alembic + Auth + Employee CRUD | ⏳ next |
| 2 | Employee Agent + tool calling + tracing (first tool-using agent) | not started |
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

## Stage 1 — Engineering Foundation (current)

Goal: a normal, production-shaped HR backend with no agents yet. Everything later stages add
(agents, RAG, workflows) plugs into this without a rewrite.

### Scaffold
- [x] Repo created, monorepo layout per blueprint §4
- [x] `pyproject.toml` with Stage 1 deps (FastAPI, SQLAlchemy async, Alembic, Pydantic v2, Redis, pytest)
- [ ] `docker-compose.yml` (Postgres, Redis)
- [ ] `.env.example`

### Core modules (domain/)
- [ ] `organization`, `tenant`, `department`, `role`, `permission`
- [ ] `employee` (CRUD)
- [ ] `audit_log`

### API (apps/api/)
- [ ] App factory with lifespan events (`apps/api/main.py`)
- [ ] `/health`, `/ready`, `/live`
- [ ] `/api/v1/employees` (full CRUD, request/response schemas, pagination)
- [ ] `/api/v1/departments`
- [ ] Global exception handler + structured error responses
- [ ] Request ID middleware
- [ ] Structured JSON logging

### Data
- [ ] SQLAlchemy 2.x async engine + session dependency
- [ ] Alembic initialized, first migration (org/tenant/department/employee/role/permission/audit_log)
- [ ] `tenant_id` on all tenant-owned tables (RLS deferred to Stage 11 hardening unless it's cheap now)

### Auth
- [ ] OIDC-based auth (start with a minimal JWT verification path; full Keycloak wiring can follow
      once there's something worth protecting)
- [ ] RBAC dependency (`require_roles(...)`) mirroring blueprint §22

### Definition of Done for Stage 1 (blueprint §50, backend-relevant subset)
- [ ] API tests (httpx + pytest-asyncio)
- [ ] Unit tests for domain services
- [ ] Authorization tests (role can't access what it shouldn't)
- [ ] Structured logging
- [ ] Error handling + correlation IDs
- [ ] Docker image for `api`
- [ ] Basic CI (lint + type check + tests) via GitHub Actions

Use the `phase-gate` skill to check this list before calling Stage 1 done.

---

## Notes for future sessions

- This project intentionally does **not** front-load Kubernetes, Kafka, or Temporal — those show
  up at the stage that introduces them (6, 7, 11).
- Frontend (Next.js) is not part of Stage 1. The blueprint's Milestone 1 pairs it with the backend
  early, but §46's stage sequence — which this plan follows — treats the API as usable via
  `/docs` (OpenAPI) until an agent exists worth building a UI around.
- When Stage 2 starts, the OpenAI Agents SDK for Python is the intended agent framework (see
  blueprint §1, §51); LangGraph is introduced only where explicit graph/state semantics earn their
  keep (blueprint suggests this becomes relevant around Stage 4+/10).
