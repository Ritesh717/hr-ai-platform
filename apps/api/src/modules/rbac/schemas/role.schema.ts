import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { PermissionCode } from '../constants/permission-code.enum';

export type RoleDocument = HydratedDocument<Role>;

// Mirrors domain/rbac/models.py's Role, with `permissions` embedded directly as a string array
// rather than a normalized Permission collection + role_permissions join table — Mongo doesn't
// need the SQL join-table pattern, and Permission.description was unused (always null) in the
// Python seed data, so there's no separate `permissions` collection here. The global permission
// catalog served by GET /api/v1/permissions is the static PermissionCode enum, no DB read.
@Schema({ collection: 'roles' })
export class Role {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, maxlength: 50 })
  name: string;

  @Prop({ maxlength: 255 })
  description?: string;

  @Prop({ type: [String], enum: PermissionCode, default: [] })
  permissions: PermissionCode[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true, name: 'uq_roles_tenant_name' });
