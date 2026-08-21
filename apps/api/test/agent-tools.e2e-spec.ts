import { AuthorizationError, NotFoundError } from '../src/common/errors/app.error';
import { DepartmentService } from '../src/modules/department/department.service';
import { EmployeeService } from '../src/modules/employee/employee.service';
import { PermissionCode } from '../src/modules/rbac/constants/permission-code.enum';
import { buildToolSet } from '../src/modules/agent/tools/agent-tool';
import { AgentToolContext } from '../src/modules/agent/tools/agent-tool-context';
import { buildEmployeeAgentTools } from '../src/modules/agent/tools/employee-agent.tools';
import {
  clearDatabase,
  closeTestApp,
  createDepartment,
  createTenantWithRoles,
  createTestApp,
  employeeUser,
  manager,
  TestContext,
} from './fixtures';

// Story #2 (Stage 2 — Employee & org read tools). Unlike tools/employee-agent.tools.spec.ts
// (mocked EmployeeService/DepartmentService), this drives the real, Mongo-backed services the
// running app wires up (same DI graph AgentModule uses) — proving the tools genuinely go through
// EmployeeService/DepartmentService end to end (CLAUDE.md rule 1) and that "unauthorized
// cross-employee lookups are rejected with the same AuthorizationError a REST call would produce"
// (the story's own acceptance criterion) against real data, not a stand-in.
function toolContext(overrides: Partial<AgentToolContext>): AgentToolContext {
  return { tenantId: '', actorId: '', actorPermissions: new Set(), ...overrides };
}

describe('Employee Agent read tools (real EmployeeService/DepartmentService)', () => {
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

  function tools() {
    const employeeService = ctx.app.get(EmployeeService);
    const departmentService = ctx.app.get(DepartmentService);
    return buildEmployeeAgentTools({ employeeService, departmentService });
  }

  describe('get_employee_profile', () => {
    it("returns the caller's own profile with no permissions granted (matches REST self-access)", async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);
      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      // @ts-expect-error — ai SDK tool execute signature; second arg unused in this runtime
      const result = await toolSet.get_employee_profile.execute!({}, {});

      expect(result).toMatchObject({ id: employee._id.toString(), email: employee.email });
    });

    it('rejects a cross-employee lookup with the same AuthorizationError a REST call would produce', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles, { email: 'e1@example.com' });
      const other = await employeeUser(ctx, tenant, roles, { email: 'e2@example.com' });
      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      await expect(
        // @ts-expect-error — see above
        toolSet.get_employee_profile.execute!({ employeeId: other._id.toString() }, {}),
      ).rejects.toThrow(AuthorizationError);
    });

    it('allows a cross-employee lookup once the caller holds EMPLOYEE_READ (e.g. a manager)', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const mgr = await manager(ctx, tenant, roles);
      const report = await employeeUser(ctx, tenant, roles, { email: 'report@example.com' });
      const toolSet = buildToolSet(
        tools(),
        toolContext({
          tenantId: tenant._id.toString(),
          actorId: mgr._id.toString(),
          actorPermissions: new Set([PermissionCode.EMPLOYEE_READ]),
        }),
      );

      // @ts-expect-error — see above
      const result = await toolSet.get_employee_profile.execute!({ employeeId: report._id.toString() }, {});

      expect(result).toMatchObject({ id: report._id.toString() });
    });
  });

  describe('get_manager', () => {
    it("resolves the caller's own manager with no permissions granted", async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const mgr = await manager(ctx, tenant, roles);
      const report = await employeeUser(ctx, tenant, roles, { managerId: mgr._id });
      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: report._id.toString() }),
      );

      // @ts-expect-error — see above
      const result = await toolSet.get_manager.execute!({}, {});

      expect(result).toMatchObject({ manager: { id: mgr._id.toString() } });
    });

    it('returns manager: null when the employee has no manager on file', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);
      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      // @ts-expect-error — see above
      const result = await toolSet.get_manager.execute!({}, {});

      expect(result).toEqual({ manager: null });
    });

    it("rejects looking up another employee's manager without EMPLOYEE_READ", async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles, { email: 'e1@example.com' });
      const other = await employeeUser(ctx, tenant, roles, { email: 'e2@example.com' });
      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      await expect(
        // @ts-expect-error — see above
        toolSet.get_manager.execute!({ employeeId: other._id.toString() }, {}),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('get_department', () => {
    it('resolves a department by name for a base employee (DEPARTMENT_READ is in the base template)', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);
      await createDepartment(ctx, tenant, 'Engineering');
      const toolSet = buildToolSet(
        tools(),
        toolContext({
          tenantId: tenant._id.toString(),
          actorId: employee._id.toString(),
          actorPermissions: new Set([PermissionCode.DEPARTMENT_READ]),
        }),
      );

      // @ts-expect-error — see above
      const result = await toolSet.get_department.execute!({ name: 'engineering' }, {}); // case-insensitive

      expect(result).toMatchObject({ name: 'Engineering' });
    });

    it('rejects the call when the caller lacks DEPARTMENT_READ — the LLM never decides this', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);
      await createDepartment(ctx, tenant, 'Engineering');
      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString(), actorPermissions: new Set() }),
      );

      await expect(
        // @ts-expect-error — see above
        toolSet.get_department.execute!({ name: 'Engineering' }, {}),
      ).rejects.toThrow(AuthorizationError);
    });

    it('raises NotFoundError for an unknown department name', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);
      const toolSet = buildToolSet(
        tools(),
        toolContext({
          tenantId: tenant._id.toString(),
          actorId: employee._id.toString(),
          actorPermissions: new Set([PermissionCode.DEPARTMENT_READ]),
        }),
      );

      await expect(
        // @ts-expect-error — see above
        toolSet.get_department.execute!({ name: 'Nonexistent' }, {}),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
