import { apiFetch } from "./client";

export type NotificationType = "leave" | "expense" | "mention" | "system" | "policy";
export type NotificationCategory = "action" | "update" | "mention";

export interface NotificationAction {
  label: string;
  variant: "primary" | "secondary" | "destructive";
  onAction?: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  href?: string;
  actions?: Array<Omit<NotificationAction, "onAction">>;
}

export async function fetchNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>("/api/v1/notifications");
}

export async function markNotificationRead(id: string): Promise<Notification> {
  return apiFetch<Notification>(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
}

export async function dismissNotification(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/notifications/${id}/dismiss`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<void>("/api/v1/notifications/read-all", { method: "PATCH" });
}
