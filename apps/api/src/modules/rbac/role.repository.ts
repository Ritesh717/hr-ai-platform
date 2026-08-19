import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { PermissionCode } from './constants/permission-code.enum';
import { Role, RoleDocument } from './schemas/role.schema';

// Mirrors domain/rbac/repository.py's RoleRepository (the Role half — permissions are served
// statically from the PermissionCode enum, so there's no listPermissions()/getByCodes() here).
@Injectable()
export class RoleRepository {
  constructor(@InjectModel(Role.name) private readonly model: Model<RoleDocument>) {}

  getById(roleId: string | Types.ObjectId, tenantId: string | Types.ObjectId): Promise<RoleDocument | null> {
    return this.model.findOne({ _id: roleId, tenantId }).exec();
  }

  getByName(name: string, tenantId: string | Types.ObjectId): Promise<RoleDocument | null> {
    return this.model.findOne({ name, tenantId }).exec();
  }

  listRoles(tenantId: string | Types.ObjectId): Promise<RoleDocument[]> {
    return this.model.find({ tenantId }).sort({ name: 1 }).exec();
  }

  async create(
    data: { tenantId: Types.ObjectId; name: string; description?: string; permissions: PermissionCode[] },
    session?: ClientSession,
  ): Promise<RoleDocument> {
    const [role] = await this.model.create([data], { session });
    return role;
  }

  async update(
    role: RoleDocument,
    data: { name?: string; description?: string; permissions?: PermissionCode[] },
  ): Promise<RoleDocument> {
    if (data.name !== undefined) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;
    if (data.permissions !== undefined) role.permissions = data.permissions;
    return role.save();
  }

  async delete(role: RoleDocument): Promise<void> {
    await role.deleteOne();
  }
}
