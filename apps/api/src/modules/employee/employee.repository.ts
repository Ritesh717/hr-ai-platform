import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, Types } from 'mongoose';
import { escapeRegExp } from '../../common/utils/regex';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { RoleDocument } from '../rbac/schemas/role.schema';
import { Employee, EmployeeDocument } from './schemas/employee.schema';

export interface EmployeeWithPopulatedRole extends Omit<EmployeeDocument, 'roleId'> {
  roleId: RoleDocument;
}

@Injectable()
export class EmployeeRepository {
  constructor(@InjectModel(Employee.name) private readonly model: Model<EmployeeDocument>) {}

  getById(employeeId: string | Types.ObjectId, tenantId: string | Types.ObjectId): Promise<EmployeeDocument | null> {
    return this.model.findOne({ _id: employeeId, tenantId }).exec();
  }

  // Used exclusively by JwtStrategy for fresh permission resolution on every request.
  getByIdWithRolePermissions(
    employeeId: string | Types.ObjectId,
    tenantId: string | Types.ObjectId,
  ): Promise<EmployeeWithPopulatedRole | null> {
    return this.model
      .findOne({ _id: employeeId, tenantId })
      .populate<{ roleId: RoleDocument }>('roleId')
      .exec() as unknown as Promise<EmployeeWithPopulatedRole | null>;
  }

  getByEmail(email: string, tenantId: string | Types.ObjectId): Promise<EmployeeDocument | null> {
    return this.model.findOne({ email, tenantId }).exec();
  }

  async list(params: {
    tenantId: string | Types.ObjectId;
    offset: number;
    limit: number;
    search?: string;
  }): Promise<{ items: EmployeeDocument[]; total: number }> {
    const { tenantId, offset, limit, search } = params;
    const filter: FilterQuery<EmployeeDocument> = { tenantId };
    if (search) {
      const pattern = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [{ fullName: pattern }, { jobTitle: pattern }];
    }
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ fullName: 1 }).skip(offset).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async create(data: Partial<Employee>, session?: ClientSession): Promise<EmployeeDocument> {
    const [employee] = await this.model.create([data], { session });
    return employee;
  }

  async save(employee: EmployeeDocument, session?: ClientSession): Promise<EmployeeDocument> {
    return employee.save({ session });
  }

  async delete(employee: EmployeeDocument, session?: ClientSession): Promise<void> {
    await employee.deleteOne({ session });
  }

  // Returns all direct reports (employees whose managerId matches the given manager).
  // Used by LeaveService.getTeamLeave() without crossing into the Employee module's internals.
  findByManagerId(managerId: string | Types.ObjectId, tenantId: string | Types.ObjectId): Promise<EmployeeDocument[]> {
    return this.model.find({ managerId, tenantId }).select('_id fullName').exec();
  }

  countByRoleId(roleId: string | Types.ObjectId, tenantId: string | Types.ObjectId): Promise<number> {
    return this.model.countDocuments({ roleId, tenantId }).exec();
  }

  // Powers the RBAC self-lockout guard: counts employees (optionally excluding one role) who
  // hold a given permission code via their role's embedded `permissions` array.
  async countByPermissionCode(params: {
    permission: PermissionCode;
    tenantId: string | Types.ObjectId;
    excludingRoleId?: string | Types.ObjectId;
  }): Promise<number> {
    const { permission, tenantId, excludingRoleId } = params;
    const roleMatch: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId), permissions: permission };
    if (excludingRoleId) {
      roleMatch._id = { $ne: new Types.ObjectId(excludingRoleId) };
    }
    const result = await this.model.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId) } },
      {
        $lookup: {
          from: 'roles',
          let: { roleId: '$roleId' },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$roleId'] }, ...roleMatch } }],
          as: 'role',
        },
      },
      { $match: { role: { $ne: [] } } },
      { $count: 'count' },
    ]);
    return result[0]?.count ?? 0;
  }
}
