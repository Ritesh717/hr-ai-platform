import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AuthorizationError, NotFoundError } from '../src/common/errors/app.error';
import { DepartmentService } from '../src/modules/department/department.service';
import { EmployeeService } from '../src/modules/employee/employee.service';
import { LeaveService } from '../src/modules/leave/leave.service';
import { LeaveRequestCreateDto } from '../src/modules/leave/dto/leave-request-create.dto';
import { LeaveType } from '../src/modules/leave/schemas/leave-request.schema';
import { PayrollService } from '../src/modules/payroll/payroll.service';
import { PayslipStatus } from '../src/modules/payroll/schemas/payslip.schema';
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
  hrAdmin,
  manager,
  TestContext,
} from './fixtures';

// Stories #2 and #3 (Stage 2 — Employee/org + leave/payroll read tools). Unlike
// tools/employee-agent.tools.spec.ts (mocked services), this drives the real, Mongo-backed
// services the running app wires up — proving the tools go through domain services end to end
// (CLAUDE.md rule 1) and that unauthorized lookups are rejected with the same AuthorizationError
// a REST call would produce, against real data.
function toolContext(overrides: Partial<AgentToolContext>): AgentToolContext {
  return { tenantId: '', actorId: '', actorPermissions: new Set(), ...overrides };
}

