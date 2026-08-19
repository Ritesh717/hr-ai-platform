import { RoleName } from '../src/modules/rbac/constants/permission-code.enum';
import request from 'supertest';
import { Types } from 'mongoose';
import {
  authHeaders,
  clearDatabase,
  closeTestApp,
  createTenantWithRoles,
  createTestApp,
  employeeUser,
  hrAdmin,
  manager,
  TestContext,
} from './fixtures';

// Mirrors tests/api/test_employees_api.py.
describe('employees API', () => {
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

  it('HR admin can create an employee (201)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/employees')
      .set(authHeaders(ctx, admin))
      .send({
        email: 'new-hire@example.com',
        password: 'password123',
        fullName: 'New Hire',
        jobTitle: 'Engineer',
        roleId: roles[RoleName.EMPLOYEE]._id.toString(),
        hireDate: '2026-01-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('new-hire@example.com');
    expect(res.body.role).toBe('employee');
  });

  it('a plain employee cannot create an employee (403)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/employees')
      .set(authHeaders(ctx, employee))
      .send({
        email: 'x@example.com',
        password: 'password123',
        fullName: 'X',
        jobTitle: 'Y',
        roleId: roles[RoleName.EMPLOYEE]._id.toString(),
        hireDate: '2026-01-01',
      });

    expect(res.status).toBe(403);
  });

  it('rejects a duplicate email within the tenant (409)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const payload = {
      email: 'dupe@example.com',
      password: 'password123',
      fullName: 'Dupe',
      jobTitle: 'Y',
      roleId: roles[RoleName.EMPLOYEE]._id.toString(),
      hireDate: '2026-01-01',
    };
    await request(ctx.app.getHttpServer()).post('/api/v1/employees').set(authHeaders(ctx, admin)).send(payload);
    const res = await request(ctx.app.getHttpServer()).post('/api/v1/employees').set(authHeaders(ctx, admin)).send(payload);

    expect(res.status).toBe(409);
  });

  it('an employee can read their own profile without EMPLOYEE_READ', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/employees/${employee._id.toString()}`)
      .set(authHeaders(ctx, employee));

    expect(res.status).toBe(200);
  });

  it('an employee reading another employee gets 403', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles, { email: 'e1@example.com' });
    const other = await employeeUser(ctx, tenant, roles, { email: 'e2@example.com' });

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/employees/${other._id.toString()}`)
      .set(authHeaders(ctx, employee));

    expect(res.status).toBe(403);
  });

  it('a manager can list employees but a plain employee cannot', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const mgr = await manager(ctx, tenant, roles);
    const employee = await employeeUser(ctx, tenant, roles, { email: 'e3@example.com' });

    const managerRes = await request(ctx.app.getHttpServer()).get('/api/v1/employees').set(authHeaders(ctx, mgr));
    const employeeRes = await request(ctx.app.getHttpServer()).get('/api/v1/employees').set(authHeaders(ctx, employee));

    expect(managerRes.status).toBe(200);
    expect(employeeRes.status).toBe(403);
  });

  it('an employee can self-update a non-privileged field (jobTitle)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/employees/${employee._id.toString()}`)
      .set(authHeaders(ctx, employee))
      .send({ jobTitle: 'Senior Engineer' });

    expect(res.status).toBe(200);
    expect(res.body.jobTitle).toBe('Senior Engineer');
  });

  it('an employee attempting self role-escalation gets 403', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/employees/${employee._id.toString()}`)
      .set(authHeaders(ctx, employee))
      .send({ roleId: roles[RoleName.HR_ADMIN]._id.toString() });

    expect(res.status).toBe(403);
  });

  it('HR admin can delete (204), manager cannot (403)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);
    const mgr = await manager(ctx, tenant, roles);
    const target = await employeeUser(ctx, tenant, roles, { email: 'target@example.com' });

    const managerAttempt = await request(ctx.app.getHttpServer())
      .delete(`/api/v1/employees/${target._id.toString()}`)
      .set(authHeaders(ctx, mgr));
    expect(managerAttempt.status).toBe(403);

    const adminAttempt = await request(ctx.app.getHttpServer())
      .delete(`/api/v1/employees/${target._id.toString()}`)
      .set(authHeaders(ctx, admin));
    expect(adminAttempt.status).toBe(204);
  });

  it('returns 404 for a nonexistent employee', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/employees/${new Types.ObjectId().toString()}`)
      .set(authHeaders(ctx, admin));

    expect(res.status).toBe(404);
  });
});
