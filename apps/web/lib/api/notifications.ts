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
  await new Promise((r) => setTimeout(r, 180));
  return [
    {
      id: "n1",
      type: "leave",
      category: "action",
      title: "Leave request needs approval",
      body: "Sofia Andersson has requested 5 days annual leave (Sep 1–5). Your approval is required.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
      actions: [
        { label: "Approve", variant: "primary" },
        { label: "Reject",  variant: "destructive" },
      ],
    },
    {
      id: "n2",
      type: "expense",
      category: "action",
      title: "Expense report awaiting review",
      body: "Marcus Webb submitted an expense report for £342.50 (August travel).",
      timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      read: false,
      actions: [
        { label: "Review", variant: "secondary" },
      ],
    },
    {
      id: "n3",
      type: "mention",
      category: "mention",
      title: "You were mentioned",
      body: "Alex Chen mentioned you in a comment on the Q3 headcount planning doc.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      actions: [
        { label: "Reply", variant: "secondary" },
      ],
    },
    {
      id: "n4",
      type: "policy",
      category: "update",
      title: "Updated: Remote Work Policy",
      body: "The Remote Work Policy has been revised. Please read and acknowledge the changes.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read: false,
      actions: [
        { label: "Acknowledge", variant: "primary" },
      ],
    },
    {
      id: "n5",
      type: "system",
      category: "update",
      title: "Payroll processed",
      body: "August payroll has been processed. Your payslip is now available.",
      timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      read: true,
      href: "/payroll",
    },
    {
      id: "n6",
      type: "leave",
      category: "update",
      title: "Leave request approved",
      body: "Your leave request (Aug 28–29) has been approved by your manager.",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      href: "/leave",
    },
    {
      id: "n7",
      type: "mention",
      category: "mention",
      title: "New message in #engineering",
      body: "Priya Sharma replied to your message about the API design review.",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];
}
