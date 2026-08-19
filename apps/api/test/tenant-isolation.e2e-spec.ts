import request from 'supertest';
import {
  authHeaders,
  clearDatabase,
  closeTestApp,
  createTenantWithRoles,
  createTestApp,
  hrAdmin,
  TEST_PASSWORD,
  TestContext,
} from './fixtures';

// Mirrors tests/api/test_tenant_isolation.py.
describe('tenant isolation', () => {
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

  it('an HR admin from tenant A cannot read an employee from tenant B (404, not 403)', async () => {
    const tenantA = await createTenantWithRoles(ctx, { slug: 'tenant-a' });
    const tenantB = await createTenantWithRoles(ctx, { slug: 'tenant-b' });
    const adminA = await hrAdmin(ctx, tenantA.tenant, tenantA.roles, { email: 'admin-a@example.com' });
    const employeeB = await hrAdmin(ctx, tenantB.tenant, tenantB.roles, { email: 'admin-b@example.com' });

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/employees/${employeeB._id.toString()}`)
      .set(authHeaders(ctx, adminA));

    expect(res.status).toBe(404);
  });

  it('login is scoped to tenantSlug — right email/password, wrong tenant, fails', async () => {
    const tenantA = await createTenantWithRoles(ctx, { slug: 'tenant-a' });
    const tenantB = await createTenantWithRoles(ctx, { slug: 'tenant-b' });
    await hrAdmin(ctx, tenantA.tenant, tenantA.roles, { email: 'shared@example.com' });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug: tenantB.tenant.slug, email: 'shared@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });
});
