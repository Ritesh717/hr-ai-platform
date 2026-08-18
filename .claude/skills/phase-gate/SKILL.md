---
name: phase-gate
description: "Check whether the current build stage meets the blueprint's Definition of Done before calling it complete or moving to the next stage. Use before saying 'Stage N is done' or before starting Stage N+1's infrastructure."
---

# /phase-gate

Blueprint §45/§50: "The project should not be considered production-ready merely because the
agent produces good answers." This skill checks a stage against that bar before it's marked done,
and prevents jumping ahead to a later stage's infrastructure early (blueprint §52's whole point).

## Usage

```
/phase-gate                # check the current stage from plan.md
/phase-gate --stage 3      # check a specific stage
```

## What to do

1. Read `plan.md` to find the current (or specified) stage and its checklist.
2. Read `docs/blueprint.md` §50 (Definition of Done) and, if the stage introduces agent
   functionality, the agent-specific subsection of §50 too.
3. For each checklist item, verify it against the actual repo state — don't take a checked box at
   face value if the code that would satisfy it doesn't visibly exist (e.g. "API tests" should map
   to real test files that pass, not just a checkbox someone ticked). Concretely check:
   - Do the claimed tests exist and pass? (run them)
   - Does structured logging actually emit JSON, or is it still `print()`?
   - Are tool permissions declared for every tool introduced this stage?
   - Is there at least one eval case per agent introduced this stage?
   - Is there an audit log entry for every high-impact action this stage added?
4. Report a clear pass/fail per item, not just an overall verdict — the user needs to know
   *which* gap to close, not just that one exists.
5. If everything passes: update `plan.md` to mark the stage done and flip the next stage's status
   from "not started" to "next".
6. If gaps exist: do not mark the stage done. List the gaps as concrete next actions. Do not start
   scaffolding the next stage's infrastructure (e.g. Temporal before Stage 6 is gated, Kafka before
   Stage 7) even if asked, without flagging that the current stage isn't gated yet — surface the
   tension and let the user decide whether to proceed anyway.

## Notes

- This is a checklist audit, not a code review — it's about coverage of required categories
  (tests, logging, auth, audit, evals), not code quality within them. Use `/code-review` separately
  for that.
- Keep the check proportional: Stage 1 has no agents, so the agent-specific Definition of Done
  items don't apply yet — don't fail a stage on requirements it hasn't reached.
