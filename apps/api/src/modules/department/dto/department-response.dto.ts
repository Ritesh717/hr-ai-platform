import { DepartmentDocument } from '../schemas/department.schema';

export class DepartmentResponseDto {
  id: string;
  tenantId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDocument(department: DepartmentDocument): DepartmentResponseDto {
    return {
      id: department._id.toString(),
      tenantId: department.tenantId.toString(),
      name: department.name,
      createdAt: department.createdAt as Date,
      updatedAt: department.updatedAt as Date,
    };
  }
}
