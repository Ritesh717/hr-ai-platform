import { getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { RoleName } from '../src/modules/rbac/constants/permission-code.enum';
import {
  authHeaders,
  clearDatabase,
  closeTestApp,
  createEmployee,
  createTenantWithRoles,
  createTestApp,
  employeeUser,
  hrAdmin,
  manager,
  TestContext,
} from './fixtures';

describe('leave API', () => {
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

  it('an employee can request their own leave with no permission (201)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/leave/requests')
      .set(authHeaders(ctx, employee))
      .send({ type: 'vacation', startDate: '2026-06-01', endDate: '2026-06-03' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.days).toBe(3);
  });

  it('a plain employee cannot approve leave (403), a manager can (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);
    const mgr = await manager(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/leave/requests')
      .set(authHeaders(ctx, employee))
      .send({ type: 'sick', startDate: '2026-07-10', endDate: '2026-07-10' });
    const requestId = create.body.id;

    const employeeAttempt = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/leave/requests/${requestId}/status`)
      .set(authHeaders(ctx, employee))
      .send({ status: 'approved' });
    expect(employeeAttempt.status).toBe(403);

    const managerAttempt = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/leave/requests/${requestId}/status`)
      .set(authHeaders(ctx, mgr))
      .send({ status: 'approved' });
    expect(managerAttempt.status).toBe(200);
    expect(managerAttempt.body.status).toBe('approved');
  });

  it("reading your own balance needs no permission; reading another's needs LEAVE_READ (403 without it, 200 with)", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);
    const other = await createEmployee(ctx, tenant, roles[RoleName.EMPLOYEE], { email: 'other@example.com' });
    const admin = await hrAdmin(ctx, tenant, roles);

    const roleModel = ctx.app.get(getModelToken('Role'));
    const bareRole = await roleModel.create({ tenantId: tenant._id, name: 'no_leave_read', permissions: [] });
    const bareEmployee = await createEmployee(ctx, tenant, bareRole, { email: 'bare@example.com' });

    const selfBalance = await request(ctx.app.getHttpServer())
      .get('/api/v1/leave/balance')
      .set(authHeaders(ctx, employee));
    expect(selfBalance.status).toBe(200);
    expect(selfBalance.body.allocatedDays).toBe(20);

    const bareAttempt = await request(ctx.app.getHttpServer())
      .get(`/api/v1/leave/balance?employeeId=${other._id.toString()}`)
      .set(authHeaders(ctx, bareEmployee));
    expect(bareAttempt.status).toBe(403);

    const adminAttempt = await request(ctx.app.getHttpServer())
      .get(`/api/v1/leave/balance?employeeId=${other._id.toString()}`)
      .set(authHeaders(ctx, admin));
    expect(adminAttempt.status).toBe(200);
  });

  it('approved leave counts toward balance usedDays', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);
    const mgr = await manager(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/leave/requests')
      .set(authHeaders(ctx, employee))
      .send({ type: 'vacation', startDate: '2026-03-01', endDate: '2026-03-05' });
    await request(ctx.app.getHttpServer())
      .patch(`/api/v1/leave/requests/${create.body.id}/status`)
      .set(authHeaders(ctx, mgr))
      .send({ status: 'approved' });

    const balance = await request(ctx.app.getHttpServer())
      .get('/api/v1/leave/balance?year=2026')
      .set(authHeaders(ctx, employee));
    expect(balance.body.usedDays).toBe(5);
    expect(balance.body.remainingDays).toBe(15);
  });

  it("a manager sees a direct report's approved leave on /leave/team, and pending leave via ?status=pending", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const mgr = await manager(ctx, tenant, roles);
    const report = await createEmployee(ctx, tenant, roles[RoleName.EMPLOYEE], {
      email: 'report@example.com',
      managerId: mgr._id,
    });

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/leave/requests')
      .set(authHeaders(ctx, report))
      .send({ type: 'personal', startDate: '2026-05-01', endDate: '2026-05-01' });

    const pending = await request(ctx.app.getHttpServer())
      .get('/api/v1/leave/team?status=pending')
      .set(authHeaders(ctx, mgr));
    expect(pending.status).toBe(200);
    expect(pending.body).toHaveLength(1);
    expect(pending.body[0].requestId).toBe(create.body.id);

    await request(ctx.app.getHttpServer())
      .patch(`/api/v1/leave/requests/${create.body.id}/status`)
      .set(authHeaders(ctx, mgr))
      .send({ status: 'approved' });

    const team = await request(ctx.app.getHttpServer()).get('/api/v1/leave/team').set(authHeaders(ctx, mgr));
    expect(team.status).toBe(200);
    expect(team.body).toHaveLength(1);
    expect(team.body[0].employeeId).toBe(report._id.toString());
  });

  it('holidays are readable by anyone but only writable with LEAVE_MANAGE', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);
    const admin = await hrAdmin(ctx, tenant, roles);

    const employeeAttempt = await request(ctx.app.getHttpServer())
      .post('/api/v1/leave/holidays')
      .set(authHeaders(ctx, employee))
      .send({ name: 'New Year', date: '2026-01-01' });
    expect(employeeAttempt.status).toBe(403);

    const adminCreate = await request(ctx.app.getHttpServer())
      .post('/api/v1/leave/holidays')
      .set(authHeaders(ctx, admin))
      .send({ name: 'New Year', date: '2026-01-01' });
    expect(adminCreate.status).toBe(201);

    const list = await request(ctx.app.getHttpServer()).get('/api/v1/leave/holidays').set(authHeaders(ctx, employee));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });
});
