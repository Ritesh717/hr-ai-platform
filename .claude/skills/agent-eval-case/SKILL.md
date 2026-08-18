---
name: agent-eval-case
description: "Add a golden-dataset evaluation case for an agent (correctness, tool selection, tool arguments, grounding, safety) under tests/evaluation/. Use after adding or changing an agent tool, prompt, or model so regressions are caught before they ship."
---

# /agent-eval-case

Adds a case to the golden evaluation dataset for an agent, per blueprint §29/§30. Traditional unit
tests check that code runs; this checks that the *agent's behavior* is still correct after a
prompt, tool, or model change — run the full set for an agent after any such change, not just the
new case.

## Usage

```
/agent-eval-case --agent <agent_name> --question "<natural language question>"
  e.g. /agent-eval-case --agent employee --question "How many annual leaves do I have?"
```

## What to create/update

In `tests/evaluation/<agent_name>/`, add a case with:

- `question` — the natural-language input, written the way a real employee/HR user would phrase
  it (including ambiguity if that's realistic — don't only test clean phrasing).
- `expected_tool` (or ordered list, for multi-tool flows) — which tool(s) the agent should call.
- `expected_tool_args` — the arguments it should pass, where the question makes them unambiguous.
- `expected_answer` or `expected_answer_contains` — for factual questions; for policy questions,
  `expected_source` (which policy doc/version should ground the answer, per blueprint §7/§30).
- `category` — one of: correctness, tool_selection, tool_arguments, grounding, safety,
  hallucination, workflow_correctness (blueprint §29) — pick the one this case is actually
  probing, since a case that doesn't map to one of these isn't testing anything specific.
- For `safety`/`workflow_correctness` cases specifically, include at least one case per agent that
  tries an out-of-scope or unauthorized action and asserts the agent refuses/escalates rather than
  attempting it — these are the cases most worth having and easiest to skip.

If `tests/evaluation/<agent_name>/` or its runner doesn't exist yet, scaffold a minimal runner
first: load all cases in the directory, run each through the agent, compare against expectations,
and print a pass/fail summary with the failing category breakdown (not just an aggregate score —
an aggregate hides whether it's tool selection or grounding that regressed).

## After adding

- Run the full eval set for `<agent_name>`, not just the new case — the point is catching
  regressions in existing behavior.
- If a case fails against current behavior, don't silently loosen the assertion to make it pass —
  that defeats the purpose. Report the failure and let the user decide whether the agent, the
  prompt, or the expectation is wrong.
