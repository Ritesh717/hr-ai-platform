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
import { ExperienceLevel, JobStatus, JobType } from '../src/modules/recruitment/schemas/job.schema';

describe('recruitment API', () => {
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

  async function seedJob(ctx: TestContext, tenantId: Types.ObjectId) {
    const model = ctx.app.get(getModelToken('Job'));
    return model.create({
      tenantId,
      title: 'Software Engineer',
      department: 'Engineering',
      location: 'London, UK',
      type: JobType.FULL_TIME,
      experienceLevel: ExperienceLevel.MID,
      description: 'Build things.',
      sections: [],
      postedAt: '2026-05-01',
      status: JobStatus.OPEN,
    });
  }

  it('GET /jobs returns open job listings (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    await seedJob(ctx, tenant._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/jobs')
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Software Engineer');
  });

  it('GET /jobs/:id returns job detail (200)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const job = await seedJob(ctx, tenant._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/jobs/${job._id.toString()}`)
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(job._id.toString());
    // JobResponseDto has a numeric matchScore (Stage 9 agent will compute it), not a
    // skillsMatch array — see dto/job.dto.ts.
    expect(typeof res.body.matchScore).toBe('number');
  });

  it('GET /jobs/:id returns 404 for unknown job (404)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/v1/jobs/${new Types.ObjectId().toString()}`)
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(404);
  });

  it('POST /jobs/:id/apply creates an application (201)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const job = await seedJob(ctx, tenant._id as Types.ObjectId);

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/v1/jobs/${job._id.toString()}/apply`)
      .set(authHeaders(ctx, emp))
      .send({ coverNote: 'I am a great fit.' });

    expect(res.status).toBe(201);
    expect(res.body.jobTitle).toBe('Software Engineer');
    expect(res.body.status).toBe('active');
  });

  it('POST /jobs/:id/apply prevents duplicate applications (409)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const job = await seedJob(ctx, tenant._id as Types.ObjectId);
    const jobId = job._id.toString();

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/apply`)
      .set(authHeaders(ctx, emp))
      .send({});

    const second = await request(ctx.app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/apply`)
      .set(authHeaders(ctx, emp))
      .send({});

    expect(second.status).toBe(409);
  });

  it("GET /applications returns the caller's applications (200)", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const job = await seedJob(ctx, tenant._id as Types.ObjectId);

    await request(ctx.app.getHttpServer())
      .post(`/api/v1/jobs/${job._id.toString()}/apply`)
      .set(authHeaders(ctx, emp))
      .send({});

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/applications')
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('PATCH /applications/:id/withdraw withdraws an active application (204)', async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const job = await seedJob(ctx, tenant._id as Types.ObjectId);

    const apply = await request(ctx.app.getHttpServer())
      .post(`/api/v1/jobs/${job._id.toString()}/apply`)
      .set(authHeaders(ctx, emp))
      .send({});

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/v1/applications/${apply.body.id}/withdraw`)
      .set(authHeaders(ctx, emp));

    // @HttpCode(204) — see application.controller.ts.
    expect(res.status).toBe(204);

    const list = await request(ctx.app.getHttpServer())
      .get('/api/v1/applications')
      .set(authHeaders(ctx, emp));
    expect(list.body[0].status).toBe('withdrawn');
  });

  it("GET /interviews returns the caller's upcoming interviews (200)", async () => {
    const { tenant, roles } = await createTenantWithRoles(ctx);
    const emp = await employeeUser(ctx, tenant, roles);
    const job = await seedJob(ctx, tenant._id as Types.ObjectId);

    const apply = await request(ctx.app.getHttpServer())
      .post(`/api/v1/jobs/${job._id.toString()}/apply`)
      .set(authHeaders(ctx, emp))
      .send({});

    const model = ctx.app.get(getModelToken('Interview'));
    await model.create({
      tenantId: tenant._id,
      applicationId: apply.body.id,
      candidateId: emp._id,
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      format: 'Video',
      panelists: [],
      agenda: [],
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/interviews')
      .set(authHeaders(ctx, emp));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].jobTitle).toBe('Software Engineer');
  });

  it('unauthenticated request to /jobs returns 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/v1/jobs');
    expect(res.status).toBe(401);
  });
});
