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
  TestContext,
} from './fixtures';
import { NotificationCategory, NotificationType } from '../src/modules/notifications/schemas/notification.schema';

describe('notifications API', () => {
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

  async function seedNotification(
    ctx: TestContext,
    tenantId: Types.ObjectId,
    recipientId: Types.ObjectId,
    overrides: Partial<{ read: boolean; dismissed: boolean; title: string }> = {},
  ) {
    const model = ctx.app.get(getModelToken('Notification'));
    return model.create({
      tenantId,
      recipientId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.UPDATE,
      title: overrides.title ?? 'Test notification',
      body: 'A test notification body.',
      read: overrides.read ?? false,
      dismissed: overrides.dismissed ?? false,
      actions: [],
    });
  }

  it("GET /notifications returns only the caller's notifications (200)", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const other = await employeeUser(ctx, tenant, roles);

    await seedNotification(ctx, tenant._id as Types.ObjectId, emp._id as Types.ObjectId, { title: 'Mine' });
    await seedNotification(ctx, tenant._id as Types.ObjectId, other._id as Types.ObjectId, { title: 'Others' });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/notifications')
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Mine');
  });

  it('PATCH /notifications/:id/read marks a notification read (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const notif = await seedNotification(ctx, tenant._id as Types.ObjectId, emp._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/notifications/${notif._id.toString()}/read`)
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  it("PATCH /notifications/:id/read returns 404 for another employee's notification", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const other = await employeeUser(ctx, tenant, roles);
    const notif = await seedNotification(ctx, tenant._id as Types.ObjectId, other._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/notifications/${notif._id.toString()}/read`)
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(404);
  });

  it('PATCH /notifications/read-all marks all caller notifications read (204)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    await seedNotification(ctx, tenant._id as Types.ObjectId, emp._id as Types.ObjectId);
    await seedNotification(ctx, tenant._id as Types.ObjectId, emp._id as Types.ObjectId, { title: 'Second' });

    const res = await request(ctx.app.getHttpServer())
      .patch('/api/v1/notifications/read-all')
      .set(authHeaders(ctx, emp));

    // @HttpCode(204) — see notification.controller.ts.
    expect(res.status).toBe(204);

    const list = await request(ctx.app.getHttpServer())
      .get('/api/v1/notifications')
      .set(authHeaders(ctx, emp));
    expect(list.body.every((n: { read: boolean }) => n.read)).toBe(true);
  });

  it('PATCH /notifications/:id/dismiss removes the notification from the list (204)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const notif = await seedNotification(ctx, tenant._id as Types.ObjectId, emp._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/notifications/${notif._id.toString()}/dismiss`)
      .set(authHeaders(ctx, emp));

    // @HttpCode(204) — see notification.controller.ts.
    expect(res.status).toBe(204);

    const list = await request(ctx.app.getHttpServer())
      .get('/api/v1/notifications')
      .set(authHeaders(ctx, emp));
    expect(list.body).toHaveLength(0);
  });

  it('unauthenticated request to /notifications returns 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });
});
