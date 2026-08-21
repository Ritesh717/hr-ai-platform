import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';

// Mirrors domain/department/repository.py's DepartmentRepository.
@Injectable()
export class DepartmentRepository {
  constructor(@InjectModel(Department.name) private readonly model: Model<DepartmentDocument>) {}

  getById(departmentId: string | Types.ObjectId, tenantId: string | Types.ObjectId): Promise<DepartmentDocument | null> {
    return this.model.findOne({ _id: departmentId, tenantId }).exec();
  }

  // Case-insensitive exact-name match — used by the Employee Agent's get_department tool, where
  // the caller supplies a name, not an id (the agent can't know a department's ObjectId). Names
  // are NOT unique within a tenant (see Department's schema comment); if more than one department
  // shares a name this deterministically returns the first match by insertion order rather than
  // erroring, same tradeoff the rest of this module already accepts for duplicate names.
  getByName(name: string, tenantId: string | Types.ObjectId): Promise<DepartmentDocument | null> {
    const pattern = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    return this.model.findOne({ name: pattern, tenantId }).exec();
  }

  list(params: { tenantId: string; offset: number; limit: number }): Promise<DepartmentDocument[]> {
    return this.model
      .find({ tenantId: params.tenantId })
      .sort({ name: 1 })
      .skip(params.offset)
      .limit(params.limit)
      .exec();
  }

  async create(data: { tenantId: Types.ObjectId; name: string }): Promise<DepartmentDocument> {
    const [department] = await this.model.create([data]);
    return department;
  }

  async update(department: DepartmentDocument, data: { name?: string }): Promise<DepartmentDocument> {
    if (data.name !== undefined) department.name = data.name;
    return department.save();
  }

  async delete(department: DepartmentDocument): Promise<void> {
    await department.deleteOne();
  }
}
