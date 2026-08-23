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
    expect(typeof res.body.headcount).toBe('number');
    expect(Array.isArray(res.body.headcountTrend)).toBe(true);
    expect(Array.isArray(res.body.leaveUtilizationTrend)).toBe(true);
    expect(Array.isArray(res.body.payrollSpendTrend)).toBe(true);
    expect(Array.isArray(res.body.attritionTrend)).toBe(true);
    expect(Array.isArray(res.body.timeToHireTrend)).toBe(true);
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
    // 3 created employees (two employeeUser + admin) all belong to the same tenant
    expect(res.body.headcount).toBe(3);
  });

  it('unauthenticated request to /analytics returns 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/analytics');
    expect(res.status).toBe(401);
  });
});
