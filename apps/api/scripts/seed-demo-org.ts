/**
 * Seed a full demo organization: one tenant, 7 departments, and 150 employees
 * in a proper 4-level reporting hierarchy (HR Admin -> Department Heads -> Team
 * Leads -> Individual Contributors), each with a realistic designation.
 *
 * Usage:
 *   npm run seed-demo-org
 *   npm run seed-demo-org -- --tenant-name "Globex Corporation" --tenant-slug globex
 *   npm run seed-demo-org -- --password "Passw0rd!2026" --user-count 150
 *
 * Safe to re-run with a different --tenant-slug; re-running with the same slug fails
 * cleanly (ConflictError) rather than creating duplicates, since it goes through the
 * same TenantService.bootstrap used by scripts/bootstrap-tenant.ts.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import { hashPassword } from '../src/common/auth/security';
import { AppError } from '../src/common/errors/app.error';
import { DepartmentRepository } from '../src/modules/department/department.repository';
import { EmployeeRepository } from '../src/modules/employee/employee.repository';
import { EmployeeDocument, EmployeeStatus } from '../src/modules/employee/schemas/employee.schema';
import { RoleName } from '../src/modules/rbac/constants/permission-code.enum';
import { RoleRepository } from '../src/modules/rbac/role.repository';
import { RoleDocument } from '../src/modules/rbac/schemas/role.schema';
import { TenantService } from '../src/modules/tenant/tenant.service';

const TEAM_LEADS_PER_DEPARTMENT = 2;
const LOCATIONS = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'London, UK', 'Remote'];
const ON_LEAVE_FRACTION = 0.05;

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Priya', 'Wei',
  'Arjun', 'Fatima', 'Diego', 'Elena', 'Kenji', 'Amara', 'Liam', 'Sofia',
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Patel', 'Chen', 'Kumar', 'Nakamura', 'Okafor', 'Silva', 'Kowalski', 'Muller',
];

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'People', 'Finance'];

const IC_TITLES: Record<string, string[]> = {
  Engineering: ['Software Engineer', 'Senior Software Engineer', 'QA Engineer', 'DevOps Engineer'],
  Product: ['Product Analyst', 'Associate Product Manager', 'Product Manager'],
  Design: ['UX Designer', 'UI Designer', 'Design Researcher'],
  Sales: ['Sales Development Rep', 'Account Executive', 'Customer Success Manager'],
  Marketing: ['Marketing Associate', 'Content Marketing Specialist', 'Growth Marketing Manager'],
  People: ['HR Generalist', 'Talent Acquisition Specialist', 'People Operations Coordinator'],
  Finance: ['Financial Analyst', 'Accountant', 'Accounts Payable Specialist'],
};

interface SeedPlan {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  password: string;
  userCount: number;
  seed?: number;
}

// Mulberry32 — small seedable PRNG so --seed reproduces the Python original's
// `random.seed(args.seed)` behavior; falls back to Math.random when unseeded.
function makeRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function uniqueNames(count: number, rng: () => number): [string, string][] {
  const pool: [string, string][] = [];
  for (const first of FIRST_NAMES) {
    for (const last of LAST_NAMES) pool.push([first, last]);
  }
  if (count > pool.length) {
    throw new Error(`Need ${count} unique names but only ${pool.length} combinations available`);
  }
  return shuffle(pool, rng).slice(0, count);
}

function uniqueEmail(first: string, last: string, domain: string, taken: Set<string>): string {
  const base = `${first}.${last}`.toLowerCase().replace(/\s+/g, '');
  let email = `${base}@${domain}`;
  let suffix = 2;
  while (taken.has(email)) {
    email = `${base}${suffix}@${domain}`;
    suffix += 1;
  }
  taken.add(email);
  return email;
}

function randomHireDate(rng: () => number): Date {
  const daysAgo = 30 + Math.floor(rng() * (5 * 365 - 30 + 1));
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function randomChoice<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

async function createEmployee(
  repository: EmployeeRepository,
  rng: () => number,
  params: {
    tenantId: Types.ObjectId;
    departmentId: Types.ObjectId;
    managerId: Types.ObjectId;
    role: RoleDocument;
    fullName: string;
    email: string;
    hashedPassword: string;
    jobTitle: string;
  },
): Promise<EmployeeDocument> {
  const status = rng() < ON_LEAVE_FRACTION ? EmployeeStatus.ON_LEAVE : EmployeeStatus.ACTIVE;
  return repository.create({
    tenantId: params.tenantId,
    departmentId: params.departmentId,
    managerId: params.managerId,
    roleId: params.role._id as Types.ObjectId,
    email: params.email,
    hashedPassword: params.hashedPassword,
    fullName: params.fullName,
    jobTitle: params.jobTitle,
    status,
    hireDate: randomHireDate(rng),
    location: randomChoice(LOCATIONS, rng),
  });
}

async function seed(plan: SeedPlan): Promise<void> {
  const rng = makeRng(plan.seed);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const tenantService = app.get(TenantService);
    const employeeRepo = app.get(EmployeeRepository);
    const departmentRepo = app.get(DepartmentRepository);
    const roleRepo = app.get(RoleRepository);

    const { tenant, admin } = await tenantService.bootstrap({
      tenantName: plan.tenantName,
      tenantSlug: plan.tenantSlug,
      adminEmail: plan.adminEmail,
      adminPassword: plan.password,
      adminFullName: 'HR Administrator',
    });
    const tenantId = tenant._id as Types.ObjectId;

    const managerRole = await roleRepo.getByName(RoleName.MANAGER, tenantId);
    const employeeRole = await roleRepo.getByName(RoleName.EMPLOYEE, tenantId);
    if (!managerRole || !employeeRole) {
      throw new Error('Seeded default roles are missing — bootstrap did not run as expected');
    }

    const hashedPassword = await hashPassword(plan.password);
    const emailsTaken = new Set<string>([plan.adminEmail]);
    const domain = `${plan.tenantSlug}.com`;

    // 1 (admin) + 7 (heads) + 7*TEAM_LEADS_PER_DEPARTMENT (leads) + ICs = userCount
    const leadsTotal = DEPARTMENTS.length * TEAM_LEADS_PER_DEPARTMENT;
    const icCount = plan.userCount - 1 - DEPARTMENTS.length - leadsTotal;
    if (icCount < DEPARTMENTS.length) {
      throw new Error(
        `--user-count ${plan.userCount} is too small for ${DEPARTMENTS.length} departments with ` +
          `a head + ${TEAM_LEADS_PER_DEPARTMENT} team leads each`,
      );
    }

    const names = uniqueNames(plan.userCount - 1, rng); // -1: admin already created
    let nameIndex = 0;
    const nextIdentity = (): [string, string] => {
      const [first, last] = names[nameIndex++];
      const fullName = `${first} ${last}`;
      const email = uniqueEmail(first, last, domain, emailsTaken);
      return [fullName, email];
    };

    // Distribute ICs across departments proportionally, at least 1 each.
    const base = Math.floor(icCount / DEPARTMENTS.length);
    const extra = icCount % DEPARTMENTS.length;
    const icCounts = DEPARTMENTS.map((_, i) => base + (i < extra ? 1 : 0));

    let created = 0;
    for (let di = 0; di < DEPARTMENTS.length; di++) {
      const deptName = DEPARTMENTS[di];
      const department = await departmentRepo.create({ tenantId, name: deptName });

      const [headName, headEmail] = nextIdentity();
      const head = await createEmployee(employeeRepo, rng, {
        tenantId,
        departmentId: department._id as Types.ObjectId,
        managerId: admin._id as Types.ObjectId,
        role: managerRole,
        fullName: headName,
        email: headEmail,
        hashedPassword,
        jobTitle: `Head of ${deptName}`,
      });
      created += 1;

      const leads: EmployeeDocument[] = [];
      for (let l = 0; l < TEAM_LEADS_PER_DEPARTMENT; l++) {
        const [leadName, leadEmail] = nextIdentity();
        const lead = await createEmployee(employeeRepo, rng, {
          tenantId,
          departmentId: department._id as Types.ObjectId,
          managerId: head._id as Types.ObjectId,
          role: managerRole,
          fullName: leadName,
          email: leadEmail,
          hashedPassword,
          jobTitle: `${deptName} Team Lead`,
        });
        leads.push(lead);
        created += 1;
      }

      const titles = IC_TITLES[deptName];
      for (let i = 0; i < icCounts[di]; i++) {
        const [icName, icEmail] = nextIdentity();
        const lead = leads[i % leads.length];
        await createEmployee(employeeRepo, rng, {
          tenantId,
          departmentId: department._id as Types.ObjectId,
          managerId: lead._id as Types.ObjectId,
          role: employeeRole,
          fullName: icName,
          email: icEmail,
          hashedPassword,
          jobTitle: randomChoice(titles, rng),
        });
        created += 1;
      }
    }

    const total = 1 + created;
    console.log(
      `Seeded tenant '${tenant.slug}' (${tenantId.toString()}) with ${total} employees across ` +
        `${DEPARTMENTS.length} departments.`,
    );
    console.log(
      `HR admin login -> workspace: ${tenant.slug}  email: ${admin.email}  password: ${plan.password}`,
    );
    console.log(`All ${total - 1} other seeded employees share the same password.`);
  } catch (err) {
    if (err instanceof AppError) {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    } else {
      throw err;
    }
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (key && value !== undefined) args[key] = value;
  }
  return args;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const tenantSlug = args['tenant-slug'] ?? 'globex';
  const plan: SeedPlan = {
    tenantName: args['tenant-name'] ?? 'Globex Corporation',
    tenantSlug,
    adminEmail: args['admin-email'] ?? `admin@${tenantSlug}.com`,
    password: args['password'] ?? 'DemoPassw0rd!2026',
    userCount: args['user-count'] ? parseInt(args['user-count'], 10) : 150,
    seed: args.seed ? parseInt(args.seed, 10) : undefined,
  };

  seed(plan).catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

main();
