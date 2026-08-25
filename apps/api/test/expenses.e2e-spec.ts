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

  // ExpenseItemCreateDto requires currency per-item (not just report-level) — see
  // src/modules/expenses/dto/expense-report-create.dto.ts.
  const sampleItems = [
    { description: 'Taxi', amount: 25, category: 'travel', date: '2026-05-01', currency: 'GBP' },
    { description: 'Lunch', amount: 15, category: 'meals', date: '2026-05-01', currency: 'GBP' },
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

  it("GET /expenses returns only the caller's reports", async () => {
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

  it('PATCH /expenses/:id/approve rejects non-submitted report (422)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    // Approving requires expense.approve, which the base employee role template doesn't grant
    // (see default-role-templates.ts) — use an hr_admin as the approver, matching real usage.
    const admin = await hrAdmin(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/expenses')
      .set(authHeaders(ctx, emp))
      .send({ title: 'Draft', currency: 'GBP', items: sampleItems });

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/expenses/${create.body.id}/approve`)
      .set(authHeaders(ctx, admin));

    // ExpenseService raises Nest's BadRequestException for this state-transition rule, which
    // HttpExceptionFilter deliberately maps to 422 (validation_error) alongside DTO failures —
    // there's no 400 in this codebase's AppError hierarchy (see http-exception.filter.ts).
    expect(res.status).toBe(422);
  });

  it('PATCH /expenses/:id/approve approves a submitted report (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const admin = await hrAdmin(ctx, tenant, roles);

    const create = await request(ctx.app.getHttpServer())
      .post('/api/v1/expenses')
      .set(authHeaders(ctx, emp))
      .send({ title: 'Submitted', currency: 'GBP', status: 'submitted', items: sampleItems });

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/expenses/${create.body.id}/approve`)
      .set(authHeaders(ctx, admin));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  it('unauthenticated request to /expenses returns 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/expenses');
    expect(res.status).toBe(401);
  });
});
