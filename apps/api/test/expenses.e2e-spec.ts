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

describe('expenses API', () => {
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

  const sampleItems = [
    { description: 'Taxi', amount: 25, category: 'travel', date: '2026-05-01' },
    { description: 'Lunch', amount: 15, category: 'meals', date: '2026-05-01' },
  ];

  it('POST /expenses creates a draft report (201)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/expenses')
      .set(authHeaders(ctx, emp))
      .send({ title: 'May Trip', currency: 'GBP', items: sampleItems });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.total).toBe(40);
    expect(res.body.items).toHaveLength(2);
  });

  it('GET /expenses returns only the caller's reports', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const other = await hrAdmin(ctx, tenant, roles);

    await request(ctx.app.getHttpServer())
      .post('/api/v1/expenses')
      .set(authHeaders(ctx, emp))
      .send({ title: 'Mine', currency: 'GBP', items: sampleItems });

    await request(ctx.app.getHttpServer())
      .post('/api/v1/expenses')
      .set(authHeaders(ctx, other))
      .send({ title: 'Others', currency: 'GBP', items: sampleItems });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/expenses')
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Mine');
  });

  it('DELETE /expenses/:id deletes a draft report (204)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/expenses')
      .set(authHeaders(ctx, emp))
      .send({ title: 'Delete me', currency: 'GBP', items: sampleItems });
    const id = create.body.id;

    const del = await request(ctx.app.getHttpServer())
      .delete(`/api/v1/expenses/${id}`)
      .set(authHeaders(ctx, emp));

    expect(del.status).toBe(204);
  });

  it('PATCH /expenses/:id/approve rejects non-submitted report (400)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/expenses')
      .set(authHeaders(ctx, emp))
      .send({ title: 'Draft', currency: 'GBP', items: sampleItems });

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/expenses/${create.body.id}/approve`)
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(400);
  });

  it('PATCH /expenses/:id/approve approves a submitted report (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/expenses')
      .set(authHeaders(ctx, emp))
      .send({ title: 'Submitted', currency: 'GBP', status: 'submitted', items: sampleItems });

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/expenses/${create.body.id}/approve`)
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  it('unauthenticated request to /expenses returns 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/expenses');
    expect(res.status).toBe(401);
  });
});
