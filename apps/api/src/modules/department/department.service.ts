import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundError } from '../../common/errors/app.error';
import { Employee, EmployeeDocument } from '../employee/schemas/employee.schema';
import { requirePermission } from '../rbac/authorization';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { DepartmentRepository } from './department.repository';
import { DepartmentDocument } from './schemas/department.schema';

// Mirrors domain/department/service.py's DepartmentService. Authorization lives here, not in
// the controller.
@Injectable()
export class DepartmentService {
  constructor(
    private readonly departmentRepository: DepartmentRepository,
    // Direct Employee model access (not the full EmployeeRepository/module) just to orphan
    // departmentId on delete — Mongo has no ON DELETE SET NULL, so this replicates that FK
    // behavior explicitly in app code. Department deletion itself is NOT blocked by employees
    // still assigned to it (contrast with Role deletion, which is) — that asymmetry is
    // intentional, matching the Python model.
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  async listDepartments(params: {
    tenantId: string;
    actorPermissions: ReadonlySet<PermissionCode>;
    offset: number;
    limit: number;
  }): Promise<DepartmentDocument[]> {
    requirePermission(params.actorPermissions, PermissionCode.DEPARTMENT_READ);
    return this.departmentRepository.list(params);
  }

  async getDepartment(
    departmentId: string,
    params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<DepartmentDocument> {
    requirePermission(params.actorPermissions, PermissionCode.DEPARTMENT_READ);
    const department = await this.departmentRepository.getById(departmentId, params.tenantId);
    if (!department) throw new NotFoundError(`Department ${departmentId} not found`);
    return department;
  }

  // Same authorization as getDepartment(), keyed by name instead of id — used by the Employee
  // Agent's get_department tool, which only ever receives a name from the model (it has no way
  // to know a department's ObjectId).
  async getDepartmentByName(
    name: string,
    params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<DepartmentDocument> {
    requirePermission(params.actorPermissions, PermissionCode.DEPARTMENT_READ);
    const department = await this.departmentRepository.getByName(name, params.tenantId);
    if (!department) throw new NotFoundError(`Department '${name}' not found`);
    return department;
  }

  async createDepartment(params: {
    tenantId: string;
    actorPermissions: ReadonlySet<PermissionCode>;
    name: string;
  }): Promise<DepartmentDocument> {
    requirePermission(params.actorPermissions, PermissionCode.DEPARTMENT_WRITE);
    return this.departmentRepository.create({ tenantId: new Types.ObjectId(params.tenantId), name: params.name });
  }

  async updateDepartment(
    departmentId: string,
    params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode>; name?: string },
  ): Promise<DepartmentDocument> {
    requirePermission(params.actorPermissions, PermissionCode.DEPARTMENT_WRITE);
    const department = await this.getDepartment(departmentId, params);
    return this.departmentRepository.update(department, { name: params.name });
  }

  async deleteDepartment(
    departmentId: string,
    params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<void> {
    requirePermission(params.actorPermissions, PermissionCode.DEPARTMENT_WRITE);
    const department = await this.departmentRepository.getById(departmentId, params.tenantId);
    if (!department) throw new NotFoundError(`Department ${departmentId} not found`);

    await this.departmentRepository.delete(department);
    await this.employeeModel
      .updateMany({ departmentId: department._id, tenantId: params.tenantId }, { $set: { departmentId: null } })
      .exec();
  }
}
