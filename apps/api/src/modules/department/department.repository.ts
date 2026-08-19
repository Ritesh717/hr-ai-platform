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
