export type ApprovalType = "leave" | "expense" | "offboarding" | "role-change";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  requesterName: string;
  requesterRole: string;
  summary: string;
  detail: string;
  submittedAt: string; // ISO
  urgency: "normal" | "high";
}

export async function fetchApprovalRequests(): Promise<ApprovalRequest[]> {
  await new Promise((r) => setTimeout(r, 180));
  return [
    {
      id: "a1",
      type: "leave",
      status: "pending",
      requesterName: "Clara Mendes",
      requesterRole: "Product Designer",
      summary: "Annual leave · 12–21 Aug (8 days)",
      detail: "Travelling for a family event. Coverage arranged with Ben Okafor.",
      submittedAt: "2026-08-20T09:14:00Z",
      urgency: "normal",
    },
    {
      id: "a2",
      type: "leave",
      status: "pending",
      requesterName: "David Kim",
      requesterRole: "QA Engineer",
      summary: "Sick leave · 22–23 Aug (2 days)",
      detail: "Medical appointment and recovery.",
      submittedAt: "2026-08-22T07:55:00Z",
      urgency: "high",
    },
    {
      id: "a3",
      type: "expense",
      status: "pending",
      requesterName: "Eva Sørensen",
      requesterRole: "Platform Engineer",
      summary: "Conference expenses · £840",
      detail: "KubeCon EU: registration £600, travel £240.",
      submittedAt: "2026-08-19T16:30:00Z",
      urgency: "normal",
    },
    {
      id: "a4",
      type: "role-change",
      status: "pending",
      requesterName: "Frank Osei",
      requesterRole: "Data Engineer",
      summary: "Role upgrade → Senior Data Engineer",
      detail: "Promotion effective 1 Sep 2026. Requires updated RBAC permissions.",
      submittedAt: "2026-08-18T11:00:00Z",
      urgency: "normal",
    },
    {
      id: "a5",
      type: "offboarding",
      status: "pending",
      requesterName: "Grace Liu",
      requesterRole: "Frontend Engineer",
      summary: "Offboarding · last day 31 Aug",
      detail: "Resignation accepted. IT access revocation and exit checklist pending.",
      submittedAt: "2026-08-15T14:20:00Z",
      urgency: "high",
    },
    {
      id: "a6",
      type: "leave",
      status: "pending",
      requesterName: "Hugo Martín",
      requesterRole: "Backend Engineer",
      summary: "Parental leave · 1 Sep – 30 Nov (13 weeks)",
      detail: "New arrival. HR Manager sign-off required for leave > 10 days.",
      submittedAt: "2026-08-10T10:05:00Z",
      urgency: "normal",
    },
    {
      id: "a7",
      type: "expense",
      status: "pending",
      requesterName: "Alice Tan",
      requesterRole: "Software Engineer",
      summary: "Home office setup · £380",
      detail: "Ergonomic chair and monitor arm for remote work.",
      submittedAt: "2026-08-21T13:45:00Z",
      urgency: "normal",
    },
    {
      id: "a8",
      type: "leave",
      status: "pending",
      requesterName: "Ben Okafor",
      requesterRole: "Software Engineer",
      summary: "Study leave · 25–27 Aug (3 days)",
      detail: "AWS certification exam preparation.",
      submittedAt: "2026-08-22T08:00:00Z",
      urgency: "normal",
    },
  ];
}
