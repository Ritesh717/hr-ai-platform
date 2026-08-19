import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

// Mirrors domain/tenant/models.py's Tenant model.
@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, maxlength: 200 })
  name: string;

  @Prop({ required: true, unique: true, maxlength: 100, index: true })
  slug: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
