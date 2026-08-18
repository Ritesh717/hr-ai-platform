---
name: new-screen
description: "Scaffold a new screen/page from ui-plan.md's screen list (§5) by composing existing components only, with loading/empty/error states wired in. Use when building out one of the app's pages, not for one-off component work."
---

# /new-screen

Scaffolds a screen listed in [`ui-plan.md`](../../../ui-plan.md) §5, wired into the Next.js App
Router and the `AppShell`. A screen's job is composition, not invention — it assembles
`components/ui`, `components/patterns`, `components/layout`, and `components/chat` pieces; it
does not define its own button, card, or input.

## Usage

```
/new-screen <ScreenName> --section <letter from ui-plan.md §5, e.g. C> --route <path>
  e.g. /new-screen MyLeave --section C --route /leave
  e.g. /new-screen EmployeesDirectory --section G --route /employees
```

## Before creating anything

1. Read the matching entry in `ui-plan.md` §5 for this screen and note which components it's
   expected to compose (e.g. Employees Directory → `DataTable`; Approvals Center →
   `ApprovalRequestCard`) — build with those, don't reinvent an equivalent inline.
2. Check `apps/web/components/` for every component the screen needs. If one doesn't exist yet,
   stop and scaffold it with `new-ui-component` first — don't write a one-off version inline to
   avoid the detour; that's exactly the drift `ui-plan.md` §1 ("one component library, everywhere")
   is meant to prevent.
3. Check which backend stage this screen pairs with (`ui-plan.md` §6). If that backend stage isn't
   built yet, the screen should still be built against a typed mock in `apps/web/lib/api/mocks/`
   rather than blocking — say so, and note it as a known mock in the PR/commit rather than a silent
   TODO.

## What to create

1. `apps/web/app/<route>/page.tsx` — thin: renders the screen's `features/` component inside the
   existing `AppShell`/`PageHeader` layout. No business logic here.
2. `apps/web/features/<domain>/<ScreenName>.tsx` — the actual screen: data fetching (TanStack
   Query hook, typed against the backend schema or the mock), composed from existing components,
   and the screen-specific interaction logic (this is where domain logic is allowed to live, unlike
   `components/`).
3. `apps/web/features/<domain>/api.ts` (or extend it) — the typed query/mutation hooks this screen
   uses, kept separate from the component so the data layer is testable/reusable independent of
   rendering.
4. Required states, not optional: loading (`Skeleton`-based), empty (`EmptyState`), and error
   (`ErrorState`) — a screen without all three isn't done, per `ui-plan.md` §8.
5. If the screen surfaces a high-impact/human-in-the-loop action (approvals, terminations,
   compensation, access), confirm it uses `ConfirmDialog` or the chat's `ApprovalRequestCard`
   pattern rather than firing the action directly on click — mirrors the backend's human-approval
   rule (blueprint §3.3/§34) on the frontend side.

## After scaffolding

- Verify the screen renders inside `AppShell` correctly at both a narrow and wide viewport.
- If this was the last screen needed for a `ui-plan.md` §6 UI stage (F1–F11), note that in your
  summary so the user can mark the stage complete — use `phase-gate` to actually check it before
  declaring it done.
