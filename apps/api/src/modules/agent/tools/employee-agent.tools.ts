import { z } from 'zod';
import { DepartmentService } from '../../department/department.service';
import { DepartmentResponseDto } from '../../department/dto/department-response.dto';
import { EmployeeResponseDto } from '../../employee/dto/employee-response.dto';
import { EmployeeService } from '../../employee/employee.service';
import { LeaveRequestResponseDto } from '../../leave/dto/leave-request-response.dto';
import { LeaveService } from '../../leave/leave.service';
import { LeaveStatus } from '../../leave/schemas/leave-request.schema';
import { PayrollService } from '../../payroll/payroll.service';
import { PermissionCode } from '../../rbac/constants/permission-code.enum';
import { AnyAgentToolDefinition, defineAgentTool } from './agent-tool';

// Stories #2 and #3 (Stage 2 — Employee/org + leave/payroll read tools), get_payslip fixed to a
// real implementation by issue #184. Six read-only tools wired to existing domain services — no
// repository/DB access here (CLAUDE.md rule 1), no tool decides authorization itself (CLAUDE.md
// rule 2/3): each handler calls the same domain-service method a controller would.
//
// Tool results use the same *Response DTOs the REST controllers return, never raw Mongoose
// documents — a raw Employee document carries hashedPassword, which must never reach the model's
// context window (blueprint §28: never expose secrets/unredacted HR data). get_payslip reuses
// PayslipResponseDto verbatim — the same shape the REST `/payroll/payslips` endpoint already
// returns to the authenticated employee themselves, so the chat surface exposes nothing beyond
// what that employee could already see there (blueprint §28, issue #184 security requirement).
//
// Caller identity is always taken from `context`, not from LLM-supplied arguments.
export interface BuildEmployeeAgentToolsDeps {
  employeeService: EmployeeService;
  departmentService: DepartmentService;
  leaveService: LeaveService;
  payrollService: PayrollService;
}

