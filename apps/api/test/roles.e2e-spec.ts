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
import { PermissionCode, RoleName } from '../src/modules/rbac/constants/permission-code.enum';

// Mirrors tests/api/test_roles_api.py.
describe('roles API', () => {
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

  it('HR admin can list/create/update/delete roles', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const list = await request(ctx.app.getHttpServer()).get('/api/v1/roles').set(authHeaders(ctx, admin));
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBe(3);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/roles')
      .set(authHeaders(ctx, admin))
      .send({ name: 'recruiter', permissionCodes: [PermissionCode.EMPLOYEE_READ] });
    expect(create.status).toBe(201);

    const update = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/roles/${create.body.id}`)
      .set(authHeaders(ctx, admin))
      .send({ description: 'Handles hiring' });
    expect(update.status).toBe(200);
    expect(update.body.description).toBe('Handles hiring');

    const remove = await request(ctx.app.getHttpServer())
      .delete(`/api/v1/roles/${create.body.id}`)
      .set(authHeaders(ctx, admin));
    expect(remove.status).toBe(204);
  });

  it('a non-admin gets 403 on role management', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer()).get('/api/v1/roles').set(authHeaders(ctx, employee));
    expect(res.status).toBe(403);
  });

  it('rejects a duplicate role name (409)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/roles')
      .set(authHeaders(ctx, admin))
      .send({ name: RoleName.MANAGER, permissionCodes: [] });

    expect(res.status).toBe(409);
  });

  it('blocks deleting a role still assigned to an employee (409)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);
    await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .delete(`/api/v1/roles/${roles[RoleName.EMPLOYEE]._id.toString()}`)
      .set(authHeaders(ctx, admin));

    expect(res.status).toBe(409);
  });

  it('allows deleting an unused role (204)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/roles')
      .set(authHeaders(ctx, admin))
      .send({ name: 'unused-role', permissionCodes: [] });

    const res = await request(ctx.app.getHttpServer())
      .delete(`/api/v1/roles/${create.body.id}`)
      .set(authHeaders(ctx, admin));

    expect(res.status).toBe(204);
  });

  it('blocks stripping RBAC_MANAGE from the only role that grants it (409)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);
    // Only the HR Admin employee (via the hr_admin role) holds RBAC_MANAGE in this tenant.

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/roles/${roles[RoleName.HR_ADMIN]._id.toString()}`)
      .set(authHeaders(ctx, admin))
      .send({ permissionCodes: [PermissionCode.EMPLOYEE_READ] });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/no one able to manage roles/);
  });

  it('lists the global permission catalog', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const admin = await hrAdmin(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer()).get('/api/v1/permissions').set(authHeaders(ctx, admin));

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(Object.values(PermissionCode).length);
  });
});
