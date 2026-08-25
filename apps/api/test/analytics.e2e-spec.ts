import request from 'supertest';
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

describe('analytics API', () => {
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

  it('GET /analytics returns the full analytics payload (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/analytics')
      .set(authHeaders(ctx, admin));

    expect(res.status).toBe(200);
    // AnalyticsResponseDto's fields are all 12-month trend arrays of { month, value } points —
    // there's no separate "headcount" scalar or "*Trend"-suffixed field (see
    // src/modules/analytics/dto/analytics-response.dto.ts).
    expect(Array.isArray(res.body.headcount)).toBe(true);
    expect(Array.isArray(res.body.attrition)).toBe(true);
    expect(Array.isArray(res.body.timeToHire)).toBe(true);
    expect(Array.isArray(res.body.leaveUtilization)).toBe(true);
    expect(Array.isArray(res.body.payrollSpend)).toBe(true);
    expect(Array.isArray(res.body.performanceDist)).toBe(true);
  });

  it('GET /analytics reflects the current headcount', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    await employeeUser(ctx, tenant, roles);
    await employeeUser(ctx, tenant, roles);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/analytics')
      .set(authHeaders(ctx, admin));

    expect(res.status).toBe(200);
    // 3 created employees (two employeeUser + admin) all belong to the same tenant; the current
    // month is the last point in the cumulative-hires headcount trend.
    const currentMonthHeadcount = res.body.headcount[res.body.headcount.length - 1].value;
    expect(currentMonthHeadcount).toBe(3);
  });

  it('unauthenticated request to /analytics returns 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/analytics');
    expect(res.status).toBe(401);
  });
});
