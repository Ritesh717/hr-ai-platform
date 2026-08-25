import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Connection, Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/errors/http-exception.filter';
import { EmployeeDocument, EmployeeStatus } from '../src/modules/employee/schemas/employee.schema';
import { RoleName } from '../src/modules/rbac/constants/permission-code.enum';
import { RoleService } from '../src/modules/rbac/role.service';
import { RoleDocument } from '../src/modules/rbac/schemas/role.schema';
import { TenantDocument } from '../src/modules/tenant/schemas/tenant.schema';
import { hashPassword } from '../src/common/auth/security';

export const TEST_PASSWORD = 'correct-horse-battery-staple';

export interface TestContext {
  app: INestApplication;
  mongod: MongoMemoryReplSet;
}

// Mirrors tests/conftest.py's `client`/`connection` fixtures: a real Mongo instance (replica-set
// mode, so Mongoose transactions work) started fresh per test file, torn down after.
export async function createTestApp(): Promise<TestContext> {
  // storageEngine must be pinned explicitly — on Windows the default engine selection can start
  // a mongod that immediately fassert()s in replica-set mode.
  const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = mongod.getUri('hr_ai_platform_test');
  process.env.JWT_SECRET = 'test-secret';

  const app = await NestFactory.create(AppModule, { logger: false });
  // Mirror main.ts setup so test routing matches production.
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'live', 'ready'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return { app, mongod };
}

export async function closeTestApp(ctx: TestContext): Promise<void> {
  await ctx.app.close();
  await ctx.mongod.stop();
}

// Mirrors the SAVEPOINT-rollback isolation tests/conftest.py gets from the DB transaction
// fixture: here we just drop every collection between tests since there's no cheap Mongo
// equivalent to a rolled-back SQL transaction across a whole test.
export async function clearDatabase(ctx: TestContext): Promise<void> {
  const connection = ctx.app.get<Connection>(getConnectionToken());
  const collections = await connection.db!.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function createTenantWithRoles(ctx: TestContext, overrides: { name?: string; slug?: string } = {}) {
  const tenantModel = ctx.app.get(getModelToken('Tenant'));
  const tenant: TenantDocument = await tenantModel.create({
    name: overrides.name ?? 'Acme Corp',
    slug: overrides.slug ?? `acme-${new Types.ObjectId().toString()}`,
  });
  const roleService = ctx.app.get(RoleService);
  const roles = await roleService.seedDefaultRoles(tenant._id as Types.ObjectId);
  return { tenant, roles };
}

export async function createDepartment(ctx: TestContext, tenant: TenantDocument, name = 'Engineering') {
  const departmentModel = ctx.app.get(getModelToken('Department'));
  return departmentModel.create({ tenantId: tenant._id, name });
}

export async function createEmployee(
  ctx: TestContext,
  tenant: TenantDocument,
  role: RoleDocument,
  overrides: Partial<{
    email: string;
    fullName: string;
    jobTitle: string;
    status: EmployeeStatus;
    departmentId: Types.ObjectId | null;
    managerId: Types.ObjectId | null;
  }> = {},
): Promise<EmployeeDocument> {
  const employeeModel = ctx.app.get(getModelToken('Employee'));
  const hashedPassword = await hashPassword(TEST_PASSWORD);
  return employeeModel.create({
    tenantId: tenant._id,
    roleId: role._id,
    email: overrides.email ?? `${new Types.ObjectId().toString()}@example.com`,
    hashedPassword,
    fullName: overrides.fullName ?? 'Test Employee',
    jobTitle: overrides.jobTitle ?? 'Engineer',
    status: overrides.status ?? EmployeeStatus.ACTIVE,
    hireDate: new Date('2024-01-01'),
    departmentId: overrides.departmentId ?? null,
    managerId: overrides.managerId ?? null,
  });
}

// Each call defaults to a fresh unique email (createEmployee's own default) rather than a fixed
// one — callers that invoke the same helper more than once within a tenant (e.g. two
// employeeUser() calls to test a headcount of N) would otherwise collide on the
// uq_employee_tenant_email index. Pass `overrides.email` for tests that need a known address.
export function hrAdmin(ctx: TestContext, tenant: TenantDocument, roles: Record<RoleName, RoleDocument>, overrides = {}) {
  return createEmployee(ctx, tenant, roles[RoleName.HR_ADMIN], overrides);
}

export function manager(ctx: TestContext, tenant: TenantDocument, roles: Record<RoleName, RoleDocument>, overrides = {}) {
  return createEmployee(ctx, tenant, roles[RoleName.MANAGER], overrides);
}

export function employeeUser(ctx: TestContext, tenant: TenantDocument, roles: Record<RoleName, RoleDocument>, overrides = {}) {
  return createEmployee(ctx, tenant, roles[RoleName.EMPLOYEE], overrides);
}

export function authHeaders(ctx: TestContext, actor: EmployeeDocument): Record<string, string> {
  const jwtService = ctx.app.get(JwtService);
  const token = jwtService.sign({
    sub: actor._id.toString(),
    tenant_id: actor.tenantId.toString(),
    role_id: actor.roleId.toString(),
  });
  return { Authorization: `Bearer ${token}` };
}
