import { AuthorizationError } from '../../../common/errors/app.error';
import { DepartmentService } from '../../department/department.service';
import { EmployeeService } from '../../employee/employee.service';
import { LeaveService } from '../../leave/leave.service';
import { PermissionCode } from '../../rbac/constants/permission-code.enum';
import { buildToolSet } from './agent-tool';
import { AgentToolContext } from './agent-tool-context';
import { buildEmployeeAgentTools } from './employee-agent.tools';

// Story #2 (Stage 2 — Employee & org read tools). Exercises the three tools through the same
// buildToolSet() path the real agent runtime uses, with EmployeeService/DepartmentService mocked
// out (unit level — real-Mongo-backed authorization behavior is covered by
// test/agent-tools.e2e-spec.ts). The point of these tests is proving:
// (a) each tool calls the right domain-service method with the right args, never a repository
//     directly (CLAUDE.md rule 1), and
// (b) authorization matches what the equivalent REST call would produce (acceptance criterion).
describe('buildEmployeeAgentTools', () => {
  function context(overrides: Partial<AgentToolContext> = {}): AgentToolContext {
    return {
      tenantId: 'tenant-1',
      actorId: 'employee-1',
      actorPermissions: new Set<PermissionCode>(),
      ...overrides,
    };
  }

  function makeServices() {
    const employeeService = {
      getEmployee: jest.fn(),
      getManager: jest.fn(),
      roleNameFor: jest.fn().mockResolvedValue('employee'),
    } as unknown as jest.Mocked<EmployeeService>;
    const departmentService = {
      getDepartmentByName: jest.fn(),
    } as unknown as jest.Mocked<DepartmentService>;
    const leaveService = {
      getBalance: jest.fn(),
      listRequests: jest.fn(),
    } as unknown as jest.Mocked<LeaveService>;
    return { employeeService, departmentService, leaveService };
  }

  describe('get_employee_profile', () => {
    it("defaults to the caller's own id when employeeId is omitted, with no permission required", async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      const employee = { _id: { toString: () => 'employee-1' }, tenantId: { toString: () => 'tenant-1' }, roleId: 'role-1' };
      employeeService.getEmployee.mockResolvedValue(employee as never);

      const ctx = context(); // no permissions at all — base employee self-access
      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), ctx);

      // @ts-expect-error — ai SDK tool execute signature; second arg unused in this runtime
      await toolSet.get_employee_profile.execute!({}, {});

      expect(employeeService.getEmployee).toHaveBeenCalledWith('employee-1', {
        tenantId: 'tenant-1',
        actorId: 'employee-1',
        actorPermissions: ctx.actorPermissions,
      });
    });

    it('rejects a cross-employee lookup with the same AuthorizationError a REST call would produce', async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      employeeService.getEmployee.mockRejectedValue(new AuthorizationError("Missing required permission 'employee.read'"));

      const ctx = context({ actorPermissions: new Set() });
      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), ctx);

      await expect(
        // @ts-expect-error — see above
        toolSet.get_employee_profile.execute!({ employeeId: 'employee-2' }, {}),
      ).rejects.toThrow(AuthorizationError);
      expect(employeeService.getEmployee).toHaveBeenCalledWith('employee-2', expect.anything());
    });

    it('allows a cross-employee lookup once the caller holds EMPLOYEE_READ', async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      const employee = { _id: { toString: () => 'employee-2' }, tenantId: { toString: () => 'tenant-1' }, roleId: 'role-1' };
      employeeService.getEmployee.mockResolvedValue(employee as never);

      const ctx = context({ actorPermissions: new Set([PermissionCode.EMPLOYEE_READ]) });
      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), ctx);

      // @ts-expect-error — see above
      const result = await toolSet.get_employee_profile.execute!({ employeeId: 'employee-2' }, {});

      expect(result).toMatchObject({ id: 'employee-2' });
    });
  });

  describe('get_manager', () => {
    it("resolves the caller's own manager by default", async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      const manager = { _id: { toString: () => 'manager-1' }, tenantId: { toString: () => 'tenant-1' }, roleId: 'role-1' };
      employeeService.getManager.mockResolvedValue(manager as never);

      const ctx = context();
      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), ctx);

      // @ts-expect-error — see above
      const result = await toolSet.get_manager.execute!({}, {});

      expect(employeeService.getManager).toHaveBeenCalledWith('employee-1', {
        tenantId: 'tenant-1',
        actorId: 'employee-1',
        actorPermissions: ctx.actorPermissions,
      });
      expect(result).toMatchObject({ manager: { id: 'manager-1' } });
    });

    it('returns manager: null when the employee has no manager on file', async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      employeeService.getManager.mockResolvedValue(null);

      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), context());

      // @ts-expect-error — see above
      const result = await toolSet.get_manager.execute!({}, {});

      expect(result).toEqual({ manager: null });
    });

    it("rejects looking up another employee's manager without EMPLOYEE_READ", async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      employeeService.getManager.mockRejectedValue(new AuthorizationError("Missing required permission 'employee.read'"));

      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), context());

      await expect(
        // @ts-expect-error — see above
        toolSet.get_manager.execute!({ employeeId: 'employee-2' }, {}),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('get_department', () => {
    it('rejects the call before the handler runs when the caller lacks DEPARTMENT_READ', async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      const ctx = context({ actorPermissions: new Set() });
      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), ctx);

      await expect(
        // @ts-expect-error — see above
        toolSet.get_department.execute!({ name: 'Engineering' }, {}),
      ).rejects.toThrow(AuthorizationError);
      expect(departmentService.getDepartmentByName).not.toHaveBeenCalled();
    });

    it('looks up a department by name when the caller holds DEPARTMENT_READ', async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      const department = { _id: { toString: () => 'dept-1' }, tenantId: { toString: () => 'tenant-1' }, name: 'Engineering' };
      departmentService.getDepartmentByName.mockResolvedValue(department as never);

      const ctx = context({ actorPermissions: new Set([PermissionCode.DEPARTMENT_READ]) });
      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), ctx);

      // @ts-expect-error — see above
      const result = await toolSet.get_department.execute!({ name: 'Engineering' }, {});

      expect(departmentService.getDepartmentByName).toHaveBeenCalledWith('Engineering', {
        tenantId: 'tenant-1',
        actorPermissions: ctx.actorPermissions,
      });
      expect(result).toMatchObject({ id: 'dept-1', name: 'Engineering' });
    });
  });

  describe('get_leave_balance', () => {
    it("fetches the caller's own balance by default (no permission required for self)", async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      leaveService.getBalance.mockResolvedValue({
        employeeId: 'employee-1',
        year: 2025,
        allocatedDays: 20,
        usedDays: 5,
        remainingDays: 15,
      });

      const ctx = context();
      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), ctx);

      // @ts-expect-error — ai SDK tool execute signature
      const result = await toolSet.get_leave_balance.execute!({}, {});

      expect(leaveService.getBalance).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        actorId: 'employee-1',
        actorPermissions: ctx.actorPermissions,
        employeeId: undefined,
        year: undefined,
      });
      expect(result).toMatchObject({ remainingDays: 15 });
    });

    it('rejects a cross-employee balance query without LEAVE_READ', async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      leaveService.getBalance.mockRejectedValue(new AuthorizationError("Missing required permission 'leave.read'"));

      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), context());

      await expect(
        // @ts-expect-error — see above
        toolSet.get_leave_balance.execute!({ employeeId: 'employee-2' }, {}),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('get_pending_requests', () => {
    it("returns the caller's own pending requests (filters to pending status)", async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      leaveService.listRequests.mockResolvedValue([
        { _id: { toString: () => 'req-1' }, tenantId: { toString: () => 'tenant-1' }, employeeId: { toString: () => 'employee-1' }, type: 'vacation', startDate: new Date('2025-07-01'), endDate: new Date('2025-07-05'), status: 'pending', reason: null, approverId: null, approverComment: null, respondedAt: null },
        { _id: { toString: () => 'req-2' }, tenantId: { toString: () => 'tenant-1' }, employeeId: { toString: () => 'employee-1' }, type: 'sick', startDate: new Date('2025-06-01'), endDate: new Date('2025-06-01'), status: 'approved', reason: null, approverId: { toString: () => 'mgr-1' }, approverComment: null, respondedAt: new Date() },
      ] as never);

      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), context());

      // @ts-expect-error — see above
      const result = await toolSet.get_pending_requests.execute!({}, {});

      expect(result.total).toBe(1);
      expect(result.requests[0].status).toBe('pending');
    });
  });

  describe('get_payslip', () => {
    it('returns a stub unavailability message (payroll module not yet built)', async () => {
      const { employeeService, departmentService, leaveService } = makeServices();
      const toolSet = buildToolSet(buildEmployeeAgentTools({ employeeService, departmentService, leaveService }), context());

      // @ts-expect-error — see above
      const result = await toolSet.get_payslip.execute!({ month: 6, year: 2025 }, {});

      expect(result.status).toBe('unavailable');
      expect(result.employeeId).toBe('employee-1');
      expect(result.period).toEqual({ month: 6, year: 2025 });
    });
  });
});
