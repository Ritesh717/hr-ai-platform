# E2E test suite

Playwright suite implementing the cases in [`docs/e2e-test-plan.md`](../../../docs/e2e-test-plan.md).
Each `it(...)` title is prefixed with the plan's case ID (e.g. `EMP-04`) so failures map straight
back to the plan.

## Prerequisites

1. Infra + backend + frontend running (see the project's root `CLAUDE.md` "Common commands"):
   ```bash
   docker compose up -d mongo mongo-rs-init redis   # or an equivalent local replica-set Mongo
   # apps/api
   npm run start:dev
   # apps/web
   npm run dev
   ```
2. A seeded tenant with a manager hierarchy (the suite needs a real `hr_admin`, at least one
   `manager`, and at least one plain `employee` to log in as). From `apps/api`:
   ```bash
   npm run seed-demo-org -- --tenant-name "Test Org" --tenant-slug globex
   ```
   The default `E2E_*` env vars below already match this exact command's output. If you seed a
   different tenant/slug/password, override the env vars accordingly.

## Running

```bash
# apps/web
npm run test:e2e            # headless, all specs
npm run test:e2e:ui         # Playwright's interactive UI mode — best for debugging
npx playwright test e2e/leave.spec.ts   # a single file
npm run test:e2e:report     # open the last HTML report
```

## How auth works

`e2e/global-setup.ts` runs once before the suite: it logs in directly against the backend
(`POST /api/v1/auth/login`) as the seeded `hr_admin`, then looks up one seeded `manager` and one
seeded `employee` from `GET /api/v1/employees` and logs in as each too. It writes three Playwright
`storageState` files to `e2e/.auth/{admin,manager,employee}.json` (gitignored) — each just contains
the JWT under the same `localStorage` key the app itself uses (`hr_ai_access_token`), so no browser
UI login is needed per test. It also writes `e2e/.auth/test-users.json` with each account's id,
email, name — import via `loadTestUsers()` from `./fixtures`.

Spec files opt into a role like:

```ts
import { test } from "@playwright/test";
import { STATE } from "./fixtures";

test.use({ storageState: STATE.manager });
```

`auth.spec.ts` is the one file that deliberately does **not** use a saved storageState — it drives
the real login form.

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `E2E_WEB_URL` | `http://localhost:3000` | Frontend base URL |
| `E2E_API_URL` | `http://localhost:3001` | Backend base URL (global setup only) |
| `E2E_TENANT_SLUG` | `globex` | Workspace slug to log into |
| `E2E_ADMIN_EMAIL` | `admin@globex.com` | Seeded HR admin email |
| `E2E_SEED_PASSWORD` | `DemoPassw0rd!2026` | Shared password for every seeded account |

## What's covered vs. not yet automated

Every P0/P1 case from the plan has a corresponding test. A handful of P2 cosmetic/visual cases
(exact pixel/contrast checks, drag interactions, `.ics` file *content* parsing beyond "a file
downloaded") are left as `test.fixme(...)` with the plan ID in the title so `npx playwright test
--grep-invert @fixme`-style bookkeeping stays accurate — grep for `test.fixme` to see the current
list.
