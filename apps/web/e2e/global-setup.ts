import fs from "node:fs";
import path from "node:path";

// Logs in as three real seeded accounts (hr_admin, manager, employee) directly against the
// backend's /auth/login endpoint, then writes Playwright storageState files so spec files can
// `test.use({ storageState: STATE.<role> })` instead of re-doing a UI login in every test.
//
// The frontend stores its JWT under a single localStorage key (see lib/auth/token.ts:
// TOKEN_KEY = "hr_ai_access_token") — that's simple enough to construct a valid storageState
// from an API-obtained token directly, without ever opening a browser here.

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001";
const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";
const TENANT_SLUG = process.env.E2E_TENANT_SLUG ?? "globex";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@globex.com";
const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? "DemoPassw0rd!2026";

const AUTH_DIR = path.join(__dirname, ".auth");
const TOKEN_KEY = "hr_ai_access_token";

interface EmployeeListItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

interface LoginResult {
  accessToken: string;
}

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantSlug: TENANT_SLUG, email, password }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `[e2e global-setup] Login failed for ${email} (workspace "${TENANT_SLUG}"): ${res.status} ${body}\n` +
        `Seed a tenant first, e.g. from apps/api:\n` +
        `  npm run seed-demo-org -- --tenant-name "Test Org" --tenant-slug ${TENANT_SLUG}\n` +
        `and/or set E2E_TENANT_SLUG / E2E_ADMIN_EMAIL / E2E_SEED_PASSWORD to match your seeded tenant.`,
    );
  }
  const data = (await res.json()) as LoginResult;
  return data.accessToken;
}

function writeStorageState(name: string, token: string) {
  const state = {
    cookies: [],
    origins: [
      {
        origin: WEB_URL,
        localStorage: [{ name: TOKEN_KEY, value: token }],
      },
    ],
  };
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(path.join(AUTH_DIR, `${name}.json`), JSON.stringify(state, null, 2));
}

export default async function globalSetup() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const adminToken = await login(ADMIN_EMAIL, SEED_PASSWORD);
  writeStorageState("admin", adminToken);

  const listRes = await fetch(`${API_URL}/api/v1/employees?limit=200`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!listRes.ok) {
    throw new Error(`[e2e global-setup] Could not list employees to find manager/employee test accounts: ${listRes.status}`);
  }
  const { items } = (await listRes.json()) as { items: EmployeeListItem[] };

  const managerUser = items.find((e) => e.role === "manager" && e.status === "active");
  const employeeUser = items.find((e) => e.role === "employee" && e.status === "active");
  const adminUser = items.find((e) => e.email === ADMIN_EMAIL);

  if (!managerUser) {
    throw new Error(
      `[e2e global-setup] No active employee with role "manager" found in tenant "${TENANT_SLUG}". ` +
        `seed-demo-org normally seeds a manager hierarchy — re-seed the tenant.`,
    );
  }
  if (!employeeUser) {
    throw new Error(
      `[e2e global-setup] No active employee with role "employee" found in tenant "${TENANT_SLUG}".`,
    );
  }

  const managerToken = await login(managerUser.email, SEED_PASSWORD);
  writeStorageState("manager", managerToken);

  const employeeToken = await login(employeeUser.email, SEED_PASSWORD);
  writeStorageState("employee", employeeToken);

  const testUsers = {
    tenantSlug: TENANT_SLUG,
    password: SEED_PASSWORD,
    admin: adminUser
      ? { id: adminUser.id, email: adminUser.email, name: adminUser.fullName, role: adminUser.role }
      : { id: "", email: ADMIN_EMAIL, name: "", role: "hr_admin" },
    manager: { id: managerUser.id, email: managerUser.email, name: managerUser.fullName, role: managerUser.role },
    employee: { id: employeeUser.id, email: employeeUser.email, name: employeeUser.fullName, role: employeeUser.role },
  };
  fs.writeFileSync(path.join(AUTH_DIR, "test-users.json"), JSON.stringify(testUsers, null, 2));

  // eslint-disable-next-line no-console
  console.log(
    `[e2e global-setup] Ready — admin=${testUsers.admin.email} manager=${testUsers.manager.email} (${testUsers.manager.name}) employee=${testUsers.employee.email} (${testUsers.employee.name})`,
  );
}
