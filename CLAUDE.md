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

## Working conventions

- Prefer running the actual code/tests over eyeballing them before calling something done —
  same expectation as `python-fastapi-mastery`.
- Keep `plan.md`'s stage checklist current as work lands.
- New domain module → use the `new-domain-module` skill. New agent tool → use the
  `new-agent-tool` skill. New agent eval case → use the `agent-eval-case` skill. New UI component
  → `new-ui-component`. New screen → `new-screen`. New chat response block → `new-response-block`.
  These exist so the layering rules above (and the frontend rules in `ui-plan.md`) are structural,
  not something to remember by hand each time.
- Never log secrets, tokens, full payslips, or unredacted HR documents (blueprint §28).
