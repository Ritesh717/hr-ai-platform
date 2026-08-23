import { NotificationActionItem, NotificationCategory, NotificationDocument, NotificationType } from '../schemas/notification.schema';

export class NotificationResponseDto {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  href?: string;
  actions?: Array<{ label: string; variant: 'primary' | 'secondary' | 'destructive' }>;

  static fromDocument(doc: NotificationDocument): NotificationResponseDto {
    return {
      id: (doc._id as any).toString(),
      type: doc.type,
      category: doc.category,
      title: doc.title,
      body: doc.body,
      timestamp: doc.createdAt?.toISOString() ?? new Date().toISOString(),
      read: doc.read,
      href: doc.href,
      actions: (doc.actions ?? []).map((a: NotificationActionItem) => ({
        label: a.label,
        variant: a.variant,
      })),
    };
  }
}
