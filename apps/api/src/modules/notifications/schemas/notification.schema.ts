import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  LEAVE = 'leave',
  EXPENSE = 'expense',
  MENTION = 'mention',
  SYSTEM = 'system',
  POLICY = 'policy',
}

export enum NotificationCategory {
  ACTION = 'action',
  UPDATE = 'update',
  MENTION = 'mention',
}

export interface NotificationActionItem {
  label: string;
  variant: 'primary' | 'secondary' | 'destructive';
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'notifications',
})
export class Notification {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: String, enum: NotificationCategory, required: true })
  category: NotificationCategory;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: false })
  dismissed: boolean;

  @Prop()
  href?: string;

  @Prop({
    type: [{ label: String, variant: String }],
    default: [],
  })
  actions: NotificationActionItem[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ tenantId: 1, recipientId: 1, createdAt: -1 });
