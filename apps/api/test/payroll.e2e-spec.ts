import request from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  authHeaders,
  clearDatabase,
  closeTestApp,
  createTenantWithRoles,
  createTestApp,
  employeeUser,
  hrAdmin,
  TestContext,
} from './fixtures';
import { PayslipStatus } from '../src/modules/payroll/schemas/payslip.schema';

describe('payroll API', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  afterEach(async () => {
    await clearDatabase(ctx);
  });

  async function seedPayslip(
    ctx: TestContext,
    tenantId: Types.ObjectId,
    employeeId: Types.ObjectId,
    overrides: Partial<{ periodStart: string; month: string }> = {},
  ) {
    const model = ctx.app.get(getModelToken('Payslip'));
    return model.create({
      tenantId,
      employeeId,
      month: overrides.month ?? 'January 2026',
      periodStart: overrides.periodStart ?? '2026-01-01',
      periodEnd: '2026-01-31',
      grossAmount: 5000,
      netAmount: 3800,
      currency: 'GBP',
      status: PayslipStatus.PAID,
      breakdown: [
        { label: 'Basic salary', amount: 5000 },
        { label: 'Income tax', amount: 1000, isDeduction: true },
        { label: 'National Insurance', amount: 200, isDeduction: true },
        { label: 'Net pay', amount: 3800, isNet: true },
      ],
    });
  }

  it("GET /payroll/payslips returns the authenticated employee's payslips (200)", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    await seedPayslip(ctx, tenant._id as Types.ObjectId, emp._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/payroll/payslips')
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].grossAmount).toBe(5000);
  });

  it("GET /payroll/payslips does not return another employee's payslips", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const other = await hrAdmin(ctx, tenant, roles);
    await seedPayslip(ctx, tenant._id as Types.ObjectId, other._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/payroll/payslips')
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('GET /payroll/payslips/:id returns a specific payslip (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const slip = await seedPayslip(ctx, tenant._id as Types.ObjectId, emp._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/payroll/payslips/${slip._id.toString()}`)
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(slip._id.toString());
    expect(res.body.netAmount).toBe(3800);
    expect(Array.isArray(res.body.breakdown)).toBe(true);
  });

  it("GET /payroll/payslips/:id returns 404 for another employee's payslip", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const other = await hrAdmin(ctx, tenant, roles);
    const slip = await seedPayslip(ctx, tenant._id as Types.ObjectId, other._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/payroll/payslips/${slip._id.toString()}`)
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(404);
  });

  it('GET /payroll/summary returns YTD and latest net for the caller (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const year = new Date().getFullYear();
    await seedPayslip(ctx, tenant._id as Types.ObjectId, emp._id as Types.ObjectId, {
      periodStart: `${year}-01-01`,
      month: `January ${year}`,
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/payroll/summary')
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body.ytdEarnings).toBe(5000);
    expect(res.body.netSalary).toBe(3800);
  });

  it('unauthenticated request to /payroll/summary returns 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/payroll/summary');
    expect(res.status).toBe(401);
  });

  describe('PUT /payroll/config', () => {
    function configBody(employeeId: string, overrides: Partial<Record<string, unknown>> = {}) {
      return {
        employeeId,
        grossSalary: 65000,
        currency: 'GBP',
        employmentType: 'Full-time',
        nextPayDate: '2026-09-01',
        ...overrides,
      };
    }

    it('an HR admin can set another employee\'s payroll config (200), not just their own', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const admin = await hrAdmin(ctx, tenant, roles);
      const target = await employeeUser(ctx, tenant, roles);

      const res = await request(ctx.app.getHttpServer())
        .put('/api/v1/payroll/config')
        .set(authHeaders(ctx, admin))
        .send(configBody(target._id.toString()));

      expect(res.status).toBe(200);

      // Verify it was the target's config that was written, not the admin's own.
      const targetSummary = await request(ctx.app.getHttpServer())
        .get('/api/v1/payroll/summary')
        .set(authHeaders(ctx, target));
      expect(targetSummary.body.grossSalary).toBe(65000);

      const adminSummary = await request(ctx.app.getHttpServer())
        .get('/api/v1/payroll/summary')
        .set(authHeaders(ctx, admin));
      expect(adminSummary.body.grossSalary).toBe(0);
    });

    it('a caller without PAYROLL_MANAGE gets 403', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const emp = await employeeUser(ctx, tenant, roles);
      const target = await employeeUser(ctx, tenant, roles);

      const res = await request(ctx.app.getHttpServer())
        .put('/api/v1/payroll/config')
        .set(authHeaders(ctx, emp))
        .send(configBody(target._id.toString()));

      expect(res.status).toBe(403);
    });

    it('rejects a target employeeId from another tenant (404)', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const admin = await hrAdmin(ctx, tenant, roles);

      const { tenant: otherTenant, roles: otherRoles } = await createTenantWithRoles(ctx, {
        name: 'Other Corp',
      });
      const otherTenantEmployee = await employeeUser(ctx, otherTenant, otherRoles);

      const res = await request(ctx.app.getHttpServer())
        .put('/api/v1/payroll/config')
        .set(authHeaders(ctx, admin))
        .send(configBody(otherTenantEmployee._id.toString()));

      expect(res.status).toBe(404);
    });

    it('rejects an unknown employeeId (404)', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const admin = await hrAdmin(ctx, tenant, roles);

      const res = await request(ctx.app.getHttpServer())
        .put('/api/v1/payroll/config')
        .set(authHeaders(ctx, admin))
        .send(configBody(new Types.ObjectId().toString()));

      expect(res.status).toBe(404);
    });

    it('rejects a malformed employeeId (422) rather than erroring', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const admin = await hrAdmin(ctx, tenant, roles);

      const res = await request(ctx.app.getHttpServer())
        .put('/api/v1/payroll/config')
        .set(authHeaders(ctx, admin))
        .send(configBody('not-a-valid-object-id'));

      expect(res.status).toBe(422);
    });
  });
});
