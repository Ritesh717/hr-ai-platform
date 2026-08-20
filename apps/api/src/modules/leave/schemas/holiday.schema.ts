import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type HolidayDocument = HydratedDocument<Holiday>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'holidays' })
export class Holiday {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, maxlength: 150 })
  name: string;

  @Prop({ required: true })
  date: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
