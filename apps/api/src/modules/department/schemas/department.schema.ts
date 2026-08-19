import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type DepartmentDocument = HydratedDocument<Department>;

// Mirrors domain/department/models.py's Department. No uniqueness on `name` within a tenant —
// duplicate department names are allowed, matching the Python model.
@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'departments' })
export class Department {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, maxlength: 150 })
  name: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