describe('Employee Agent read tools (real domain services)', () => {
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
    const leaveService = ctx.app.get(LeaveService);
    const payrollService = ctx.app.get(PayrollService);
    return buildEmployeeAgentTools({ employeeService, departmentService, leaveService, payrollService });
  }

  // Mirrors test/payroll.e2e-spec.ts's seedPayslip helper — writes a Payslip document directly
  // (no PayrollService.createPayslip() call needed; that method requires PAYROLL_MANAGE, which
  // is irrelevant to what get_payslip is testing here).
  async function seedPayslip(
    tenantId: Types.ObjectId,
    employeeId: Types.ObjectId,
    overrides: Partial<{ periodStart: string; month: string }> = {},
  ) {
    const model = ctx.app.get(getModelToken('Payslip'));
    return model.create({
      tenantId,
      employeeId,
      month: overrides.month ?? 'June 2025',
      periodStart: overrides.periodStart ?? '2025-06-01',
      periodEnd: '2025-06-30',
      grossAmount: 5000,
      netAmount: 3800,
      currency: 'GBP',
      status: PayslipStatus.PAID,
      breakdown: [
        { label: 'Basic salary', amount: 5000 },
        { label: 'Income tax', amount: 1000, isDeduction: true },
        { label: 'National Insurance', amount: 200, isDeduction: true },
        { label: 'Net pay', amount: 3800, isNet: true },
      ],
    });
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

    it('returns manager: null (not a NotFoundError) when managerId points at a deleted employee', async () => {
      // deleteEmployee() never clears managerId on that manager's former reports, so this is a
      // realistic, non-exceptional state ("my manager left the company") — see
      // EmployeeService.getManager()'s doc comment.
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const mgr = await manager(ctx, tenant, roles);
      const report = await employeeUser(ctx, tenant, roles, { managerId: mgr._id });

      const employeeService = ctx.app.get(EmployeeService);
      await employeeService.deleteEmployee(mgr._id.toString(), {
        tenantId: tenant._id.toString(),
        actorId: mgr._id.toString(),
        actorPermissions: new Set([PermissionCode.EMPLOYEE_DELETE]),
      });

      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: report._id.toString() }),
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

  // Story #3 (Stage 2 — leave & payroll read tools).
  describe('get_leave_balance', () => {
    it("returns the caller's own balance with no permissions needed (self-access)", async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);
      const leaveService = ctx.app.get(LeaveService);

      // Seed an approved leave request so usedDays > 0
      await leaveService.createRequest(
        { type: LeaveType.VACATION, startDate: '2025-07-01', endDate: '2025-07-05' } as LeaveRequestCreateDto,
        { tenantId: tenant._id.toString(), actorId: employee._id.toString() },
      );

      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      // @ts-expect-error — ai SDK tool execute signature
      const result = await toolSet.get_leave_balance.execute!({ year: 2025 }, {});

      expect(result).toMatchObject({
        employeeId: employee._id.toString(),
        year: 2025,
        allocatedDays: 20,
      });
      // The request is still pending (not approved), so usedDays should be 0
      expect(result.usedDays).toBe(0);
      expect(result.remainingDays).toBe(20);
    });

    it('rejects a cross-employee balance query when the caller lacks LEAVE_READ', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles, { email: 'e1@example.com' });
      const other = await employeeUser(ctx, tenant, roles, { email: 'e2@example.com' });

      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      await expect(
        // @ts-expect-error — see above
        toolSet.get_leave_balance.execute!({ employeeId: other._id.toString() }, {}),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('get_pending_requests', () => {
    it("returns only the caller's pending requests (not approved/rejected)", async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);
      const leaveService = ctx.app.get(LeaveService);

      await leaveService.createRequest(
        { type: LeaveType.VACATION, startDate: '2025-07-01', endDate: '2025-07-03' } as LeaveRequestCreateDto,
        { tenantId: tenant._id.toString(), actorId: employee._id.toString() },
      );

      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      // @ts-expect-error — see above
      const result = await toolSet.get_pending_requests.execute!({}, {});

      expect(result.total).toBe(1);
      expect(result.requests[0].status).toBe('pending');
    });

    it('returns an empty list when the caller has no pending requests', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);

      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      // @ts-expect-error — see above
      const result = await toolSet.get_pending_requests.execute!({}, {});

      expect(result.total).toBe(0);
      expect(result.requests).toHaveLength(0);
    });
  });

  // Story #3 (Stage 2 — leave & payroll read tools), fixed to a real PayrollService-backed
  // implementation by issue #184.
  describe('get_payslip', () => {
    it("returns the caller's real payslip for the requested month/year, Mongo-backed (issue #184)", async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);
      const slip = await seedPayslip(tenant._id as Types.ObjectId, employee._id as Types.ObjectId);

      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      // @ts-expect-error — see above
      const result = await toolSet.get_payslip.execute!({ month: 6, year: 2025 }, {});

      expect(result.found).toBe(true);
      expect(result.employeeId).toBe(employee._id.toString());
      expect(result.period).toEqual({ month: 6, year: 2025 });
      expect(result.payslip).toMatchObject({
        id: slip._id.toString(),
        grossAmount: 5000,
        netAmount: 3800,
        currency: 'GBP',
      });
    });

    it('returns found: false with no salary data when the caller has no payslip for that period', async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles);

      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      // @ts-expect-error — see above
      const result = await toolSet.get_payslip.execute!({ month: 6, year: 2025 }, {});

      expect(result.found).toBe(false);
      expect(result.employeeId).toBe(employee._id.toString());
      expect(result.period).toEqual({ month: 6, year: 2025 });
      // No raw salary data to leak — verify it genuinely isn't present (blueprint §28)
      expect(result).not.toHaveProperty('payslip');
      expect(result).not.toHaveProperty('grossAmount');
      expect(result).not.toHaveProperty('netAmount');
    });

    it("never returns another employee's payslip — the tool has no employeeId input at all (self-only)", async () => {
      const { tenant, roles } = await createTenantWithRoles(ctx);
      const employee = await employeeUser(ctx, tenant, roles, { email: 'e1@example.com' });
      const other = await hrAdmin(ctx, tenant, roles, { email: 'e2@example.com' });
      await seedPayslip(tenant._id as Types.ObjectId, other._id as Types.ObjectId);

      const toolSet = buildToolSet(
        tools(),
        toolContext({ tenantId: tenant._id.toString(), actorId: employee._id.toString() }),
      );

      // Even though the LLM's tool-call arguments are attacker/model-controlled, the schema has
      // no employeeId field to pass — only month/year reach the handler, so this proves the
      // handler itself can't be steered onto another employee's data even by extra JSON keys an
      // unvalidated model output might include.
      // @ts-expect-error — see above
      const result = await toolSet.get_payslip.execute!({ month: 6, year: 2025, employeeId: other._id.toString() }, {});

      expect(result.found).toBe(false);
      expect(result.employeeId).toBe(employee._id.toString());
    });
  });
});
