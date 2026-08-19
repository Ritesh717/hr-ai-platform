import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

// Mirrors domain/audit_log/models.py's AuditLog. No updatedAt — log entries are immutable/
// append-only. `extra` maps the Postgres JSONB column to a Mongo Mixed field.
@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', default: null })
  actorEmployeeId: Types.ObjectId | null;

  @Prop({ required: true, maxlength: 100, index: true })
  action: string;

  @Prop({ required: true, maxlength: 100 })
  resourceType: string;

  @Prop({ required: true, maxlength: 100 })
  resourceId: string;

  @Prop({ type: Object, default: null })
  extra: Record<string, unknown> | null;

  createdAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
