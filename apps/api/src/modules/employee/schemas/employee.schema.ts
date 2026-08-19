import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type EmployeeDocument = HydratedDocument<Employee>;

// Mirrors domain/employee/models.py's EmployeeStatus StrEnum.
export enum EmployeeStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}

// Mirrors domain/employee/models.py's Employee model. An employee is also this platform's login
// identity (email + hashedPassword) — there is no separate User/Account collection, same as the
// Python side. Email uniqueness is scoped per-tenant (compound index below), not global.
@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'employees' })
export class Employee {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Department', default: null })
  departmentId: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', default: null })
  managerId: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;

  @Prop({ required: true, maxlength: 255, index: true })
  email: string;

  @Prop({ required: true, maxlength: 255 })
  hashedPassword: string;

  @Prop({ required: true, maxlength: 200 })
  fullName: string;

  @Prop({ required: true, maxlength: 150 })
  jobTitle: string;

  @Prop({ type: String, enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  status: EmployeeStatus;

  @Prop({ required: true })
  hireDate: Date;

  @Prop({ type: String, maxlength: 150, default: null })
  location: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
EmployeeSchema.index({ tenantId: 1, email: 1 }, { unique: true, name: 'uq_employee_tenant_email' });
