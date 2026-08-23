import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name) private readonly model: Model<NotificationDocument>,
  ) {}

  async findForRecipient(tenantId: string, recipientId: string): Promise<NotificationDocument[]> {
    return this.model
      .find({
        tenantId: new Types.ObjectId(tenantId),
        recipientId: new Types.ObjectId(recipientId),
        dismissed: false,
      })
      .sort({ createdAt: -1 })
      .limit(100);
  }

  async findById(id: string): Promise<NotificationDocument | null> {
    return this.model.findById(id);
  }

  async markRead(id: string): Promise<NotificationDocument | null> {
    return this.model.findByIdAndUpdate(id, { $set: { read: true } }, { new: true });
  }

  async markDismissed(id: string): Promise<NotificationDocument | null> {
    return this.model.findByIdAndUpdate(id, { $set: { dismissed: true } }, { new: true });
  }

  async markAllReadForRecipient(tenantId: string, recipientId: string): Promise<void> {
    await this.model.updateMany(
      {
        tenantId: new Types.ObjectId(tenantId),
        recipientId: new Types.ObjectId(recipientId),
        read: false,
        dismissed: false,
      },
      { $set: { read: true } },
    );
  }

  async create(
    tenantId: string,
    data: Omit<Notification, 'tenantId' | 'recipientId'> & { recipientId: string },
  ): Promise<NotificationDocument> {
    return this.model.create({
      ...data,
      tenantId: new Types.ObjectId(tenantId),
      recipientId: new Types.ObjectId(data.recipientId),
    });
  }
}
