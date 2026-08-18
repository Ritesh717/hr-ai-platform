---
name: new-agent-tool
description: "Scaffold a new agent tool (the function an LLM agent calls) wired to a domain service with a declared permission, never direct DB access. Use whenever an agent needs a new capability — get_leave_balance, create_leave_request, etc."
---

# /new-agent-tool

Scaffolds a tool in `apps/agent_service/tools/` for the OpenAI Agents SDK, enforcing blueprint §23
(every tool declares the permission it requires) and §3.1 (`Agent -> Tool -> Domain Service ->
Repository`, never `Agent -> raw SQL`). The LLM must never be the thing deciding whether an action
is authorized — this skill exists so that check is structural, not a prompt instruction that can
be ignored or injected around.

## Usage

```
/new-agent-tool <tool_name> --domain <domain> --permission <permission.scope>
  e.g. /new-agent-tool get_leave_balance --domain leave --permission employee.leave.read
  e.g. /new-agent-tool create_leave_request --domain leave --permission employee.leave.write
```

If `--permission` is omitted, stop and ask what permission scope this action requires rather than
guessing — an under-scoped or missing permission is a security bug, not a style nit.

## What to create

1. `apps/agent_service/tools/<domain>/<tool_name>.py`:
   - A Pydantic model for the tool's input arguments (explicit types, no free-form dicts).
   - The tool function itself, decorated per the OpenAI Agents SDK's tool-definition convention.
   - The function body does exactly one thing: validate input, call the corresponding
     `domain/<domain>/service.py` method with the caller's identity/context, and return a
     structured result. **No business logic, no DB access, no authorization decisions inside the
     tool** — those live in the service (see `new-domain-module`). If the needed service method
     doesn't exist yet, say so and stop rather than adding business logic here to make it work.
   - A docstring/description written for the *model* to read (what this tool does, when to use
     it, what it returns) — this is prompt content, keep it precise and free of internal jargon.
2. Register the tool's required permission in whatever permission registry `shared/auth/` uses
   (create `shared/auth/tool_permissions.py` as a simple name -> scope mapping if it doesn't exist
   yet). The agent runtime should check this mapping against the caller's grants before invoking
   the tool — if that enforcement point doesn't exist yet in `apps/agent_service/`, flag it as a
   blocker rather than silently shipping an unenforced tool.
3. `tests/agent/test_<tool_name>.py`: a test that calls the tool with (a) an authorized identity
   and valid args — expect success, (b) an unauthorized identity — expect a permission denial, not
   a raised exception from deep inside the service.
4. Remind the user (in your response, not silently) whether this tool's action is high-impact per
   blueprint §3.3/§34 (payroll, termination, compensation, access, compliance) — if so, it needs a
   human-approval gate before execution, not a direct call. Don't wire the gate yourself unless
   the human-in-the-loop mechanism already exists in this repo; otherwise just flag it clearly.

## After scaffolding

- If this is the first tool for a given agent, also create/update
  `apps/agent_service/agents/<domain>_agent.py` registering the tool, and a versioned prompt file
  under `apps/agent_service/prompts/<domain>/v1.txt` (blueprint §17/§31 — prompts are versioned
  artifacts, not inline strings).
- Suggest an `agent-eval-case` for this tool so it has at least one golden-dataset entry before
  being considered done.
