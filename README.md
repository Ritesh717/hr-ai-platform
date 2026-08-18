# HR AI Agent Platform

A production-oriented HR platform built as a learning path for AI agent engineering: tool-using agents, RAG, action-taking agents, durable workflows, event-driven systems, text-to-SQL, multi-agent orchestration, human-in-the-loop, and observability — all inside one real, evolving codebase.

The full design reference lives in [`docs/blueprint.md`](docs/blueprint.md). The build sequence and current status live in [`plan.md`](plan.md).

## Stack (Stage 1)

Python 3.12 · FastAPI · SQLAlchemy 2.x (async) · PostgreSQL · Alembic · Pydantic v2 · Redis · pytest

Later stages add: OpenAI Agents SDK, pgvector, Temporal, Kafka/Redpanda, OpenTelemetry, Next.js — see the blueprint for the full stack and phase-by-phase rollout.

## Repository layout

```text
apps/
  api/              FastAPI app: routers, dependencies, middleware
  agent_service/    agents, tools, prompts, policies
  workflow_worker/  Temporal workflows + activities (from Stage 6)
  event_consumer/   Kafka/Redpanda consumers (from Stage 7)
domain/             business logic per module (employee, leave, payroll, ...)
infrastructure/      db, redis, kafka, temporal, storage, observability wiring
shared/             auth, errors, events, logging, configuration
tests/              unit, integration, agent, workflow, security, evaluation
migrations/         Alembic
docker/ helm/ terraform/   deployment (later stages)
docs/               blueprint + design notes
```

This mirrors the monorepo architecture in the blueprint (§4) so that later phases (agents, workflows, events) drop into an existing structure instead of requiring a rewrite.

## Getting started

Stage 1 (current) has no runnable app yet — see `plan.md` for the Stage 1 checklist. Once scaffolded:

```bash
poetry install
docker compose up -d   # postgres, redis
poetry run alembic upgrade head
poetry run start
```

## Working with this repo in Claude Code

See [`CLAUDE.md`](CLAUDE.md) for how this project should be built (architectural non-negotiables from the blueprint) and [`.claude/skills/`](.claude/skills/) for repo-specific skills that scaffold new domain modules, agent tools, and eval cases consistently.
