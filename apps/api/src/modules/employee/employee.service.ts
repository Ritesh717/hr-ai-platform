import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { hashPassword, verifyPassword } from '../../common/auth/security';
import { AuthenticationError, AuthorizationError, ConflictError, NotFoundError } from '../../common/errors/app.error';
import { AuditLogService } from '../audit-log/audit-log.service';
import { requirePermission, hasPermission } from '../rbac/authorization';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { RoleRepository } from '../rbac/role.repository';
import { RoleDocument } from '../rbac/schemas/role.schema';
import { EmployeeCreateDto } from './dto/employee-create.dto';
import { EmployeeUpdateDto, PRIVILEGED_UPDATE_FIELDS } from './dto/employee-update.dto';
import { EmployeeRepository } from './employee.repository';
import { Employee, EmployeeDocument, EmployeeStatus } from './schemas/employee.schema';

// Mirrors domain/employee/service.py's EmployeeService.
@Injectable()
export class EmployeeService {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly roleRepository: RoleRepository,
    private readonly auditLogService: AuditLogService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async resolveRole(roleId: string, tenantId: string): Promise<RoleDocument> {
    const role = await this.roleRepository.getById(roleId, tenantId);
    if (!role) throw new NotFoundError(`Role ${roleId} not found`);
    return role;
  }

  async authenticate(params: { tenantId: string; email: string; password: string }): Promise<EmployeeDocument> {
    const employee = await this.employeeRepository.getByEmail(params.email, params.tenantId);
    // Deliberately the same message for "no such employee" and "wrong password" — anti-enumeration.
    if (!employee || !(await verifyPassword(params.password, employee.hashedPassword))) {
      throw new AuthenticationError('Invalid email or password');
    }
    if (employee.status === EmployeeStatus.TERMINATED) {
      throw new AuthenticationError('This account is no longer active');
    }
    return employee;
  }

  async listEmployees(params: {
    tenantId: string;
    actorPermissions: ReadonlySet<PermissionCode>;
    offset: number;
    limit: number;
    search?: string;
  }): Promise<{ items: EmployeeDocument[]; total: number }> {
    requirePermission(params.actorPermissions, PermissionCode.EMPLOYEE_READ);
    return this.employeeRepository.list(params);
  }

