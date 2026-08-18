---
name: new-domain-module
description: "Scaffold a new HR domain module (e.g. leave, payroll, expense) with the Service -> Repository layering the blueprint requires. Use when adding a new business domain to domain/, not for adding a single endpoint to an existing domain."
---

# /new-domain-module

Scaffolds a new domain module under `domain/<name>/` for the HR AI Agent Platform, following
[`docs/blueprint.md`](../../../docs/blueprint.md) §3.1/§4/§16. The point of this skill is to make
the required layering (`Router -> Service -> Repository -> PostgreSQL`) the default shape instead
of something to remember each time — agents call services, never repositories or raw SQL, and
routers call services too (no route handler should contain business logic).

## Usage

```
/new-domain-module <name>          e.g. /new-domain-module leave
/new-domain-module <name> --tenant  # include tenant_id column + tenant-scoped repository queries (default: on)
```

## What to create

Given `<name>` (snake_case, singular or matching blueprint's domain list — employee, leave,
payroll, recruitment, expense, onboarding, performance):

1. `domain/<name>/__init__.py`
2. `domain/<name>/models.py` — SQLAlchemy 2.x models using `Mapped`/`mapped_column`, inheriting a
   shared `TimestampMixin` from `shared/`. Include `tenant_id` unless `--tenant` explicitly opts
   out. Ask the user for the entity's fields if not already described in the conversation —
   don't invent business fields (e.g. leave day counts, payroll amounts) without confirming them.
3. `domain/<name>/schemas.py` — Pydantic v2 `<Name>Create`, `<Name>Update` (all fields optional),
   `<Name>Response` (`model_config = {"from_attributes": True}`), following the DTO separation in
   blueprint §16.
4. `domain/<name>/repository.py` — a repository class with `get_by_id`, `list`, `create`,
   `update`, `delete`, tenant-scoped by default. No business rules here — pure data access.
5. `domain/<name>/service.py` — the service class. **This is where authorization, policy
   validation, and business rules live** (blueprint §3.2). Every public method should read as a
   business operation, not a CRUD passthrough (e.g. `request_leave(...)`, not just `create(...)`),
   even if today it only wraps the repository — this is the seam agents and API routes both call
   through, and it's the only place authorization checks belong.
6. `apps/api/routers/<name>.py` — FastAPI router calling the service, with request/response
   schemas, proper status codes, and a `Depends` chain for auth. Wire it into
   `apps/api/routers/__init__.py` (or the aggregator router) with prefix `/api/v1/<name>s` unless
   the plural is irregular.
7. A migration stub note: remind the user to run
   `alembic revision --autogenerate -m "create <name> table"` once the model is finalized — don't
   hand-write migration SQL.
8. `tests/unit/test_<name>_service.py` — unit tests for the service's business rules (mock the
   repository).
9. `tests/integration/test_<name>_api.py` — integration test hitting the router via
   `httpx.AsyncClient`, covering at least: happy path, not-found, and an authorization-denied case.

## After scaffolding

- Update `plan.md`'s Stage checklist if this module corresponds to a tracked stage item.
- Do not add an agent tool for this module in the same pass unless asked — that's what
  `new-agent-tool` is for, and it depends on the service methods created here existing first.
- Run `pytest tests/unit/test_<name>_service.py tests/integration/test_<name>_api.py` before
  calling the module done.
