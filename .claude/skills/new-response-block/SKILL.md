---
name: new-response-block
description: "Add a new ResponseRenderer block type (text, citation, tool-call, table, chart, approval-request, refusal, ...) so a new agent capability gets a chat renderer without redesigning the chat. Use whenever an agent starts returning a new kind of structured content."
---

# /new-response-block

Extends `ResponseRenderer` (ui-plan.md §4.4) with a new content-block type. This is the seam that
makes the chat UI extensible as agents gain capabilities (blueprint's later stages: analytics
charts, candidate cards, workflow status, ...) — a new capability should mean "register a block
renderer," never "touch the chat shell."

## Usage

```
/new-response-block <BlockType>
  e.g. /new-response-block interview_feedback_summary
  e.g. /new-response-block workflow_status
```

## Before creating anything

Check whether `apps/agent_service/` already has (or plans) a corresponding Pydantic schema for
this structured output. The frontend block type and the backend's response-block schema must agree
on shape — if the backend side doesn't exist yet, coordinate the shape explicitly (ask, or check
`apps/agent_service/tools/` for the tool that will produce this data) rather than inventing a
shape unilaterally that the backend then has to conform to.

## What to create

1. Extend the shared discriminated union type for chat content blocks (wherever
   `ResponseRenderer`'s block types are defined, e.g. `apps/web/components/chat/blocks/types.ts`)
   with the new `type` literal and its payload shape.
2. `apps/web/components/chat/blocks/<BlockType>Block.tsx` — a **presentational-only** component:
   it renders the given payload and, if it has actions (e.g. an approval card's Approve/Reject),
   calls callback props passed in — it does not fetch data or manage its own async state. Style it
   with existing `components/ui`/`components/patterns` pieces (`Card`, `Badge`, `Button`, `Avatar`,
   `DataTable`, `ChartCard`, ...) rather than new one-off markup.
3. Register it in the `ResponseRenderer` block-type registry so `type: "<BlockType>"` in a message
   resolves to this component.
4. A mock fixture of this block's data under `apps/web/lib/mocks/` so it can be visually verified
   in a chat without a live agent call — the chat surface has no Storybook, so this fixture is the
   only way to iterate on the block's look without round-tripping through the real agent.
5. If this block represents a high-impact/human-in-the-loop action (approve/reject something
   consequential), it must follow the `ApprovalRequestCard` pattern — explicit action buttons with
   confirmation, never an auto-executing action embedded in a chat bubble (blueprint §3.3/§34).

## After scaffolding

- Confirm the block renders correctly for realistic payloads, including any edge case the backend
  schema allows (e.g. a citation block with zero sources, a data table block with an empty result
  set) — the registry should degrade to a sensible empty/error state per block, not throw.
- Note in your summary which backend response type this block now expects, so the agent-service
  side can be built or updated to match without re-deriving the contract.