  async getEmployee(
    employeeId: string,
    params: { tenantId: string; actorId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<EmployeeDocument> {
    const isSelf = employeeId === params.actorId;
    if (!isSelf) {
      requirePermission(params.actorPermissions, PermissionCode.EMPLOYEE_READ);
    }
    const employee = await this.employeeRepository.getById(employeeId, params.tenantId);
    if (!employee) throw new NotFoundError(`Employee ${employeeId} not found`);
    return employee;
  }

  // Resolves an employee's manager from the existing managerId reporting-hierarchy field — no
  // new persistence, just a read that follows one relationship. Reuses getEmployee()'s
  // self-or-EMPLOYEE_READ gate on the *target* employee (so "who is my manager" needs no extra
  // permission, matching self-profile access; looking up someone else's manager needs
  // EMPLOYEE_READ same as looking up their profile would). The manager's own basic record is
  // then resolved directly — not re-gated by a second self/EMPLOYEE_READ check against the
  // manager's id — since it's exposed as a natural extension of a lookup the caller was already
  // authorized to make (the REST employee response already exposes the raw managerId; this just
  // resolves it to a record).
  async getManager(
    employeeId: string,
    params: { tenantId: string; actorId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<EmployeeDocument | null> {
    const employee = await this.getEmployee(employeeId, params);
    if (!employee.managerId) return null;
    const manager = await this.employeeRepository.getById(employee.managerId, params.tenantId);
    if (!manager) throw new NotFoundError(`Manager for employee ${employeeId} not found`);
    return manager;
  }

  async createEmployee(
    payload: EmployeeCreateDto,
    params: { tenantId: string; actorId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<EmployeeDocument> {
    requirePermission(params.actorPermissions, PermissionCode.EMPLOYEE_WRITE);

    const existing = await this.employeeRepository.getByEmail(payload.email, params.tenantId);
    if (existing) throw new ConflictError(`Employee with email '${payload.email}' already exists`);

    const role = await this.resolveRole(payload.roleId, params.tenantId);
    const hashedPassword = await hashPassword(payload.password);

    const data: Partial<Employee> & { tenantId: Types.ObjectId } = {
      tenantId: new Types.ObjectId(params.tenantId),
      departmentId: payload.departmentId ? new Types.ObjectId(payload.departmentId) : null,
      managerId: payload.managerId ? new Types.ObjectId(payload.managerId) : null,
      roleId: role._id,
      email: payload.email,
      hashedPassword,
      fullName: payload.fullName,
      jobTitle: payload.jobTitle,
      status: payload.status,
      hireDate: new Date(payload.hireDate),
      location: payload.location ?? null,
    };
    // Write + audit log span two collections — wrap in a transaction so they commit/rollback
    // together, mirroring the shared Postgres transaction the Python side gets from get_db().
    let employee!: EmployeeDocument;
    await this.connection.transaction(async (session) => {
      employee = await this.employeeRepository.create(data, session);
      await this.auditLogService.log(
        {
          tenantId: params.tenantId,
          actorEmployeeId: params.actorId,
          action: 'employee.created',
          resourceType: 'employee',
          resourceId: employee._id.toString(),
        },
        session,
      );
    });

    return employee;
  }

  async updateEmployee(
    employeeId: string,
    payload: EmployeeUpdateDto,
    params: { tenantId: string; actorId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<EmployeeDocument> {
    const isSelf = employeeId === params.actorId;
    const canWrite = hasPermission(params.actorPermissions, PermissionCode.EMPLOYEE_WRITE);

    if (!isSelf && !canWrite) {
      throw new AuthorizationError('Not permitted to update this employee');
    }

    // Only fields explicitly present in the request body — mirrors exclude_unset=True.
    const providedFields = Object.keys(payload) as (keyof EmployeeUpdateDto)[];

    if (isSelf && !canWrite) {
      const offending = providedFields.filter((field) => PRIVILEGED_UPDATE_FIELDS.has(field));
      if (offending.length > 0) {
        throw new AuthorizationError(`Not permitted to change ${offending.join(', ')}`);
      }
    }

    const employee = await this.employeeRepository.getById(employeeId, params.tenantId);
    if (!employee) throw new NotFoundError(`Employee ${employeeId} not found`);

    if (providedFields.includes('roleId') && payload.roleId) {
      const role = await this.resolveRole(payload.roleId, params.tenantId);
      employee.roleId = role._id;
    }
    if (providedFields.includes('fullName') && payload.fullName !== undefined) employee.fullName = payload.fullName;
    if (providedFields.includes('jobTitle') && payload.jobTitle !== undefined) employee.jobTitle = payload.jobTitle;
    if (providedFields.includes('departmentId'))
      employee.departmentId = payload.departmentId ? new Types.ObjectId(payload.departmentId) : null;
    if (providedFields.includes('managerId'))
      employee.managerId = payload.managerId ? new Types.ObjectId(payload.managerId) : null;
    if (providedFields.includes('status') && payload.status !== undefined) employee.status = payload.status;
    if (providedFields.includes('hireDate') && payload.hireDate !== undefined) employee.hireDate = new Date(payload.hireDate);
    if (providedFields.includes('location')) employee.location = payload.location ?? null;

    await this.connection.transaction(async (session) => {
      await this.employeeRepository.save(employee, session);
      await this.auditLogService.log(
        {
          tenantId: params.tenantId,
          actorEmployeeId: params.actorId,
          action: 'employee.updated',
          resourceType: 'employee',
          resourceId: employee._id.toString(),
          extra: { fields: providedFields },
        },
        session,
      );
    });

    return employee;
  }

  async deleteEmployee(
    employeeId: string,
    params: { tenantId: string; actorId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<void> {
    requirePermission(params.actorPermissions, PermissionCode.EMPLOYEE_DELETE);
    const employee = await this.employeeRepository.getById(employeeId, params.tenantId);
    if (!employee) throw new NotFoundError(`Employee ${employeeId} not found`);

    await this.connection.transaction(async (session) => {
      await this.employeeRepository.delete(employee, session);
      await this.auditLogService.log(
        {
          tenantId: params.tenantId,
          actorEmployeeId: params.actorId,
          action: 'employee.deleted',
          resourceType: 'employee',
          resourceId: employeeId,
        },
        session,
      );
    });
  }

  async roleNameFor(employee: EmployeeDocument, tenantId: string): Promise<string> {
    const role = await this.roleRepository.getById(employee.roleId, tenantId);
    return role?.name ?? '';
  }
}
