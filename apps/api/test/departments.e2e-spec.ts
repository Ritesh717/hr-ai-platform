import request from 'supertest';
import { authHeaders, clearDatabase, closeTestApp, createTenantWithRoles, createTestApp, employeeUser, hrAdmin, manager, TestContext } from './fixtures';

// Mirrors tests/api/test_departments_api.py.
describe('departments API', () => {
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

  it('HR admin can create a department (201)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/departments')
      .set(authHeaders(ctx, admin))
      .send({ name: 'Engineering' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Engineering');
  });

  it('a plain employee cannot create a department (403)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/departments')
      .set(authHeaders(ctx, employee))
      .send({ name: 'Sales' });

    expect(res.status).toBe(403);
  });

  it('an employee can list departments (DEPARTMENT_READ is in the base template)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer()).get('/api/v1/departments').set(authHeaders(ctx, employee));

    expect(res.status).toBe(200);
  });

  it('a manager cannot delete a department (403), HR admin can (204)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);
    const mgr = await manager(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/departments')
      .set(authHeaders(ctx, admin))
      .send({ name: 'Ops' });
    const departmentId = create.body.id;

    const managerAttempt = await request(ctx.app.getHttpServer())
      .delete(`/api/v1/departments/${departmentId}`)
      .set(authHeaders(ctx, mgr));
    expect(managerAttempt.status).toBe(403);

    const adminAttempt = await request(ctx.app.getHttpServer())
      .delete(`/api/v1/departments/${departmentId}`)
      .set(authHeaders(ctx, admin));
    expect(adminAttempt.status).toBe(204);
  });
});
