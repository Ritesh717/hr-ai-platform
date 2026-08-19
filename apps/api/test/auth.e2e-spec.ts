import request from 'supertest';
import { EmployeeStatus } from '../src/modules/employee/schemas/employee.schema';
import {
  clearDatabase,
  closeTestApp,
  createTenantWithRoles,
  createTestApp,
  hrAdmin,
  TEST_PASSWORD,
  TestContext,
} from './fixtures';

// Mirrors tests/api/test_auth_api.py.
describe('auth', () => {
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

  it('logs in with valid credentials', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug: tenant.slug, email: admin.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.tokenType).toBe('bearer');
  });

  it('rejects wrong password', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug: tenant.slug, email: admin.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('authentication_error');
  });

  it('rejects unknown tenant slug', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug: 'no-such-tenant', email: 'a@b.com', password: 'whatever1' });

    expect(res.status).toBe(401);
  });

  it('rejects a terminated employee', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles, { status: EmployeeStatus.TERMINATED });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug: tenant.slug, email: admin.email, password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/no longer active/);
  });

  it('rejects a protected endpoint without a token', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/employees');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/employees')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
