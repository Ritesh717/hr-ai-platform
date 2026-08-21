import { z } from 'zod';
import { DepartmentService } from '../../department/department.service';
import { DepartmentResponseDto } from '../../department/dto/department-response.dto';
import { EmployeeResponseDto } from '../../employee/dto/employee-response.dto';
import { EmployeeService } from '../../employee/employee.service';
import { PermissionCode } from '../../rbac/constants/permission-code.enum';
import { AnyAgentToolDefinition, defineAgentTool } from './agent-tool';

// Story #2 (Stage 2 — Employee & org read tools). Three read-only tools wired to the existing
// EmployeeService/DepartmentService — no repository/DB access happens here (CLAUDE.md rule 1),
// and no tool decides authorization itself (CLAUDE.md rule 2/3): each `handler` below calls the
// same domain-service method a controller would, and either buildToolSet() enforces a flat
// requiredPermission first (get_department) or the domain service's own self-vs-permission logic
// is the sole gate (get_employee_profile, get_manager — see agent-tool.ts's requiredPermission
// doc for why those two are safe to leave undefined).
//
// Tool results are mapped through the same *Response DTOs the REST controllers return, never the
// raw Mongoose documents — a raw Employee document carries hashedPassword, which must never reach
// the model's context window (blueprint §28: never expose secrets/unredacted HR data).
//
// Employee ids are only ever taken from `context` (the caller's own identity) or from an
// `employeeId`/`name` argument the model supplies — this file never trusts the model for the
// caller's own identity, matching the issue's "receives the caller's identity/tenant from agent
// context, not from LLM-supplied arguments" requirement.
export interface BuildEmployeeAgentToolsDeps {
  employeeService: EmployeeService;
  departmentService: DepartmentService;
}

export function buildEmployeeAgentTools(deps: BuildEmployeeAgentToolsDeps): AnyAgentToolDefinition[] {
  const { employeeService, departmentService } = deps;

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

  return [getEmployeeProfile, getManager, getDepartment];
}
