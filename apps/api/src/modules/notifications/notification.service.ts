import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationRepository } from './notification.repository';
import { NotificationActionItem, NotificationCategory, NotificationType } from './schemas/notification.schema';

export interface EmitNotificationOptions {
  tenantId: string;
  recipientId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string;
  actions?: NotificationActionItem[];
}

@Injectable()
export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  async getNotifications(tenantId: string, recipientId: string): Promise<NotificationResponseDto[]> {
    const docs = await this.repo.findForRecipient(tenantId, recipientId);
    return docs.map(NotificationResponseDto.fromDocument);
  }

  async markRead(tenantId: string, recipientId: string, id: string): Promise<NotificationResponseDto> {
    const doc = await this.repo.findById(id);
    if (!doc || doc.tenantId.toString() !== tenantId || doc.recipientId.toString() !== recipientId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    const updated = await this.repo.markRead(id);
    return NotificationResponseDto.fromDocument(updated!);
  }

  async dismiss(tenantId: string, recipientId: string, id: string): Promise<void> {
    const doc = await this.repo.findById(id);
    if (!doc || doc.tenantId.toString() !== tenantId || doc.recipientId.toString() !== recipientId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    await this.repo.markDismissed(id);
  }

  async markAllRead(tenantId: string, recipientId: string): Promise<void> {
    await this.repo.markAllReadForRecipient(tenantId, recipientId);
  }

  /** Called by other modules to emit a notification to a user */
  async emit(opts: EmitNotificationOptions): Promise<void> {
    await this.repo.create(opts.tenantId, {
      recipientId: opts.recipientId,
      type: opts.type,
      category: opts.category,
      title: opts.title,
      body: opts.body,
      read: false,
      dismissed: false,
      href: opts.href,
      actions: opts.actions ?? [],
    });
  }
}
