export type MemberStatus = "in-office" | "remote" | "on-leave" | "in-meeting" | "out";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  managerId: string;
  status: MemberStatus;
  leaveDaysRemaining: number;
}

export interface AvailabilityBlock {
  startHour: number;
  endHour: number;
  status: MemberStatus;
  label: string;
}

export interface MemberAvailability {
  memberId: string;
  blocks: AvailabilityBlock[];
}

export interface TeamKPIs {
  headcount: number;
  onLeaveToday: number;
  onRemoteToday: number;
  upcomingReviews: number;
}

export async function fetchTeamKPIs(_managerId: string): Promise<TeamKPIs> {
  await new Promise((r) => setTimeout(r, 150));
  return { headcount: 8, onLeaveToday: 2, onRemoteToday: 3, upcomingReviews: 4 };
}

export async function fetchTeamMembers(_managerId: string): Promise<TeamMember[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [
    { id: "m1", name: "Alice Tan",    role: "Software Engineer",  managerId: "mgr", status: "in-office",  leaveDaysRemaining: 18 },
    { id: "m2", name: "Ben Okafor",   role: "Software Engineer",  managerId: "mgr", status: "remote",     leaveDaysRemaining: 12 },
    { id: "m3", name: "Clara Mendes", role: "Product Designer",   managerId: "mgr", status: "on-leave",   leaveDaysRemaining: 5  },
    { id: "m4", name: "David Kim",    role: "QA Engineer",        managerId: "mgr", status: "in-meeting", leaveDaysRemaining: 22 },
    { id: "m5", name: "Eva Sorensen", role: "Platform Engineer",  managerId: "mgr", status: "remote",     leaveDaysRemaining: 9  },
    { id: "m6", name: "Frank Osei",   role: "Data Engineer",      managerId: "mgr", status: "in-office",  leaveDaysRemaining: 14 },
    { id: "m7", name: "Grace Liu",    role: "Frontend Engineer",  managerId: "mgr", status: "out",        leaveDaysRemaining: 20 },
    { id: "m8", name: "Hugo Martin",  role: "Backend Engineer",   managerId: "mgr", status: "in-office",  leaveDaysRemaining: 17 },
  ];
}

export async function fetchTeamAvailability(_managerId: string): Promise<MemberAvailability[]> {
  await new Promise((r) => setTimeout(r, 180));
  return [
    { memberId: "m1", blocks: [
      { startHour: 8,  endHour: 12, status: "in-office",  label: "In Office" },
      { startHour: 12, endHour: 13, status: "out",        label: "Lunch" },
      { startHour: 13, endHour: 18, status: "in-office",  label: "In Office" },
    ]},
    { memberId: "m2", blocks: [
      { startHour: 8,  endHour: 10, status: "out",        label: "Commute" },
      { startHour: 10, endHour: 18, status: "remote",     label: "Remote" },
    ]},
    { memberId: "m3", blocks: [
      { startHour: 8,  endHour: 18, status: "on-leave",   label: "Annual Leave" },
    ]},
    { memberId: "m4", blocks: [
      { startHour: 8,  endHour: 9,  status: "in-office",  label: "In Office" },
      { startHour: 9,  endHour: 11, status: "in-meeting", label: "Sprint Planning" },
      { startHour: 11, endHour: 13, status: "in-office",  label: "In Office" },
      { startHour: 13, endHour: 15, status: "in-meeting", label: "Design Review" },
      { startHour: 15, endHour: 18, status: "in-office",  label: "In Office" },
    ]},
    { memberId: "m5", blocks: [
      { startHour: 8,  endHour: 18, status: "remote",     label: "Remote" },
    ]},
    { memberId: "m6", blocks: [
      { startHour: 8,  endHour: 12, status: "in-office",  label: "In Office" },
      { startHour: 12, endHour: 14, status: "in-meeting", label: "1:1s" },
      { startHour: 14, endHour: 18, status: "in-office",  label: "In Office" },
    ]},
    { memberId: "m7", blocks: [
      { startHour: 8,  endHour: 18, status: "out",        label: "Out of Office" },
    ]},
    { memberId: "m8", blocks: [
      { startHour: 8,  endHour: 11, status: "in-office",  label: "In Office" },
      { startHour: 11, endHour: 12, status: "in-meeting", label: "Stand-up" },
      { startHour: 12, endHour: 18, status: "in-office",  label: "In Office" },
    ]},
  ];
}
