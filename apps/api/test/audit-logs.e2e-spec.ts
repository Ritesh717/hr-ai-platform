import request from 'supertest';
import { RoleName } from '../src/modules/rbac/constants/permission-code.enum';
import { authHeaders, clearDatabase, closeTestApp, createTenantWithRoles, createTestApp, employeeUser, hrAdmin, manager, TestContext } from './fixtures';

// Mirrors tests/api/test_audit_logs_api.py.
describe('audit logs API', () => {
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

  it('HR admin can view audit logs, including entries produced by employee mutations', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    await request(ctx.app.getHttpServer())
      .post('/api/v1/employees')
      .set(authHeaders(ctx, admin))
      .send({
        email: 'audited@example.com',
        password: 'password123',
        fullName: 'Audited',
        jobTitle: 'Engineer',
        roleId: roles[RoleName.EMPLOYEE]._id.toString(),
        hireDate: '2026-01-01',
      });

    const res = await request(ctx.app.getHttpServer()).get('/api/v1/audit-logs').set(authHeaders(ctx, admin));

    expect(res.status).toBe(200);
    expect(res.body.items.some((log: { action: string }) => log.action === 'employee.created')).toBe(true);
  });

  it('manager and employee get 403', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const mgr = await manager(ctx, tenant, roles);
    const employee = await employeeUser(ctx, tenant, roles);

    const managerRes = await request(ctx.app.getHttpServer()).get('/api/v1/audit-logs').set(authHeaders(ctx, mgr));
    const employeeRes = await request(ctx.app.getHttpServer()).get('/api/v1/audit-logs').set(authHeaders(ctx, employee));

    expect(managerRes.status).toBe(403);
    expect(employeeRes.status).toBe(403);
  });
});