export function buildEmployeeAgentTools(deps: BuildEmployeeAgentToolsDeps): AnyAgentToolDefinition[] {
  const { employeeService, departmentService, leaveService, payrollService } = deps;

  const getEmployeeProfile = defineAgentTool({
    name: 'get_employee_profile',
    description:
      "Get an employee's profile (name, job title, department, manager, status, hire date). " +
      "Omit employeeId to get the current user's own profile — this is the common case. Only " +
      'pass employeeId when the user has given you a specific employee id to look up; never guess ' +
      'or infer an id from a name.',
    inputSchema: z.object({
      employeeId: z
        .string()
        .optional()
        .describe("The employee's id. Omit this to get the current user's own profile."),
    }),
    // No blanket permission: EmployeeService.getEmployee() already allows self access and gates
    // cross-employee access on EMPLOYEE_READ — declaring EMPLOYEE_READ here would block a base
    // employee from asking about their own profile. See agent-tool.ts's doc comment.
    handler: async (input: { employeeId?: string }, context) => {
      const targetId = input.employeeId ?? context.actorId;
      const employee = await employeeService.getEmployee(targetId, {
        tenantId: context.tenantId,
        actorId: context.actorId,
        actorPermissions: context.actorPermissions,
      });
      const roleName = await employeeService.roleNameFor(employee, context.tenantId);
      return EmployeeResponseDto.fromEmployee(employee, roleName);
    },
  });

  const getManager = defineAgentTool({
    name: 'get_manager',
    description:
      "Get an employee's manager (name, job title, department). Omit employeeId to get the " +
      "current user's own manager — this is the common case. Returns manager: null if the " +
      'employee has no manager on file. Only pass employeeId when the user has given you a ' +
      'specific employee id to look up; never guess or infer an id from a name.',
    inputSchema: z.object({
      employeeId: z
        .string()
        .optional()
        .describe("The employee's id whose manager to look up. Omit this for the current user's own manager."),
    }),
    // Same rationale as get_employee_profile: EmployeeService.getManager() reuses
    // getEmployee()'s self-or-EMPLOYEE_READ gate on the target employee internally.
    handler: async (input: { employeeId?: string }, context) => {
      const targetId = input.employeeId ?? context.actorId;
      const manager = await employeeService.getManager(targetId, {
        tenantId: context.tenantId,
        actorId: context.actorId,
        actorPermissions: context.actorPermissions,
      });
      if (!manager) return { manager: null };
      const roleName = await employeeService.roleNameFor(manager, context.tenantId);
      return { manager: EmployeeResponseDto.fromEmployee(manager, roleName) };
    },
  });

  const getDepartment = defineAgentTool({
    name: 'get_department',
    description: "Get a department's details by name (e.g. 'Engineering'). Case-insensitive exact match.",
    inputSchema: z.object({
      name: z.string().min(1).describe("The department's name, e.g. 'Engineering'."),
    }),
    // Flat gate: DepartmentService.getDepartmentByName() unconditionally requires DEPARTMENT_READ
    // (no self-access nuance for departments), so the central buildToolSet() check is the right
    // place to enforce it — same permission the base EMPLOYEE role template already grants.
    requiredPermission: PermissionCode.DEPARTMENT_READ,
    handler: async (input: { name: string }, context) => {
      const department = await departmentService.getDepartmentByName(input.name, {
        tenantId: context.tenantId,
        actorPermissions: context.actorPermissions,
      });
      return DepartmentResponseDto.fromDocument(department);
    },
  });

  const getLeaveBalance = defineAgentTool({
    name: 'get_leave_balance',
    description:
      "Get an employee's leave balance for a given year (allocated, used, and remaining days). " +
      "Omit employeeId to get the current user's own balance — this is the common case. " +
      'Omit year to use the current calendar year.',
    inputSchema: z.object({
      employeeId: z
        .string()
        .optional()
        .describe("The employee's id. Omit to get the current user's own balance."),
      year: z
        .number()
        .int()
        .min(2000)
        .max(2100)
        .optional()
        .describe('The calendar year (e.g. 2025). Defaults to the current year.'),
    }),
    // No blanket permission: LeaveService.getBalance() allows self-access and gates cross-employee
    // access on LEAVE_READ — same self-or-permission pattern as EmployeeService.getEmployee().
    handler: async (input: { employeeId?: string; year?: number }, context) => {
      return leaveService.getBalance({
        tenantId: context.tenantId,
        actorId: context.actorId,
        actorPermissions: context.actorPermissions,
        employeeId: input.employeeId,
        year: input.year,
      });
    },
  });

  const getPendingRequests = defineAgentTool({
    name: 'get_pending_requests',
    description:
      "Get an employee's pending leave requests. Omit employeeId to get the current user's own " +
      "pending requests — this is the common case. Managers with leave.read can query a specific " +
      "report's pending requests by passing employeeId.",
    inputSchema: z.object({
      employeeId: z
        .string()
        .optional()
        .describe("The employee's id. Omit to get the current user's own pending requests."),
    }),
    // LeaveService.listRequests() enforces LEAVE_READ for cross-employee queries.
    handler: async (input: { employeeId?: string }, context) => {
      const requests = await leaveService.listRequests({
        tenantId: context.tenantId,
        actorId: context.actorId,
        actorPermissions: context.actorPermissions,
        employeeId: input.employeeId,
      });
      const pending = requests.filter((r) => r.status === LeaveStatus.PENDING);
      return { requests: pending.map(LeaveRequestResponseDto.fromDocument), total: pending.length };
    },
  });

  // get_payslip — wired to the real PayrollService as of issue #184 (previously a hardcoded
  // stub written before PayrollModule existed, see the module's own history). Filters the
  // caller's own payslips down to the requested period, the same way get_pending_requests
  // filters listRequests() down to pending status — no new PayrollService method needed for a
  // presentation-layer filter over data already scoped to the caller.
  const getPayslip = defineAgentTool({
    name: 'get_payslip',
    description:
      "Get the current employee's own payslip for a given month and year (gross pay, net pay, " +
      'currency, status, and the pay breakdown) — the same data shown on the payslip detail ' +
      'screen. Returns found: false with no payslip if none exists for that period.',
    inputSchema: z.object({
      month: z
        .number()
        .int()
        .min(1)
        .max(12)
        .describe('The month (1–12).'),
      year: z
        .number()
        .int()
        .min(2000)
        .max(2100)
        .describe('The calendar year (e.g. 2025).'),
    }),
    // Self-only access: no employeeId input at all — the tool can only ever resolve the
    // caller's own payslips via context.actorId, mirroring PayrollController's REST endpoints
    // (which likewise only ever read the current employee's own payroll data, never a
    // cross-employee id). No permission check needed here for the same reason a REST call to
    // GET /payroll/payslips needs none beyond authentication.
    handler: async (input: { month: number; year: number }, context) => {
      const payslips = await payrollService.getPayslips(context.tenantId, context.actorId);
      const periodPrefix = `${input.year}-${String(input.month).padStart(2, '0')}`;
      const payslip = payslips.find((p) => p.periodStart.startsWith(periodPrefix));

      if (!payslip) {
        return {
          employeeId: context.actorId,
          period: { month: input.month, year: input.year },
          found: false as const,
          message: `No payslip found for ${input.month}/${input.year}.`,
        };
      }

      return {
        employeeId: context.actorId,
        period: { month: input.month, year: input.year },
        found: true as const,
        payslip,
      };
    },
  });

  return [getEmployeeProfile, getManager, getDepartment, getLeaveBalance, getPendingRequests, getPayslip];
}
