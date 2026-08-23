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
import { PayslipRepository } from '../src/modules/payroll/payslip.repository';
import { PayslipStatus } from '../src/modules/payroll/schemas/payslip.schema';
import { JobRepository } from '../src/modules/recruitment/repositories/job.repository';
import { ExperienceLevel, JobStatus, JobType } from '../src/modules/recruitment/schemas/job.schema';
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

// Salary bands by job title keyword
function baseSalaryForTitle(title: string, rng: () => number): number {
  const t = title.toLowerCase();
  if (t.includes('head') || t.includes('director')) return 90000 + Math.floor(rng() * 30000);
  if (t.includes('lead') || t.includes('senior') || t.includes('manager')) return 70000 + Math.floor(rng() * 20000);
  return 45000 + Math.floor(rng() * 20000);
}

async function seedPayslips(
  payslipRepo: PayslipRepository,
  employees: EmployeeDocument[],
  tenantId: string,
  rng: () => number,
): Promise<void> {
  const now = new Date();
  const MONTHS_BACK = 6;
  for (const emp of employees) {
    const gross = baseSalaryForTitle(emp.jobTitle, rng) / 12;
    const tax = gross * 0.2;
    const ni = gross * 0.12;
    const net = gross - tax - ni;
    for (let m = MONTHS_BACK; m >= 1; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = d.getFullYear();
      const month = d.getMonth(); // 0-indexed
      const periodStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const periodEnd = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
      const monthLabel = d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
      try {
        await payslipRepo.create(tenantId, {
          employeeId: (emp._id as Types.ObjectId).toString(),
          month: monthLabel,
          periodStart,
          periodEnd,
          grossAmount: Math.round(gross * 100) / 100,
          netAmount: Math.round(net * 100) / 100,
          currency: 'GBP',
          status: PayslipStatus.PAID,
          breakdown: [
            { label: 'Basic salary', amount: Math.round(gross * 100) / 100 },
            { label: 'Income tax', amount: Math.round(tax * 100) / 100, isDeduction: true },
            { label: 'National Insurance', amount: Math.round(ni * 100) / 100, isDeduction: true },
            { label: 'Net pay', amount: Math.round(net * 100) / 100, isNet: true },
          ],
        });
      } catch {
        // Unique-index violation on re-run — skip silently
      }
    }
  }
}

const JOB_POSTINGS = [
  {
    title: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'London, UK',
    type: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.SENIOR,
    description: 'Join our engineering team to build scalable backend services and APIs.',
    sections: [
      { heading: 'What you will do', body: 'Design and implement RESTful APIs, mentor junior engineers, participate in architecture reviews.' },
      { heading: 'What we are looking for', body: '5+ years backend experience, Node.js or Python, cloud infrastructure (AWS/GCP), excellent communication.' },
    ],
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote',
    type: JobType.REMOTE,
    experienceLevel: ExperienceLevel.MID,
    description: 'Drive product strategy and execution for our core HR platform.',
    sections: [
      { heading: 'What you will do', body: 'Define product roadmap, collaborate with engineering and design, gather customer insights.' },
      { heading: 'What we are looking for', body: '3+ years product management experience, strong analytical skills, Agile familiarity.' },
    ],
  },
  {
    title: 'UX Designer',
    department: 'Design',
    location: 'New York, NY',
    type: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.MID,
    description: 'Create delightful, accessible user experiences for our HR platform.',
    sections: [
      { heading: 'What you will do', body: 'Conduct user research, create wireframes and prototypes, work closely with engineers to ship polished UI.' },
      { heading: 'What we are looking for', body: '3+ years UX design experience, proficiency in Figma, portfolio demonstrating B2B SaaS work.' },
    ],
  },
  {
    title: 'Account Executive',
    department: 'Sales',
    location: 'San Francisco, CA',
    type: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.MID,
    description: 'Close enterprise deals and grow our customer base.',
    sections: [
      { heading: 'What you will do', body: 'Manage a pipeline of mid-market and enterprise prospects, run demos, negotiate contracts.' },
      { heading: 'What we are looking for', body: '3+ years SaaS sales experience, track record of quota attainment, excellent communication.' },
    ],
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: JobType.REMOTE,
    experienceLevel: ExperienceLevel.SENIOR,
    description: 'Own infrastructure, CI/CD pipelines, and platform reliability.',
    sections: [
      { heading: 'What you will do', body: 'Manage Kubernetes clusters, build deployment pipelines, drive SRE practices.' },
      { heading: 'What we are looking for', body: '4+ years DevOps/SRE experience, Kubernetes, Terraform, cloud-native monitoring.' },
    ],
  },
];

async function seedJobs(jobRepo: JobRepository, tenantId: string): Promise<void> {
  const baseDate = new Date();
  for (let i = 0; i < JOB_POSTINGS.length; i++) {
    const posting = JOB_POSTINGS[i];
    const daysAgo = 5 + i * 7;
    const postedDate = new Date(baseDate);
    postedDate.setDate(postedDate.getDate() - daysAgo);
    const postedAt = postedDate.toISOString().slice(0, 10);
    try {
      await jobRepo.create(tenantId, { ...posting, postedAt, status: JobStatus.OPEN });
    } catch {
      // Already exists — skip
    }
  }
}

async function seed(plan: SeedPlan): Promise<void> {
  const rng = makeRng(plan.seed);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const tenantService = app.get(TenantService);
    const employeeRepo = app.get(EmployeeRepository);
    const departmentRepo = app.get(DepartmentRepository);
    const roleRepo = app.get(RoleRepository);
    const payslipRepo = app.get(PayslipRepository);
    const jobRepo = app.get(JobRepository);

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

    const allEmployees: EmployeeDocument[] = [];
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
      allEmployees.push(head);
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
        allEmployees.push(lead);
        created += 1;
      }

      const titles = IC_TITLES[deptName];
      for (let i = 0; i < icCounts[di]; i++) {
        const [icName, icEmail] = nextIdentity();
        const lead = leads[i % leads.length];
        const ic = await createEmployee(employeeRepo, rng, {
          tenantId,
          departmentId: department._id as Types.ObjectId,
          managerId: lead._id as Types.ObjectId,
          role: employeeRole,
          fullName: icName,
          email: icEmail,
          hashedPassword,
          jobTitle: randomChoice(titles, rng),
        });
        allEmployees.push(ic);
        created += 1;
      }
    }

    // Seed payslips (6 months) for all employees, including the admin
    const adminDoc = await employeeRepo.getById(admin._id, tenantId);
    const payslipTargets = adminDoc ? [adminDoc, ...allEmployees] : allEmployees;
    console.log(`Seeding payslips for ${payslipTargets.length} employees (6 months each)...`);
    await seedPayslips(payslipRepo, payslipTargets, tenantId.toString(), rng);

    // Seed open job postings
    console.log(`Seeding ${JOB_POSTINGS.length} open job postings...`);
    await seedJobs(jobRepo, tenantId.toString());

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
