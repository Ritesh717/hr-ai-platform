export type InterviewFormat = "Video" | "In-person" | "Phone";

export interface Panelist {
  id: string;
  name: string;
  role: string;
}

export interface AgendaItem {
  topic: string;
  durationMin: number;
}

export interface Interview {
  id: string;
  jobTitle: string;
  department: string;
  scheduledAt: string;
  format: InterviewFormat;
  panelists: Panelist[];
  agenda: AgendaItem[];
}

export async function fetchInterviews(): Promise<Interview[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [
    {
      id: "i1",
      jobTitle: "Senior Software Engineer",
      department: "Engineering",
      scheduledAt: "2026-08-27T10:00:00",
      format: "Video",
      panelists: [
        { id: "p1", name: "Alex Chen",      role: "Engineering Manager" },
        { id: "p2", name: "Priya Sharma",   role: "Senior Engineer" },
        { id: "p3", name: "James O'Brien",  role: "HR Partner" },
      ],
      agenda: [
        { topic: "Introduction & role overview",  durationMin: 10 },
        { topic: "Technical deep-dive",           durationMin: 40 },
        { topic: "System design discussion",      durationMin: 30 },
        { topic: "Culture & values chat",         durationMin: 15 },
        { topic: "Q&A",                           durationMin: 10 },
      ],
    },
    {
      id: "i2",
      jobTitle: "Staff Engineer — Platform",
      department: "Engineering",
      scheduledAt: "2026-09-02T14:30:00",
      format: "In-person",
      panelists: [
        { id: "p4", name: "Maria Torres",   role: "VP Engineering" },
        { id: "p5", name: "David Kim",      role: "Staff Engineer" },
        { id: "p6", name: "Sophie Martin",  role: "Engineering Manager" },
        { id: "p7", name: "Liam Walker",    role: "HR Lead" },
      ],
      agenda: [
        { topic: "Meet the team",                 durationMin: 15 },
        { topic: "Leadership & strategy",         durationMin: 45 },
        { topic: "Platform reliability deep-dive", durationMin: 30 },
        { topic: "Q&A & next steps",              durationMin: 15 },
      ],
    },
  ];
}
