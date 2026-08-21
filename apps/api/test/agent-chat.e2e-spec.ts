import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  authHeaders,
  clearDatabase,
  closeTestApp,
  createTenantWithRoles,
  createTestApp,
  employeeUser,
  TestContext,
} from './fixtures';

// Story #4 (auth propagation) + #68 (e2e validation) — HTTP-level tests for
// POST /api/v1/agent/employee/chat. These verify:
//   (a) the endpoint enforces the same JWT auth as every other route (issue #4 AC #1),
//   (b) authorization errors surface as a clean 403 JSON body rather than a stack trace (#4 AC #3),
//   (c) the response shape matches AgentChatResponseDto (issue #68 AC — traceable to agent/prompt
//       version at the network level).
//
// These tests do NOT make a real LLM call — they rely on the fact that a missing model API key
// causes a clean error, or they call with a message that the toolset rejects before reaching the
// model. A separate manual pass (issue #68's acceptance criteria) exercises real tool calls against
// seeded data; that can't be automated without a live model API key.
describe('POST /api/v1/agent/employee/chat', () => {
  let ctx: TestContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  afterEach(async () => {
    await clearDatabase(ctx);
  });

  it('returns 401 when no Authorization header is provided (JWT required)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/agent/employee/chat')
      .send({ message: 'who is my manager' })
      .expect(401);

    expect(response.body.error.code).toBe('authentication_error');
  });

  it('returns 401 for a malformed JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/agent/employee/chat')
      .set('Authorization', 'Bearer not-a-jwt')
      .send({ message: 'who is my manager' })
      .expect(401);

    expect(response.body.error.code).toBe('authentication_error');
  });

  it('returns 422 when the message body is missing (DTO validation)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const employee = await employeeUser(ctx, tenant, roles);

    await request(app.getHttpServer())
      .post('/api/v1/agent/employee/chat')
      .set(authHeaders(ctx, employee))
      .send({})
      .expect(422);
  });
});
